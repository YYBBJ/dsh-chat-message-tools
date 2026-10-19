**功能：**  

这是一个 DSH Web 插件，把「改一条消息」「截断一段对话」「彻底删掉整个对话」「找回归档的对话」这四件事做成对话页里点得着的按钮，而不是让你去翻配置文件或手动删磁盘。单条消息的操作都在**当前对话里原地完成**：改完原地重发，归档后对话标题和侧栏位置不变；整条对话的删除是**真删磁盘文件**，不是只从列表里隐藏。

安装：

```
dsh plugin add github:YYBBJ/dsh-chat-message-tools
```

注：安装完成之后重启DSH

**它会删除什么（只有这些）**

```
<DSH_HOME>/sessions/<cwdKey>/<sessionId>/                         整个会话目录（session.v4.jsonl.zstd 等）
<DSH_HOME>/storages/session_projcache/sessions/<sessionId>.json   投影缓存
```

另外会写一个待删清单 `<DSH_HOME>/storages/chat-message-tools/pending-deletes.json`（记录哪次删除被占用、下次启动重试）。

**怎么保证不越界**

- session id 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`；
- 每个候选路径都要求 `basename === sessionId`、父目录正好是 `<DSH_HOME>/sessions/<某个 cwdKey>` 或投影缓存目录，任何拼接都逃不出 `<DSH_HOME>`；
- 删除前一定先 `archiveSession(id, { stopActivity: true })` 停止该会话的活动，再进行文件操作；
- 删除动作在 UI 里永远走一个显式确认框，按钮写「永久删除」；单条消息的「归档此条及之后」不物理删除任何东西。

**网络面**

- Host 半边只注册 `POST /plugins/dsh-chat-message-tools/session/delete`，请求体只接受 `{ sessionId }`（≤8KB）；
- 处理前校验来源：必须是回环地址、`Host` 必须是 `127.0.0.1`/`localhost`/`[::1]`、`Origin`（若有）必须与 `Host` 同源，否则 403；
- 没有遥测、没有外发请求、不下载也不执行任何远程代码。

**不可逆的部分**

整条会话的物理删除**不可恢复**（这正是设计意图）。删除失败时会回滚、不会留下半删状态；日志被 agent 占用时会先隐藏、下次启动再清理。