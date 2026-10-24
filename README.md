# OphthaCare 2.0 (次世代眼科全週期數位手術與圍手術期臨床管理系統)

> 👁️ **Next-Gen Ophthalmic Perioperative Clinical Information & Surgery Management System**  
> 基於 **Node.js 22 (ES Modules)**、**HL7 FHIR R4 醫療架構規範** 與 **SRK/T 智能人工水晶體 (IOL) 試算演算法**，為眼科診所與大型醫療院所打造之現代化圍手術期（術前評估 / 術中監測與手術室排程 / 術後恢復追蹤）臨床數位工作台。

---

## 🌟 核心特色與技術升級亮點

### 1. 📋 雙眼對照術前臨床評估 (OD / OS Clinical Assessment)
- **OD (右眼) vs OS (左眼) 雙眼並排比對**：
  - 裸視視力 (UCVA)、最佳矯正視力 (BCVA)、屈光度數 (Sphere / Cylinder / Axis) 與球面等效 (SE)。
  - 實測眼壓 (IOP) 結合中央角膜厚度 (CCT) 依據 Dresdner/Ehlers 演算法自動進行微米級修正，防範偽低眼壓漏診青光眼。
  - 角膜曲率 (K1 / K2)、眼軸長度 (Axial Length, AL) 與前房深度 (ACD)。

### 2. 🔬 SRK/T 智能人工水晶體 (IOL) 度數試算器
- 臨床經典 **Sanders-Retzlaff-Kraff / T (SRK/T)** 演算法直接整合：
  $$P = A - 2.5 \cdot AL - 0.9 \cdot K$$
- 動態輸入眼軸長、角膜曲率與水晶體常數（A-Constant），即時演算推薦度數（如 $+21.0\text{ D}$）與周邊 5 階屈光預測表，杜絕術後屈光意外。

### 3. 🏥 手術室 (OR) 即時排程與術中紀錄
- 全院手術室狀態看板（第一手術室 Phaco 白內障、第二手術室 SMILE 全飛秒近視雷射、第三手術室視網膜微創）。
- 即時生命徵象監視模擬（HR, NIBP, SpO2, 麻醉狀態），完整記錄超音波乳化時間 (Phaco Time)、累積耗能 (CDE) 與植入水晶體序號。

### 4. 📈 術後視力恢復與臨床追蹤歷程
- 術後 Day 1 $\to$ Week 1 $\to$ Month 1 視力恢復進展追蹤表。
- 傷口閉合評估 (Seidel Test)、眼壓監控與專用用藥處方指引（Cravit 抗生素、Pred Forte 抗發炎）。

### 5. ⚡ 內建 HL7 FHIR / 臨床 RESTful API 互動中台
- 開箱即在瀏覽器中實時發送測試 6 大臨床 API（病患管理、IOL 度數試算、CCT 眼壓校正、手術室排程、臨床總覽），即時查看標準醫療 JSON 響應。

---

## 🚀 快速啟動

### 方法 A：雙擊 Windows 啟動腳本 (推薦)
雙擊目錄下的 `start.bat`，系統會自動在 Port 3001 啟動醫療伺服器，並優先以 **Brave 瀏覽器** 開啟醫師工作台：

```cmd
start.bat
```

### 方法 B：標準 npm 指令啟動
```bash
# 啟動臨床伺服器 (Port 3001)
npm start

# 或熱重載開發模式
npm run dev
```
啟動後打開瀏覽器訪問：`http://localhost:3001`

---

## 🧮 醫學演算法與計算公式

### 1. 人工水晶體度數公式：Sanders-Retzlaff-Kraff / T (SRK/T)
$$P_{\text{emmetropia}} = A - 2.5 \cdot AL - 0.9 \cdot K$$

- $A$：晶體常數 (A-Constant，通常介於 $118.0 \sim 119.5$)
- $AL$：眼軸長度 (Axial Length, mm)
- $K$：平均角膜屈光力 ($K = \frac{K_1 + K_2}{2}$, Diopters)

針對短眼軸 ($AL < 22\text{ mm}$) 與長眼軸 ($AL > 24.5\text{ mm}$) 導入非線性幾何係數校正。

### 2. 球面等效度數 (Spherical Equivalent, SE)
$$SE = \text{Sphere} + \frac{\text{Cylinder}}{2}$$

### 3. 角膜厚度眼壓校正公式 (Ehlers / Dresdner Formulation)
$$IOP_{\text{corrected}} = IOP_{\text{measured}} + \frac{545 - CCT}{50} \cdot 2.5$$

---

## 📁 專案架構

```
SQL/ (建議更名為 OphthaCare)
├── server.js              # Node.js 22 ESM 臨床伺服器 (REST API on Port 3001)
├── services/
│   ├── ophthalmicEngine.js# SRK/T IOL 計算、眼壓校正與屈光醫學演算法
│   └── clinicalDb.js      # 臨床病患、OD/OS 檢驗值、手術室排程與回診資料庫
├── public/
│   ├── index.html         # 現代眼科醫師臨床工作台主介面
│   ├── style.css          # 醫療級深色與青綠色質感設計系統
│   └── app.js             # 病患切換、IOL 即時計算器與 API 測試中台
├── package.json           # 現代 NPM 配置 (ES Modules, Express, cors)
├── start.bat              # Windows 一鍵啟動腳本 (純淨 ASCII 編碼，優先調用 Brave)
└── README.md              # 系統規格與臨床演算法說明文件
```

---

## 📡 臨床 RESTful API 規格

| HTTP 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/health` | 伺服器狀態與 HL7 FHIR 規範支援說明 |
| `GET` | `/api/patients` | 獲取全院眼科患者名冊及其圍手術期狀態 |
| `GET` | `/api/patients/:id` | 查詢指定患者之雙眼 OD/OS 檢查數據與手術記錄 |
| `POST` | `/api/calculate-iol` | 傳送 AL 與 K 值，即時以 SRK/T 公式試算水晶體度數 |
| `POST` | `/api/correct-iop` | 以 CCT 角膜厚度校正眼壓實測值 |
| `GET` | `/api/or-rooms` | 查詢 3 間專屬手術室即時運作狀態與醫師排程 |
| `GET` | `/api/stats/clinical` | 臨床手術量、各階段分佈與手術室稼動率統計 |

---

## 📄 License
MIT License © 2026 wytsai109
