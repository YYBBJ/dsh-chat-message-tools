// Smoke test for the Client half. It runs the real plugin factory against a tiny
// fake React + fake Cordis context, so a crash in render or a wrong fork seq is
// caught without opening a browser.
import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'

const captured = { load: undefined }

globalThis.window = {
  innerWidth: 1440,
  __ModuleLoader__: {
    load(options) {
      captured.load = options
    },
  },
}

const React = makeFakeReact()
await import(pathToFileURL(fileURLToPath(new URL('../client.js', import.meta.url))).href)

assert.ok(captured.load, 'client bundle must call window.__ModuleLoader__.load')
assert.equal(captured.load.id, 'dsh-chat-message-tools')

const plugin = captured.load.factory((specifier) => {
  if (specifier === 'react') return React
  if (specifier === 'react-dom') return { createPortal: (node) => node }
  // The primitives package is optional for the plugin (it falls back on its own
  // menu row), so the harness deliberately does not provide it.
  throw new Error(`unexpected require: ${specifier}`)
})

assert.equal(typeof plugin.apply, 'function')
assert.deepEqual(plugin.inject, ['slots'])

// ---- fake Chat snapshot: two user messages in two closed turns ---------------
const userNode = (key, seq, text) => ({
  key,
  kind: 'user',
  anchorSeq: seq,
  data: { content: [{ kind: 'text', text }], time: 1_700_000_000_000 },
})
const chat = {
  nodes: new Map([
    ['u1', userNode('u1', 10, 'hello there')],
    ['a1', { key: 'a1', kind: 'assistant-step', anchorSeq: 11, data: { blocks: [] } }],
    ['u2', userNode('u2', 30, 'second question')],
  ]),
  timeline: {
    turns: new Map([
      [1, { turn: 1, end: { seq: 20 } }],
      [2, { turn: 2, end: { seq: 40 } }],
    ]),
  },
}

const calls = { fork: [], archive: [], open: [], prompt: [], insert: [], rename: [], start: [], unarchive: [], removed: [] }
const childSession = {
  prompt: async (content, mode) => {
    calls.prompt.push({ content, mode })
    return { ok: true }
  },
  rename: async (title) => {
    calls.rename.push(title)
    return { ok: true }
  },
}
const sessions = {
  fork: async (options) => {
    calls.fork.push(options)
    return 'child-1'
  },
  binding: (id) => (id === 'child-1' ? { session: childSession } : undefined),
  handleSessionRemoved: (id) => calls.removed.push(id),
  list: {
    getSnapshot: () => ({ byId: { 'session-1': { title: 'Demo chat' } } }),
  },
}
const workspace = {
  openSession: (id) => calls.open.push(id),
  archiveSession: async (id) => calls.archive.push(id),
  unarchiveSession: async (id) => calls.unarchive.push(id),
  startSession: (id) => calls.start.push(id),
}
const workspaces = {
  list: { getSnapshot: () => ({ items: [{ workspaceId: 'ws-1', title: 'Demo workspace', sessionIds: ['session-1', 'session-9'] }] }) },
  insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
    calls.insert.push([workspaceId, sessionId, beforeSessionId])
  },
}
const ctx = {
  get(name) {
    if (name === 'locale') return { getSnapshot: () => ({ id: 'zh' }), subscribe: () => () => {} }
    if (name === 'sessions') return sessions
    if (name === 'uiWorkspace') return workspace
    if (name === 'workspaces') return workspaces
    return undefined
  },
  slots: {
    inject(name, callback) {
      assert.ok(
        ['conversation.input.left', 'shell.overlay', 'sidebar.workspaces.session.menu.item'].includes(name),
        `unexpected slot ${name}`
      )
      captured.injectDispose = callback()
    },
    register(spec, component) {
      captured.registrations = captured.registrations ?? {}
      captured.registrations[spec.name] = { spec, component }
      return () => {}
    },
  },
}

plugin.apply(ctx)
const composer = captured.registrations['conversation.input.left']
const hostEntry = captured.registrations['shell.overlay']
const menuEntry = captured.registrations['sidebar.workspaces.session.menu.item']
assert.ok(composer, 'composer entry must register')
assert.ok(hostEntry, 'archive controller must register on shell.overlay')
assert.ok(menuEntry, 'session menu item must register')
assert.equal(composer.spec.id, 'chat-message-tools')
assert.equal(hostEntry.spec.id, 'chat-message-tools-archives')
assert.equal(menuEntry.spec.id, 'chat-message-tools-delete')
assert.equal(menuEntry.spec.order, 450, 'the menu row lands after the shipped archive (400)')
assert.equal(typeof composer.component, 'function')
assert.equal(typeof hostEntry.component, 'function')
assert.equal(typeof menuEntry.component, 'function')

// ---- render harness --------------------------------------------------------
const api = composer.spec.inject()
const props = {
  ...api,
  sessionId: 'session-1',
  useChat: (selector) => selector(chat),
}

function render() {
  React.__enter(composer.component)
  return composer.component(props)
}

const hostProps = { ...hostEntry.spec.inject() }
function renderHost() {
  // The host reads shared store state at mount; the fake has no effect flush, so
  // remount it to observe the latest request.
  React.__resetAll()
  return hostEntry.component(hostProps)
}

function findAll(tree, predicate, out = []) {
  if (tree === null || tree === undefined) return out
  if (Array.isArray(tree)) {
    for (const child of tree) findAll(child, predicate, out)
    return out
  }
  if (typeof tree !== 'object') return out
  if (predicate(tree)) out.push(tree)
  if (typeof tree.type === 'function') {
    // Host components are strings; anything callable is one of ours.
    findAll(tree.type(tree.props), predicate, out)
    return out
  }
  findAll(tree.props === undefined ? undefined : tree.props.children, predicate, out)
  return out
}

function findByTitle(tree, title) {
  const [found] = findAll(tree, (node) => node.props !== undefined && node.props.title === title)
  assert.ok(found, `expected a node titled "${title}"`)
  return found
}

const isOpenTrigger = (node) => node.props !== undefined && typeof node.props.title === 'string' && node.props.title.startsWith('消息操作')

// 1. The composer entry renders an icon button that opens the message list.
const first = render()
const openButton = findAll(first, isOpenTrigger)
assert.equal(openButton.length, 1, 'composer entry must render one trigger')
openButton[0].props.onClick()

// 2. The list shows both human messages.
const listTree = render()
const listText = JSON.stringify(listTree)
assert.match(listText, /hello there/)
assert.match(listText, /second question/)

// 3. Delete the SECOND message: boundary must be the first turn's end (seq 20),
//    and the truncated child must take the original's place, not sit beside it.
const deleteButtons = findAll(listTree, (node) => node.props !== undefined && node.props.title === '归档')
assert.equal(deleteButtons.length, 2)
deleteButtons[1].props.onClick()

const deleteDialog = render()
assert.match(JSON.stringify(deleteDialog), /这条消息以及它之后的所有轮次会从当前对话中移走/)
const [confirm] = findAll(deleteDialog, (node) => node.props !== undefined && node.props.label === '归档')
assert.ok(confirm, 'delete dialog must offer the confirm action')
confirm.props.onClick()

await new Promise((resolve) => setTimeout(resolve, 80))
assert.deepEqual(calls.fork, [{ sessionId: 'session-1', atSeq: 20, increaseTitle: false }], 'delete must fork at the previous turn end, without a title suffix')
assert.deepEqual(calls.insert, [['ws-1', 'child-1', 'session-1']], 'the child takes the original sidebar slot')
assert.deepEqual(calls.open, ['child-1'])
assert.deepEqual(calls.rename, ['Demo chat'], 'the child inherits the original title')
assert.deepEqual(calls.archive, ['session-1'], 'the replaced session is archived so the sidebar shows one conversation')
assert.deepEqual(calls.prompt, [], 'delete never sends a prompt')

// 3b. The FIRST message has no earlier boundary, so "archive from here" means
//     archiving the whole conversation: the same dialog explains it and its
//     confirm does exactly that (no truncation, no physical delete).
calls.archive.length = 0
calls.unarchive.length = 0
calls.fork.length = 0
const listForFirst = render()
findAll(listForFirst, isOpenTrigger)[0].props.onClick()
const firstRowTree = render()
const [firstArchive] = findAll(firstRowTree, (node) => node.props !== undefined && node.props.title === '归档')
assert.ok(firstArchive, 'the first message still offers the archive action')
firstArchive.props.onClick()

const firstDialog = render()
assert.match(JSON.stringify(firstDialog), /归档整个对话/, 'the dialog explains that this archives the whole conversation')
const [firstConfirm] = findAll(firstDialog, (node) => node.props !== undefined && node.props.label === '归档整个对话')
assert.ok(firstConfirm, 'the escalated action is pressable')
assert.equal(firstConfirm.props.disabled, false)
firstConfirm.props.onClick()

await new Promise((resolve) => setTimeout(resolve, 60))
assert.deepEqual(calls.archive, ['session-1'], 'archiving from the first message archives the conversation')
assert.deepEqual(calls.fork, [], 'no truncation happens for the first message')
assert.equal(hostProps.api.archiveUi.get().deleteRequest, null, 'the archive action never opens the delete confirmation')

// 4. Edit the first message: its boundary is null, so confirming must be refused.
calls.fork.length = 0
calls.open.length = 0
calls.insert.length = 0
calls.rename.length = 0
calls.archive.length = 0
const listAgain = render()
findAll(listAgain, isOpenTrigger)[0].props.onClick()
const reopened = render()
findByTitle(reopened, '修改并重发').props.onClick()
const editDialog = render()
const [send] = findAll(editDialog, (node) => node.props !== undefined && node.props.label === '发送')
assert.ok(send)
assert.equal(send.props.disabled, true, 'the first message has no truncation boundary')
assert.match(JSON.stringify(editDialog), /第一条消息/, 'the editor explains why')
const [escalateToDelete] = findAll(editDialog, (node) => node.props !== undefined && node.props.label === '归档整个对话')
assert.ok(escalateToDelete, 'the editor offers the conversation delete instead')

// 5. Edit the second message and resend: fork at seq 20, prompt, then archive the original.
calls.fork.length = 0
calls.open.length = 0
calls.insert.length = 0
calls.rename.length = 0
calls.archive.length = 0
const listForEdit = render()
findAll(listForEdit, isOpenTrigger)[0].props.onClick()
const editButtons = findAll(render(), (node) => node.props !== undefined && node.props.title === '修改并重发')
assert.equal(editButtons.length, 2)
editButtons[1].props.onClick()
const editor = render()
const [resend] = findAll(editor, (node) => node.props !== undefined && node.props.label === '发送')
assert.ok(resend)
assert.equal(resend.props.disabled, false)
resend.props.onClick()

await new Promise((resolve) => setTimeout(resolve, 120))
assert.deepEqual(calls.fork, [{ sessionId: 'session-1', atSeq: 20, increaseTitle: false }])
assert.deepEqual(calls.insert, [['ws-1', 'child-1', 'session-1']])
assert.deepEqual(calls.open, ['child-1'])
assert.deepEqual(calls.rename, ['Demo chat'])
assert.deepEqual(calls.prompt, [{ content: [{ type: 'text', text: 'second question' }], mode: 'queue' }])
assert.deepEqual(calls.archive, ['session-1'], 'the original is archived only after the resend succeeded')

// 6. The composer delete button opens the shared confirmation; confirming
//    archives, purges the files through the Host half, and leaves a blank chat.
calls.archive.length = 0
calls.start.length = 0
const purgeCalls = []
const originalFetch = globalThis.fetch
globalThis.fetch = async (url, init) => {
  purgeCalls.push({ url, body: init?.body })
  return { ok: true, status: 200, json: async () => ({ ok: true, found: true, deleted: ['...'], pending: [] }) }
}
// The row that is on screen, so the controller also clears the empty view.
globalThis.document = {
  querySelectorAll: (selector) =>
    selector === '[data-row-key^="session:"]'
      ? [{ getAttribute: (name) => (name === 'data-row-key' ? 'session:session-1' : name === 'aria-selected' ? 'true' : null) }]
      : [],
  querySelector: () => null,
}
const listForConversation = render()
const [deleteConversation] = findAll(listForConversation, (node) => node.props !== undefined && node.props.title === '删除整个对话')
assert.ok(deleteConversation, 'the composer entry offers a whole-conversation delete')
deleteConversation.props.onClick()

const conversationDialog = renderHost()
assert.match(JSON.stringify(conversationDialog), /Demo chat/, 'the dialog names the conversation being removed')
assert.match(JSON.stringify(conversationDialog), /从磁盘删除/, 'the dialog states the deletion is on disk')
const [confirmConversation] = findAll(conversationDialog, (node) => node.props !== undefined && node.props.label === '永久删除')
assert.ok(confirmConversation)
confirmConversation.props.onClick()

await new Promise((resolve) => setTimeout(resolve, 60))
globalThis.fetch = originalFetch
assert.deepEqual(calls.archive, ['session-1'], 'the conversation is archived so it leaves the sidebar')
assert.deepEqual(calls.unarchive, ['session-1'], 'a successful purge drops the archive marker again')
assert.equal(purgeCalls.length, 1, 'the Host half is asked exactly once')
assert.equal(purgeCalls[0].url, '/plugins/dsh-chat-message-tools/session/delete')
assert.deepEqual(JSON.parse(purgeCalls[0].body), { sessionId: 'session-1' })
assert.deepEqual(calls.start, ['ws-1'], 'the shell lands on a blank chat in the same workspace')
assert.deepEqual(calls.removed, ['session-1'], 'the row is removed from the client catalog so the sidebar drops it at once')

// 6a. A route that does not exist yet (the Host half only loads at startup)
//     must NOT count as a delete: no new chat, and the conversation comes back.
calls.archive.length = 0
calls.unarchive.length = 0
calls.start.length = 0
calls.removed.length = 0
globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({ ok: false, error: 'HTTP 404' }) })
const listForMissing = render()
const [missingDelete] = findAll(listForMissing, (node) => node.props !== undefined && node.props.title === '删除整个对话')
missingDelete.props.onClick()
const missingDialog = renderHost()
const [missingConfirm] = findAll(missingDialog, (node) => node.props !== undefined && node.props.label === '永久删除')
missingConfirm.props.onClick()
await new Promise((resolve) => setTimeout(resolve, 60))
assert.deepEqual(calls.archive, ['session-1'], 'the hiding step still runs first')
assert.deepEqual(calls.unarchive, ['session-1'], 'a missing route rolls the hiding step back')
assert.deepEqual(calls.start, [], 'a missing route must not open a new conversation')
assert.deepEqual(calls.removed, [], 'a missing route must not touch the catalog')

// 6a2. Any other failure also restores the conversation instead of creating one.
calls.archive.length = 0
calls.unarchive.length = 0
calls.start.length = 0
calls.removed.length = 0
globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ ok: false, error: 'file is locked' }) })
const listForFailure = render()
const [failDelete] = findAll(listForFailure, (node) => node.props !== undefined && node.props.title === '删除整个对话')
failDelete.props.onClick()
const failDialog = renderHost()
const [failConfirm] = findAll(failDialog, (node) => node.props !== undefined && node.props.label === '永久删除')
failConfirm.props.onClick()
await new Promise((resolve) => setTimeout(resolve, 60))
assert.deepEqual(calls.archive, ['session-1'])
assert.deepEqual(calls.unarchive, ['session-1'], 'a failed purge restores the conversation')
assert.deepEqual(calls.start, [], 'a failed purge must not open a new conversation')
assert.deepEqual(calls.removed, [], 'a failed purge must not touch the catalog')

// 6a3. Files still held open: stay hidden (archived) so a half-deleted session
//      never reappears, and do not open a new conversation either.
calls.archive.length = 0
calls.unarchive.length = 0
calls.start.length = 0
calls.removed.length = 0
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, found: true, deleted: [], pending: ['session-1'] }) })
const listForPending = render()
const [pendingDeleteButton] = findAll(listForPending, (node) => node.props !== undefined && node.props.title === '删除整个对话')
pendingDeleteButton.props.onClick()
const pendingDialog = renderHost()
const [pendingConfirmButton] = findAll(pendingDialog, (node) => node.props !== undefined && node.props.label === '永久删除')
pendingConfirmButton.props.onClick()
await new Promise((resolve) => setTimeout(resolve, 60))
globalThis.fetch = originalFetch
assert.deepEqual(calls.archive, ['session-1'])
assert.deepEqual(calls.unarchive, [], 'a pending purge keeps the session archived')
assert.deepEqual(calls.start, [], 'a pending purge must not open a new conversation')
assert.deepEqual(calls.removed, [], 'a pending purge must not touch the catalog')

// 6a4. Nothing on disk matched the id: never claim success, put it back.
calls.archive.length = 0
calls.unarchive.length = 0
calls.start.length = 0
calls.removed.length = 0
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, found: false, deleted: [], pending: [] }) })
const listForMissingFiles = render()
const [missingFilesButton] = findAll(listForMissingFiles, (node) => node.props !== undefined && node.props.title === '删除整个对话')
missingFilesButton.props.onClick()
const missingFilesDialog = renderHost()
const [missingFilesConfirm] = findAll(missingFilesDialog, (node) => node.props !== undefined && node.props.label === '永久删除')
missingFilesConfirm.props.onClick()
await new Promise((resolve) => setTimeout(resolve, 60))
globalThis.fetch = originalFetch
assert.deepEqual(calls.archive, ['session-1'])
assert.deepEqual(calls.unarchive, ['session-1'], 'an unmatched id is restored, not claimed as deleted')
assert.deepEqual(calls.start, [], 'an unmatched id must not open a new conversation')
assert.deepEqual(calls.removed, [], 'an unmatched id must not touch the catalog')

// 6b. The session "..." menu offers the same permanent delete.
const menuClosed = []
const menuProps = {
  ...menuEntry.spec.inject(),
  sessionId: 'session-2',
  displayTitle: 'Second chat',
  useMenuOpenState: () => [true, (value) => menuClosed.push(value)],
}
React.__enter(menuEntry.component)
const menuTree = menuEntry.component(menuProps)
const [menuItem] = findAll(menuTree, (node) => node.props !== undefined && node.props.children === '删除会话')
assert.ok(menuItem, 'the menu row is labelled 删除会话')
menuItem.props.onClick()
assert.deepEqual(menuClosed, [false], 'selecting the row dismisses the menu')
const pendingDelete = menuEntry.spec.inject().api.archiveUi.get().deleteRequest
assert.equal(pendingDelete.sessionId, 'session-2')
assert.equal(pendingDelete.title, 'Second chat')
const menuDialog = renderHost()
assert.match(JSON.stringify(menuDialog), /Second chat/, 'the sidebar path opens the same confirmation')

// 7. The archive controller mounts a button on each workspace row.
const internals = plugin.__test
assert.ok(internals && typeof internals.mountWorkspaceSlots === 'function', 'the row mounter is exposed for tests')

const fakeDocument = makeFakeDocument([
  { rowKey: 'workspace:ws-1' },
  { rowKey: 'workspace:ws-unknown' },
  { rowKey: 'workspace:ungrouped' },
  { rowKey: 'session:session-1' },
])
const known = new Set(['ws-1'])
const mounted = internals.mountWorkspaceSlots(fakeDocument, known)
assert.equal(mounted.length, 1, 'only rows whose key is a known workspace get a slot')
assert.equal(mounted[0].workspaceId, 'ws-1')
assert.equal(fakeDocument.created.length, 1, 'exactly one span was created')
const mountedAgain = internals.mountWorkspaceSlots(fakeDocument, known)
assert.equal(mountedAgain[0].container, mounted[0].container, 'the existing slot is reused, never duplicated')
assert.equal(fakeDocument.created.length, 1, 'no second span is appended')

// 8. The per-workspace button opens a dialog filtered to that workspace and restores.
const archivedWorkspaceSnapshot = {
  archivedSessionIds: ['session-9', 'session-10'],
  items: [{ workspaceId: 'ws-1', title: 'Demo workspace', sessionIds: ['session-1', 'session-9'] }],
}
const archivedSessionSnapshot = {
  byId: {
    'session-9': { title: 'Old chat', updatedAt: 1_600_000_000_000 },
    'session-10': { title: 'Older chat', updatedAt: 1_500_000_000_000 },
  },
}
ctx.get = ((original) => (name) => {
  if (name === 'workspaces') return { list: { getSnapshot: () => archivedWorkspaceSnapshot, subscribe: () => () => {} } }
  if (name === 'sessions') return { ...sessions, list: { getSnapshot: () => archivedSessionSnapshot, subscribe: () => () => {} } }
  return original(name)
})(ctx.get)

// Mount one workspace row, then the controller renders one button per row.
hostProps.api.archiveUi.setRows([{ workspaceId: 'ws-1', container: { isConnected: true } }])
const withButton = renderHost()
const [workspaceButton] = findAll(withButton, (node) => node.props !== undefined && typeof node.props.title === 'string' && node.props.title.startsWith('归档会话'))
assert.ok(workspaceButton, 'the workspace row gets an archive button')
assert.match(JSON.stringify(withButton), /"1"/, 'the button counts only this workspace archive')
workspaceButton.props.onClick()

const opened = renderHost()
assert.match(JSON.stringify(opened), /归档会话 · Demo workspace/, 'the dialog is scoped to the clicked workspace')
assert.match(JSON.stringify(opened), /Old chat/)
assert.doesNotMatch(JSON.stringify(opened), /Older chat/, 'another workspace archive is not listed')

calls.unarchive.length = 0
calls.open.length = 0
const [restore] = findAll(opened, (node) => node.props !== undefined && node.props.label === '恢复')
assert.ok(restore)
restore.props.onClick()

await new Promise((resolve) => setTimeout(resolve, 40))
assert.deepEqual(calls.unarchive, ['session-9'], 'restoring unarchives the conversation')
assert.deepEqual(calls.open, ['session-9'], 'restoring opens it')

console.log('smoke: ok')

// ---- tiny DOM stand-in -----------------------------------------------------
function makeFakeDocument(specs) {
  const created = []
  const rows = specs.map((spec) => {
    const attributes = { 'data-row-key': spec.rowKey }
    const children = []
    return {
      getAttribute: (name) => (name in attributes ? attributes[name] : null),
      appendChild: (node) => {
        children.push(node)
      },
      querySelector: (selector) => (selector === '[data-dcmo-ws-archive]' ? children.find((child) => child.__slot === true) ?? null : null),
    }
  })
  return {
    created,
    querySelectorAll: (selector) =>
      selector === '[data-row-key^="workspace:"]' ? rows.filter((row) => String(row.getAttribute('data-row-key')).startsWith('workspace:')) : [],
    createElement: () => {
      const node = {
        __slot: true,
        className: '',
        attributes: {},
        setAttribute(name, value) {
          node.attributes[name] = String(value)
        },
      }
      created.push(node)
      return node
    },
  }
}

// ---- tiny React stand-in ---------------------------------------------------
function makeFakeReact() {
  // Each component gets its own hook array, like a real renderer: rendering one
  // component must never hand another component's state back to it.
  const stores = new Map()
  let hooks = []
  let cursor = 0
  return {
    __enter(component) {
      if (!stores.has(component)) stores.set(component, [])
      hooks = stores.get(component)
      cursor = 0
    },
    __resetAll() {
      stores.clear()
      hooks = []
      cursor = 0
    },
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props ?? {}),
          children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
        },
      }
    },
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial
      const set = (next) => {
        hooks[index] = typeof next === 'function' ? next(hooks[index]) : next
      }
      return [hooks[index], set]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = { current: initial }
      return hooks[index]
    },
    useEffect() {
      cursor++
    },
    useMemo(factory) {
      cursor++
      return factory()
    },
    useCallback(callback) {
      cursor++
      return callback
    },
  }
}
