// Host-half test: the destructive path guard and the purger, run against a
// throwaway DSH_HOME so no real session directory is ever touched.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dcmt-home-'))
process.env.DSH_HOME = home

const sessionsRoot = path.join(home, 'sessions')
const projectDir = path.join(sessionsRoot, '--C-work-demo--')
const otherDir = path.join(sessionsRoot, '--C-work-other--')
const cacheDir = path.join(home, 'storages', 'session_projcache', 'sessions')

function seed() {
  fs.mkdirSync(path.join(projectDir, 'session-keep'), { recursive: true })
  fs.writeFileSync(path.join(projectDir, 'session-keep', 'session.v4.jsonl.zstd'), 'keep')
  fs.mkdirSync(path.join(projectDir, 'session-gone'), { recursive: true })
  fs.writeFileSync(path.join(projectDir, 'session-gone', 'session.v4.jsonl.zstd'), 'gone')
  fs.mkdirSync(path.join(otherDir, 'session-gone'), { recursive: true })
  fs.writeFileSync(path.join(otherDir, 'session-gone', 'session.v4.jsonl.zstd'), 'gone-too')
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(path.join(cacheDir, 'session-gone.json'), '{}')
  fs.writeFileSync(path.join(cacheDir, 'session-keep.json'), '{}')
}

seed()

const module = await import(pathToFileURL(fileURLToPath(new URL('../host.mjs', import.meta.url))).href)
const { targetsFor, purgeSession, readPending, writePending } = module.__test

assert.equal(module.name, 'dsh-chat-message-tools')
assert.equal(typeof module.apply, 'function')

// ---- path guard ------------------------------------------------------------
assert.deepEqual(targetsFor('../evil'), [], 'path fragments are rejected')
assert.deepEqual(targetsFor('..'), [], 'a bare dot-dot is rejected')
assert.deepEqual(targetsFor('a/b'), [], 'separators are rejected')
assert.deepEqual(targetsFor(''), [], 'empty ids are rejected')
assert.deepEqual(targetsFor(42), [], 'non-strings are rejected')
const unknown = targetsFor('session-unknown')
assert.ok(unknown.length > 0, 'a well-formed id still yields candidates')
assert.ok(
  unknown.every((candidate) => candidate.startsWith(home + path.sep)),
  'every candidate stays under DSH_HOME'
)
assert.ok(
  unknown.every((candidate) => ['session-unknown', 'session-unknown.json'].includes(path.basename(candidate))),
  'every candidate is that exact id, never a parent or sibling'
)

const targets = targetsFor('session-gone').sort()
assert.deepEqual(
  targets,
  [path.join(projectDir, 'session-gone'), path.join(otherDir, 'session-gone'), path.join(cacheDir, 'session-gone.json')].sort(),
  'every copy of the session (all cwd buckets + cache) is targeted'
)

// ---- purge -----------------------------------------------------------------
const result = await purgeSession('session-gone')
assert.equal(result.remaining.length, 0, 'nothing is left behind')
assert.equal(fs.existsSync(path.join(projectDir, 'session-gone')), false, 'the session directory is gone')
assert.equal(fs.existsSync(path.join(otherDir, 'session-gone')), false, 'other cwd buckets are gone too')
assert.equal(fs.existsSync(path.join(cacheDir, 'session-gone.json')), false, 'the projection cache is gone')
assert.equal(fs.existsSync(path.join(projectDir, 'session-keep', 'session.v4.jsonl.zstd')), true, 'sibling sessions survive')
assert.equal(fs.existsSync(path.join(cacheDir, 'session-keep.json')), true, 'sibling caches survive')

// A second purge is an idempotent no-op.
const again = await purgeSession('session-gone')
assert.equal(again.remaining.length, 0)

// ---- pending list ----------------------------------------------------------
assert.deepEqual(readPending(), [])
writePending(['session-keep', '../evil'])
assert.deepEqual(readPending(), ['session-keep'], 'the pending file keeps only safe ids')
writePending([])
assert.deepEqual(readPending(), [], 'an empty pending list removes the file')

fs.rmSync(home, { recursive: true, force: true })
console.log('host: ok')
