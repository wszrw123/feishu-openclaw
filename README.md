# feishu-openclaw

A reusable Codex skill for connecting OpenClaw to a Feishu/Lark bot.

## Includes

- `SKILL.md` — trigger rules and workflow
- `scripts/list_feishu_chats.mjs` — fetch visible Feishu chats and `chat_id`
- `scripts/configure_openclaw_feishu.mjs` — patch `~/.openclaw/openclaw.json`
- `scripts/feishu_openclaw_relay.mjs` — polling fallback when event mode is unstable
- `references/event-mode.md` — native event subscription checklist
- `references/polling-fallback.md` — fallback relay notes

## Typical use

```powershell
$env:FS_APP_ID="cli_xxx"
$env:FS_APP_SECRET="your-secret"
node scripts/list_feishu_chats.mjs
node scripts/configure_openclaw_feishu.mjs --chat-id oc_xxx
openclaw gateway run --force
openclaw channels status
```

If Feishu event mode still drops inbound messages, use:

```powershell
node scripts/feishu_openclaw_relay.mjs --chat-id oc_xxx
```

Do not commit real secrets or tenant tokens. Keep `FS_APP_SECRET` in the shell, secret manager, or local env only.
