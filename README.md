# 許應良｜AI / Machine Learning Engineer

這是我的雙語履歷／作品集網站，依 2026/10/24 匯出的 104 履歷，聚焦 Machine Learning、Industrial AI、Optimization 與 Python。

職務與求職定位分別顯示：**廣達電腦 AI 數據工程師（2026/10–至今）**、**希望職稱 AI / Machine Learning Engineer**。易豐購任職期間為 **2023/07–2026/09**。公開網站不包含 104 PDF 的完整通訊地址。

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
- 最後更新: 2026年10月24日

## 聯絡方式
- Email: joe0827joe@yahoo.com.tw
- Phone: 0930-227-913
- GitHub: https://github.com/joe0827joe

## 履歷資料維護原則
- 104 PDF 作為職務、任職期間及研究成果的正式內容基準。
- `data/resume.json` 是一頁式履歷的來源；首頁 `index.html` 需同步調整對應欄位。
- 研究成果分開標示「模擬可用能損耗降低 9.2%」與「實際場域 PUE 降低 7%」，不混用驗證環境。
- 現任廣達職務只描述已參與的資料分析、可行性評估與 PoC／整合規劃，不宣稱模型已上線。
- GitHub Pages 正式部署前以 Pull Request 執行履歷生成測試，PDF 需符合一頁限制。
