/**
 * ====================================================
 * MAPID BI & B2B KANBAN — Multi-Spreadsheet API
 * ====================================================
 */

const MAIN_SHEET_ID = '1SDOF1rVTKJPBd19UxbAatPqhWotGBwQ3PznVhUrbL6A'; // Sheet BI Utama
const KANBAN_SHEET_ID = '1N4Xkb2A0-pqeCl6jIX7pvvgmnRqV-BuFAmEFV2daLI4'; // WAJIB GANTI: Sheet B2B Operations

// ==========================================
// 1A. SETUP DB UTAMA (BI DASHBOARD + BUDGET)
// ==========================================
function setupMainDB() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
    
    // --- DATABASE LAMA (Sesuai Referensi Anda) ---
    let sheetRev = ss.getSheetByName('DB_Revenue') || ss.insertSheet('DB_Revenue');
    let sheetProj = ss.getSheetByName('DB_Projects') || ss.insertSheet('DB_Projects');
    
    let sheetPipe = ss.getSheetByName('DB_Pipeline') || ss.insertSheet('DB_Pipeline');
    sheetPipe.clear();
    sheetPipe.appendRow(['Client', 'Industry', 'Stage', 'Value_IDR', 'Action', 'ETA']);
    sheetPipe.appendRow(['Nabati', 'FMCG', 'Proposal', 28827273, 'Waiting for PO', '28-Feb']);
    sheetPipe.appendRow(['PT Pupuk Indonesia', 'BUMN', 'Proposal', 15789750, 'Waiting for PO', '28-Feb']);
    sheetPipe.appendRow(['Cimory', 'FMCG', 'Proposal', 298987000, 'Procurement Review', '28-Feb']);
    sheetPipe.appendRow(['PLN', 'BUMN', 'Proposal', 199000000, 'User Review', '30-Jun']);
    sheetPipe.appendRow(['Hutama Karya Indonesia', 'BUMN', 'Negotiation', 770000000, 'User Review', '31-Mar']);
    sheetPipe.appendRow(['Pelindo Excube', 'BUMN', 'Won', 276390000, 'Waiting for Agreement', '28-Feb']);
    sheetPipe.appendRow(['Nippon Koei', 'Consultant', 'Proposal', 1514000000, 'User postpone to March', '30-May']);
    sheetPipe.appendRow(['BTID', 'Property', 'Negotiation', 1798866000, 'Follow Up', '1-Jun']);
    sheetPipe.appendRow(['Nabati (Pilot)', 'FMCG', 'Won', 2204000000, 'Switch to Pilot', '31-May']);

    let sheetCamp = ss.getSheetByName('DB_Campaigns') || ss.insertSheet('DB_Campaigns');
    sheetCamp.clear();
    sheetCamp.appendRow(['Campaign_Name', 'Period', 'Status', 'Leads', 'Participants', 'Conversion_Pct']);
    sheetCamp.appendRow(['Opening Rush Loc Analytics', 'Q1 2026', 'Completed', 150, 65, 43.3]);
    sheetCamp.appendRow(['Free Class Backgrounds', 'Q1 2026', 'Active', 320, 110, 34.3]);
    sheetCamp.appendRow(['Business Expansion Testing', 'Q2 2026', 'Planning', 0, 0, 0]);

    let sheetSoc = ss.getSheetByName('DB_Socials') || ss.insertSheet('DB_Socials');
    sheetSoc.clear();
    sheetSoc.appendRow(['Month', 'Week', 'Platform', 'Metric', 'Value']);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'Instagram', 'Followers', 6550]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'LinkedIn', 'Followers', 9673]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'YouTube', 'Subscribers', 1240]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'WA Community', 'Members', 1893]);

    let sheetTrend = ss.getSheetByName('DB_Trends') || ss.insertSheet('DB_Trends');
    sheetTrend.clear();
    sheetTrend.appendRow(['Timeframe', 'Label', 'Revenue_M', 'DealSizeAvg_M']);
    sheetTrend.appendRow(['month', 'Nov 25', 140, 15]);
    sheetTrend.appendRow(['month', 'Dec 25', 110, 10]);
    sheetTrend.appendRow(['month', 'Jan 26', 180, 20]);

    let sheetDocs = ss.getSheetByName('DB_Docs') || ss.insertSheet('DB_Docs');
    sheetDocs.clear();
    sheetDocs.appendRow(['Title', 'Category', 'Format', 'Link', 'Description']);
    sheetDocs.appendRow(['Business Status Report Q1', 'Report', 'PDF', '#', 'Bi-weekly status report.']);

    let sheetGrowth = ss.getSheetByName('DB_UserGrowth') || ss.insertSheet('DB_UserGrowth');
    sheetGrowth.clear();
    sheetGrowth.appendRow(['Month', 'Week', 'NewRegist', 'ActiveGeoUsers', 'ConversionRate']);
    sheetGrowth.appendRow(['Jan 2026', 'Week 1', 100, 50, 50]);

    let sheetAcademy = ss.getSheetByName('DB_Academy') || ss.insertSheet('DB_Academy');
    sheetAcademy.clear();
    sheetAcademy.appendRow(['Program', 'Batch', 'Registrants', 'Converted']);
    sheetAcademy.appendRow(['Location Analytics', 'Batch 1', 100, 25]);

    // --- DATABASE BARU: BUDGET DISBURSEMENT ---
    let sheetBudget = ss.getSheetByName('DB_Budget') || ss.insertSheet('DB_Budget');
    sheetBudget.clear();
    sheetBudget.appendRow(['Date', 'Category', 'Amount', 'Description']);
    sheetBudget.appendRow(['2026-03-01', 'Ads Spend', 5000000, 'Meta Ads - Top of Funnel']);
    sheetBudget.appendRow(['2026-03-05', 'Event', 12500000, 'Sponsorship Acara Peta Bumi']);
    sheetBudget.appendRow(['2026-03-10', 'Software', 1500000, 'Lisensi n8n & API Pihak Ketiga']);

    Logger.log("✅ Setup Main DB (termasuk Budget) Sukses!");
  } catch (error) { Logger.log("❌ Setup Main DB Error: " + error.message); }
}

// ==========================================
// 1B. SETUP DB KANBAN (SPREADSHEET KEDUA)
// ==========================================
function setupKanbanDB() {
  try {
    if (!KANBAN_SHEET_ID) {
      Logger.log("❌ Kanban Sheet ID is empty!");
      return;
    }

    const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
    
    let sheetPSE = ssKanban.getSheetByName('DB_PSE_Members') || ssKanban.insertSheet('DB_PSE_Members');
    sheetPSE.clear();
    sheetPSE.appendRow(['PSE_ID', 'Name', 'Max_Capacity', 'Is_Active']);
    sheetPSE.appendRow([Utilities.getUuid(), 'Zhafran', 15, true]);
    sheetPSE.appendRow([Utilities.getUuid(), 'Lossa', 15, true]);
    sheetPSE.appendRow([Utilities.getUuid(), 'Amel', 15, true]);

    let sheetProjects = ssKanban.getSheetByName('DB_Kanban_Projects') || ssKanban.insertSheet('DB_Kanban_Projects');
    sheetProjects.clear();
    sheetProjects.appendRow(['Project_ID', 'Client', 'Project_Name', 'PSE_ID', 'Stage', 'Progress_Pct', 'Priority']);

    let sheetLeads = ssKanban.getSheetByName('DB_PSE_Leads') || ssKanban.insertSheet('DB_PSE_Leads');
    sheetLeads.clear();
    sheetLeads.appendRow(['Lead_ID', 'Lead_Name', 'PSE_ID', 'Is_Closed']);

    let sheetPartners = ssKanban.getSheetByName('DB_PSE_Partners') || ssKanban.insertSheet('DB_PSE_Partners');
    sheetPartners.clear();
    sheetPartners.appendRow(['Partner_ID', 'Partner_Name', 'PSE_ID', 'Is_Active']);

    Logger.log("✅ Setup Kanban DB di Spreadsheet Baru Sukses!");
  } catch (error) { 
    Logger.log("❌ Setup Kanban Error: " + error.message); 
  }
}

// ==========================================
// 2. HTTP GET HANDLER (Menggabungkan 2 Sheet)
// ==========================================
function doGet(e) {
  try {
    const ssMain = SpreadsheetApp.openById(MAIN_SHEET_ID);
    
    const readData = (ss, name) => {
      if (!ss) return [];
      const sheet = ss.getSheetByName(name);
      return sheet ? sheet.getDataRange().getValues().slice(1) : [];
    };

    // --- BACA DATA DARI SPREADSHEET UTAMA ---
    const payload = {
      revenue: readData(ssMain, 'DB_Revenue').map(r => ({ subProduct: r[1], quarter: r[2], target: r[3], actual: r[4], achievement: r[5] })),
      projects: readData(ssMain, 'DB_Projects').map(r => ({ name: r[0], phase: r[1], progress: r[2], issue: r[3] })),
      docs: readData(ssMain, 'DB_Docs').map(r => ({ title: r[0], category: r[1], format: r[2], link: r[3], desc: r[4] })),
      pipeline: readData(ssMain, 'DB_Pipeline').map(r => ({ client: r[0], industry: r[1], stage: r[2], value: r[3], action: r[4], eta: r[5] })),
      campaigns: readData(ssMain, 'DB_Campaigns').map(r => ({ name: r[0], period: r[1], status: r[2], leads: r[3], participants: r[4], conversion: r[5] })),
      socials: readData(ssMain, 'DB_Socials').map(r => ({ month: r[0], week: r[1], platform: r[2], metric: r[3], value: r[4] })),
      userGrowth: readData(ssMain, 'DB_UserGrowth').map(r => ({ month: r[0], week: r[1], newRegist: r[2], activeGeoUsers: r[3], conversion: r[4] })),
      trends: readData(ssMain, 'DB_Trends').map(r => ({ category: r[0], label: r[1], revenue: r[2], dealSize: r[3] })),
      academy: readData(ssMain, 'DB_Academy').map(r => ({ program: r[0], batch: r[1], registrants: r[2], converted: r[3] })),
      // Menarik Data Budget
      budget: readData(ssMain, 'DB_Budget').map(r => ({ date: r[0], category: r[1], amount: r[2], description: r[3] }))
    };

    // --- BACA DATA DARI SPREADSHEET KANBAN ---
    let kanbanProjects = [];
    let pseWorkloads = [];
    let kanbanLeads = [];
    let kanbanPartners = [];

    // Failsafe: Hanya coba tarik data jika ID Kanban sudah diubah
    if (KANBAN_SHEET_ID) {
      try {
        const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
        const pseData = readData(ssKanban, 'DB_PSE_Members');
        const projectData = readData(ssKanban, 'DB_Kanban_Projects');
        const leadsData = readData(ssKanban, 'DB_PSE_Leads');
        const partnerData = readData(ssKanban, 'DB_PSE_Partners');

        kanbanProjects = projectData.map(r => ({
          id: r[0], client: r[1], projectName: r[2], pseId: r[3], stage: r[4], progress: r[5], priority: r[6], notes: r[7] || ''
        }));

        kanbanLeads = leadsData.map(r => ({
          id: r[0], name: r[1], pseId: r[2], isClosed: r[3], stage: r[4] || 'Lead Generation', progress: Number(r[5]) || 0, priority: r[6] || 'Medium', notes: r[7] || ''
        }));

        kanbanPartners = partnerData.map(r => ({
          id: r[0], name: r[1], pseId: r[2], isActive: r[3], type: r[4] || 'Technology', stage: r[5] || 'Lead Generation', progress: Number(r[6]) || 0, priority: r[7] || 'Medium', notes: r[8] || ''
        }));

        pseWorkloads = pseData.filter(p => p[3] === true).map(p => {
          const pseId = p[0];
          const maxCap = p[2] || 15;

          const activeProjects = projectData.filter(prj => prj[3] === pseId && prj[4] !== 'Done').length;
          const activeLeads = leadsData.filter(ld => ld[2] === pseId && ld[3] === false).length;
          const activePartners = partnerData.filter(pt => pt[2] === pseId && pt[3] === true).length;

          const totalPoints = (activeProjects * 3) + (activeLeads * 1) + (activePartners * 1);
          const loadPercentage = maxCap > 0 ? Math.round((totalPoints / maxCap) * 100) : 0;

          return {
            pseId: pseId, name: p[1], activeProjects: activeProjects, activeLeads: activeLeads, activePartners: activePartners,
            totalPoints: totalPoints, maxCapacity: maxCap, loadPercentage: loadPercentage
          };
        });
      } catch (kanbanErr) {
        Logger.log("Gagal baca DB Kanban: " + kanbanErr.message);
      }
    }

    payload.kanbanProjects = kanbanProjects;
    payload.pseWorkloads = pseWorkloads;
    payload.kanbanLeads = kanbanLeads;
    payload.kanbanPartners = kanbanPartners;

    // Ambil Admin Config
    var adminConfig = getAdminConfig();
    if (adminConfig) {
      payload.adminConfig = adminConfig;
    }

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ isError: true, error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. HTTP POST HANDLER (doPost)
// ==========================================
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    
    // Handler A: Save Admin Config & Sync BI Data (Simpan ke MAIN SHEET)
    if (body.action === 'saveConfig') {
      saveAdminConfig(body.data);
      if (body.data && body.data.biData) {
        syncBiDataToSheets(body.data.biData);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Config & Main Sheets saved successfully' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handler B: Update Kanban Stage dari Drag & Drop (Simpan ke KANBAN SHEET)
    if (body.action === 'updateKanban') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");

      const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
      const sheet = ssKanban.getSheetByName('DB_Kanban_Projects');
      const data = sheet.getDataRange().getValues();
      let isUpdated = false;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.projectId) {
          sheet.getRange(i + 1, 5).setValue(body.newStage); // Kolom E (Stage)
          isUpdated = true;
          break;
        }
      }
      
      if (isUpdated) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Kanban stage updated" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Project ID not found" })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Handler C: Add Kanban Project
    if (body.action === 'addKanbanProject') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");

      const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
      const sheet = ssKanban.getSheetByName('DB_Kanban_Projects');
      const newId = Utilities.getUuid();
      sheet.appendRow([newId, body.client, body.projectName, body.pseId || '-', body.stage, body.progress || 0, body.priority || 'Medium', body.notes || '']);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Kanban project added", newId: newId })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler D: Add Kanban Lead
    if (body.action === 'addKanbanLead') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");
      const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
      const sheet = ssKanban.getSheetByName('DB_PSE_Leads');
      const newId = Utilities.getUuid();
      sheet.appendRow([newId, body.name, body.pseId, false, body.stage, body.progress || 0, body.priority || 'Medium', body.notes || '']); 
      return ContentService.createTextOutput(JSON.stringify({ success: true, newId: newId })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler E: Add Kanban Partner
    if (body.action === 'addKanbanPartner') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");
      const ssKanban = SpreadsheetApp.openById(KANBAN_SHEET_ID);
      const sheet = ssKanban.getSheetByName('DB_PSE_Partners');
      const newId = Utilities.getUuid();
      sheet.appendRow([newId, body.name, body.pseId, true, body.type, body.stage, body.progress || 0, body.priority || 'Medium', body.notes || '']);
      return ContentService.createTextOutput(JSON.stringify({ success: true, newId: newId })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler F: Update Kanban Lead (Drag & Drop)
    if (body.action === 'updateKanbanLead') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");
      const sheet = SpreadsheetApp.openById(KANBAN_SHEET_ID).getSheetByName('DB_PSE_Leads');
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.leadId) {
          sheet.getRange(i + 1, 5).setValue(body.newStage);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ID not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler G: Update Kanban Partner (Drag & Drop)
    if (body.action === 'updateKanbanPartner') {
      if (!KANBAN_SHEET_ID) throw new Error("Kanban Sheet ID is empty on the server");
      const sheet = SpreadsheetApp.openById(KANBAN_SHEET_ID).getSheetByName('DB_PSE_Partners');
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.partnerId) {
          sheet.getRange(i + 1, 6).setValue(body.newStage);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ID not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler H: Edit Kanban Project
    if (body.action === 'editKanbanProject') {
      const sheet = SpreadsheetApp.openById(KANBAN_SHEET_ID).getSheetByName('DB_Kanban_Projects');
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.id) {
          sheet.getRange(i + 1, 2, 1, 7).setValues([[body.client, body.projectName, body.pseId, body.stage, body.progress || 0, body.priority, body.notes || '']]);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler I: Edit Kanban Lead
    if (body.action === 'editKanbanLead') {
      const sheet = SpreadsheetApp.openById(KANBAN_SHEET_ID).getSheetByName('DB_PSE_Leads');
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.id) {
          sheet.getRange(i + 1, 2, 1, 7).setValues([[body.name, body.pseId, body.isClosed !== undefined ? body.isClosed : false, body.stage, body.progress || 0, body.priority || 'Medium', body.notes || '']]);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handler J: Edit Kanban Partner
    if (body.action === 'editKanbanPartner') {
      const sheet = SpreadsheetApp.openById(KANBAN_SHEET_ID).getSheetByName('DB_PSE_Partners');
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === body.id) {
          sheet.getRange(i + 1, 2, 1, 8).setValues([[body.name, body.pseId, body.isActive !== undefined ? body.isActive : true, body.type, body.stage, body.progress || 0, body.priority || 'Medium', body.notes || '']]);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function getAdminConfig() {
  var ssMain = SpreadsheetApp.openById(MAIN_SHEET_ID);
  var sheet = ssMain.getSheetByName('AdminConfig');
  if (!sheet) return null;
  var jsonString = sheet.getRange('A2').getValue();
  if (!jsonString) return null;
  try { return JSON.parse(jsonString); } catch (e) { return null; }
}

function saveAdminConfig(configData) {
  var ssMain = SpreadsheetApp.openById(MAIN_SHEET_ID);
  var sheet = ssMain.getSheetByName('AdminConfig');
  if (!sheet) {
    sheet = ssMain.insertSheet('AdminConfig');
    sheet.getRange('A1').setValue('config');
  }
  
  // Clone to avoid deleting biData from the object if it's used later
  var clone = JSON.parse(JSON.stringify(configData));
  if (clone.biData) {
     delete clone.biData;
  }
  
  sheet.getRange('A2').setValue(JSON.stringify(clone));
}

function syncBiDataToSheets(biData) {
  var ssMain = SpreadsheetApp.openById(MAIN_SHEET_ID);

  function writeToSheet(sheetName, headers, dataRows) {
    var sheet = ssMain.getSheetByName(sheetName);
    if (!sheet) sheet = ssMain.insertSheet(sheetName);
    sheet.clear();
    
    var maxCols = headers.length;
    var safeDataRows = dataRows.map(function(row) {
      var safeRow = [];
      for (var i = 0; i < maxCols; i++) {
        safeRow.push(row[i] === undefined ? '' : row[i]);
      }
      return safeRow;
    });
    
    var allRows = [headers].concat(safeDataRows);
    sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
  }

  if (biData.pipeline) {
    var pipelineRows = biData.pipeline.map(function(r) { return [r.client, r.industry, r.stage, r.value, r.action, r.eta]; });
    writeToSheet('DB_Pipeline', ['Client', 'Industry', 'Stage', 'Value_IDR', 'Action', 'ETA'], pipelineRows);
  }

  if (biData.campaigns) {
    var campaignRows = biData.campaigns.map(function(r) { return [r.name, r.period || '', r.status, r.leads, r.participants, r.conversion]; });
    writeToSheet('DB_Campaigns', ['Campaign_Name', 'Period', 'Status', 'Leads', 'Participants', 'Conversion_Pct'], campaignRows);
  }

  if (biData.socials) {
    var socialRows = biData.socials.map(function(r) { return [r.month, r.week, r.platform, r.metric, r.value]; });
    writeToSheet('DB_Socials', ['Month', 'Week', 'Platform', 'Metric', 'Value'], socialRows);
  }

  if (biData.userGrowth) {
    var growthRows = biData.userGrowth.map(function(r) { return [r.month, r.week, r.newRegist, r.activeGeoUsers, r.conversion]; });
    writeToSheet('DB_UserGrowth', ['Month', 'Week', 'NewRegist', 'ActiveGeoUsers', 'ConversionRate'], growthRows);
  }

  if (biData.projects) {
    var projectRows = biData.projects.map(function(r) { return [r.name, r.phase, r.progress, r.issue]; });
    writeToSheet('DB_Projects', ['Name', 'Phase', 'Progress', 'Issue'], projectRows);
  }

  if (biData.docs) {
    var docRows = biData.docs.map(function(r) { return [r.title, r.category, r.format, r.link, r.desc]; });
    writeToSheet('DB_Docs', ['Title', 'Category', 'Format', 'Link', 'Description'], docRows);
  }

  if (biData.trends) {
    var trendRows = biData.trends.map(function(r) { return [r.category || 'Month', r.label, r.revenue, r.dealSize]; });
    writeToSheet('DB_Trends', ['Category', 'Label', 'Revenue_M', 'DealSizeAvg_M'], trendRows);
  }

  if (biData.academy) {
    var academyRows = biData.academy.map(function(r) { return [r.program, r.batch, r.registrants, r.converted]; });
    writeToSheet('DB_Academy', ['Program', 'Batch', 'Registrants', 'Converted'], academyRows);
  }

  // Menulis Data Budget jika disync dari Admin Panel
  if (biData.budget) {
    var budgetRows = biData.budget.map(function(r) { return [r.date, r.category, r.amount, r.description]; });
    writeToSheet('DB_Budget', ['Date', 'Category', 'Amount', 'Description'], budgetRows);
  }

  if (biData.revenue) {
    var revSheet = ssMain.getSheetByName('DB_Revenue');
    var existingRevMap = {};
    if (revSheet) {
      var revData = revSheet.getDataRange().getValues().slice(1);
      revData.forEach(function(r) {
        if (r[0] && r[1]) existingRevMap[r[1]] = r[0];
      });
    }
    var revenueRows = biData.revenue.map(function(r) { 
      return [existingRevMap[r.subProduct] || '-', r.subProduct, r.quarter || '', r.target, r.actual, r.achievement]; 
    });
    writeToSheet('DB_Revenue', ['Category', 'SubProduct', 'Quarter', 'Target', 'Actual', 'Achievement_Pct'], revenueRows);
  }
}
