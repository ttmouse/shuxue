# 操作命令

## 运行

```bash
# 打开应用（在浏览器中直接打开）
open index.html
```

无需服务器，无需构建，直接在浏览器中打开即可运行。

## 本地预览（可选）

如果需要通过 HTTP 服务器预览：

```bash
# Python
python3 -m http.server 8080

# Node (需安装)
npx serve .
```

## 无可用命令

- ❌ 无构建脚本
- ❌ 无测试脚本
- ❌ 无 lint 配置
- ❌ 无 CI/CD
- ❌ 无包管理（无 package.json）
