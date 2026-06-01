# 上下文文件索引

> 文件结构：根级别入口 + `.harness/` 操作级文件

## 文件清单

| 文件 | 类型 | 作用 | 何时读取 |
|---|---|---|---|
| `AGENTS.md` | 🔥 热 | 项目入口、架构概览、关键约束 | 每次任务 |
| `CONTEXT-MAP.md` | 🔥 热 | 本文件 — 上下文导航 | 每次任务 |
| `.harness/commands.md` | 🌡️ 温 | 构建/测试/运行命令 | 需要执行命令时 |
| `.harness/working-boundaries.md` | 🌡️ 温 | 工作边界、禁止操作、风险 | 修改代码前 |

## 上下文选择指南

- **修改 UI 样式** → 读 `css/style.css`
- **新增/修改题型** → 读 `js/questions.js` + `js/knowledge.js`
- **修改答题流程/UI 逻辑** → 读 `js/app.js`
- **修改错题本逻辑** → 读 `js/wrongbook.js`
- **修改统计逻辑** → 读 `js/stats.js`
- **修改音效** → 读 `js/sound.js`
- **修改 HTML 结构** → 读 `index.html`

## 未覆盖的方面

- 无测试文件（纯静态应用，手动测试）
- 无构建/CI 配置（零依赖 SPA）
- 无后端 API（全部本地运行）
