const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ExcelJS = require('exceljs');

let mainWindow;
let portalWindow = null;
let dssWindow = null;

// SSL & Network Security Bypass Flags
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('disable-web-security');

const SND_URL = 'https://mayfair.sndpro.app:1132/Mayfair/Default.aspx';
const DSS_URL = 'https://mayfair.sndpro.app:1163/DSS/Presentation/Login.aspx';

// Production Safe Data Storage Path
const STORAGE_DIR = path.join(__dirname, 'app_storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const SHOP_MASTER_FILE = path.join(STORAGE_DIR, 'SHOP_MASTER_DATA.json');
const TARGET_MASTER_FILE = path.join(STORAGE_DIR, 'MONTHLY_TARGETS.json');
const CRED_FILE = path.join(STORAGE_DIR, 'APP_CREDENTIALS.json');
const HISTORY_FILE = path.join(STORAGE_DIR, 'DAILY_SALES_HISTORY.json');
const BOOKING_EXE_FILE = path.join(STORAGE_DIR, 'BOOKING_EXECUTION_DATA.json');
const DSR_DIV_TARGET_FILE = path.join(STORAGE_DIR, 'DSR_DIVISION_TARGETS.json');
const LIVE_CACHE_FILE = path.join(STORAGE_DIR, 'LIVE_SALES_CACHE.json');

// Stock Module Specific Storage
const STOCK_BALANCE_FILE = path.join(STORAGE_DIR, 'STOCK_CURRENT_BALANCE.json');
const DISPATCH_DATA_FILE = path.join(STORAGE_DIR, 'TODAY_DISPATCH_DATA.json');
const MAPPING_CONFIG_FILE = path.join(STORAGE_DIR, 'STOCK_MAPPING_CONFIG.json');
const HIDDEN_SKU_FILE = path.join(STORAGE_DIR, 'HIDDEN_SKU_CONFIG.json');

// -------------------------------------------------------------
// GITHUB AUTO-SYNC / AUTO-UPDATE ENGINE
// -------------------------------------------------------------
function syncWithGitHub() {
  try {
    console.log("Checking for GitHub updates...");
    // Check if git is initialized in current directory
    if (fs.existsSync(path.join(__dirname, '.git'))) {
      execSync('git pull origin main', {
        cwd: __dirname,
        stdio: 'inherit',
        timeout: 10000
      });
      console.log("App code is fully up to date with GitHub!");
    } else {
      console.log("Git repository not initialized in this directory. Skipping sync.");
    }
  } catch (err) {
    console.log("GitHub sync skipped or offline:", err.message);
  }
}

// Helper: Wait until file is unlocked
async function waitForFileUnlock(filePath, maxRetries = 25, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          const fd = fs.openSync(filePath, 'r');
          fs.closeSync(fd);
          return true;
        }
      }
    } catch (err) {}
    await new Promise(res => setTimeout(res, delayMs));
  }
  return fs.existsSync(filePath);
}

// -------------------------------------------------------------
// DAILY SALES HISTORY HANDLERS
// -------------------------------------------------------------
ipcMain.handle('save-daily-sales-history', async (event, { dateKey, records }) => {
  try {
    let history = {};
    if (fs.existsSync(HISTORY_FILE)) {
      try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (e) { history = {}; }
    }
    history[dateKey] = records;
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    return { success: true, message: `Report saved successfully for ${dateKey}!` };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-daily-sales-history', async () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return { success: true, history: JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) };
    }
    return { success: true, history: {} };
  } catch (err) {
    return { success: false, history: {}, error: err.message };
  }
});

// Credentials Storage Engine
function getSavedCredentials() {
  const defaultCreds = {
    snd: { distributor: '102336', username: 'kpo', password: 'kpo321' },
    dss: { username: 'asmkhib', password: '' }
  };
  if (fs.existsSync(CRED_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8'));
      return {
        snd: parsed.snd || defaultCreds.snd,
        dss: parsed.dss || defaultCreds.dss
      };
    } catch (e) {
      return defaultCreds;
    }
  }
  return defaultCreds;
}

ipcMain.handle('get-all-credentials', async () => {
  return { success: true, credentials: getSavedCredentials() };
});

ipcMain.handle('save-all-credentials', async (event, newCreds) => {
  try {
    fs.writeFileSync(CRED_FILE, JSON.stringify(newCreds, null, 2), 'utf8');
    return { success: true, message: 'Credentials saved successfully!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Image to Clipboard
ipcMain.handle('copy-image-to-clipboard', async (event, dataUrl) => {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      throw new Error('Invalid image data URL');
    }
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
    return { success: true, message: 'Image copied to clipboard!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    title: 'Multi Tracking System Powered by Danish Rais',
    backgroundColor: '#070d18',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  // 1. Check for GitHub updates automatically
  syncWithGitHub();

  // 2. Start main UI and Watchers
  createMainWindow();
  startFolderWatchers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function sendWindowStatus(targetWin, msg, badge, color, showProgress, percent) {
  if (targetWin && !targetWin.isDestroyed()) {
    const js = `
      (function() {
        let bar = document.getElementById('__app_floating_status_bar__');
        if (!bar) {
          bar = document.createElement('div');
          bar.id = '__app_floating_status_bar__';
          bar.style.cssText = \`
            position: fixed;
            top: 10px;
            right: 15px;
            z-index: 9999999;
            background: rgba(7, 13, 24, 0.95);
            color: #ffffff;
            border: 1.5px solid #0284c7;
            border-radius: 8px;
            padding: 8px 14px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 280px;
            pointer-events: auto;
          \`;

          bar.innerHTML = \`
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span id="__app_badge__" style="padding:2px 7px; border-radius:4px; font-weight:800; font-size:10.5px; text-transform:uppercase;"></span>
                <span id="__app_msg__" style="font-weight:600; font-size:11.5px; color:#f8fafc;"></span>
              </div>
              <span onclick="this.parentElement.parentElement.style.display='none'" style="cursor:pointer; color:#94a3b8; font-weight:bold; font-size:13px; margin-left:8px;">✕</span>
            </div>
            <div id="__app_prog_box__" style="width:100%; height:5px; background:#1e293b; border-radius:3px; overflow:hidden; display:none;">
              <div id="__app_prog_fill__" style="height:100%; width:0%; transition:width 0.2s; background:#38bdf8;"></div>
            </div>
          \`;
          document.body.appendChild(bar);
        }

        bar.style.display = 'flex';
        const badgeEl = document.getElementById('__app_badge__');
        const msgEl = document.getElementById('__app_msg__');
        const progBox = document.getElementById('__app_prog_box__');
        const progFill = document.getElementById('__app_prog_fill__');

        if (badgeEl) {
          badgeEl.innerText = ${JSON.stringify(badge)};
          badgeEl.style.background = ${JSON.stringify(color)};
          badgeEl.style.color = '#ffffff';
        }
        if (msgEl) msgEl.innerText = ${JSON.stringify(msg)};

        if (progBox && progFill) {
          if (${showProgress}) {
            progBox.style.display = 'block';
            progFill.style.width = (${percent} || 0) + '%';
            progFill.style.background = ${JSON.stringify(color)};
          } else {
            progBox.style.display = 'none';
          }
        }
      })();
    `;
    targetWin.webContents.executeJavaScript(js).catch(() => {});
  }
}

function cleanDSRName(rawName) {
  let cleaned = (rawName || '').toString().trim();
  if (!cleaned) return '';
  const dashPos = cleaned.indexOf('-');
  if (dashPos > -1 && dashPos < cleaned.length - 1) cleaned = cleaned.substring(dashPos + 1).trim();
  const mergePos = cleaned.toUpperCase().indexOf('-MERGE');
  if (mergePos > -1) cleaned = cleaned.substring(0, mergePos).trim();
  const parenPos = cleaned.indexOf('(');
  if (parenPos > -1) cleaned = cleaned.substring(0, parenPos).trim();
  if (cleaned.endsWith('-')) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
  return cleaned;
}

function getBaseSKUKey(sku) {
  let s = (sku || '').toString();
  s = s.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  s = s.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  return s;
}

function normalizeDisplaySKU(sku) {
  return (sku || '').toString().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// -------------------------------------------------------------
// STOCK REPORT & DISPATCH ENGINE
// -------------------------------------------------------------
async function parseStockBalanceReport(filePath) {
  await waitForFileUnlock(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const sheet = workbook.getWorksheet('Stock_Data') || workbook.worksheets[0];
  if (!sheet) throw new Error("Stock sheet nahi mili!");

  const stockRows = [];
  let colBrand = 8, colSku = 9, colDesc = 10, colCtn = 11, colBox = 12;

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const val = (cell.value || '').toString().trim().toLowerCase();
    if (val.includes('brand')) colBrand = colNumber;
    if (val.includes('sku code') || val === 'sku') colSku = colNumber;
    if (val.includes('product') || val.includes('description') || val.includes('item')) colDesc = colNumber;
    if (val.includes('ctn') || val.includes('carton')) colCtn = colNumber;
    if (val.includes('box')) colBox = colNumber;
  });

  let currentBrand = "OTHER BRANDS";
  const totalRows = sheet.rowCount;

  for (let r = 2; r <= totalRows; r++) {
    const row = sheet.getRow(r);
    const skuCode = (row.getCell(colSku).value || '').toString().trim();
    const bCell = (row.getCell(colBrand).value || '').toString().trim();
    const prodName = (row.getCell(colDesc).value || '').toString().trim();

    if (bCell && !bCell.toUpperCase().includes('TOTAL')) {
      currentBrand = bCell;
    }

    if (currentBrand.toUpperCase() === "OTHER BRANDS") {
      if (prodName.toUpperCase().includes("CHASKA")) currentBrand = "CHASKA";
      else if (prodName.toUpperCase().includes("MILKO")) currentBrand = "MILKO";
    }

    if (skuCode && !skuCode.toUpperCase().includes('TOTAL')) {
      const rawCtn = row.getCell(colCtn).value;
      const rawBox = row.getCell(colBox).value;
      const ctnVal = typeof rawCtn === 'number' ? rawCtn : (parseFloat(rawCtn) || 0);
      const boxVal = typeof rawBox === 'number' ? rawBox : (parseFloat(rawBox) || 0);

      stockRows.push({
        brand: currentBrand,
        sku: skuCode,
        name: prodName,
        ctn: ctnVal,
        box: boxVal
      });
    }
  }

  fs.writeFileSync(STOCK_BALANCE_FILE, JSON.stringify(stockRows, null, 2), 'utf8');
  return { success: true, count: stockRows.length, fileName: path.basename(filePath), data: stockRows };
}

// -------------------------------------------------------------
// STRICT TODAY DISPATCH PARSER (ONLY KHI – REHMAN ENT-BR2 / 102336)
// -------------------------------------------------------------
async function parseDispatchReport(filePath) {
  await waitForFileUnlock(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const sheet = workbook.getWorksheet('TODAY_DISPATCH') || workbook.worksheets[0];
  if (!sheet) throw new Error("Dispatch sheet nahi mili!");

  const dispatchRows = [];
  const totalRows = sheet.rowCount;

  for (let r = 2; r <= totalRows; r++) {
    const row = sheet.getRow(r);
    
    // Column C (3): Distributor Code
    const distCode = (row.getCell(3).value || '').toString().trim();

    // Column D (4): Distributor Name
    const rawDistName = (row.getCell(4).value || '').toString().trim();

    // Normalize en-dash to hyphen and uppercase
    const cleanDistName = rawDistName.replace(/\u2013|\u2014/g, '-').replace(/\s+/g, ' ').toUpperCase();

    // STRICT MATCH: Only KHI - REHMAN ENT-BR2 (Code 102336)
    const isTargetBR2 = 
      distCode === "102336" || 
      cleanDistName === "KHI - REHMAN ENT-BR2" || 
      (cleanDistName.includes("REHMAN ENT") && (cleanDistName.includes("BR2") || cleanDistName.includes("BR-2")));

    if (isTargetBR2) {
      // Column J (10): Material Code
      let matCode = (row.getCell(10).value || '').toString().trim();

      // Column K (11): Product Name
      const prodName = (row.getCell(11).value || '').toString().trim();

      // Column I (9): Quantity in Cartons
      const rawQty = row.getCell(9).value;
      const qtyVal = typeof rawQty === 'number' ? rawQty : (parseFloat(rawQty) || 0);

      // Clean material code decimals/formulas if any
      if (matCode.includes('.')) matCode = matCode.split('.')[0];
      matCode = matCode.replace(/[^0-9]/g, '');

      if (matCode && qtyVal > 0) {
        dispatchRows.push({
          materialCode: matCode,
          productName: prodName,
          qty: qtyVal
        });
      }
    }
  }

  fs.writeFileSync(DISPATCH_DATA_FILE, JSON.stringify(dispatchRows, null, 2), 'utf8');
  return { 
    success: true, 
    count: dispatchRows.length, 
    fileName: path.basename(filePath), 
    data: dispatchRows,
    message: `${dispatchRows.length} Dispatch items loaded strictly for KHI – REHMAN ENT-BR2!`
  };
}

ipcMain.handle('upload-stock-balance-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'MF SKU And Div Wise Stock Current Balance Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };
    const res = await parseStockBalanceReport(filePaths[0]);
    return { success: true, message: `Stock Balance Loaded! (${res.count} Items)`, data: res.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('upload-total-dispatch-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Total Dispatch / TODAY_DISPATCH Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };
    const res = await parseDispatchReport(filePaths[0]);
    return { success: true, message: res.message || `Dispatch Data Loaded! (${res.count} Entries)`, data: res.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-stock-report-data', async () => {
  try {
    const stock = fs.existsSync(STOCK_BALANCE_FILE) ? JSON.parse(fs.readFileSync(STOCK_BALANCE_FILE, 'utf8')) : [];
    const dispatch = fs.existsSync(DISPATCH_DATA_FILE) ? JSON.parse(fs.readFileSync(DISPATCH_DATA_FILE, 'utf8')) : [];
    const mapping = fs.existsSync(MAPPING_CONFIG_FILE) ? JSON.parse(fs.readFileSync(MAPPING_CONFIG_FILE, 'utf8')) : {};
    const hidden = fs.existsSync(HIDDEN_SKU_FILE) ? JSON.parse(fs.readFileSync(HIDDEN_SKU_FILE, 'utf8')) : {};

    return {
      success: true,
      stockData: stock,
      dispatchData: dispatch,
      mappingConfig: mapping,
      hiddenConfig: hidden
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-stock-mapping-config', async (event, newMapping) => {
  try {
    fs.writeFileSync(MAPPING_CONFIG_FILE, JSON.stringify(newMapping, null, 2), 'utf8');
    return { success: true, message: 'Mapping successfully save ho gayi!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('save-hidden-sku-config', async (event, newHidden) => {
  try {
    fs.writeFileSync(HIDDEN_SKU_FILE, JSON.stringify(newHidden, null, 2), 'utf8');
    return { success: true, message: 'Hidden SKU settings save ho gayi!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// -------------------------------------------------------------
// SALES DUMP PARSER ENGINE
// -------------------------------------------------------------
async function parseGenericSalesDump(filePath) {
  await waitForFileUnlock(filePath);
  return new Promise((resolve, reject) => {
    try {
      const options = { entries: "emit", sharedStrings: "cache", hyperlinks: "ignore", worksheets: "emit" };
      const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, options);
      
      let colDSR = -1, colBrand = -1, colSKU = -1, colPOP = -1, colDate = -1, colQty = -1, colNet = -1, colPopName = -1, colSection = -1;
      const deliveredRecords = [];
      const allDumpPOPsByDSR = new Map();
      const dateCounts = new Map();
      let isFirstSheet = true;

      workbookReader.on('worksheet', (worksheetReader) => {
        if (!isFirstSheet && !worksheetReader.name.toLowerCase().includes('dump')) {
          worksheetReader.destroy();
          return;
        }
        isFirstSheet = false;

        worksheetReader.on('row', (row) => {
          const rowNumber = row.number;
          const values = row.values;

          if (rowNumber === 1) {
            for (let c = 1; c < values.length; c++) {
              const val = (values[c] || '').toString().trim().toLowerCase();
              if (val === 'dsr name' || val === 'dsr') colDSR = c;
              if (val === 'brand') colBrand = c;
              if (val === 'sku description' || val === 'sku') colSKU = c;
              if (val === 'pop') colPOP = c;
              if (val === 'pop name') colPopName = c;
              if (val === 'section name') colSection = c;
              if (val === 'fulldate' || val === 'date') colDate = c;
              if (val === 'delivered qty1' || val === 'qty1' || val === 'ctn') colQty = c;
              if (val === 'net sale' || val === 'netsale') colNet = c;
            }

            if (colDSR === -1) colDSR = 8;
            if (colBrand === -1) colBrand = 9;
            if (colSKU === -1) colSKU = 11;
            if (colPOP === -1) colPOP = 13;
            if (colPopName === -1) colPopName = 14;
            if (colSection === -1) colSection = 15;
            if (colDate === -1) colDate = 18;
            if (colQty === -1) colQty = 19;
            if (colNet === -1) colNet = 25;
            return;
          }

          const rawQty = values[colQty];
          const qtyVal = typeof rawQty === 'number' ? rawQty : (parseFloat(rawQty) || 0);
          const rawDsr = values[colDSR] ? String(values[colDSR]).trim() : '';
          const popVal = values[colPOP] ? String(values[colPOP]).trim() : '';

          if (rawDsr && popVal) {
            const dsrName = cleanDSRName(rawDsr);
            if (!allDumpPOPsByDSR.has(dsrName)) allDumpPOPsByDSR.set(dsrName, new Set());
            allDumpPOPsByDSR.get(dsrName).add(popVal);

            if (qtyVal > 0) {
              const brandVal = values[colBrand] ? String(values[colBrand]).trim() : '';
              const skuVal = normalizeDisplaySKU(values[colSKU]);
              const popNameVal = values[colPopName] ? String(values[colPopName]).trim() : '';
              const sectionVal = values[colSection] ? String(values[colSection]).trim() : '';

              let dateVal = '';
              const rawDate = values[colDate];
              if (rawDate instanceof Date) {
                dateVal = rawDate.toISOString().split('T')[0];
              } else if (rawDate) {
                dateVal = String(rawDate).split(' ')[0].trim();
              }

              if (dateVal) dateCounts.set(dateVal, (dateCounts.get(dateVal) || 0) + 1);

              deliveredRecords.push({
                dsr: dsrName,
                rawDsr: rawDsr,
                brand: brandVal,
                sku: skuVal,
                pop: popVal,
                popName: popNameVal,
                section: sectionVal,
                date: dateVal,
                qty: qtyVal,
                net: typeof values[colNet] === 'number' ? values[colNet] : (parseFloat(values[colNet]) || 0)
              });
            }
          }
        });
      });

      workbookReader.on('end', () => {
        const dsrUniverse = {};
        allDumpPOPsByDSR.forEach((setObj, k) => { dsrUniverse[k] = setObj.size; });

        let identifiedType = 'CM';
        const allDates = Array.from(dateCounts.keys()).sort();
        if (allDates.length > 0) {
          const sampleDate = new Date(allDates[Math.floor(allDates.length / 2)]);
          const currentNow = new Date();
          if (!isNaN(sampleDate.getTime())) {
            const isCurrentMonth =
              sampleDate.getFullYear() === currentNow.getFullYear() &&
              sampleDate.getMonth() === currentNow.getMonth();
            identifiedType = isCurrentMonth ? 'CM' : 'LM';
          }
        }

        resolve({ deliveredRecords, dsrUniverse, identifiedType, allDates, fileName: path.basename(filePath) });
      });

      workbookReader.on('error', (err) => reject(err));
      workbookReader.read();
    } catch (e) {
      reject(e);
    }
  });
}

async function processAndSaveDumpDirectly(filePath, targetWindow = null) {
  try {
    sendWindowStatus(targetWindow || dssWindow, 'Identifying Dump dates...', 'Processing', '#f59e0b', true, 60);
    const parsed = await parseGenericSalesDump(filePath);
    const saveFileName = parsed.identifiedType === 'LM' ? 'LM_SALES_DUMP.json' : 'CM_SALES_DUMP.json';
    const savePath = path.join(STORAGE_DIR, saveFileName);

    fs.writeFileSync(savePath, JSON.stringify(parsed, null, 2), 'utf8');

    sendWindowStatus(targetWindow || dssWindow, `${parsed.identifiedType} Dump Updated! (${parsed.deliveredRecords.length} Rows)`, 'Success', '#10b981', false, 100);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('dump-auto-updated', {
        dumpType: parsed.identifiedType,
        totalRecords: parsed.deliveredRecords.length,
        fileName: parsed.fileName
      });
    }
    return { success: true, dumpType: parsed.identifiedType, count: parsed.deliveredRecords.length };
  } catch (err) {
    sendWindowStatus(targetWindow || dssWindow, `Error: ${err.message}`, 'Failed', '#ef4444', false, 0);
    return { success: false, error: err.message };
  }
}

ipcMain.handle('upload-sales-dump-tagged', async (event, dumpType) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: `${dumpType === 'LM' ? 'Last Month (LM)' : 'Current Month (CM)'} Sales Dump Select Karein`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel kar diya gaya.' };

    const parsed = await parseGenericSalesDump(filePaths[0]);
    const saveFileName = dumpType === 'LM' ? 'LM_SALES_DUMP.json' : 'CM_SALES_DUMP.json';
    const savePath = path.join(STORAGE_DIR, saveFileName);

    fs.writeFileSync(savePath, JSON.stringify(parsed, null, 2), 'utf8');

    return {
      success: true,
      dumpType: dumpType,
      fileName: parsed.fileName,
      totalProductive: parsed.deliveredRecords.length,
      message: `${dumpType} Sales Dump save ho gaya! (${parsed.deliveredRecords.length} Delivered Rows)`
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-both-sales-dumps', async () => {
  try {
    const lmPath = path.join(STORAGE_DIR, 'LM_SALES_DUMP.json');
    const cmPath = path.join(STORAGE_DIR, 'CM_SALES_DUMP.json');
    const lmData = fs.existsSync(lmPath) ? JSON.parse(fs.readFileSync(lmPath, 'utf8')) : null;
    const cmData = fs.existsSync(cmPath) ? JSON.parse(fs.readFileSync(cmPath, 'utf8')) : null;
    return { success: true, lmData, cmData };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------
// PORTAL INTEGRATIONS & AUTOMATION
// -------------------------------------------------------------
ipcMain.handle('launch-dss-portal', async () => {
  try {
    if (dssWindow && !dssWindow.isDestroyed()) {
      dssWindow.show();
      dssWindow.focus();
      return { success: true };
    }
    const creds = getSavedCredentials().dss;
    dssWindow = new BrowserWindow({
      width: 1300,
      height: 880,
      show: true,
      title: 'DSS -- Decision Support System (Centegy)',
      webPreferences: { nodeIntegration: false, contextIsolation: false, webSecurity: false }
    });

    dssWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    dssWindow.webContents.session.setCertificateVerifyProc((req, cb) => cb(0));

    dssWindow.webContents.on('did-finish-load', () => {
      const autoFillScript = `
        (function() {
          const uInput = document.querySelector('input[name*="User"], input[id*="User"], input[placeholder*="User"]') || document.querySelectorAll('input[type="text"]')[0];
          const pInput = document.querySelector('input[type="password"]');
          if (uInput && !uInput.value) uInput.value = ${JSON.stringify(creds.username)};
          if (pInput && !pInput.value) pInput.value = ${JSON.stringify(creds.password)};
        })();
      `;
      dssWindow.webContents.executeJavaScript(autoFillScript).catch(() => {});
      sendWindowStatus(dssWindow, 'DSS Portal Connected', 'Ready', '#10b981', false, 100);
    });

    dssWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url && (url.toLowerCase().includes('.xlsx') || url.toLowerCase().includes('dump') || url.toLowerCase().includes('export'))) {
        dssWindow.webContents.downloadURL(url);
      }
      return { action: 'deny' };
    });

    dssWindow.webContents.session.on('will-download', (event, item) => {
      const origFileName = item.getFilename();
      const ext = path.extname(origFileName) || '.xlsx';
      const baseName = path.basename(origFileName, ext);
      const safeFileName = `${baseName}_${Date.now()}${ext}`;
      const savePath = path.join(STORAGE_DIR, safeFileName);
      item.setSavePath(savePath);

      sendWindowStatus(dssWindow, `Downloading Sales Dump...`, 'Downloading', '#38bdf8', true, 30);
      item.on('updated', (ev, state) => {
        if (state === 'progressing') {
          const total = item.getTotalBytes();
          const received = item.getReceivedBytes();
          const pct = total > 0 ? Math.round((received / total) * 100) : 60;
          sendWindowStatus(dssWindow, `Downloading (${pct}%)...`, 'Downloading', '#38bdf8', true, pct);
        }
      });

      item.once('done', async (ev, state) => {
        if (state === 'completed') {
          sendWindowStatus(dssWindow, 'Identifying Month & Processing...', 'Parsing', '#f59e0b', true, 85);
          setTimeout(async () => {
            await processAndSaveDumpDirectly(savePath, dssWindow);
          }, 1000);
        } else {
          sendWindowStatus(dssWindow, 'Download Failed', 'Failed', '#ef4444', false, 0);
        }
      });
    });

    dssWindow.loadURL(DSS_URL);
    dssWindow.on('closed', () => { dssWindow = null; });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('launch-snd-portal', async () => {
  try {
    if (portalWindow && !portalWindow.isDestroyed()) {
      portalWindow.show();
      portalWindow.focus();
      return { success: true };
    }

    const creds = getSavedCredentials().snd;
    portalWindow = new BrowserWindow({
      width: 1280,
      height: 850,
      show: true,
      title: 'SnD Pro Enterprise Portal',
      webPreferences: { nodeIntegration: false, contextIsolation: false, webSecurity: false }
    });

    portalWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0');
    portalWindow.webContents.session.setCertificateVerifyProc((req, cb) => cb(0));

    portalWindow.webContents.on('did-finish-load', () => {
      const initScript = `
        (function() {
          const distInput = document.querySelector('input[name*="Distributor"], input[id*="Distributor"]') || document.querySelectorAll('input[type="text"]')[0];
          const userInput = document.querySelector('input[name*="User"], input[id*="User"]') || document.querySelectorAll('input[type="text"]')[1];
          const passInput = document.querySelector('input[type="password"]');
          if (distInput && !distInput.value) distInput.value = ${JSON.stringify(creds.distributor)};
          if (userInput && !userInput.value) userInput.value = ${JSON.stringify(creds.username)};
          if (passInput && !passInput.value) passInput.value = ${JSON.stringify(creds.password)};
        })();
      `;
      portalWindow.webContents.executeJavaScript(initScript).catch(() => {});
      sendWindowStatus(portalWindow, 'SnD Portal Ready', 'Connected', '#10b981', false, 100);
    });

    portalWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url && (url.toLowerCase().includes('.xlsx') || url.toLowerCase().includes('export') || url.toLowerCase().includes('report'))) {
        portalWindow.webContents.downloadURL(url);
      }
      return { action: 'deny' };
    });

    portalWindow.webContents.session.on('will-download', (event, item) => {
      const origFileName = item.getFilename();
      const ext = path.extname(origFileName) || '.xlsx';
      const baseName = path.basename(origFileName, ext);
      const safeFileName = `${baseName}_${Date.now()}${ext}`;
      const savePath = path.join(STORAGE_DIR, safeFileName);
      item.setSavePath(savePath);

      sendWindowStatus(portalWindow, `Downloading Report...`, 'Downloading', '#38bdf8', true, 20);
      item.on('updated', (ev, state) => {
        if (state === 'progressing') {
          const total = item.getTotalBytes();
          const received = item.getReceivedBytes();
          const pct = total > 0 ? Math.round((received / total) * 100) : 60;
          sendWindowStatus(portalWindow, `Downloading (${pct}%)`, 'Downloading', '#38bdf8', true, pct);
        }
      });

      item.once('done', async (ev, state) => {
        if (state === 'completed') {
          setTimeout(async () => {
            if (origFileName.includes('Stock Current Balance') || origFileName.includes('Stock') || origFileName.includes('Current Balance')) {
              sendWindowStatus(portalWindow, 'Processing Current Stock Balance...', 'Parsing', '#f59e0b', true, 80);
              try {
                await parseStockBalanceReport(savePath);
                sendWindowStatus(portalWindow, 'Stock Balance Synced!', 'Success', '#10b981', false, 100);
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('stock-balance-updated');
              } catch(e) {
                sendWindowStatus(portalWindow, `Stock Error: ${e.message}`, 'Failed', '#ef4444', false, 0);
              }
            } else if (origFileName.includes('Order Booking') || origFileName.includes('Execution') || origFileName.includes('EXE')) {
              sendWindowStatus(portalWindow, 'Processing Booking vs Execution...', 'Parsing', '#f59e0b', true, 80);
              try {
                await parseBookingExecutionReport(savePath);
                sendWindowStatus(portalWindow, 'Booking vs Execution Updated!', 'Success', '#10b981', false, 100);
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('booking-execution-updated');
              } catch (e) {
                sendWindowStatus(portalWindow, `Parse Error: ${e.message}`, 'Failed', '#ef4444', false, 0);
              }
            } else {
              sendWindowStatus(portalWindow, 'Merging Sales Data...', 'Processing', '#f59e0b', true, 85);
              await triggerAutoMerge(savePath);
            }
          }, 1200);
        } else {
          sendWindowStatus(portalWindow, 'Download Failed', 'Failed', '#ef4444', false, 0);
        }
      });
    });

    portalWindow.loadURL(SND_URL);
    portalWindow.on('closed', () => { portalWindow = null; });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Watcher Engine
let lastProcessedTime = 0;
function startFolderWatchers() {
  const dirs = [STORAGE_DIR, path.join(app.getPath('home'), 'Downloads')];
  dirs.forEach(watchDir => {
    if (!fs.existsSync(watchDir)) return;
    try {
      fs.watch(watchDir, async (eventType, filename) => {
        if (!filename) return;
        if (filename.endsWith('.xlsx') && !filename.startsWith('~$') && !filename.includes('Target VS')) {
          const now = Date.now();
          if (now - lastProcessedTime < 2500) return;
          lastProcessedTime = now;
          const fullPath = path.join(watchDir, filename);

          if (filename.includes('Stock Current Balance') || filename.includes('Stock_Data')) {
            sendWindowStatus(portalWindow, `Parsing: ${filename}`, 'Processing', '#f59e0b', true, 75);
            setTimeout(async () => {
              try {
                await parseStockBalanceReport(fullPath);
                sendWindowStatus(portalWindow, 'Stock Data Synced!', 'Success', '#10b981', false, 100);
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('stock-balance-updated');
              } catch(e) {}
            }, 1200);
          } else if (filename.includes('TODAY_DISPATCH') || filename.includes('Total Dispatch')) {
            setTimeout(async () => {
              try {
                await parseDispatchReport(fullPath);
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('dispatch-data-updated');
              } catch(e) {}
            }, 1200);
          } else if (filename.includes('Sales Dump') || filename.includes('Dump')) {
            setTimeout(async () => { await processAndSaveDumpDirectly(fullPath); }, 1000);
          } else if (filename.includes('Order Booking') || filename.includes('Execution') || filename.includes('EXE')) {
            sendWindowStatus(portalWindow, `Parsing: ${filename}`, 'Processing', '#f59e0b', true, 75);
            setTimeout(async () => {
              try {
                await parseBookingExecutionReport(fullPath);
                sendWindowStatus(portalWindow, 'Booking vs Execution Synced!', 'Success', '#10b981', false, 100);
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('booking-execution-updated');
              } catch (e) {}
            }, 1200);
          } else if (filename.includes('MF DSR Wise') || filename.includes('Sales')) {
            sendWindowStatus(portalWindow, `Downloaded: ${filename}`, 'Processing', '#f59e0b', true, 85);
            setTimeout(async () => { await triggerAutoMerge(fullPath); }, 1500);
          }
        }
      });
    } catch (e) { console.error("Watch error:", e); }
  });
}

// -------------------------------------------------------------
// BOOKING VS EXECUTION PARSER
// -------------------------------------------------------------
async function parseBookingExecutionReport(filePath) {
  const isUnlocked = await waitForFileUnlock(filePath, 15, 500);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = workbook.getWorksheet('EXE') || workbook.worksheets[0];
  if (!sheet) throw new Error('Booking/Execution sheet nahi mili!');

  const row2 = sheet.getRow(2);
  let maxDate1 = null, maxDate2 = null, maxCol1 = -1, maxCol2 = -1;

  row2.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber >= 28) {
      let val = cell.value;
      let d = null;
      if (val instanceof Date) d = val;
      else if (val) {
        const parsedD = new Date(val);
        if (!isNaN(parsedD.getTime())) d = parsedD;
      }
      if (d) {
        const curDtTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (!maxDate1 || curDtTime > maxDate1.getTime()) {
          maxDate2 = maxDate1; maxCol2 = maxCol1;
          maxDate1 = new Date(curDtTime); maxCol1 = colNumber;
        } else if (!maxDate2 || (curDtTime > maxDate2.getTime() && curDtTime < maxDate1.getTime())) {
          maxDate2 = new Date(curDtTime); maxCol2 = colNumber;
        }
      }
    }
  });

  const executionMap = {};
  const totalRows = sheet.rowCount;

  for (let r = 4; r <= totalRows; r++) {
    const row = sheet.getRow(r);
    const rawDsr = (row.getCell(22).value || '').toString().trim();
    if (!rawDsr) continue;

    let todayBooking = 0, yesterdayExe = 0, yesterdayRtg = 0;
    if (maxCol1 > 0) {
      const bkgVal = row.getCell(maxCol1).value;
      todayBooking = typeof bkgVal === 'number' ? bkgVal : (parseFloat(bkgVal) || 0);
    }
    if (maxCol2 > 0) {
      const ordVal = row.getCell(maxCol2).value;
      const delVal = row.getCell(maxCol2 + 1).value;
      const ordQty = typeof ordVal === 'number' ? ordVal : (parseFloat(ordVal) || 0);
      const delQty = typeof delVal === 'number' ? delVal : (parseFloat(delVal) || 0);
      yesterdayExe = ordQty;
      yesterdayRtg = Math.max(0, ordQty - delQty);
    }

    executionMap[rawDsr] = { todayBooking, yesterdayExe, yesterdayRtg };
  }

  fs.writeFileSync(BOOKING_EXE_FILE, JSON.stringify(executionMap, null, 2), 'utf8');
  return { success: true, count: Object.keys(executionMap).length, data: executionMap };
}

ipcMain.handle('upload-booking-execution-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'MF - Order Booking Vs Execution Report (New) Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };
    const res = await parseBookingExecutionReport(filePaths[0]);
    return { success: true, message: `Booking vs Execution Processed! (${res.count} DSRs)`, data: res.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-booking-vs-execution-data', async () => {
  try {
    if (fs.existsSync(BOOKING_EXE_FILE)) {
      return { success: true, data: JSON.parse(fs.readFileSync(BOOKING_EXE_FILE, 'utf8')) };
    }
    return { success: true, data: {} };
  } catch (err) {
    return { success: false, data: {}, error: err.message };
  }
});

// -------------------------------------------------------------
// DSR DIVISION TARGETS ENGINE & MISSING TEMPLATE HANDLER
// -------------------------------------------------------------
ipcMain.handle('download-dsr-target-template', async () => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'DSR Target Template Save Karein',
      defaultPath: 'DSR_Target_Template.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });
    if (canceled || !filePath) return { success: false, message: 'Cancelled' };

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('DSR_Targets');
    sheet.addRow(['DSR Name', 'Total Shops', 'BAKERY', 'BISCUITS', 'CONFECTIONERY']);
    sheet.addRow(['SAMPLE DSR 1', 250, 100, 150, 200]);

    await workbook.xlsx.writeFile(filePath);
    return { success: true, message: 'Template successfully download ho gaya!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-saved-dsr-targets', async () => {
  try {
    if (fs.existsSync(DSR_DIV_TARGET_FILE)) {
      return { success: true, targets: JSON.parse(fs.readFileSync(DSR_DIV_TARGET_FILE, 'utf8')) };
    }
    return { success: true, targets: {} };
  } catch (err) {
    return { success: false, targets: {}, error: err.message };
  }
});

ipcMain.handle('upload-dsr-target-template', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Filled DSR Target Template Excel',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };

    await waitForFileUnlock(filePaths[0]);
    const fileBuffer = fs.readFileSync(filePaths[0]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.getWorksheet('DSR_Targets') || workbook.worksheets[0];
    if (!sheet) return { success: false, message: 'Sheet nahi mili!' };

    const targetsMap = {};
    let matchedCount = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const dsrName = (row.getCell(1).value || '').toString().trim();
      if (!dsrName) return;

      const totalShops = parseFloat(row.getCell(2).value) || 0;
      const bakTgt = parseFloat(row.getCell(3).value) || 0;
      const bisTgt = parseFloat(row.getCell(4).value) || 0;
      const confTgt = parseFloat(row.getCell(5).value) || 0;

      targetsMap[dsrName] = {
        totalShops, bakTgt, bisTgt, confTgt,
        totalTgt: bakTgt + bisTgt + confTgt
      };
      matchedCount++;
    });

    fs.writeFileSync(DSR_DIV_TARGET_FILE, JSON.stringify(targetsMap, null, 2), 'utf8');
    return { success: true, message: `DSR Targets Updated! (${matchedCount} DSRs)`, targets: targetsMap };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// -------------------------------------------------------------
// MONTHLY TARGETS ENGINE
// -------------------------------------------------------------
ipcMain.handle('upload-monthly-target-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Target VS Achievement Brand Wise Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel kar diya gaya.' };

    await waitForFileUnlock(filePaths[0]);
    const fileBuffer = fs.readFileSync(filePaths[0]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const sheet = workbook.getWorksheet('Target VS Achievement Brand Wis') || workbook.worksheets[0];
    if (!sheet) return { success: false, message: 'Target sheet nahi mili!' };

    let colArea = 2, colDist = 6, colDSR = 8, colBrand = 15, colSKU = 16, colTarget = 17;
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const val = (cell.value || '').toString().trim().toLowerCase();
      if (val === 'area') colArea = colNumber;
      if (val === 'distributor' || val === 'distributor_name') colDist = colNumber;
      if (val === 'dsr name' || val === 'dsr') colDSR = colNumber;
      if (val === 'brand') colBrand = colNumber;
      if (val === 'sku description' || val === 'sku') colSKU = colNumber;
      if (val === 'mtd_target_uom' || val === 'target') colTarget = colNumber;
    });

    const targetMap = new Map();
    const totalRows = sheet.rowCount;

    for (let r = 2; r <= totalRows; r++) {
      const row = sheet.getRow(r);
      const areaVal = (row.getCell(colArea).value || '').toString().trim();
      const distVal = (row.getCell(colDist).value || '').toString().trim();
      const rawDsr = (row.getCell(colDSR).value || '').toString().trim();
      const dsrVal = cleanDSRName(rawDsr);
      const brandVal = (row.getCell(colBrand).value || '').toString().trim();
      let fullSku = normalizeDisplaySKU(row.getCell(colSKU).value);
      const targetVal = parseFloat(row.getCell(colTarget).value) || 0;

      if (distVal !== '' && dsrVal !== '' && brandVal !== '' && fullSku !== '') {
        const baseKey = getBaseSKUKey(fullSku);
        const mapKey = `${areaVal.toUpperCase()}|${distVal.toUpperCase()}|${dsrVal.toUpperCase()}|${brandVal.toUpperCase()}|${baseKey}`;

        if (!targetMap.has(mapKey)) {
          targetMap.set(mapKey, {
            area: areaVal || 'MAIN AREA', distributor: distVal, dsrName: dsrVal, rawDsr: rawDsr,
            brand: brandVal, sku: fullSku, baseKey: baseKey, target: targetVal, achiv: 0, bills: 0
          });
        } else {
          const item = targetMap.get(mapKey);
          item.target += targetVal;
          if (targetVal > 0) item.sku = fullSku;
        }
      }
    }

    const extractedTargets = Array.from(targetMap.values());
    fs.writeFileSync(TARGET_MASTER_FILE, JSON.stringify(extractedTargets, null, 2), 'utf8');
    return { success: true, totalRecords: extractedTargets.length, fileName: path.basename(filePaths[0]) };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// -------------------------------------------------------------
// SND AUTO-MERGE ENGINE
// -------------------------------------------------------------
async function triggerAutoMerge(filePath) {
  try {
    await waitForFileUnlock(filePath);
    const result = await parseAndMergeSalesReport(filePath);
    const data = JSON.parse(fs.readFileSync(TARGET_MASTER_FILE, 'utf8'));
    
    fs.writeFileSync(LIVE_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');

    sendWindowStatus(portalWindow, 'Report Merged Successfully!', 'Success', '#10b981', false, 100);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-merge-completed', {
        success: true, fileName: path.basename(filePath), data: data, meta: result
      });
    }
  } catch (err) {
    console.error('Auto merge error:', err);
    sendWindowStatus(portalWindow, `Update Error: ${err.message}`, 'Error', '#ef4444', false, 0);
  }
}

async function parseAndMergeSalesReport(salesFilePath) {
  let targets = [];
  if (fs.existsSync(TARGET_MASTER_FILE)) {
    try { targets = JSON.parse(fs.readFileSync(TARGET_MASTER_FILE, 'utf8')); } catch(e) { targets = []; }
  }
  targets.forEach(t => { t.achiv = 0; t.bills = 0; });

  await waitForFileUnlock(salesFilePath);
  const fileBuffer = fs.readFileSync(salesFilePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!sheet) throw new Error('Sales Report sheet nahi mili!');

  let colDSR = -1, colBrand = -1, colSKU = -1, colCtn = -1, colBill = -1;
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const val = (cell.value || '').toString().trim().toLowerCase();
    if (val === 'dsr' || val.includes('dsr name')) colDSR = colNumber;
    if (val === 'brand') colBrand = colNumber;
    if (val === 'sku' || val.includes('sku desc')) colSKU = colNumber;
    if (val === 'ctn' || val.includes('delivered qty') || val === 'qty1') colCtn = colNumber;
    if (val === 'bill' || val.includes('bills')) colBill = colNumber;
  });

  if (colDSR === -1) colDSR = 6;
  if (colBrand === -1) colBrand = 8;
  if (colSKU === -1) colSKU = 9;
  if (colCtn === -1) colCtn = 10;
  if (colBill === -1) colBill = 11;

  const salesMap = new Map();
  const rawSalesItems = [];
  const totalRows = sheet.rowCount;

  for (let r = 2; r <= totalRows; r++) {
    const row = sheet.getRow(r);
    const regCheck = (row.getCell(1).value || '').toString().trim();
    if (regCheck.toLowerCase() === 'total') continue;

    const rawDsr = (row.getCell(colDSR).value || '').toString().trim();
    const dsrClean = cleanDSRName(rawDsr);
    const brandVal = (row.getCell(colBrand).value || '').toString().trim();
    const skuVal = (row.getCell(colSKU).value || '').toString().trim();
    const ctnVal = parseFloat(row.getCell(colCtn).value) || 0;
    const billVal = parseInt(row.getCell(colBill).value, 10) || 0;

    if (dsrClean !== '' && brandVal !== '' && skuVal !== '') {
      const baseKey = getBaseSKUKey(skuVal);
      const matchKey = `${dsrClean.toUpperCase()}|${brandVal.toUpperCase()}|${baseKey}`;
      if (!salesMap.has(matchKey)) {
        salesMap.set(matchKey, { ctn: ctnVal, bill: billVal });
      } else {
        const item = salesMap.get(matchKey);
        item.ctn += ctnVal;
        item.bill += billVal;
      }
      rawSalesItems.push({ dsrName: dsrClean, rawDsr, brand: brandVal, sku: skuVal, baseKey, ctn: ctnVal, bill: billVal });
    }
  }

  if (targets.length > 0) {
    targets.forEach(t => {
      const baseKey = t.baseKey || getBaseSKUKey(t.sku);
      const targetKey = `${t.dsrName.toUpperCase()}|${t.brand.toUpperCase()}|${baseKey}`;
      if (salesMap.has(targetKey)) {
        const sData = salesMap.get(targetKey);
        t.achiv = sData.ctn;
        t.bills = sData.bill;
      }
    });
  } else {
    targets = rawSalesItems.map(item => ({
      area: 'MAIN AREA',
      distributor: 'KHI - REHMAN ENT-BR2',
      dsrName: item.dsrName,
      rawDsr: item.rawDsr,
      brand: item.brand,
      sku: item.sku,
      baseKey: item.baseKey,
      target: 0,
      achiv: item.ctn,
      bills: item.bill
    }));
  }

  fs.writeFileSync(TARGET_MASTER_FILE, JSON.stringify(targets, null, 2), 'utf8');
  fs.writeFileSync(LIVE_CACHE_FILE, JSON.stringify(targets, null, 2), 'utf8');
  return { totalTargets: targets.length, salesItemsFound: salesMap.size };
}

ipcMain.handle('get-target-report-data', async () => {
  try {
    if (fs.existsSync(LIVE_CACHE_FILE)) {
      return { success: true, data: JSON.parse(fs.readFileSync(LIVE_CACHE_FILE, 'utf8')) };
    }
    if (fs.existsSync(TARGET_MASTER_FILE)) {
      return { success: true, data: JSON.parse(fs.readFileSync(TARGET_MASTER_FILE, 'utf8')) };
    }
    return { success: false, data: [] };
  } catch (e) {
    return { success: false, data: [], message: e.message };
  }
});

// -------------------------------------------------------------
// DSR CARRY-FORWARD & OUTLET LIST PARSER
// -------------------------------------------------------------
ipcMain.handle('upload-shop-master-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'MF Outlet List Detail / Shop Master Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };

    await waitForFileUnlock(filePaths[0]);
    const filePath = filePaths[0];

    const fileBuffer = await fs.promises.readFile(filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return { success: false, message: 'Excel file me koi sheet nahi mili!' };
    }

    const shopMap = new Map();

    for (const sheet of workbook.worksheets) {
      if (sheet.rowCount < 2) continue;

      let colPop = 8, colName = 11, colDsr = 12, colSection = 17;
      let headerRowIdx = -1;
      let runningDsrName = 'Unassigned';

      const maxScan = Math.min(35, sheet.rowCount);
      for (let r = 1; r <= maxScan; r++) {
        const rowVals = sheet.getRow(r).values;
        if (!Array.isArray(rowVals)) continue;

        for (let c = 1; c < rowVals.length; c++) {
          const valStr = (rowVals[c] || '').toString().trim();
          const v = valStr.toLowerCase();
          
          if (v.startsWith('orderer:') || v.startsWith('dsr:')) {
            const parts = valStr.split(':');
            if (parts.length > 1 && parts[1].trim()) {
              runningDsrName = cleanDSRName(parts[1].trim());
            }
          }
          if (v === 'pop code' || v === 'pop' || v.includes('outlet code') || v.includes('shop code')) colPop = c;
          if (v === 'pop name' || v.includes('outlet name') || v.includes('shop name') || v === 'customer name') colName = c;
          if (v === 'dsr' || v === 'dsr name' || v === 'orderer') colDsr = c;
          if (v === 'section' || v.includes('section name') || v.includes('beat') || v.includes('route')) colSection = c;
        }

        if (colPop !== -1 && colName !== -1 && headerRowIdx === -1) {
          headerRowIdx = r;
        }
      }

      if (headerRowIdx === -1) headerRowIdx = 21;

      const totalRows = sheet.rowCount;

      for (let r = headerRowIdx + 1; r <= totalRows; r++) {
        const rowVals = sheet.getRow(r).values;
        if (!rowVals || !Array.isArray(rowVals)) continue;

        for (let c = 1; c < Math.min(rowVals.length, 15); c++) {
          const cellStr = (rowVals[c] || '').toString().trim();
          if (cellStr.toLowerCase().startsWith('orderer:') || cellStr.toLowerCase().startsWith('dsr:')) {
            const p = cellStr.split(':');
            if (p.length > 1 && p[1].trim()) {
              runningDsrName = cleanDSRName(p[1].trim());
            }
          }
        }

        let rawPop = (rowVals[colPop] || '').toString().trim();
        let rawName = (rowVals[colName] || '').toString().trim();
        let rowDsr = (rowVals[colDsr] || '').toString().trim();
        let rawSec = (rowVals[colSection] || '').toString().trim();

        if (rowDsr && !rowDsr.toLowerCase().includes('orderer') && !rowDsr.toLowerCase().includes('dsr')) {
          runningDsrName = cleanDSRName(rowDsr);
        }

        if (rawPop.startsWith('=') || isNaN(rawPop)) {
          if (rawPop.length >= 8) rawPop = rawPop.slice(-8);
        }

        const isInvalidPop = !rawPop || rawPop.toLowerCase() === 'null' || isNaN(rawPop);
        const isInvalidName = !rawName || rawName.toLowerCase().includes('pop name') || rawName.toLowerCase().includes('total');

        if (!isInvalidPop && !isInvalidName) {
          if (!shopMap.has(rawPop)) {
            shopMap.set(rawPop, {
              pop: rawPop,
              name: rawName,
              dsr: runningDsrName !== 'Unassigned' ? runningDsrName : (cleanDSRName(rowDsr) || 'Unassigned'),
              rawDsr: rowDsr || runningDsrName,
              section: rawSec || 'General'
            });
          }
        }

        if (r % 250 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }

    const shopList = Array.from(shopMap.values());
    await fs.promises.writeFile(SHOP_MASTER_FILE, JSON.stringify(shopList, null, 2), 'utf8');

    return { 
      success: true, 
      count: shopList.length, 
      message: `${shopList.length} Shops Successfully Loaded!` 
    };
  } catch (err) {
    return { success: false, message: 'Shop upload error: ' + err.message };
  }
});

// -------------------------------------------------------------
// REQUIRED SHOP DATA IPC HANDLERS
// -------------------------------------------------------------
ipcMain.handle('get-saved-shop-count', async () => {
  try {
    if (fs.existsSync(SHOP_MASTER_FILE)) {
      const stats = fs.statSync(SHOP_MASTER_FILE);
      if (stats.size > 10) {
        const shops = JSON.parse(fs.readFileSync(SHOP_MASTER_FILE, 'utf8'));
        return { success: true, count: Array.isArray(shops) ? shops.length : 0 };
      }
    }
    return { success: true, count: 0 };
  } catch (err) {
    return { success: false, count: 0 };
  }
});

ipcMain.handle('get-saved-shop-data', async () => {
  try {
    if (fs.existsSync(SHOP_MASTER_FILE)) {
      return { success: true, shops: JSON.parse(fs.readFileSync(SHOP_MASTER_FILE, 'utf8')) };
    }
    return { success: true, shops: [] };
  } catch (err) {
    return { success: false, shops: [], error: err.message };
  }
});

// -------------------------------------------------------------
// CUSTOM BRANDS & DIVISION STORAGE ENGINE
// -------------------------------------------------------------
ipcMain.handle('get-custom-brands', async () => {
  try {
    const filePath = path.join(STORAGE_DIR, 'CUSTOM_BRANDS.json');
    if (!fs.existsSync(filePath)) return { success: true, customBrands: {} };
    return { success: true, customBrands: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (err) {
    return { success: false, customBrands: {}, error: err.message };
  }
});

ipcMain.handle('save-custom-brands', async (event, customBrands) => {
  try {
    const filePath = path.join(STORAGE_DIR, 'CUSTOM_BRANDS.json');
    fs.writeFileSync(filePath, JSON.stringify(customBrands, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-division-mapper-config', async (event, divConfig) => {
  try {
    const filePath = path.join(STORAGE_DIR, 'DIVISION_MAP_CONFIG.json');
    fs.writeFileSync(filePath, JSON.stringify(divConfig, null, 2), 'utf8');
    return { success: true, message: 'Division mapping saved!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});