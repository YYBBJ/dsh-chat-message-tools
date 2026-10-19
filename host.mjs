// Host half of dsh-chat-message-tools.
//
// The browser half owns the UI; this half owns the one operation the browser
// cannot do itself: deleting a conversation's session files. DSH ships no
// delete API (the session-persistence seam has none, and the workspace registry
// keeps a session's accounting slot forever), so this is a deliberate,
// narrowly-scoped filesystem operation:
//
//   <DSH_HOME>/sessions/<cwdKey>/<sessionId>/                        session log directory
//   <DSH_HOME>/storages/session_projcache/sessions/<sessionId>.json  projection cache
//
// A session log is usually still open in the running agent, so the delete is
// retried for a few seconds; whatever is left is recorded and retried on the
// next start instead of being reported as a success.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export const name = 'dsh-chat-message-tools'

/** Route the browser half POSTs a session id to. */
export const DELETE_ENDPOINT = '/plugins/dsh-chat-message-tools/session/delete'

const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const MAX_BODY_BYTES = 8192
// The open writer usually lets go once the archiving stop lands, so give it a
// few seconds before parking the id for the next start.
const RETRY_DELAYS_MS = [0, 200, 400, 800, 1500, 2500]

/** Resolve the DSH home the way the rest of the host does. */
function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  return path.join(os.homedir(), '.dsh')
}

function sessionsRoot() {
  return path.join(dshHome(), 'sessions')
}

function projectionCacheDir() {
  return path.join(dshHome(), 'storages', 'session_projcache', 'sessions')
}

function pendingFile() {
  return path.join(dshHome(), 'storages', 'chat-message-tools', 'pending-deletes.json')
}

function readPending() {
  try {
    const raw = fs.readFileSync(pendingFile(), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && SESSION_ID.test(id)) : []
  } catch {
    return []
  }
}

function writePending(ids) {
  const file = pendingFile()
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (ids.length === 0) {
      fs.rmSync(file, { force: true })
      return
    }
    fs.writeFileSync(file, JSON.stringify([...new Set(ids)], null, 2), 'utf8')
  } catch (error) {
    console.error('[dsh-chat-message-tools] failed to record pending deletions:', error)
  }
}

/**
 * Every path this plugin is ever allowed to remove for one session. Each entry
 * is re-checked against its expected parent and basename, so a crafted id can
 * never escape the DSH home.
 */
function targetsFor(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) return []
  const targets = []
  const root = sessionsRoot()
  let entries = []
  try {
    entries = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  } catch {
    entries = []
  }
  for (const entry of entries) {
    const candidate = path.join(root, entry.name, sessionId)
    if (path.dirname(candidate) !== path.join(root, entry.name)) continue
    if (path.basename(candidate) !== sessionId) continue
    targets.push(candidate)
  }
  const cache = path.join(projectionCacheDir(), `${sessionId}.json`)
  if (path.dirname(cache) === projectionCacheDir() && path.basename(cache) === `${sessionId}.json`) targets.push(cache)
  return targets
}

function tryRemove(target) {
  try {
    fs.rmSync(target, { recursive: true, force: true })
    return !fs.existsSync(target)
  } catch {
    return false
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Remove one session's files, retrying while the live agent may still hold the
 * log open.
 * @param sessionId - validated session id.
 * @returns `{ removed, remaining, found }` paths and whether anything existed.
 */
async function purgeSession(sessionId) {
  const removed = []
  let remaining = []
  let found = false
  for (const [attempt, delay] of RETRY_DELAYS_MS.entries()) {
    if (attempt > 0) await sleep(delay)
    remaining = []
    for (const target of targetsFor(sessionId)) {
      if (!fs.existsSync(target)) continue
      found = true
      if (tryRemove(target)) removed.push(target)
      else remaining.push(target)
    }
    if (remaining.length === 0 && found) break
    // Nothing matched on the first pass either: do not sit here for seconds.
    if (!found && attempt >= 1) break
  }
  return { removed, remaining, found: found || removed.length > 0 }
}

function isLocalRequest(req) {
  const address = req.socket === undefined ? undefined : req.socket.remoteAddress
  if (address !== undefined && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return false
  const host = req.headers === undefined ? undefined : req.headers.host
  if (typeof host === 'string' && host.length > 0) {
    try {
      const parsed = new URL(`http://${host}`)
      if (parsed.username || parsed.password) return false
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) return false
    } catch {
      return false
    }
  }
  const origin = req.headers === undefined ? undefined : req.headers.origin
  if (typeof origin !== 'string' || origin.length === 0) return true
  try {
    const parsed = new URL(origin)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host === host
  } catch {
    return false
  }
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload)
  })
  res.end(payload)
}

async function readJsonBody(req) {
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    bytes += chunk.length
    if (bytes > MAX_BODY_BYTES) throw new Error('request body is too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('body must be an object')
  return value
}

/** HTTP handler: POST `{ sessionId }` removes that session's files. */
export function createDeleteHandler() {
  return async (req, res) => {
    if (!isLocalRequest(req)) {
      json(res, 403, { ok: false, error: 'local access only' })
      return
    }
    if (req.method !== 'POST') {
      json(res, 405, { ok: false, error: 'method not allowed' })
      return
    }
    let body
    try {
      body = await readJsonBody(req)
    } catch (error) {
      json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
      return
    }
    const sessionId = body.sessionId
    if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) {
      json(res, 400, { ok: false, error: 'invalid session id' })
      return
    }
    try {
      const { removed, remaining, found } = await purgeSession(sessionId)
      const pending = readPending()
      if (remaining.length === 0) writePending(pending.filter((id) => id !== sessionId))
      else writePending([...pending, sessionId])
      json(res, 200, {
        ok: true,
        found,
        deleted: removed,
        pending: remaining.length === 0 ? [] : [sessionId],
        remaining
      })
    } catch (error) {
      console.error('[dsh-chat-message-tools] session purge failed:', error)
      json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }
}

/** Retry the deletions a previous run could not finish. */
export async function flushPendingDeletes() {
  const pending = readPending()
  if (pending.length === 0) return
  const still = []
  for (const sessionId of pending) {
    try {
      const { remaining } = await purgeSession(sessionId)
      if (remaining.length > 0) still.push(sessionId)
    } catch {
      still.push(sessionId)
    }
  }
  writePending(still)
}

export function apply(ctx) {
  // Finish what a previous run left behind (a log the agent still held open).
  Promise.resolve()
    .then(() => flushPendingDeletes())
    .catch((error) => console.error('[dsh-chat-message-tools] pending delete flush failed:', error))

  ctx.inject(['webServer'], (http) => {
    http.effect(
      () => http.webServer.register({ kind: 'exact', path: DELETE_ENDPOINT, handler: createDeleteHandler() }),
      'dsh-chat-message-tools: session delete endpoint'
    )
  })
}

// Test-only surface: the path guard and the purger are the destructive core of
// this half and are exercised by tests/host.mjs against a throwaway DSH_HOME.
export const __test = { targetsFor, purgeSession, readPending, writePending }

export default apply
