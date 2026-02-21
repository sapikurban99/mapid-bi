/**
 * ====================================================
 * MAPID BI Dashboard — Google Apps Script (Reference)
 * ====================================================
 * 
 * INSTRUKSI:
 * 1. Buka Google Apps Script project yang sudah ada
 * 2. TAMBAHKAN (jangan replace) function doPost() di bawah ke file Code.gs
 * 3. Tambahkan juga helper functions: saveAdminConfig() dan getAdminConfig()  
 * 4. Update function doGet() untuk include admin config di response
 * 5. Deploy sebagai NEW VERSION (wajib!)
 * 6. URL tetap sama, tidak perlu ganti .env.local
 * 
 * CATATAN: Jangan hapus doGet() yang sudah ada!
 * Hanya tambahkan kode di bawah ini.
 */

// ============================================
// TAMBAHKAN FUNCTION INI KE Code.gs
// ============================================

/**
 * Handle POST requests dari Admin Panel
 * Menyimpan admin config ke sheet "AdminConfig"
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    
    if (body.action === 'saveConfig') {
      saveAdminConfig(body.data);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Config saved successfully' }))
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

// ============================================
// UPDATE doGet() YANG SUDAH ADA
// ============================================
// Tambahkan baris ini di dalam doGet(), SEBELUM return:
//
//   // Include admin config in response
//   var adminConfig = getAdminConfig();
//   if (adminConfig) {
//     result.adminConfig = adminConfig;
//   }
//
// Sehingga response GET akan include field "adminConfig" jika ada
// ============================================
