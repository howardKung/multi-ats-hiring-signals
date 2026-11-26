# 🚀 大 Boss 3 分鐘傻瓜上架指南（Apify Store）

所有程式碼、Schema、Dockerfile、Zero-Charge 防死補丁、每日防壞 Canary CI 與英文商品頁都已經 100% 準備就緒並推送到 GitHub (`howardKung/multi-ats-hiring-signals`)。

您只需要花 **3 分鐘** 點滑鼠完成以下 4 步，現金流引擎即可開始自動接單！

---

## Step 1：在 Apify Console 連結 GitHub 倉庫（1 分鐘）

1. 登入 [Apify Console](https://console.apify.com/)。
2. 左側選單點選 **Actors** → 右上角 **Develop new** → **Link Git repository**。
3. 貼上 GitHub URL：
   `https://github.com/howardKung/multi-ats-hiring-signals`
4. Branch 保持預設 `main`，點選 **Create**。

---

## Step 2：一鍵 Build 並試跑驗證（1 分鐘）

1. 進入剛建立的 Actor 頁面，切到 **Source** 分頁，點選 **Build**。
   - 因為我們採用官方 `apify/actor-node:22` 且零 Puppeteer 依賴，Build 約 30 秒就會亮綠燈！
2. Build 完成後，點選 **Start**（使用預設預填的 5 家企業：`stripe.com`, `airbnb.com`, `figma.com`, `linear.app`, `notion.so`）。
3. 確認 **Output** 表格呈現乾淨的 `openRolesCount`、`buyingSignals`、`detectedTechStack` 即可進入下一步。

---

## Step 3：開啟 Pay-Per-Event (PPE) 定價（30 秒）

1. 切到 **Publication** → **Monetization** 分頁。
2. 選擇 **Pay per event (PPE)**（Apify 官方目前最推、轉換率最高的計費模式）。
3. 新增一個計費事件（**事件名稱必須完全一致**）：
   - **Event name**: `company-signal-extracted`
   - **Event title**: `Company Hiring & GTM Signals Extracted`
   - **Event description**: `Charged only when at least 1 active job posting is extracted for a company. Zero charge ($0) if not found.`
   - **Price per event**: 建議設定 **`$0.015`**（每 1,000 家公司 = $15，毛利率 > 95%，對 Clay / AI SDR 團隊超便宜！）
4. 確認已在 Apify 帳號設定好 Payout 收款方式（Stripe / PayPal / Wise）。

---

## Step 4：設定商店分類與一鍵 Publish（30 秒）

1. 切到 **Publication** 分頁：
   - **Title**: `Multi-ATS Career & GTM Buying Signals Normalizer`
   - **Categories**: 勾選 `Lead generation`, `Business`, `Jobs`
   - **SEO Title**: `Multi-ATS Job Scraper & GTM Buying Signals API (Greenhouse, Lever, Ashby)`
   - **README**: Apify 會自動同步我們寫好的英文 `README.md`！
2. 將 **Visibility** 改為 **Public**，點選 **Save & Publish**！

---

## 自動化巡檢與維護（完全免手動）

- 本倉庫已內建 `.github/workflows/canary.yml`，每天 UTC 06:00 自動對 10 家真實知名企業進行端對端 API 測試。
- 若未來有任何 ATS 改版，GitHub Actions 會自動發信通知，交給 AI 戰隊一鍵修補並 push，Apify 會自動重新 Build。
