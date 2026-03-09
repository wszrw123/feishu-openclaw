# Event Mode

Use this path first when the user wants native OpenClaw Feishu channel support.

## Required checks

- Feishu app bot capability is enabled.
- Feishu event subscription uses long connection / WebSocket mode.
- `im.message.receive_v1` is added.
- The current app version is published.
- The bot has been added to the target group.

## OpenClaw checks

- `plugins.entries.feishu.enabled = true`
- `channels.feishu.enabled = true`
- `channels.feishu.accounts.main.appId` and `appSecret` are set.
- If only one group should be allowed, keep `groupPolicy = "allowlist"` and set `groupAllowFrom` to the selected `oc_xxx`.
- If the group should reply without `@`, set `channels.feishu.groups.<chat_id>.requireMention = false`.

## Typical verification commands

```powershell
openclaw gateway probe
openclaw channels status
openclaw logs --limit 200
```

## Important observation

Feishu replies may arrive as `post` messages attached to the original message thread. If the user claims there was no reply, verify recent Feishu messages through API before assuming OpenClaw failed to send.
