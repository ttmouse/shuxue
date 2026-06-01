# 数学口算大闯关 — AI 工作上下文入口

> 小学 1~6 年级口算练习 Web 应用。纯前端，零依赖，离线可用。

## 快速启动

打开 `index.html` 即可使用。无需构建、无需安装。

## 核心约束

- **纯前端应用** — 所有逻辑在浏览器中运行，无后端
- **localStorage 持久化** — 错题本和统计存储在浏览器本地
- **零外部依赖** — 不要引入 npm 包、CDN 或构建工具
- **保持可心算** — 所有题目必须能通过心算完成（无纸笔）

## 架构概览

```
index.html          → 布局容器 + 5 个页面视图
├── css/style.css   → 样式系统（Stone+Emerald 主题）
└── js/
    ├── knowledge.js   → 知识点定义（3 年级 × N 题型）
    ├── questions.js   → 题目生成器（11 种生成器）
    ├── app.js         → 主逻辑（状态管理、UI 控制、快捷键）
    ├── wrongbook.js   → 错题本 CRUD（localStorage）
    ├── stats.js       → 每日统计
    └── sound.js       → 音效（Web Audio API）
```

### 模块依赖方向

```
knowledge.js ──→ questions.js ──→ app.js ←── wrongbook.js
                                       ←── stats.js
                                       ←── sound.js
```

所有 JS 文件在 `index.html` 底部按依赖顺序加载。

## 关键文件

| 文件 | 作用 | 关键内容 |
|---|---|---|
| `index.html` | 单页入口 | 5 个页面容器，script 加载顺序 |
| `css/style.css` | 全部样式 | CSS 变量系统，响应式，动画 |
| `js/knowledge.js` | 知识点体系 | 3 个年级分组，18 个知识点 |
| `js/questions.js` | 题目生成 | 11 个生成器，3 级难度 |
| `js/app.js` | 主控制器 | 状态管理，答题流程，错题重练，快捷键 |
| `js/wrongbook.js` | 错题持久化 | localStorage API，题型筛选，按日期分组 |
| `js/stats.js` | 统计 | 每日/累计统计记录 |
| `js/sound.js` | 音效 | Web Audio API 合成，无外部文件 |

## 上下文文件

- **CONTEXT-MAP.md** — 上下文文件索引与导航
- **`.harness/commands.md`** — 操作命令速查
- **`.harness/working-boundaries.md`** — 工作边界与禁止操作

## 思维训练进化计划

详见 `docs/thinking-training-plan.md`。项目正在从"传统口算练习"逐步演进为"以思维训练为核心"的数学工具。当前优先级：

1. **24 点挑战** — 反向组合 + 试错，独立新模式
2. **运算定律巧算专题** — 分配律/结合律的专项训练
3. **抽卡凑数** — 24 点的泛化版本
