# 許應良 - AI 工程師履歷

這是我的個人履歷網站，展示專業技能、專案作品與工作經歷。

## 技術棧
- HTML5 / CSS3 / JavaScript
- Playwright（部署時產生固定一頁 PDF）

## 內容架構
| 層次 | 用途 | 網址 |
|------|------|------|
| 作品集網站 | 形象、架構圖、完整專案說明 | https://joe0827joe.github.io/ |
| 一頁式履歷 | 快速閱讀（靜態 HTML，不依賴 JS 才能讀內容） | https://joe0827joe.github.io/resume.html |
| 中文 PDF | 投遞／轉寄附件 | [Joe_Hsu_Resume_ZH.pdf](https://joe0827joe.github.io/Joe_Hsu_Resume_ZH.pdf) |
| 英文 PDF | 投遞／轉寄附件 | [Joe_Hsu_Resume_EN.pdf](https://joe0827joe.github.io/Joe_Hsu_Resume_EN.pdf) |
| 共用資料 | 內容單一來源 | `data/resume.json` |

## 更新履歷流程
1. 修改 `data/resume.json`
2. 執行 `npm run build:resume`（或 push 後由 GitHub Actions 自動建置）
3. 產出：更新後的 `resume.html`、`Joe_Hsu_Resume_ZH.pdf`、`Joe_Hsu_Resume_EN.pdf`
4. 建置會驗證 PDF **必須正好 1 頁**，否則失敗

## 使用建議
- **104**：放首頁作品集網址
- **Email／官網投遞**：附中文或英文 PDF + 首頁連結
- **只要履歷網址**：給 `/resume.html`
- **技術面試**：用首頁專案展開

## 部署狀態
- GitHub Pages: https://joe0827joe.github.io
- 最後更新: 2026年7月14日

## 聯絡方式
- Email: joe0827joe@yahoo.com.tw
- Phone: 0930-227-913
- GitHub: https://github.com/joe0827joe
