# 🚀 PRD: B2B Project Kanban & PSE Workload (GAS Architecture)
**To:** Antigravity Engineering & Design Team  
**Module:** B2B Delivery & Operations (`/b2b-board`)  
**Architecture:** Serverless (Next.js Frontend + Google Apps Script Backend)  

## 🎯 1. Overview & Objectives
Kita akan memigrasikan tabel statis "Live Project Delivery" menjadi **Kanban Board** yang interaktif. Selain itu, kita akan menambahkan fitur pemantauan **Workload Tim PSE** secara proporsional. Keseluruhan sistem ini akan menggunakan **Google Sheets (GAS)** sebagai *database* utamanya.

## 🛠️ 2. Frontend Scope of Work (Next.js)

### Feature A: B2B Delivery Kanban Board
* **Routing:** Buat halaman baru `/b2b-board`.
* **Kanban Columns (Stages):** `Preparation`, `Development`, `UAT`, `Done`.
* **Card Components:** Menampilkan Nama Project, Klien, Avatar PSE, Progress (%), dan Prioritas.
* **Interactivity:** Menggunakan library Drag-and-Drop (seperti `dnd-kit`). 
* **Data Flow:** Saat *card* digeser ke kolom lain, *frontend* menembak `POST` ke API GAS dengan *payload*: `{ "action": "updateKanban", "projectId": "...", "newStage": "..." }`.

### Feature B: PSE Workload Dashboard
* Terletak di bagian atas halaman Kanban.
* **Workload Cards:** Menampilkan metrik tiap PSE: Active Projects, Active Leads, dan Active Partners.
* **Proportional Load Progress Bar:** Menampilkan persentase beban kerja (hijau/kuning/merah). Angka persentase ini akan dihitung dan dikirim langsung dari API GAS (Frontend tinggal *render*).

## 🗄️ 3. Backend Scope of Work (Google Apps Script)
Kita akan menambahkan 4 Sheet baru di *database* Google Sheets kita. Skema kolomnya adalah sebagai berikut:
1. **DB_PSE_Members:** `PSE_ID`, `Name`, `Max_Capacity`, `Is_Active`
2. **DB_Kanban_Projects:** `Project_ID`, `Client`, `Project_Name`, `PSE_ID`, `Stage`, `Progress_Pct`, `Priority`
3. **DB_PSE_Leads:** `Lead_ID`, `Lead_Name`, `PSE_ID`, `Is_Closed`
4. **DB_PSE_Partners:** `Partner_ID`, `Partner_Name`, `PSE_ID`, `Is_Active`

*(Tim Backend/GAS Engineer: Silakan gunakan script `setupKanbanDB()` terlampir untuk meng-generate sheet ini secara otomatis).*