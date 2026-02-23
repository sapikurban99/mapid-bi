/**
 * ====================================================
 * MAPID BI Dashboard — Google Apps Script (Reference)
 * ====================================================
 */

const SHEET_ID = '1SDOF1rVTKJPBd19UxbAatPqhWotGBwQ3PznVhUrbL6A'; // WAJIB GANTI INI!

function setup() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 1. DATABASE: REVENUE & PROJECTS (Dipersingkat untuk contoh, biarkan yang lama jika ada)
    let sheetRev = ss.getSheetByName('DB_Revenue') || ss.insertSheet('DB_Revenue');
    let sheetProj = ss.getSheetByName('DB_Projects') || ss.insertSheet('DB_Projects');
    
    // 2. DATABASE BARU: B2B PIPELINE (Data Asli dari Screenshot)
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

    // 3. DATABASE BARU: B2C CAMPAIGNS & CHANNELS
    let sheetCamp = ss.getSheetByName('DB_Campaigns') || ss.insertSheet('DB_Campaigns');
    sheetCamp.clear();
    sheetCamp.appendRow(['Campaign_Name', 'Status', 'Leads', 'Participants', 'Conversion_Pct']);
    sheetCamp.appendRow(['Opening Rush Loc Analytics', 'Completed', 150, 65, 43.3]);
    sheetCamp.appendRow(['Free Class Backgrounds', 'Active', 320, 110, 34.3]);
    sheetCamp.appendRow(['Business Expansion Testing', 'Planning', 0, 0, 0]);

    // 4. DATABASE BARU: SOCIAL MEDIA & COMMUNITY
    let sheetSoc = ss.getSheetByName('DB_Socials') || ss.insertSheet('DB_Socials');
    sheetSoc.clear();
    sheetSoc.appendRow(['Month', 'Week', 'Platform', 'Metric', 'Value']);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'Instagram', 'Followers', 6550]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'LinkedIn', 'Followers', 9673]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'YouTube', 'Subscribers', 1240]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'TikTok', 'Followers', 850]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'WA Community', 'Members', 1893]);
    sheetSoc.appendRow(['Jan 2026', 'Week 4', 'MAPID Apps', 'Registered Users', 1045]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'Instagram', 'Followers', 6800]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'LinkedIn', 'Followers', 10200]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'YouTube', 'Subscribers', 1300]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'TikTok', 'Followers', 900]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'WA Community', 'Members', 1950]);
    sheetSoc.appendRow(['Feb 2026', 'Week 1', 'MAPID Apps', 'Registered Users', 1040]);

    // 5. DATABASE BARU: TRENDS (Multi-timeframe)
    let sheetTrend = ss.getSheetByName('DB_Trends') || ss.insertSheet('DB_Trends');
    sheetTrend.clear();
    sheetTrend.appendRow(['Timeframe', 'Label', 'Revenue_M', 'DealSizeAvg_M']);
    sheetTrend.appendRow(['month', 'Nov 25', 140, 15]);
    sheetTrend.appendRow(['month', 'Dec 25', 110, 10]);
    sheetTrend.appendRow(['month', 'Jan 26', 180, 20]);
    sheetTrend.appendRow(['month', 'Feb 26', 195, 25]);
    sheetTrend.appendRow(['quarter', 'Q2 2025', 320, 14]);
    sheetTrend.appendRow(['quarter', 'Q3 2025', 410, 16]);
    sheetTrend.appendRow(['quarter', 'Q4 2025', 380, 12]);
    sheetTrend.appendRow(['quarter', 'Q1 2026', 180, 20]);
    sheetTrend.appendRow(['year', '2024', 1200, 12]);
    sheetTrend.appendRow(['year', '2025', 1550, 15]);
    sheetTrend.appendRow(['year', '2026 (YTD)', 180, 20]);

    // 6. DATABASE: GALLERY & DOCS (Knowledge Base)
    let sheetDocs = ss.getSheetByName('DB_Docs') || ss.insertSheet('DB_Docs');
    sheetDocs.clear();
    sheetDocs.appendRow(['Title', 'Category', 'Format', 'Link', 'Description']);
    sheetDocs.appendRow([
      'Business Status Report Q1', 
      'Report', 
      'PDF', 
      '#',
      'Bi-weekly status report containing key blockers and pipeline.'
    ]);
    sheetDocs.appendRow([
      'Enterprise Playbook Q1', 
      'Strategy', 
      'PDF', 
      '#', 
      'Scripts & handling objections for Hunter Team.'
    ]);
    sheetDocs.appendRow([
      'Pricing Calculator', 
      'Tools', 
      'Sheet', 
      '#', 
      'B2B project scope pricing logic.'
    ]);
    sheetDocs.appendRow([
      'Brand Assets 2026', 
      'Design', 
      'Folder', 
      '#', 
      'Logos, fonts, and presentation templates.'
    ]);

    // 7. DATABASE BARU: USER GROWTH ANALYSIS
    let sheetGrowth = ss.getSheetByName('DB_UserGrowth') || ss.insertSheet('DB_UserGrowth');
    sheetGrowth.clear();
    sheetGrowth.appendRow(['Month', 'Week', 'NewRegist', 'ActiveGeoUsers', 'ConversionRate']);
    sheetGrowth.appendRow(['Jan 2026', 'Week 1', 100, 50, 50]);
    sheetGrowth.appendRow(['Jan 2026', 'Week 2', 120, 60, 50]);
    sheetGrowth.appendRow(['Jan 2026', 'Week 3', 150, 80, 53.33]);
    sheetGrowth.appendRow(['Jan 2026', 'Week 4', 200, 120, 60]);
    sheetGrowth.appendRow(['Feb 2026', 'Week 1', 250, 160, 64]);
    sheetGrowth.appendRow(['Feb 2026', 'Week 2', 300, 200, 66.67]);

    Logger.log("✅ Setup Sukses!");
  } catch (error) { Logger.log("❌ Setup Error: " + error.message); }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const readSheet = (name) => {
      const sheet = ss.getSheetByName(name);
      return sheet ? sheet.getDataRange().getValues().slice(1) : [];
    };

    const trendsRaw = readSheet('DB_Trends');
    
    const payload = {
      revenue: readSheet('DB_Revenue').map(r => ({ subProduct: r[1], target: r[2], actual: r[3], achievement: r[4] })),
      projects: readSheet('DB_Projects').map(r => ({ name: r[0], phase: r[1], progress: r[2], issue: r[3] })),
      docs: readSheet('DB_Docs').map(r => ({ title: r[0], category: r[1], format: r[2], link: r[3], desc: r[4] })),
      
      // DATA BARU
      pipeline: readSheet('DB_Pipeline').map(r => ({ client: r[0], industry: r[1], stage: r[2], value: r[3], action: r[4], eta: r[5] })),
      campaigns: readSheet('DB_Campaigns').map(r => ({ name: r[0], status: r[1], leads: r[2], participants: r[3], conversion: r[4] })),
      socials: readSheet('DB_Socials').map(r => ({ month: r[0], week: r[1], platform: r[2], metric: r[3], value: r[4] })),
      userGrowth: readSheet('DB_UserGrowth').map(r => ({ month: r[0], week: r[1], newRegist: r[2], activeGeoUsers: r[3], conversion: r[4] })),
      
      // TRENDS DI-GROUP BERDASARKAN TIMEFRAME
      trends: {
        month: trendsRaw.filter(r => r[0] === 'month').map(r => ({ label: r[1], revenue: r[2], dealSize: r[3] })),
        quarter: trendsRaw.filter(r => r[0] === 'quarter').map(r => ({ label: r[1], revenue: r[2], dealSize: r[3] })),
        year: trendsRaw.filter(r => r[0] === 'year').map(r => ({ label: r[1], revenue: r[2], dealSize: r[3] }))
      }
    };
    
    var adminConfig = getAdminConfig();
    if (adminConfig) {
      payload.adminConfig = adminConfig;
    }
    
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ isError: true, error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    
    if (body.action === 'saveConfig') {
      saveAdminConfig(body.data);
      if (body.data && body.data.biData) {
        syncBiDataToSheets(body.data.biData);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Config & Sheets saved successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Simpan admin config ke sheet "AdminConfig"
 * Sheet ini hanya punya 2 cell: A1 = "config", A2 = JSON string
 */
function saveAdminConfig(configData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('AdminConfig');
  
  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet('AdminConfig');
    sheet.getRange('A1').setValue('config');
  }
  
  // Simpan config sebagai JSON string di A2
  var jsonString = JSON.stringify(configData);
  sheet.getRange('A2').setValue(jsonString);
}

/**
 * Baca admin config dari sheet "AdminConfig"
 * Returns: object config atau null jika belum ada
 */
function getAdminConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('AdminConfig');
  
  if (!sheet) return null;
  
  var jsonString = sheet.getRange('A2').getValue();
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

/**
 * Menyinkronkan dan menimpa langsung data di sheet DB_ berdasarkan biData dari Admin Panel
 */
function syncBiDataToSheets(biData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  function writeToSheet(sheetName, headers, dataRows) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    sheet.clear();
    var allRows = [headers].concat(dataRows);
    sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
  }

  if (biData.pipeline) {
    var pipelineRows = biData.pipeline.map(function(r) { return [r.client, r.industry, r.stage, r.value, r.action, r.eta]; });
    writeToSheet('DB_Pipeline', ['Client', 'Industry', 'Stage', 'Value_IDR', 'Action', 'ETA'], pipelineRows);
  }

  if (biData.campaigns) {
    var campaignRows = biData.campaigns.map(function(r) { return [r.name, r.status, r.leads, r.participants, r.conversion]; });
    writeToSheet('DB_Campaigns', ['Campaign_Name', 'Status', 'Leads', 'Participants', 'Conversion_Pct'], campaignRows);
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
    var trendRows = [];
    if (biData.trends.month) biData.trends.month.forEach(function(r) { trendRows.push(['month', r.label, r.revenue, r.dealSize]); });
    if (biData.trends.quarter) biData.trends.quarter.forEach(function(r) { trendRows.push(['quarter', r.label, r.revenue, r.dealSize]); });
    if (biData.trends.year) biData.trends.year.forEach(function(r) { trendRows.push(['year', r.label, r.revenue, r.dealSize]); });
    writeToSheet('DB_Trends', ['Timeframe', 'Label', 'Revenue_M', 'DealSizeAvg_M'], trendRows);
  }

  if (biData.revenue) {
    var revSheet = ss.getSheetByName('DB_Revenue');
    var existingRevMap = {};
    if (revSheet) {
      var revData = revSheet.getDataRange().getValues().slice(1);
      revData.forEach(function(r) {
        if (r[0] && r[1]) existingRevMap[r[1]] = r[0];
      });
    }
    var revenueRows = biData.revenue.map(function(r) { 
      return [existingRevMap[r.subProduct] || '-', r.subProduct, r.target, r.actual, r.achievement]; 
    });
    writeToSheet('DB_Revenue', ['Category', 'SubProduct', 'Target_Q1', 'Actual', 'Achievement_Pct'], revenueRows);
  }
}
