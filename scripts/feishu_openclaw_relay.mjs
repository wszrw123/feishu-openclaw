#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const runtimeDir = path.join(rootDir, ".runtime");
const statePath = path.join(runtimeDir, "feishu-relay-state.json");
const logPath = path.join(rootDir, "feishu-openclaw-relay.log");

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.appendFileSync(logPath, `${line}\n`, "utf8");
}

function loadConfig() {
  const configPath = path.resolve(getArg("--config") || process.env.OPENCLAW_CONFIG_PATH || path.join(os.homedir(), ".openclaw", "openclaw.json"));
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);
  const feishu = cfg.channels?.feishu || {};
  const main = feishu.accounts?.main || {};
  const groupAllowFrom = Array.isArray(feishu.groupAllowFrom) ? feishu.groupAllowFrom : [];
  return {
    chatId: getArg("--chat-id") || process.env.FS_CHAT_ID || process.env.FEISHU_CHAT_ID || groupAllowFrom[0] || "",
    appId: getArg("--app-id") || process.env.FS_APP_ID || process.env.FEISHU_APP_ID || main.appId || "",
    appSecret: getArg("--app-secret") || process.env.FS_APP_SECRET || process.env.FEISHU_APP_SECRET || main.appSecret || "",
    pollInterval: Number(getArg("--poll-interval") || process.env.FS_POLL_INTERVAL_SECONDS || 3),
    pageSize: Number(getArg("--page-size") || process.env.FS_HISTORY_PAGE_SIZE || 20),
    thinking: String(getArg("--thinking") || process.env.FS_AGENT_THINKING || "high").toLowerCase(),
    sessionPrefix: getArg("--session-prefix") || process.env.FS_SESSION_PREFIX || "feishu-relay",
    timeoutSeconds: Number(getArg("--timeout") || process.env.FS_AGENT_TIMEOUT_SECONDS || 600),
    once: args.includes("--once"),
  };
}

async function requestJson(url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  if (Number(parsed.code || 0) !== 0) {
    throw new Error(`Feishu API error code=${parsed.code} msg=${parsed.msg || ""}`);
  }
  return parsed;
}

async function getTenantToken(appId, appSecret) {
  const parsed = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    body: { app_id: appId, app_secret: appSecret },
  });
  return String(parsed.tenant_access_token || "").trim();
}

async function listMessages(token, chatId, pageSize) {
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?container_id_type=chat&container_id=${encodeURIComponent(chatId)}&sort_type=ByCreateTimeDesc&page_size=${pageSize}`;
  const parsed = await requestJson(url, { headers: { authorization: `Bearer ${token}` } });
  return Array.isArray(parsed.data?.items) ? parsed.data.items : [];
}

async function sendText(token, chatId, text) {
  await requestJson("https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: {
      receive_id: chatId,
      msg_type: "text",
      content: JSON.stringify({ text }),
    },
  });
}

function messageId(item) {
  return String(item?.message_id || "").trim();
}

function messageTime(item) {
  return Number(String(item?.create_time || 0));
}

function senderType(item) {
  return String(item?.sender?.sender_type || "").toLowerCase();
}

function senderIdentity(item) {
  const senderId = item?.sender?.sender_id || {};
  return String(senderId.open_id || senderId.user_id || senderId.union_id || "unknown");
}

function messageText(item) {
  if (String(item?.msg_type || "") !== "text") {
    return "";
  }
  const raw = String(item?.body?.content || "");
  try {
    return String(JSON.parse(raw).text || "").trim();
  } catch {
    return raw.trim();
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function runAgent(settings, sessionId, text) {
  const command = [
    "openclaw",
    "agent",
    "--local",
    "--session-id",
    sessionId,
    "--message",
    text,
    "--json",
    "--timeout",
    String(settings.timeoutSeconds),
  ];
  if (["off", "minimal", "low", "medium", "high"].includes(settings.thinking)) {
    command.push("--thinking", settings.thinking);
  }
  const result = spawnSync(command[0], command.slice(1), { encoding: "utf8", windowsHide: true, env: process.env });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "openclaw agent failed").trim().slice(0, 1200));
  }
  const lines = String(result.stdout || "").split(/\r?\n/).filter(Boolean);
  const start = lines.findIndex((line) => line.trim().startsWith("{"));
  if (start < 0) {
    throw new Error(`No JSON found in openclaw output: ${String(result.stdout || "").slice(0, 1200)}`);
  }
  const parsed = JSON.parse(lines.slice(start).join("\n"));
  const payloads = Array.isArray(parsed.payloads) ? parsed.payloads : [];
  const textParts = payloads.map((entry) => String(entry?.text || "").trim()).filter(Boolean);
  return (textParts.join("\n\n") || "消息已处理，但 OpenClaw 没返回文本。").slice(0, 4000);
}

async function main() {
  const settings = loadConfig();
  if (!settings.chatId || !settings.appId || !settings.appSecret) {
    throw new Error("Missing chatId/appId/appSecret. Pass --chat-id --app-id --app-secret or reuse ~/.openclaw/openclaw.json");
  }

  const token = await getTenantToken(settings.appId, settings.appSecret);
  const state = loadState();
  const seen = new Set(Array.isArray(state.seenIds) ? state.seenIds : []);
  let lastSeenMs = Number(state.lastSeenMs || 0);
  const items = await listMessages(token, settings.chatId, settings.pageSize);

  if (!state.initialized) {
    const ids = items.map(messageId).filter(Boolean).slice(0, 200);
    const newest = items.reduce((acc, item) => Math.max(acc, messageTime(item)), 0);
    saveState({ initialized: true, seenIds: ids, lastSeenMs: newest });
    log(`Initialized relay state for ${settings.chatId} with ${ids.length} recent messages.`);
    return;
  }

  const newItems = [];
  for (const item of items) {
    const id = messageId(item);
    const created = messageTime(item);
    const text = messageText(item);
    if (!id || seen.has(id) || created <= lastSeenMs || senderType(item) === "app" || !text) {
      continue;
    }
    newItems.push(item);
  }

  for (const item of newItems.reverse()) {
    const id = messageId(item);
    const created = messageTime(item);
    const text = messageText(item);
    const sender = senderIdentity(item);
    const sessionId = `${settings.sessionPrefix}-${settings.chatId}-${sender}`.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
    log(`Inbound Feishu message ${id} from ${sender}: ${text.slice(0, 200)}`);
    const reply = runAgent(settings, sessionId, text);
    await sendText(token, settings.chatId, reply);
    log(`Replied to ${id}`);
    seen.add(id);
    lastSeenMs = Math.max(lastSeenMs, created);
  }

  saveState({ initialized: true, seenIds: Array.from(seen).slice(-200), lastSeenMs });

  if (!settings.once) {
    setTimeout(() => void main(), settings.pollInterval * 1000);
  }
}

main().catch((error) => {
  log(`Relay failed: ${error.message || String(error)}`);
  process.exit(1);
});
