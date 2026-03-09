#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function usage() {
  console.error("Usage: node scripts/configure_openclaw_feishu.mjs --app-id <cli_xxx> --app-secret <secret> --chat-id <oc_xxx> [--require-mention true|false] [--config <path>]");
  process.exit(1);
}

const appId = getArg("--app-id") || process.env.FS_APP_ID || process.env.FEISHU_APP_ID;
const appSecret = getArg("--app-secret") || process.env.FS_APP_SECRET || process.env.FEISHU_APP_SECRET;
const chatId = getArg("--chat-id") || process.env.FS_CHAT_ID || process.env.FEISHU_CHAT_ID;
const requireMentionRaw = getArg("--require-mention");
const requireMention = requireMentionRaw == null ? false : ["1", "true", "yes", "on"].includes(String(requireMentionRaw).toLowerCase());
const configPath = path.resolve(getArg("--config") || path.join(os.homedir(), ".openclaw", "openclaw.json"));

if (!appId || !appSecret || !chatId) {
  usage();
}
if (!fs.existsSync(configPath)) {
  throw new Error(`Config not found: ${configPath}`);
}

const raw = fs.readFileSync(configPath, "utf8");
const cfg = JSON.parse(raw);
cfg.plugins ||= {};
cfg.plugins.entries ||= {};
cfg.plugins.entries.feishu = { enabled: true };

cfg.channels ||= {};
cfg.channels.feishu ||= {};
cfg.channels.feishu.enabled = true;
cfg.channels.feishu.domain = "feishu";
cfg.channels.feishu.connectionMode = "websocket";
cfg.channels.feishu.defaultAccount = "main";
cfg.channels.feishu.dmPolicy = cfg.channels.feishu.dmPolicy || "pairing";
cfg.channels.feishu.groupPolicy = "allowlist";
cfg.channels.feishu.accounts ||= {};
cfg.channels.feishu.accounts.main = {
  ...(cfg.channels.feishu.accounts.main || {}),
  appId,
  appSecret,
};
cfg.channels.feishu.groupAllowFrom = [chatId];
cfg.channels.feishu.groups ||= {};
cfg.channels.feishu.groups[chatId] = {
  ...(cfg.channels.feishu.groups[chatId] || {}),
  enabled: true,
  requireMention,
};

const backupPath = `${configPath}.${new Date().toISOString().replace(/[:.]/g, "-")}.bak`;
fs.copyFileSync(configPath, backupPath);
fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ ok: true, configPath, backupPath, chatId, requireMention }, null, 2));
