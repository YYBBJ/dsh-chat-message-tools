window.__ModuleLoader__.load({
	id: 'dsh-chat-message-tools',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");
		const h = React.createElement;
		let ReactDOM;
		try {
			ReactDOM = require("react-dom");
		} catch {
			ReactDOM = undefined;
		}
		/** Shipped menu/icon primitives, when the host composition provides them. */
		let primitives;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch {
			primitives = undefined;
		}

		//#region styles
		const STYLE_ID = "dsh-chat-message-tools/style";
		/** Host half route that deletes one session's files. */
		const DELETE_ENDPOINT = "/plugins/dsh-chat-message-tools/session/delete";
		const CSS = `
.dcmo-btn{box-sizing:border-box;font:inherit;font-size:13px;line-height:20px;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;transition:background-color .12s,border-color .12s}
.dcmo-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.dcmo-btn:disabled{opacity:.5;cursor:default}
.dcmo-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dcmo-btn-primary:hover{filter:brightness(1.06);background:var(--dsw-alias-brand-primary)}
.dcmo-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent)}
.dcmo-btn-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}
.dcmo-iconbtn{width:28px;height:28px;padding:0;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background-color .12s,color .12s;position:relative}
.dcmo-iconbtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dcmo-iconbtn-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.dcmo-badge{position:absolute;top:-2px;right:-4px;min-width:14px;height:14px;padding:0 3px;border-radius:7px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:9px;line-height:14px;text-align:center;font-variant-numeric:tabular-nums}
.dcmo-ws-archive-slot{display:none;flex:none;align-items:center;justify-content:center}
[data-row-key^="workspace:"]:hover .dcmo-ws-archive-slot{display:inline-flex}
.dcmo-ws-archive{position:relative;width:20px;height:20px;padding:0;border:none;border-radius:var(--dsw-radius-xs);background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;flex:none;display:inline-flex;align-items:center;justify-content:center}
.dcmo-ws-archive:hover{color:var(--dsw-alias-label-primary)}
.dcmo-ws-archive[data-count="0"]{opacity:.5}
.dcmo-ws-count{position:absolute;top:-4px;right:-5px;min-width:12px;height:12px;padding:0 2px;border-radius:6px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:8px;line-height:12px;text-align:center;font-variant-numeric:tabular-nums}
.dcmo-menu-item{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-state-error-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.dcmo-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dcmo-toolbar{position:fixed;z-index:2147482000;display:flex;align-items:center;gap:2px;padding:3px;border-radius:10px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 6px 18px rgba(0,0,0,.16)}
.dcmo-toolbar .dcmo-tool{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 8px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dcmo-toolbar .dcmo-tool:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dcmo-toolbar .dcmo-tool-danger:hover{color:var(--dsw-alias-state-error-primary)}
.dcmo-overlay{position:fixed;inset:0;z-index:2147482500;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,17,22,.42)}
.dcmo-panel{box-sizing:border-box;width:min(600px,100%);max-height:min(78vh,720px);display:flex;flex-direction:column;gap:0;border-radius:14px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 18px 48px rgba(0,0,0,.28);color:var(--dsw-alias-label-primary);overflow:hidden}
.dcmo-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dcmo-title{font-size:15px;font-weight:600;flex:auto;min-width:0}
.dcmo-body{padding:16px;overflow:auto;display:flex;flex-direction:column;gap:12px;min-height:0}
.dcmo-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dcmo-warn{font-size:12px;line-height:18px;color:var(--dsw-alias-state-warn-primary)}
.dcmo-error{font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary)}
.dcmo-input{box-sizing:border-box;width:100%;min-height:132px;resize:vertical;font:inherit;font-size:14px;line-height:22px;padding:10px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}
.dcmo-input:focus{border-color:var(--dsw-alias-brand-primary)}
.dcmo-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l1)}
.dcmo-list{display:flex;flex-direction:column;gap:8px}
.dcmo-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.dcmo-item-main{flex:auto;min-width:0;display:flex;flex-direction:column;gap:4px}
.dcmo-item-text{font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dcmo-item-meta{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);display:flex;gap:8px}
.dcmo-item-actions{display:flex;gap:6px;flex:none}
.dcmo-item-empty{font-size:13px;color:var(--dsw-alias-label-secondary);padding:12px 0}
.dcmo-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:2147482600;max-width:min(560px,calc(100vw - 48px));padding:10px 14px;border-radius:10px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 10px 30px rgba(0,0,0,.24);font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}
.dcmo-toast[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.dcmo-toast[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
`;
		function installStyles() {
			if (typeof document === "undefined") return () => {};
			const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_ID)}]`);
			if (existing !== null) return () => {};
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-chat-message-tools";
			tag.dataset.pluginCss = STYLE_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		//#endregion

		//#region i18n
		const DICT = {
			zh: {
				open: "消息操作",
				openHint: "删除某条消息，或修改后重新发送",
				listTitle: "消息操作",
				listHint: "选择一条你发送过的消息：删除它（以及之后的内容），或修改内容后重新发送。两种操作都保持当前对话不变。",
				listEmpty: "当前会话还没有已加载的用户消息。",
				edit: "修改并重发",
				remove: "归档",
				editTitle: "修改并重新发送",
				editHint: "保存后这条消息及其之后的内容会被替换为修改后的版本，并在同一位置重新发送。对话标题和侧栏位置保持不变。",
				send: "发送",
				cancel: "取消",
				removeTitle: "归档这条消息及其后的内容",
				removeBody: "这条消息以及它之后的所有轮次会从当前对话中移走（对话保持原位、标题不变），移走前的那一版会进入归档，可随时找回。",
				removeFirst: "这是本次会话中已加载的第一条用户消息，它之前没有可分界的位置，所以「归档此条及之后」等于归档整个对话。",
				removeConfirm: "归档",
				removeFirstConfirm: "归档整个对话",
				working: "处理中…",
				busy: "正在处理上一条操作，请稍候。",
				doneRemove: "已归档。移走前的那一版在归档里，可随时找回。",
				doneRemoveFailed: "内容已从对话中移走，但旧版本未能自动归档，请到侧栏手动归档。",
				doneArchiveConversation: "整个对话已归档，可随时在归档中找回。",
				doneEdit: "已重新发送。",
				deleteConversation: "删除整个对话",
				deleteConversationTitle: "删除整个对话",
				deleteConversationBody: "「{title}」会从侧栏移除，并从磁盘删除它的会话日志与投影缓存。删除后无法恢复；如果文件正被占用，会在下次启动 DSH 时完成清除。",
				deleteConversationUntitled: "未命名对话",
				deleteConversationConfirm: "永久删除",
				deleteSessionMenu: "删除会话",
				doneDeleteConversation: "已删除，文件已从磁盘移除。",
				doneDeleteConversationPending: "已隐藏该会话；部分文件被占用，将在下次启动 DSH 时清除。",
				doneDeleteNotFound: "没有找到这个会话的文件（可能已被删除）。会话已恢复到侧栏。",
				doneDeleteFailed: "磁盘删除失败：{error}。会话已恢复到侧栏。",
				doneDeleteNeedsRestart: "磁盘删除没有执行：需要重启一次 DSH 才会生效。会话已恢复到侧栏。",
				archives: "归档会话",
				archivesTitle: "归档会话",
				archivesHint: "恢复会把对话移回侧栏，并直接打开它。",
				archivesEmpty: "还没有归档的会话。",
				archivesEmptyWorkspace: "这个工作区还没有归档的会话。",
				archiveUnknownTitle: "未命名对话",
				restore: "恢复",
				restored: "已恢复「{title}」。",
				restoreFailed: "恢复失败",
				fail: "操作失败",
				noService: "会话服务不可用，请刷新页面后重试。",
				noBoundary: "这是会话里的第一条消息，前面没有可截断的位置，无法原地修改重发。可以改为归档整个对话，再重新开始。",
				editEmpty: "内容不能为空。",
				rowEdit: "修改重发",
				rowArchive: "归档此条及之后",
				steering: "插话"
			},
			en: {
				open: "Message actions",
				openHint: "Delete a message, or edit one and resend it",
				listTitle: "Message actions",
				listHint: "Pick a message you sent: delete it (and everything after it), or edit it and resend. Both keep this conversation in place.",
				listEmpty: "This session has no loaded user messages yet.",
				edit: "Edit & resend",
				remove: "Archive",
				editTitle: "Edit and resend",
				editHint: "Saving replaces this message and everything after it with your edit, and resends it from the same place. The title and sidebar position stay the same.",
				send: "Send",
				cancel: "Cancel",
				removeTitle: "Archive this message and what follows",
				removeBody: "This message and every later turn leave the current conversation, which keeps its place and title. The version that still contains them moves to Archive, where you can restore it at any time.",
				removeFirst: "This is the first loaded user message, so there is no earlier boundary to cut at — archiving from here means archiving the whole conversation.",
				removeConfirm: "Archive",
				removeFirstConfirm: "Archive the whole conversation",
				working: "Working…",
				busy: "Another action is still running. Please wait.",
				doneRemove: "Archived. The previous version is in Archive if you need it back.",
				doneRemoveFailed: "The content left the conversation, but the previous version could not be archived automatically — archive it from the sidebar.",
				doneArchiveConversation: "The whole conversation is in Archive; restore it any time.",
				doneEdit: "Resent.",
				deleteConversation: "Delete conversation",
				deleteConversationTitle: "Delete this conversation",
				deleteConversationBody: "\"{title}\" leaves the sidebar and its session log and projection cache are deleted from disk. This cannot be undone. If a file is still held open, the rest is removed on the next DSH start.",
				deleteConversationUntitled: "Untitled conversation",
				deleteConversationConfirm: "Delete permanently",
				deleteSessionMenu: "Delete conversation",
				doneDeleteConversation: "Deleted — the files are gone from disk.",
				doneDeleteConversationPending: "Hidden; some files were in use and will be removed on the next DSH start.",
				doneDeleteNotFound: "No files were found for this conversation (it may already be gone). It is back in the sidebar.",
				doneDeleteFailed: "Disk deletion failed: {error}. The conversation is back in the sidebar.",
				doneDeleteNeedsRestart: "Nothing was deleted: this needs one DSH restart to take effect. The conversation is back in the sidebar.",
				archives: "Archived conversations",
				archivesTitle: "Archived conversations",
				archivesHint: "Restoring moves the conversation back into the sidebar and opens it.",
				archivesEmpty: "No archived conversations yet.",
				archivesEmptyWorkspace: "No archived conversations in this workspace.",
				archiveUnknownTitle: "Untitled conversation",
				restore: "Restore",
				restored: "Restored \"{title}\".",
				restoreFailed: "Restore failed",
				fail: "Action failed",
				noService: "Session service is unavailable. Refresh the page and try again.",
				noBoundary: "This is the first message of the conversation, so there is no earlier cut point to edit from. Archive the whole conversation and start over instead.",
				editEmpty: "The message cannot be empty.",
				rowEdit: "Edit & resend",
				rowArchive: "Archive from here",
				steering: "steering"
			}
		};
		function resolveLocaleId(ctx) {
			try {
				const service = ctx && typeof ctx.get === "function" ? ctx.get("locale") : undefined;
				const snapshot = service && typeof service.getSnapshot === "function" ? service.getSnapshot() : service && typeof service.getLocale === "function" ? service.getLocale() : undefined;
				const id = snapshot && (snapshot.id ?? snapshot.locale ?? snapshot.current);
				if (typeof id === "string" && id.length > 0) return id;
			} catch {}
			const nav = typeof navigator === "undefined" ? "" : navigator.language || "";
			return nav;
		}
		function makeTranslator(ctx) {
			return (key) => {
				const id = resolveLocaleId(ctx);
				const table = /^zh/i.test(String(id || "")) ? DICT.zh : DICT.en;
				return table[key] ?? DICT.en[key] ?? key;
			};
		}
		//#endregion

		//#region data helpers
		/** Flatten one durable content block list into its visible text. */
		function textOf(content) {
			if (typeof content === "string") return content;
			if (Array.isArray(content)) {
				const parts = [];
				for (const block of content) {
					if (block === null || typeof block !== "object") continue;
					if (typeof block.text === "string" && block.text.length > 0) parts.push(block.text);
				}
				return parts.join("\n");
			}
			return "";
		}
		function clampText(text, limit) {
			const value = typeof text === "string" ? text : "";
			if (value.length <= limit) return value;
			return `${value.slice(0, limit)}…`;
		}
		/**
		 * Collect the human messages of one loaded Chat window in render order.
		 * @param snapshot - Chat store snapshot (may be undefined while mounting).
		 * @returns ordered descriptors carrying the seq used for a truncation cut.
		 */
		function collectMessages(snapshot) {
			const nodes = snapshot && snapshot.nodes;
			if (!nodes || typeof nodes.values !== "function") return [];
			const messages = [];
			try {
				for (const node of nodes.values()) {
					if (node === null || typeof node !== "object") continue;
					if (node.kind !== "user" && node.kind !== "steering") continue;
					const data = node.data;
					if (data === null || typeof data !== "object") continue;
					const seq = typeof node.anchorSeq === "number" ? node.anchorSeq : undefined;
					if (seq === undefined) continue;
					messages.push({
						key: node.key,
						seq,
						kind: node.kind,
						text: textOf(data.content),
						time: typeof data.time === "number" ? data.time : undefined
					});
				}
			} catch {
				return messages;
			}
			messages.sort((left, right) => left.seq - right.seq);
			return messages;
		}
		/**
		 * Find the last real event seq strictly before `seq`: the end of the newest
		 * Turn that closes before this message. Forking there keeps that prefix.
		 * @param snapshot - Chat store snapshot.
		 * @param seq - target message anchor seq.
		 * @returns a real Turn-end event seq, or null when no earlier Turn closed.
		 */
		function boundaryBefore(snapshot, seq) {
			const timeline = snapshot && snapshot.timeline;
			const turns = timeline && timeline.turns;
			if (!turns || typeof turns.values !== "function" || typeof seq !== "number") return null;
			let best = null;
			try {
				for (const turn of turns.values()) {
					const end = turn && turn.end;
					const endSeq = end && typeof end.seq === "number" ? end.seq : undefined;
					if (endSeq === undefined) continue;
					if (endSeq >= seq) continue;
					if (best === null || endSeq > best) best = endSeq;
				}
			} catch {
				return null;
			}
			return best;
		}
		function formatClock(ms) {
			if (typeof ms !== "number" || !Number.isFinite(ms)) return "";
			try {
				return new Date(ms).toLocaleString();
			} catch {
				return "";
			}
		}
		function delay(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		//#endregion

		//#region session operations
		const getService = (ctx, name) => {
			try {
				return typeof ctx.get === "function" ? ctx.get(name) : undefined;
			} catch {
				return undefined;
			}
		};
		/**
		 * Read the metadata that makes a forked Session indistinguishable from the
		 * one it replaces: its durable title and the workspace whose list holds it.
		 */
		function originalMetaOf(ctx, sessionId) {
			const meta = { title: undefined, workspaceId: undefined };
			try {
				const sessions = getService(ctx, "sessions");
				const snapshot = sessions && sessions.list && typeof sessions.list.getSnapshot === "function" ? sessions.list.getSnapshot() : undefined;
				const summary = snapshot && snapshot.byId ? snapshot.byId[sessionId] : undefined;
				if (summary && typeof summary.title === "string" && summary.title !== "") meta.title = summary.title;
			} catch {}
			try {
				const workspaces = getService(ctx, "workspaces");
				const snapshot = workspaces && workspaces.list && typeof workspaces.list.getSnapshot === "function" ? workspaces.list.getSnapshot() : undefined;
				const items = snapshot && Array.isArray(snapshot.items) ? snapshot.items : [];
				const owner = items.find((item) => item !== null && typeof item === "object" && Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId));
				if (owner) meta.workspaceId = owner.workspaceId;
			} catch {}
			return meta;
		}
		/**
		 * Wait for a freshly forked Session to be retained by the shell so its
		 * controller object (rename/prompt) becomes addressable.
		 */
		async function waitForChildSession(ctx, sessionId) {
			const sessions = getService(ctx, "sessions");
			if (sessions === undefined || typeof sessions.binding !== "function") throw new Error("sessions service unavailable");
			const deadline = Date.now() + 15000;
			while (Date.now() < deadline) {
				const binding = sessions.binding(sessionId);
				const session = binding === undefined ? undefined : binding.session;
				if (session !== undefined && typeof session.prompt === "function") return session;
				await delay(120);
			}
			throw new Error("forked session did not become ready");
		}
		/**
		 * Put the truncated child where the original was: open it (which catalogues
		 * it into the workspace list), move it into the original's sidebar slot, and
		 * give it the same title.
		 */
		async function attachChildInPlace(ctx, sessionId, childId) {
			const meta = originalMetaOf(ctx, sessionId);
			const uiWorkspace = getService(ctx, "uiWorkspace");
			if (uiWorkspace !== undefined && typeof uiWorkspace.openSession === "function") uiWorkspace.openSession(childId);
			const workspaces = getService(ctx, "workspaces");
			if (meta.workspaceId !== undefined && workspaces !== undefined && typeof workspaces.insertSessionBefore === "function") {
				try {
					await workspaces.insertSessionBefore(meta.workspaceId, childId, sessionId);
				} catch {}
			}
			const childSession = await waitForChildSession(ctx, childId);
			if (meta.title !== undefined && typeof childSession.rename === "function") {
				try {
					await childSession.rename(meta.title);
				} catch {}
			}
			return meta.title;
		}
		/** Hide one Session in Archive — the supported way to take it out of the sidebar. */
		async function archiveOriginal(ctx, sessionId) {
			const uiWorkspace = getService(ctx, "uiWorkspace");
			if (uiWorkspace === undefined || typeof uiWorkspace.archiveSession !== "function") return false;
			try {
				await uiWorkspace.archiveSession(sessionId);
				return true;
			} catch {
				return false;
			}
		}
		/**
		 * Archive a whole conversation and, when it is the one on screen, leave a
		 * blank chat in its place. Nothing is deleted from disk — this is the
		 * conversation-level form of the per-message "archive from here".
		 * @returns whether the archive succeeded.
		 */
		async function archiveConversation(ctx, sessionId) {
			const wasSelected = isSessionSelected(sessionId);
			const meta = originalMetaOf(ctx, sessionId);
			const ok = await archiveOriginal(ctx, sessionId);
			if (!ok) return false;
			const uiWorkspace = getService(ctx, "uiWorkspace");
			if (wasSelected && uiWorkspace !== undefined && typeof uiWorkspace.startSession === "function") {
				try {
					uiWorkspace.startSession(meta.workspaceId);
				} catch {}
			}
			return true;
		}
		/** Bring one archived conversation back and open it. */
		async function restoreConversation(ctx, sessionId) {
			const uiWorkspace = getService(ctx, "uiWorkspace");
			if (uiWorkspace === undefined) throw new Error("uiWorkspace service unavailable");
			if (typeof uiWorkspace.unarchiveSession !== "function") throw new Error("uiWorkspace.unarchiveSession unavailable");
			await uiWorkspace.unarchiveSession(sessionId);
			if (typeof uiWorkspace.openSession === "function") uiWorkspace.openSession(sessionId);
		}
		/**
		 * Whether the sidebar row for `sessionId` is the selected one. Used to decide
		 * if deleting a conversation also has to leave its empty view.
		 */
		function isSessionSelected(sessionId) {
			if (typeof document === "undefined") return false;
			try {
				for (const row of document.querySelectorAll('[data-row-key^="session:"]')) {
					if (row.getAttribute("data-row-key") !== `session:${sessionId}`) continue;
					return row.getAttribute("aria-selected") === "true";
				}
			} catch {}
			return false;
		}
		/**
		 * Ask the Host half to delete one session's files.
		 * @param sessionId - Session whose log and projection cache should go.
		 * @returns `{ ok, pending, unavailable, error }`; `unavailable` marks a
		 *   missing route (the Host half has not been loaded by this process yet),
		 *   which is the one case where we know nothing was touched.
		 */
		async function purgeSessionFiles(sessionId) {
			let response;
			try {
				response = await fetch(DELETE_ENDPOINT, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sessionId }),
					cache: "no-store"
				});
			} catch (error) {
				return { ok: false, pending: 0, unavailable: false, error: error instanceof Error ? error.message : String(error) };
			}
			let payload = null;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}
			if (response.ok !== true) {
				const detail = payload !== null && payload.error !== undefined ? String(payload.error) : `HTTP ${response.status}`;
				return { ok: false, pending: 0, unavailable: response.status === 404 || response.status === 405, error: detail };
			}
			return {
				ok: payload !== null && payload.ok === true,
				pending: payload !== null && Array.isArray(payload.pending) ? payload.pending.length : 0,
				// Older Host halves do not report `found`; only an explicit false means
				// "nothing matched", so mixed versions keep working.
				found: !(payload !== null && payload.found === false),
				unavailable: false,
				error: payload !== null && payload.error !== undefined ? String(payload.error) : undefined
			};
		}
		/**
		 * Permanently remove a whole conversation.
		 *
		 * Archive is only the hiding step (it is also what stops the session's
		 * activity). Three outcomes:
		 *
		 * - `deleted`   — every file is gone: drop the archive marker, refresh the
		 *                 list, and leave an empty chat when this was the open one.
		 * - `pending`   — some file is held open; keep the session archived so it
		 *                 stays hidden, and let the next start finish the job.
		 * - `unavailable` / `failed` — nothing was removed; **undo the hiding step**
		 *                 so the conversation comes straight back and no empty chat
		 *                 is created.
		 * @returns `{ status, error }` where status is one of the four above.
		 */
		async function deleteConversation(ctx, sessionId) {
			const meta = originalMetaOf(ctx, sessionId);
			const wasSelected = isSessionSelected(sessionId);
			const uiWorkspace = getService(ctx, "uiWorkspace");
			const canUnarchive = uiWorkspace !== undefined && typeof uiWorkspace.unarchiveSession === "function";
			const show = async () => {
				if (!canUnarchive) return;
				try {
					await uiWorkspace.unarchiveSession(sessionId);
				} catch {}
			};

			let archived = false;
			if (uiWorkspace !== undefined && typeof uiWorkspace.archiveSession === "function") {
				try {
					await uiWorkspace.archiveSession(sessionId, { stopActivity: true });
					archived = true;
				} catch {
					try {
						await uiWorkspace.archiveSession(sessionId);
						archived = true;
					} catch {}
				}
			}
			if (!archived) return { status: "failed", error: undefined };

			const purge = await purgeSessionFiles(sessionId);
			if (purge.ok === true && purge.pending === 0) {
				if (purge.found !== true) {
					// The Host found no file for this id: nothing was deleted, so do not
					// pretend otherwise — put the conversation back.
					await show();
					return { status: "notFound", error: undefined };
				}
				// Files are gone: drop the archive marker too (a deleted conversation
				// must not sit in Archive), move the view off it when it was the open
				// one, and then take the row out of the client catalog.
				await show();
				if (wasSelected && typeof uiWorkspace.startSession === "function") {
					try {
						uiWorkspace.startSession(meta.workspaceId);
					} catch {}
				}
				try {
					const sessions = getService(ctx, "sessions");
					// Deleting files notifies nobody, and the Host catalog keeps the
					// summary until it restarts, so the sidebar row would survive the
					// deletion. Apply the same removal the shell applies for a Host-side
					// removal; without it the row lingers until restart.
					if (sessions !== undefined && typeof sessions.handleSessionRemoved === "function") sessions.handleSessionRemoved(sessionId);
				} catch {}
				return { status: "deleted", error: undefined };
			}
			if (purge.ok === true) {
				// Files still locked: keep it hidden (and archived) so nothing half
				// deleted reappears in the sidebar.
				return { status: "pending", error: purge.error };
			}
			// Nothing was deleted at all — put the conversation back where it was and
			// leave the current view alone.
			await show();
			return { status: purge.unavailable === true ? "unavailable" : "failed", error: purge.error };
		}
		//#endregion

		//#region icons
		function icon(paths, size = 14) {
			return h(
				"svg",
				{
					width: size,
					height: size,
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.4,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true"
				},
				paths.map((d, index) => h("path", { key: index, d }))
			);
		}
		const ICON_EDIT = ["M10.4 2.6a1.4 1.4 0 0 1 2 2L5.8 11.2l-2.7.7.7-2.7Z", "M9.4 3.6l2 2"];
		const ICON_TRASH = ["M2.6 4.3h10.8", "M6.2 4.3V3.1h3.6v1.2", "M3.9 4.3l.6 8.2h7l.6-8.2", "M6.6 6.6v3.6M9.4 6.6v3.6"];
		const ICON_LIST = ["M3 4.5h10", "M3 8h10", "M3 11.5h7"];
		const ARCHIVE_ICON = ["M2.5 5.2h11l-.8 7.3H3.3Z", "M5.8 5.2V3.6h4.4v1.6", "M6.3 7.6v3M9.7 7.6v3"];
		//#endregion

		//#region shared components
		function portal(node) {
			if (ReactDOM && typeof ReactDOM.createPortal === "function" && typeof document !== "undefined") {
				return ReactDOM.createPortal(node, document.body);
			}
			return node;
		}

		function Button(props) {
			const className = `dcmo-btn${props.variant === undefined ? "" : ` dcmo-btn-${props.variant}`}`;
			return h(
				"button",
				{
					type: "button",
					className,
					disabled: props.disabled === true,
					title: props.title,
					onClick: props.onClick
				},
				props.icon === undefined ? null : icon(props.icon),
				h("span", null, props.label)
			);
		}

		function Toolbar(props) {
			const { t, rect, message, onEdit, onRemove } = props;
			if (rect === null) return null;
			const top = Math.max(8, Math.round(rect.bottom) - 38);
			const right = Math.max(8, Math.round((typeof window === "undefined" ? 0 : window.innerWidth) - rect.right) + 2);
			return portal(
				h(
					"div",
					{
						className: "dcmo-toolbar",
						"data-dcmo-toolbar": "",
						style: { top: `${top}px`, right: `${right}px` },
						onMouseDown: (event) => event.preventDefault()
					},
					h(
						"button",
						{ type: "button", className: "dcmo-tool", onClick: () => onEdit(message) },
						icon(ICON_EDIT, 12),
						h("span", null, t("rowEdit"))
					),
					h(
						"button",
						{ type: "button", className: "dcmo-tool dcmo-tool-danger", onClick: () => onRemove(message) },
						icon(ICON_TRASH, 12),
						h("span", null, t("rowArchive"))
					)
				)
			);
		}

		function DialogShell(props) {
			return portal(
				h(
					"div",
					{
						className: "dcmo-overlay",
						role: "presentation",
						onMouseDown: (event) => {
							if (event.target === event.currentTarget) props.onClose();
						}
					},
					h(
						"div",
						{ className: "dcmo-panel", role: "dialog", "aria-modal": "true", "aria-label": props.title },
						h(
							"div",
							{ className: "dcmo-head" },
							h("div", { className: "dcmo-title" }, props.title),
							h(
								"button",
								{ type: "button", className: "dcmo-iconbtn", "aria-label": props.closeLabel, onClick: props.onClose },
								icon(["M4 4l8 8", "M12 4l-8 8"], 14)
							)
						),
						props.children
					)
				)
			);
		}

		function MessageRow(props) {
			const { t, message, busy, onEdit, onRemove } = props;
			const preview = clampText(message.text === "" ? " " : message.text, 320);
			const clock = formatClock(message.time);
			return h(
				"div",
				{ className: "dcmo-item" },
				h(
					"div",
					{ className: "dcmo-item-main" },
					h("div", { className: "dcmo-item-text" }, preview),
					h(
						"div",
						{ className: "dcmo-item-meta" },
						clock === "" ? null : h("span", null, clock),
						message.kind === "steering" ? h("span", null, t("steering")) : null
					)
				),
				h(
					"div",
					{ className: "dcmo-item-actions" },
					h(
						"button",
						{ type: "button", className: "dcmo-iconbtn", title: t("edit"), disabled: busy, onClick: () => onEdit(message) },
						icon(ICON_EDIT, 14)
					),
					h(
						"button",
						{ type: "button", className: "dcmo-iconbtn", title: t("remove"), disabled: busy, onClick: () => onRemove(message) },
						icon(ICON_TRASH, 14)
					)
				)
			);
		}
		//#endregion

		//#region composer entry
		function ComposerEntry(props) {
			const api = props.api;
			const t = api.t;
			const ctx = api.ctx;
			const sessionId = props.sessionId;
			const useChat = props.useChat;
			const chat = useChat === undefined ? undefined : useChat((snapshot) => snapshot);
			const chatRef = React.useRef(chat);
			chatRef.current = chat;

			// Locale changes do not touch the Chat store, so re-render through a counter.
			const [, bumpLocale] = React.useState(0);
			React.useEffect(() => {
				const service = getService(ctx, "locale");
				if (service === undefined || typeof service.subscribe !== "function") return undefined;
				return service.subscribe(() => bumpLocale((value) => value + 1));
			}, [ctx]);

			const [dialog, setDialog] = React.useState(null);
			const [busy, setBusy] = React.useState(false);
			const [toast, setToast] = React.useState(null);
			const [hover, setHover] = React.useState(null);
			const [draft, setDraft] = React.useState("");
			const busyRef = React.useRef(false);
			busyRef.current = busy;
			const dialogRef = React.useRef(null);
			dialogRef.current = dialog;

			const messages = React.useMemo(() => collectMessages(chat), [chat]);
			const hoverKey = hover === null ? undefined : hover.key;
			const hoveredNode = useChat === undefined ? undefined : useChat((snapshot) => hoverKey === undefined || snapshot.nodes === undefined ? undefined : snapshot.nodes.get(hoverKey));
			const hoveredMessage = React.useMemo(() => {
				if (hover === null) return null;
				const found = messages.find((entry) => entry.key === hover.key);
				if (found !== undefined) return found;
				if (hoveredNode !== undefined && hoveredNode !== null) {
					return {
						key: hoveredNode.key,
						seq: hoveredNode.anchorSeq,
						kind: hoveredNode.kind,
						text: textOf(hoveredNode.data && hoveredNode.data.content),
						time: hoveredNode.data && hoveredNode.data.time
					};
				}
				return null;
			}, [hover, messages, hoveredNode]);

			const showToast = React.useCallback((text, tone) => {
				setToast({ text, tone, id: Date.now() });
			}, []);
			React.useEffect(() => {
				if (toast === null) return undefined;
				const timer = setTimeout(() => setToast(null), toast.tone === "error" ? 7000 : 4000);
				return () => clearTimeout(timer);
			}, [toast]);

			// Hover tracking: read the shipped row rect, never mutate shipped DOM.
			React.useEffect(() => {
				if (typeof document === "undefined") return undefined;
				let hideTimer;
				const clearHide = () => {
					if (hideTimer !== undefined) {
						clearTimeout(hideTimer);
						hideTimer = undefined;
					}
				};
				const onMove = (event) => {
					const target = event.target;
					if (!(target instanceof Element)) return;
					if (dialogRef.current !== null) {
						clearHide();
						setHover(null);
						return;
					}
					const row = target.closest('[data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]');
					if (row !== null) {
						const key = row.getAttribute("data-chat-node-key");
						if (key === null || key === "") return;
						const rect = row.getBoundingClientRect();
						if (rect.height <= 0) return;
						clearHide();
						setHover((previous) => {
							if (previous !== null && previous.key === key && Math.abs(previous.rect.top - rect.top) < 1 && Math.abs(previous.rect.bottom - rect.bottom) < 1) return previous;
							return { key, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right } };
						});
						return;
					}
					if (target.closest("[data-dcmo-toolbar]") !== null) {
						clearHide();
						return;
					}
					if (hideTimer === undefined) hideTimer = setTimeout(() => setHover(null), 240);
				};
				const onScroll = () => {
					clearHide();
					setHover(null);
				};
				document.addEventListener("mousemove", onMove, true);
				window.addEventListener("scroll", onScroll, true);
				window.addEventListener("resize", onScroll);
				return () => {
					clearHide();
					document.removeEventListener("mousemove", onMove, true);
					window.removeEventListener("scroll", onScroll, true);
					window.removeEventListener("resize", onScroll);
				};
			}, []);

			const openEdit = React.useCallback((message) => {
				if (message === undefined || message === null) return;
				setHover(null);
				setDraft(message.text);
				setDialog({ kind: "edit", message, boundary: boundaryBefore(chatRef.current, message.seq), error: undefined });
			}, []);
			const openRemove = React.useCallback(
				(message) => {
					if (message === undefined || message === null) return;
					setHover(null);
					// A null boundary (first human message) keeps the same dialog: it
					// explains that archiving from here means archiving the whole
					// conversation, and its confirm does exactly that.
					setDialog({ kind: "remove", message, boundary: boundaryBefore(chatRef.current, message.seq), error: undefined });
				},
				[]
			);

			// Escape closes the dialog unless a fork/prompt round-trip is in flight.
			React.useEffect(() => {
				if (dialog === null || typeof window === "undefined") return undefined;
				const onKey = (event) => {
					if (event.key !== "Escape" || busyRef.current) return;
					event.stopPropagation();
					setDialog(null);
					setDraft("");
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [dialog]);

			const closeDialog = React.useCallback(() => {
				if (busyRef.current) return;
				setDialog(null);
				setDraft("");
			}, []);

			const forkAt = React.useCallback(
				async (boundary) => {
					const sessions = getService(ctx, "sessions");
					if (sessions === undefined || typeof sessions.fork !== "function") throw new Error(t("noService"));
					// No title suffix: the child takes the replaced Session's title.
					return sessions.fork({ sessionId, atSeq: boundary, increaseTitle: false });
				},
				[ctx, sessionId, t]
			);

			const takeOver = React.useCallback(
				async (boundary) => {
					const childId = await forkAt(boundary);
					await api.attachChildInPlace(sessionId, childId);
					const session = await api.waitForChildSession(childId);
					return session;
				},
				[api, forkAt, sessionId]
			);

			const submitEdit = React.useCallback(async () => {
				if (dialog === null || dialog.boundary === null || busyRef.current) return;
				const text = draft.trim();
				if (text === "") {
					setDialog({ ...dialog, error: t("editEmpty") });
					return;
				}
				setBusy(true);
				try {
					const session = await takeOver(dialog.boundary);
					const result = await session.prompt([{ type: "text", text }], "queue");
					if (result === undefined || result.ok !== true) {
						const code = result && result.error && result.error.code ? `: ${result.error.code}` : "";
						throw new Error(`${t("fail")}${code}`);
					}
					await api.archiveOriginal(sessionId);
					setBusy(false);
					setDialog(null);
					setDraft("");
					showToast(t("doneEdit"), "success");
				} catch (error) {
					setBusy(false);
					const message = error instanceof Error ? error.message : String(error);
					setDialog((current) => (current === null ? current : { ...current, error: message }));
				}
			}, [dialog, draft, takeOver, api, sessionId, t, showToast]);

			const submitRemove = React.useCallback(async () => {
				if (dialog === null || busyRef.current) return;
				setBusy(true);
				try {
					if (dialog.boundary === null) {
						// No earlier Turn to fork at: "archive this message and what
						// follows" is the whole conversation.
						const ok = await api.archiveConversation(sessionId);
						setBusy(false);
						setDialog(null);
						showToast(t(ok ? "doneArchiveConversation" : "doneRemoveFailed"), ok ? "success" : "warn");
						return;
					}
					await takeOver(dialog.boundary);
					const archived = await api.archiveOriginal(sessionId);
					setBusy(false);
					setDialog(null);
					showToast(t(archived ? "doneRemove" : "doneRemoveFailed"), archived ? "success" : "warn");
				} catch (error) {
					setBusy(false);
					const message = error instanceof Error ? error.message : String(error);
					setDialog((current) => (current === null ? current : { ...current, error: message }));
				}
			}, [dialog, takeOver, api, sessionId, t, showToast]);

			const entryButton = h(
				React.Fragment,
				null,
				h(
					"button",
					{
						type: "button",
						className: "dcmo-iconbtn",
						title: `${t("open")} — ${t("openHint")}`,
						"aria-label": t("open"),
						onClick: () => setDialog({ kind: "list" })
					},
					icon(ICON_LIST, 15)
				),
				h(
					"button",
					{
						type: "button",
						className: "dcmo-iconbtn dcmo-iconbtn-danger",
						title: t("deleteConversation"),
						"aria-label": t("deleteConversation"),
						onClick: () => api.archiveUi.requestDelete(sessionId, api.conversationTitle(sessionId))
					},
					icon(ICON_TRASH, 15)
				)
			);

			let dialogNode = null;
			if (dialog !== null && dialog.kind === "list") {
				dialogNode = h(
					DialogShell,
					{ title: t("listTitle"), closeLabel: t("cancel"), onClose: closeDialog },
					h(
						"div",
						{ className: "dcmo-body" },
						h("div", { className: "dcmo-hint" }, t("listHint")),
						messages.length === 0
							? h("div", { className: "dcmo-item-empty" }, t("listEmpty"))
							: h(
									"div",
									{ className: "dcmo-list" },
									messages.map((message) =>
										h(MessageRow, {
											key: `${message.key}:${message.seq}`,
											t,
											message,
											busy,
											onEdit: openEdit,
											onRemove: openRemove
										})
									)
								)
					),
					h("div", { className: "dcmo-foot" }, h(Button, { label: t("cancel"), onClick: closeDialog }))
				);
			} else if (dialog !== null && dialog.kind === "edit") {
				dialogNode = h(
					DialogShell,
					{ title: t("editTitle"), closeLabel: t("cancel"), onClose: closeDialog },
					h(
						"div",
						{ className: "dcmo-body" },
						h("div", { className: "dcmo-hint" }, t("editHint")),
						dialog.boundary === null ? h("div", { className: "dcmo-warn" }, t("noBoundary")) : null,
						h("textarea", {
							className: "dcmo-input",
							value: draft,
							disabled: busy,
							autoFocus: true,
							onChange: (event) => setDraft(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
									event.preventDefault();
									void submitEdit();
								}
							}
						}),
						dialog.error === undefined ? null : h("div", { className: "dcmo-error" }, dialog.error)
					),
					h(
						"div",
						{ className: "dcmo-foot" },
						dialog.boundary === null
							? h(Button, {
									label: t("removeFirstConfirm"),
									variant: "danger",
									disabled: busy,
									onClick: () => {
										closeDialog();
										void api.archiveConversation(sessionId).then((ok) => {
											showToast(t(ok ? "doneArchiveConversation" : "doneRemoveFailed"), ok ? "success" : "warn");
										});
									}
								})
							: null,
						h(Button, { label: t("cancel"), onClick: closeDialog, disabled: busy }),
						h(Button, {
							label: busy ? t("working") : t("send"),
							variant: "primary",
							disabled: busy || dialog.boundary === null,
							onClick: () => void submitEdit()
						})
					)
				);
			} else if (dialog !== null && dialog.kind === "remove") {
				const first = dialog.boundary === null;
				dialogNode = h(
					DialogShell,
					{ title: t("removeTitle"), closeLabel: t("cancel"), onClose: closeDialog },
					h(
						"div",
						{ className: "dcmo-body" },
						h("div", { className: "dcmo-hint" }, t("removeBody")),
						first ? h("div", { className: "dcmo-warn" }, t("removeFirst")) : null,
						dialog.error === undefined ? null : h("div", { className: "dcmo-error" }, dialog.error)
					),
					h(
						"div",
						{ className: "dcmo-foot" },
						h(Button, { label: t("cancel"), onClick: closeDialog, disabled: busy }),
						h(Button, {
							label: busy ? t("working") : first ? t("removeFirstConfirm") : t("removeConfirm"),
							variant: "danger",
							disabled: busy,
							onClick: () => void submitRemove()
						})
					)
				);
			}

			return h(
				React.Fragment,
				null,
				entryButton,
				hoveredMessage === null
					? null
					: h(Toolbar, {
							t,
							rect: hover.rect,
							message: hoveredMessage,
							onEdit: openEdit,
							onRemove: openRemove
						}),
				dialogNode,
				toast === null ? null : portal(h("div", { className: "dcmo-toast", "data-tone": toast.tone }, toast.text))
			);
		}
		//#endregion

		//#region archive + delete controller
		/** Subscribe one component to a tiny observable store. */
		function useStoreState(store) {
			const [state, setState] = React.useState(() => store.get());
			React.useEffect(() => {
				const dispose = store.subscribe(() => setState(store.get()));
				return typeof dispose === "function" ? dispose : undefined;
			}, [store]);
			return state;
		}
		/**
		 * Shared UI state: the per-workspace archive button mount points discovered
		 * in the shipped sidebar, plus the last archive-list / delete request.
		 */
		function createArchiveUi() {
			let state = { rows: [], request: null, deleteRequest: null };
			const listeners = new Set();
			const emit = () => {
				for (const listener of listeners) listener();
			};
			const nextToken = (previous) => (previous === null ? 1 : previous.token + 1);
			return {
				get: () => state,
				setRows(rows) {
					const same = state.rows.length === rows.length && state.rows.every((row, index) => row.workspaceId === rows[index].workspaceId && row.container === rows[index].container);
					if (same) return;
					state = { ...state, rows };
					emit();
				},
				requestOpen(workspaceId, label) {
					state = { ...state, request: { workspaceId, label, token: nextToken(state.request) } };
					emit();
				},
				requestDelete(sessionId, title) {
					state = { ...state, deleteRequest: { sessionId, title, token: nextToken(state.deleteRequest) } };
					emit();
				},
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}
			};
		}
		/** Read the Host-published archive set plus the summaries that describe it. */
		function readArchiveSnapshot(ctx) {
			const snapshot = { archived: [], workspaces: [], byId: {} };
			try {
				const service = getService(ctx, "workspaces");
				const source = service && service.list && typeof service.list.getSnapshot === "function" ? service.list.getSnapshot() : undefined;
				if (source !== undefined && source !== null) {
					if (Array.isArray(source.archivedSessionIds)) snapshot.archived = source.archivedSessionIds.slice();
					if (Array.isArray(source.items)) {
						snapshot.workspaces = source.items
							.filter((item) => item !== null && typeof item === "object")
							.map((item) => ({
								workspaceId: item.workspaceId,
								title: typeof item.title === "string" ? item.title : undefined,
								sessionIds: Array.isArray(item.sessionIds) ? item.sessionIds : []
							}));
					}
				}
			} catch {}
			try {
				const service = getService(ctx, "sessions");
				const source = service && service.list && typeof service.list.getSnapshot === "function" ? service.list.getSnapshot() : undefined;
				if (source !== undefined && source !== null && source.byId) snapshot.byId = source.byId;
			} catch {}
			return snapshot;
		}
		/** Archived conversations of one workspace (all of them when `workspaceId` is undefined). */
		function archivedRowsFor(snapshot, workspaceId, t) {
			const owner = workspaceId === undefined ? undefined : snapshot.workspaces.find((workspace) => workspace.workspaceId === workspaceId);
			const members = workspaceId === undefined ? null : new Set(owner === undefined ? [] : owner.sessionIds);
			// A physically deleted conversation can leave its id in the archive set;
			// once summaries are loaded, an id without one is not restorable.
			const hasSummaries = Object.keys(snapshot.byId).length > 0;
			const rows = [];
			for (const id of snapshot.archived) {
				if (members !== null && !members.has(id)) continue;
				const summary = snapshot.byId[id];
				if (hasSummaries && summary === undefined) continue;
				const title = summary && typeof summary.title === "string" && summary.title !== "" ? summary.title : t("archiveUnknownTitle");
				rows.push({
					id,
					title,
					updatedAt: summary && typeof summary.updatedAt === "number" ? summary.updatedAt : undefined
				});
			}
			rows.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
			return rows;
		}
		function portalInto(container, element) {
			if (ReactDOM === null || ReactDOM === undefined || typeof ReactDOM.createPortal !== "function") return null;
			if (container === null || container === undefined || container.isConnected === false) return null;
			return ReactDOM.createPortal(element, container);
		}
		/**
		 * Mount one archive slot at the right edge of every shipped workspace row.
		 * Pure DOM work so the fragile part is testable without React: rows are
		 * matched by the semantic `data-row-key="workspace:<id>"` attribute only,
		 * unknown ids (Ungrouped, flat-list keys) are skipped, and an existing slot
		 * is reused instead of duplicated.
		 */
		function mountWorkspaceSlots(documentLike, known, root) {
			const rows = [];
			const scope = root === undefined || root === null ? documentLike : root;
			for (const node of scope.querySelectorAll('[data-row-key^="workspace:"]')) {
				const raw = node.getAttribute("data-row-key") === null ? "" : node.getAttribute("data-row-key");
				const workspaceId = raw.slice("workspace:".length);
				if (workspaceId === "" || !known.has(workspaceId)) continue;
				let slot = node.querySelector("[data-dcmo-ws-archive]");
				if (slot === null) {
					slot = documentLike.createElement("span");
					slot.className = "dcmo-ws-archive-slot";
					slot.setAttribute("data-dcmo-ws-archive", workspaceId);
					node.appendChild(slot);
				}
				rows.push({ workspaceId, container: slot });
			}
			return rows;
		}

		/**
		 * Root-owned archive + delete controller: one archive button per workspace
		 * row, the restore dialog, and the shared permanent-delete confirmation that
		 * both the composer button and the sidebar menu open.
		 */
		function ArchivePortalHost(props) {
			const api = props.api;
			const t = api.t;
			const store = api.archiveUi;
			const state = useStoreState(store);
			const [dismissedToken, setDismissedToken] = React.useState(0);
			const [dismissedDeleteToken, setDismissedDeleteToken] = React.useState(0);
			const [busyId, setBusyId] = React.useState(null);
			const [deleting, setDeleting] = React.useState(false);
			const [error, setError] = React.useState(undefined);
			const [toast, setToast] = React.useState(null);
			const [revision, bump] = React.useState(0);
			const busyRef = React.useRef(null);
			busyRef.current = busyId;
			const deletingRef = React.useRef(false);
			deletingRef.current = deleting;

			React.useEffect(() => {
				const disposers = [];
				for (const name of ["workspaces", "sessions", "locale"]) {
					try {
						const service = getService(api.ctx, name);
						const source = name === "locale" ? service : service && service.list;
						if (source !== undefined && source !== null && typeof source.subscribe === "function") {
							const dispose = source.subscribe(() => bump((value) => value + 1));
							if (typeof dispose === "function") disposers.push(dispose);
						}
					} catch {}
				}
				return () => {
					for (const dispose of disposers) {
						try {
							dispose();
						} catch {}
					}
				};
			}, [api.ctx]);

			// Discover workspace rows and mount one slot per row. The observer is kept
			// on the sidebar column when it exists so streaming chat text does not
			// schedule scans, and falls back to the whole document otherwise.
			React.useEffect(() => {
				if (typeof document === "undefined" || ReactDOM === null || ReactDOM === undefined) return undefined;
				let frame;
				let observer;
				let attached;
				const resolveScope = () => {
					const sidebar = document.querySelector('[data-slot="sidebar.workspaces"]');
					return sidebar === null ? document.body : sidebar;
				};
				const sync = () => {
					frame = undefined;
					const scope = resolveScope();
					if (observer !== undefined && attached !== scope) {
						observer.disconnect();
						try {
							observer.observe(scope, { childList: true, subtree: true });
							attached = scope;
						} catch {
							attached = undefined;
						}
					}
					const known = new Set(readArchiveSnapshot(api.ctx).workspaces.map((workspace) => workspace.workspaceId));
					store.setRows(mountWorkspaceSlots(document, known, scope));
				};
				const schedule = () => {
					if (frame !== undefined) return;
					frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(sync) : setTimeout(sync, 16);
				};
				try {
					observer = new MutationObserver(schedule);
					attached = resolveScope();
					observer.observe(attached, { childList: true, subtree: true });
				} catch {
					observer = undefined;
					attached = undefined;
				}
				const timer = setInterval(sync, 1500);
				sync();
				return () => {
					if (observer !== undefined) observer.disconnect();
					clearInterval(timer);
					if (frame !== undefined) {
						if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
						else clearTimeout(frame);
					}
				};
			}, [api, store]);

			React.useEffect(() => {
				if (toast === null) return undefined;
				const timer = setTimeout(() => setToast(null), toast.tone === "error" ? 7000 : 4000);
				return () => clearTimeout(timer);
			}, [toast]);

			const request = state.request;
			const dialog = request === null || request.token === dismissedToken ? null : { workspaceId: request.workspaceId, label: request.label, token: request.token };
			const deleteRequest = state.deleteRequest;
			const deleteDialog = deleteRequest === null || deleteRequest.token === dismissedDeleteToken ? null : deleteRequest;

			const close = React.useCallback(() => {
				if (busyRef.current !== null) return;
				if (request !== null) setDismissedToken(request.token);
				setError(undefined);
			}, [request]);

			const closeDelete = React.useCallback(() => {
				if (deletingRef.current) return;
				if (deleteRequest !== null) setDismissedDeleteToken(deleteRequest.token);
				setError(undefined);
			}, [deleteRequest]);

			React.useEffect(() => {
				if ((dialog === null && deleteDialog === null) || typeof window === "undefined") return undefined;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					if (deletingRef.current || busyRef.current !== null) return;
					event.stopPropagation();
					if (deleteDialog !== null && deleteRequest !== null) setDismissedDeleteToken(deleteRequest.token);
					if (dialog !== null && request !== null) setDismissedToken(request.token);
					setError(undefined);
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [dialog, deleteDialog, request, deleteRequest]);

			const restore = React.useCallback(
				async (row) => {
					if (busyRef.current !== null) return;
					setBusyId(row.id);
					setError(undefined);
					try {
						await api.restoreConversation(row.id);
						setBusyId(null);
						if (request !== null) setDismissedToken(request.token);
						setToast({ text: t("restored").replace("{title}", row.title), tone: "success" });
					} catch (caught) {
						setBusyId(null);
						setError(`${t("restoreFailed")}: ${caught instanceof Error ? caught.message : String(caught)}`);
					}
				},
				[api, t, request]
			);

			const confirmDelete = React.useCallback(async () => {
				if (deletingRef.current || deleteRequest === null) return;
				setDeleting(true);
				setError(undefined);
				try {
					const result = await api.deleteConversation(deleteRequest.sessionId);
					if (result === undefined || result === null || typeof result.status !== "string") throw new Error(t("fail"));
					setDeleting(false);
					setDismissedDeleteToken(deleteRequest.token);
					if (result.status === "deleted") {
						setToast({ text: t("doneDeleteConversation"), tone: "success" });
					} else if (result.status === "pending") {
						setToast({ text: t("doneDeleteConversationPending"), tone: "warn" });
					} else if (result.status === "notFound") {
						setToast({ text: t("doneDeleteNotFound"), tone: "warn" });
					} else if (result.status === "unavailable") {
						setToast({ text: t("doneDeleteNeedsRestart"), tone: "warn" });
					} else {
						setToast({
							text: t("doneDeleteFailed").replace("{error}", typeof result.error === "string" ? result.error : ""),
							tone: "warn"
						});
					}
				} catch (caught) {
					setDeleting(false);
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [api, t, deleteRequest]);

			const snapshot = readArchiveSnapshot(api.ctx);
			const counts = new Map();
			for (const workspace of snapshot.workspaces) counts.set(workspace.workspaceId, archivedRowsFor(snapshot, workspace.workspaceId, t).length);
			void revision;

			const buttons = state.rows.map((row) => {
				const count = counts.get(row.workspaceId) ?? 0;
				const button = h(
					"button",
					{
						type: "button",
						className: "dcmo-ws-archive",
						title: count === 0 ? t("archives") : `${t("archives")} (${count})`,
						"aria-label": t("archives"),
						"data-count": count,
						onMouseDown: (event) => event.preventDefault(),
						onClick: (event) => {
							// The button lives inside the shipped row's click-to-toggle
							// handler, so both default and bubbling are stopped here.
							if (event !== undefined && event !== null) {
								event.preventDefault();
								event.stopPropagation();
							}
							const owner = snapshot.workspaces.find((workspace) => workspace.workspaceId === row.workspaceId);
							store.requestOpen(row.workspaceId, owner === undefined ? undefined : owner.title);
						}
					},
					icon(ARCHIVE_ICON, 13),
					count === 0 ? null : h("span", { className: "dcmo-ws-count" }, String(count))
				);
				return h(React.Fragment, { key: row.workspaceId }, portalInto(row.container, button));
			});

			const rows = dialog === null ? [] : archivedRowsFor(snapshot, dialog.workspaceId, t);
			const heading = dialog !== null && typeof dialog.label === "string" && dialog.label !== "" ? `${t("archivesTitle")} · ${dialog.label}` : t("archivesTitle");
			const dialogNode =
				dialog === null
					? null
					: h(
							DialogShell,
							{ title: heading, closeLabel: t("cancel"), onClose: close },
							h(
								"div",
								{ className: "dcmo-body" },
								h("div", { className: "dcmo-hint" }, t("archivesHint")),
								rows.length === 0
									? h("div", { className: "dcmo-item-empty" }, dialog.workspaceId === undefined ? t("archivesEmpty") : t("archivesEmptyWorkspace"))
									: h(
											"div",
											{ className: "dcmo-list" },
											rows.map((row) =>
												h(
													"div",
													{ className: "dcmo-item", key: row.id },
													h(
														"div",
														{ className: "dcmo-item-main" },
														h("div", { className: "dcmo-item-text" }, row.title),
														row.updatedAt === undefined ? null : h("div", { className: "dcmo-item-meta" }, h("span", null, formatClock(row.updatedAt)))
													),
													h(
														"div",
														{ className: "dcmo-item-actions" },
														h(Button, {
															label: busyId === row.id ? t("working") : t("restore"),
															variant: "primary",
															disabled: busyId !== null,
															onClick: () => void restore(row)
														})
													)
												)
											)
										),
								error === undefined ? null : h("div", { className: "dcmo-error" }, error)
							),
							h("div", { className: "dcmo-foot" }, h(Button, { label: t("cancel"), onClick: close, disabled: busyId !== null }))
						);

			const deleteNode =
				deleteDialog === null
					? null
					: h(
							DialogShell,
							{ title: t("deleteConversationTitle"), closeLabel: t("cancel"), onClose: closeDelete },
							h(
								"div",
								{ className: "dcmo-body" },
								h(
									"div",
									{ className: "dcmo-hint" },
									t("deleteConversationBody").replace(
										"{title}",
										typeof deleteDialog.title === "string" && deleteDialog.title !== "" ? deleteDialog.title : t("deleteConversationUntitled")
									)
								),
								error === undefined ? null : h("div", { className: "dcmo-error" }, error)
							),
							h(
								"div",
								{ className: "dcmo-foot" },
								h(Button, { label: t("cancel"), onClick: closeDelete, disabled: deleting }),
								h(Button, {
									label: deleting ? t("working") : t("deleteConversationConfirm"),
									variant: "danger",
									disabled: deleting,
									onClick: () => void confirmDelete()
								})
							)
						);

			return h(
				React.Fragment,
				null,
				buttons,
				dialogNode,
				deleteNode,
				toast === null ? null : portal(h("div", { className: "dcmo-toast", "data-tone": toast.tone }, toast.text))
			);
		}
		//#endregion

		//#region session menu item
		/**
		 * One row in a Session's "..." menu: permanently delete this conversation.
		 * It only opens the shared confirmation (which owns the Host round-trip), so
		 * the menu closes immediately and the destructive work happens behind one
		 * guarded dialog.
		 */
		function SessionDeleteMenuItem(props) {
			const api = props.api;
			const t = api.t;
			const sessionId = props.sessionId;
			const useMenuOpenState = props.useMenuOpenState;
			const menuState = typeof useMenuOpenState === "function" ? useMenuOpenState() : undefined;
			const onSelect = () => {
				if (menuState !== undefined) {
					const closeMenu = menuState[1];
					if (typeof closeMenu === "function") {
						try {
							closeMenu(false);
						} catch {}
					}
				}
				api.archiveUi.requestDelete(sessionId, typeof props.displayTitle === "string" && props.displayTitle !== "" ? props.displayTitle : undefined);
			};
			if (primitives !== undefined && typeof primitives.MenuItemButton === "function") {
				return h(
					primitives.MenuItemButton,
					{
						danger: true,
						separatorBefore: true,
						icon: typeof primitives.IconTrashOutlineRegular === "function" ? h(primitives.IconTrashOutlineRegular, { size: 14 }) : undefined,
						onSelect
					},
					t("deleteSessionMenu")
				);
			}
			return h("button", { type: "button", role: "menuitem", className: "dcmo-menu-item", onClick: onSelect }, t("deleteSessionMenu"));
		}
		//#endregion

		//#region plugin
		function apply(ctx) {
			// The stylesheet tag is process-wide and idempotent; it stays for the
			// lifetime of the page so a re-registration never flashes unstyled UI.
			installStyles();
			const t = makeTranslator(ctx);
			const api = {
				ctx,
				t,
				primitives,
				attachChildInPlace: (sessionId, childId) => attachChildInPlace(ctx, sessionId, childId),
				waitForChildSession: (childId) => waitForChildSession(ctx, childId),
				archiveOriginal: (sessionId) => archiveOriginal(ctx, sessionId),
				archiveConversation: (sessionId) => archiveConversation(ctx, sessionId),
				deleteConversation: (sessionId) => deleteConversation(ctx, sessionId),
				restoreConversation: (sessionId) => restoreConversation(ctx, sessionId),
				conversationTitle: (sessionId) => originalMetaOf(ctx, sessionId).title,
				archiveUi: createArchiveUi()
			};
			const businessProps = { api };
			function registerOn(slot, spec, Component) {
				try {
					return ctx.slots.register({ name: slot, inject: () => businessProps, ...spec }, Component);
				} catch (error) {
					if (typeof console !== "undefined" && console.error) console.error(`[dsh-chat-message-tools] failed to register ${slot}:`, error);
					return () => {};
				}
			}
			const inject = (slot, spec, Component) => {
				try {
					ctx.slots.inject(slot, () => registerOn(slot, spec, Component));
				} catch (error) {
					if (typeof console !== "undefined" && console.error) console.error(`[dsh-chat-message-tools] failed to inject ${slot}:`, error);
				}
			};
			inject("conversation.input.left", { id: "chat-message-tools", order: 40, label: () => t("open") }, ComposerEntry);
			inject("shell.overlay", { id: "chat-message-tools-archives", order: 900 }, ArchivePortalHost);
			inject("sidebar.workspaces.session.menu.item", { id: "chat-message-tools-delete", order: 450, label: () => t("deleteSessionMenu") }, SessionDeleteMenuItem);
		}
		//#endregion

		module.exports = {
			name: "dsh-chat-message-tools-client",
			inject: ["slots"],
			apply
		};
		// Test-only surface: the row mounter does the fragile DOM work and is
		// exercised by tests/smoke.mjs against a stand-in document.
		module.exports.__test = { mountWorkspaceSlots };
		return module.exports;
	}
});
