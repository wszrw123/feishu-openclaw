#!/usr/bin/env node

const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function requestJson(url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Failed to parse response: ${text.slice(0, 500)}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  if (Number(parsed.code || 0) !== 0) {
    throw new Error(`Feishu API error code=${parsed.code} msg=${parsed.msg || ""}`);
  }
  return parsed;
}

async function main() {
  const appId = getArg("--app-id") || process.env.FS_APP_ID || process.env.FEISHU_APP_ID;
  const appSecret = getArg("--app-secret") || process.env.FS_APP_SECRET || process.env.FEISHU_APP_SECRET;
  const jsonMode = args.includes("--json");
  if (!appId || !appSecret) {
    throw new Error("Missing --app-id/--app-secret or FS_APP_ID/FS_APP_SECRET");
  }

  const tokenRes = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    body: { app_id: appId, app_secret: appSecret },
  });
  const token = String(tokenRes.tenant_access_token || "").trim();
  const chatsRes = await requestJson("https://open.feishu.cn/open-apis/im/v1/chats?page_size=100", {
    headers: { authorization: `Bearer ${token}` },
  });
  const items = Array.isArray(chatsRes.data?.items) ? chatsRes.data.items : [];
  const rows = items.map((item) => ({
    name: item.name || "",
    chat_id: item.chat_id || "",
    status: item.chat_status || "",
  }));

  if (jsonMode) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.table(rows);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
