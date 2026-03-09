# 宣传文案合集

下面这些文案都是为 `feishu-openclaw` 准备的，可直接复制后按场景微调。

## 1. 朋友圈版本

这两天把 **OpenClaw 接飞书机器人** 这件事彻底整理了一遍，顺手做成了一个可复用 Skill：  
`feishu-openclaw`

不是那种“理论上能接”的说明，而是把真实会遇到的问题都补上了：

- 怎么拿飞书群 `chat_id`
- 怎么把 OpenClaw 正确接进群里
- 为什么消息进来了却没回复
- 飞书事件订阅不稳定时，怎么用轮询方案兜底

仓库里有脚本、有排障清单、有兜底方案，拿来就能用。  
如果你也在做 **AI 接入飞书 / 飞书群机器人 / OpenClaw 扩展**，欢迎一起用、一起改。

GitHub：  
`https://github.com/wszrw123/feishu-openclaw`

## 2. 飞书群版本

我把 **OpenClaw 接入飞书机器人** 这套流程整理成开源仓库了：

`feishu-openclaw`  
GitHub：`https://github.com/wszrw123/feishu-openclaw`

它主要解决这几个问题：

- 飞书群 `chat_id` 怎么快速获取
- OpenClaw 飞书配置怎么一键写入
- 飞书事件订阅明明配了，为什么群里还是不回
- 事件不稳定时，怎么直接走轮询兜底

适合想把 **AI 助手接进飞书群** 的同学直接上手。  
欢迎试用，也欢迎提 issue / PR。

## 3. 推特 / X 版本

I open-sourced `feishu-openclaw` — a reusable skill for connecting OpenClaw to Feishu / Lark bots.

It covers:
- chat_id discovery
- OpenClaw config patching
- event-subscription troubleshooting
- polling fallback when Feishu events are unreliable

Useful if you're building AI assistants inside Feishu groups.

GitHub: https://github.com/wszrw123/feishu-openclaw

## 4. GitHub 动态版本

刚开源了一个新项目：**feishu-openclaw**

这是一个围绕 **OpenClaw × 飞书机器人** 的可复用 Skill，目标很明确：

让“把 OpenClaw 接进飞书群”这件事，不再停留在文档层面，而是真正可以快速落地。

项目里包含：

- 飞书群列表 / `chat_id` 获取脚本
- OpenClaw 飞书配置脚本
- 原生事件订阅模式排障文档
- 飞书轮询兜底方案

如果你在做：

- AI 助手接入飞书
- 飞书群机器人协作
- OpenClaw 渠道扩展

欢迎来看看，也欢迎一起补坑：  
https://github.com/wszrw123/feishu-openclaw

## 5. 超短版一句话文案

- 把 OpenClaw 接进飞书群的坑，我整理成开源 Skill 了：`feishu-openclaw`
- OpenClaw × 飞书机器人，一套打通：`chat_id`、事件订阅、轮询兜底都带上了
- 如果你想让 AI 在飞书群里稳定回复，这个仓库可以直接用
