# My Blog — 黑白之间

极简风格的个人博客，黑白配色 + 右侧边栏。基于纯 HTML、CSS、JavaScript 构建，文章内容使用 Markdown 编写。

## 功能特点

- 黑白极简设计，右侧固定边栏
- 文章由 Markdown 文件驱动，无需构建工具
- 响应式布局，支持移动端
- 可部署在 GitHub Pages 上

## 文章管理

所有文章存放在 `posts/` 目录下，每篇文章是一个 Markdown 文件，元数据写在文件开头的 YAML 头（frontmatter）中：

```
posts/
├── posts.json          # 文章列表（只需写文件名，不含扩展名）
├── your-post.md        # 你的文章（元数据内嵌在文件头部）
└── another-post.md
```

### 添加新文章

1. 在 `posts/` 目录下创建 `.md` 文件
2. 在文件开头添加 YAML 头（frontmatter）：

```markdown
---
title: 文章标题
category: 分类名称
date: May 30, 2026
tags: [tag1, tag2]
excerpt: 文章摘要，会显示在首页卡片上
---

正文内容从这里开始...
```

3. 在 `posts/posts.json` 中添加文件名（不含 `.md` 后缀）：

```json
"your-post"
```

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库 `https://github.com/你的用户名/你的用户名.github.io`

2. 推送代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
   git push -u origin main
   ```

3. 启用 GitHub Pages：
   - 进入仓库 **Settings** → **Pages**
   - 在 "Branch" 下选择 `main`，目录选 `/ (root)`
   - 点击 **Save**

4. 你的站点将发布在：`https://你的用户名.github.io`

### 自定义域名（可选）

在仓库 **Settings** → **Pages** → **Custom domain** 中配置域名，或在根目录添加 `CNAME` 文件。

## 本地预览

直接用浏览器打开 `index.html` 即可 — 无需任何构建工具。

## License

MIT
