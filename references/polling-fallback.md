# Polling Fallback

Use this fallback when:

- Feishu event mode is configured but inbound events are still unreliable
- The bot can read and send messages through API, but OpenClaw does not consistently receive event callbacks

## How the relay works

1. Exchange `app_id` + `app_secret` for `tenant_access_token`
2. Poll `GET /im/v1/messages` for the selected `chat_id`
3. Ignore bot-originated messages and already-seen message IDs
4. Send the user text into `openclaw agent --local --session-id ... --json`
5. Send the generated text reply back with `POST /im/v1/messages`

## Notes

- The relay is chat-scoped, not tenant-wide.
- It stores dedup state under `.runtime/feishu-relay-state.json`.
- It does not require Feishu event subscription once API permissions are sufficient.
