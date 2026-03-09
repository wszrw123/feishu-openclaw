---
name: feishu-openclaw
description: Configure OpenClaw to work with a Feishu/Lark bot, fetch chat_id values, validate event-subscription delivery, and fall back to a polling relay when Feishu event delivery is unreliable. Use when a user wants to connect OpenClaw to Feishu, troubleshoot missing replies, list available Feishu chats, or switch from event mode to a stable polling bridge.
---

# Feishu OpenClaw

Use this skill when the task is about connecting `openclaw` to a Feishu/Lark bot, verifying whether messages are entering OpenClaw, or stabilizing delivery with a polling bridge.

## Quick workflow

1. Inspect `~/.openclaw/openclaw.json` and confirm `channels.feishu` plus `plugins.entries.feishu.enabled` exist.
2. Use `scripts/list_feishu_chats.mjs` to fetch the bot-visible chat list and choose the target `chat_id`.
3. If configuration is missing or wrong, run `scripts/configure_openclaw_feishu.mjs`.
4. Restart the gateway and verify `openclaw gateway probe` plus `openclaw channels status`.
5. If event mode still fails, switch to `scripts/feishu_openclaw_relay.mjs` as a polling fallback.

## Entry points

- **List available chats**: `FS_APP_ID=cli_xxx FS_APP_SECRET=*** node scripts/list_feishu_chats.mjs`
- **Patch OpenClaw config**: `FS_APP_ID=cli_xxx FS_APP_SECRET=*** node scripts/configure_openclaw_feishu.mjs --chat-id <oc_xxx>`
- **Run polling fallback**: `FS_APP_ID=cli_xxx FS_APP_SECRET=*** node scripts/feishu_openclaw_relay.mjs --chat-id <oc_xxx>`

Prefer environment variables for secrets. Do not commit real `appSecret`, API keys, or tenant tokens into the repo.

## What to verify in event mode

- `openclaw channels status` shows `Feishu <account>: enabled, configured, running`
- Gateway logs contain `received message from ... in oc_xxx (group)`
- If the bot replies but the user says “没看到”，check whether Feishu sent a `post` reply attached to the original message thread instead of a plain `text` bubble

See `references/event-mode.md` for the event-mode checklist and `references/polling-fallback.md` for the fallback bridge behavior.
