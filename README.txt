匿名单选投票网站

文件：
- index.html
- style.css
- script.js

使用方法：
1. 将这三个文件上传到 GitHub repository。
2. 在 GitHub Settings -> Pages 中开启 GitHub Pages。
3. 使用 main 分支和 / (root)。
4. 网站首页用于创建投票。
5. 创建后会生成独立投票链接，例如：
   https://你的用户名.github.io/仓库名/?id=xxxxxxxxxxxx

Apps Script API 已经写入 script.js。

注意：
- 当前为匿名单选投票。
- Google Sheet 自动保存投票。
- 投票结果在提交后显示。
- localStorage 只提供浏览器级别的防重复投票，不是严格的一人一票。
- 不要把 Apps Script URL 改成 /dev，必须使用部署后的 /exec 地址。
