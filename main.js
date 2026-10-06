===FILE:main.js===
const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

let mainWindow;

const DATA_DIR = path.join(app.getPath('userData'), 'DataStore');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SHOP_MASTER_FILE = path.join(DATA_DIR, 'SHOP_MASTER_DATA.json');
const TARGET_REPORT_FILE = path.join(DATA_DIR, 'TARGET_REPORT_DATA.json');
const DSR_TARGETS_FILE = path.join(DATA_DIR, 'DSR_SAVED_TARGETS.json');
const CUSTOM_BRANDS_FILE = path.join(DATA_DIR, 'CUSTOM_BRANDS.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'CREDENTIALS.json');
const DUMP_CM_FILE = path.join(DATA_DIR, 'SALES_DUMP_CM.json');
const DUMP_LM_FILE = path.join(DATA_DIR, 'SALES_DUMP_LM.json');
const STOCK_DATA_FILE = path.join(DATA_DIR, 'STOCK_DISPATCH_DATA.json');
const DAILY_HISTORY_FILE = path.join(DATA_DIR, 'DAILY_SALES_HISTORY.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'MULTI TRACKING SYSTEM - POWERED BY DANISH RAIS',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.maximize();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function waitForFileUnlock(filePath, retries = 5, delay = 600) {
  for (let i = 0; i < retries; i++) {
    try {
      const handle = await fs.promises.open(filePath, 'r');
      await handle.close();
      return true;
    } catch (err) {
      if (i === retries - 1) throw new Error("File Excel mein khuli hui hai. Meharbani karke pehle Excel file band karein!");
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function getSafeCellString(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'string' || typeof val === 'number') {
    return String(val).trim();
  }
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) {
      if (typeof val.result === 'object' && val.result.richText) {
        return val.result.richText.map(t => t.text).join('').trim();
      }
      return String(val.result).trim();
    }
    if (val.richText && Array.isArray(val.richText)) {
      return val.richText.map(t => t.text).join('').trim();
    }
    if (val.text !== undefined && val.text !== null) {
      return String(val.text).trim();
    }
    if (val.sharedString !== undefined) {
      return String(val.sharedString).trim();
    }
  }
  if (cell.text && typeof cell.text === 'string') {
    return cell.text.trim();
  }
  return '';
}

function cleanDSRName(rawName) {
  let cleaned = (rawName || '').toString().trim();
  if (!cleaned) return 'Unassigned';
  const dashPos = cleaned.indexOf('-');
  if (dashPos > -1 && dashPos < cleaned.length - 1 && dashPos <= 6) {
    cleaned = cleaned.substring(dashPos + 1).trim();
  }
  const mergePos = cleaned.toUpperCase().indexOf('-MERGE');
  if (mergePos > -1) cleaned = cleaned.substring(0, mergePos).trim();
  const parenPos = cleaned.indexOf('(');
  if (parenPos > -1) cleaned = cleaned.substring(0, parenPos).trim();
  const wsPos = cleaned.toUpperCase().indexOf('-WS');
  if (wsPos > -1) cleaned = cleaned.substring(0, wsPos).trim();
  if (cleaned.endsWith('-')) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
  return cleaned || 'Unassigned';
}

ipcMain.handle('upload-shop-master-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'MF Outlet List Detail Excel Select Karein',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false, message: 'Upload cancel ho gaya.' };

    await waitForFileUnlock(filePaths[0]);
    const filePath = filePaths[0];

    const fileBuffer = await fs.promises.readFile(filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return { success: false, message: 'Excel file me sheet nahi mili!' };

    const shopList = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      let fullPop = getSafeCellString(row.getCell(1));
      let shortPop = getSafeCellString(row.getCell(2));

      if (!shortPop || shortPop === '[object Object]' || shortPop.length < 4) {
        if (fullPop && fullPop.length >= 7) {
          shortPop = fullPop.slice(-7);
        }
      }
      shortPop = shortPop.replace(/^0+/, '').trim();

      const shopName = getSafeCellString(row.getCell(3));
      const rawDsr = getSafeCellString(row.getCell(4));
      const dsrName = cleanDSRName(rawDsr);
      const section = getSafeCellString(row.getCell(5));

      if (!shopName || fullPop.toUpperCase().includes('POP') || fullPop.toUpperCase().includes('TOTAL')) return;

      shopList.push({
        id: rowNumber,
        pop: shortPop || fullPop,
        fullPop: fullPop,
        name: shopName,
        dsr: dsrName || 'Unassigned',
        rawDsr: rawDsr,
        section: section || 'General'
      });
    });

    await fs.promises.writeFile(SHOP_MASTER_FILE, JSON.stringify(shopList, null, 2), 'utf8');

    return { 
      success: true, 
      count: shopList.length, 
      message: `⚡ ${shopList.length} Shops Successfully Loaded with Assigned DSRs!` 
    };
  } catch (err) {
    return { success: false, message: 'Shop upload error: ' + err.message };
  }
});

ipcMain.handle('get-saved-shop-data', async () => {
  try {
    if (fs.existsSync(SHOP_MASTER_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(SHOP_MASTER_FILE, 'utf8'));
      return { success: true, shops: Array.isArray(data) ? data : [] };
    }
    return { success: true, shops: [] };
  } catch (err) {
    return { success: false, shops: [], message: err.message };
  }
});

ipcMain.handle('get-saved-shop-count', async () => {
  try {
    if (fs.existsSync(SHOP_MASTER_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(SHOP_MASTER_FILE, 'utf8'));
      return { success: true, count: Array.isArray(data) ? data.length : 0 };
    }
    return { success: true, count: 0 };
  } catch (err) {
    return { success: false, count: 0 };
  }
});

ipcMain.handle('copy-image-to-clipboard', async (event, dataUrl) => {
  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const nativeImg = nativeImage.createFromBuffer(imgBuffer);
    clipboard.writeImage(nativeImg);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-both-sales-dumps', async () => {
  let lmData = null;
  let cmData = null;
  try {
    if (fs.existsSync(DUMP_LM_FILE)) lmData = JSON.parse(await fs.promises.readFile(DUMP_LM_FILE, 'utf8'));
    if (fs.existsSync(DUMP_CM_FILE)) cmData = JSON.parse(await fs.promises.readFile(DUMP_CM_FILE, 'utf8'));
    return { success: true, lmData, cmData };
  } catch (e) {
    return { success: false, lmData: null, cmData: null };
  }
});

ipcMain.handle('get-target-report-data', async () => {
  try {
    if (fs.existsSync(TARGET_REPORT_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(TARGET_REPORT_FILE, 'utf8'));
      return { success: true, data };
    }
    return { success: true, data: [] };
  } catch (e) {
    return { success: false, data: [] };
  }
});

ipcMain.handle('get-stock-report-data', async () => {
  try {
    if (fs.existsSync(STOCK_DATA_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(STOCK_DATA_FILE, 'utf8'));
      return { success: true, stockData: data.stockData || [], dispatchData: data.dispatchData || [] };
    }
    return { success: true, stockData: [], dispatchData: [] };
  } catch (e) {
    return { success: false, stockData: [], dispatchData: [] };
  }
});

ipcMain.handle('get-custom-brands', async () => {
  try {
    if (fs.existsSync(CUSTOM_BRANDS_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(CUSTOM_BRANDS_FILE, 'utf8'));
      return { success: true, customBrands: data };
    }
    return { success: true, customBrands: {} };
  } catch (e) {
    return { success: false, customBrands: {} };
  }
});

ipcMain.handle('save-custom-brands', async (ev, data) => {
  try {
    await fs.promises.writeFile(CUSTOM_BRANDS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('get-all-credentials', async () => {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const creds = JSON.parse(await fs.promises.readFile(CREDENTIALS_FILE, 'utf8'));
      return { success: true, credentials: creds };
    }
    return { success: true, credentials: { snd: {}, dss: {} } };
  } catch (e) {
    return { success: false };
  }
});

ipcMain.handle('save-all-credentials', async (ev, creds) => {
  try {
    await fs.promises.writeFile(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('save-daily-sales-history', async (ev, payload) => {
  try {
    let history = {};
    if (fs.existsSync(DAILY_HISTORY_FILE)) {
      history = JSON.parse(await fs.promises.readFile(DAILY_HISTORY_FILE, 'utf8'));
    }
    history[payload.dateKey] = payload.records;
    await fs.promises.writeFile(DAILY_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('get-saved-dsr-targets', async () => {
  try {
    if (fs.existsSync(DSR_TARGETS_FILE)) {
      const targets = JSON.parse(await fs.promises.readFile(DSR_TARGETS_FILE, 'utf8'));
      return { success: true, targets };
    }
    return { success: true, targets: {} };
  } catch (e) {
    return { success: false, targets: {} };
  }
});

ipcMain.handle('get-booking-vs-execution-data', async () => {
  return { success: true, data: {} };
});
===END===
===FILE:modules/zeroShopWise.js===
window.ZeroShopModule = {
  selectedDsr: 'ALL',
  selectedSection: 'ALL',
  statusFilter: 'ALL',

  standardizePop: function(val) {
    if (!val) return "";
    let s = typeof val === 'object' ? (val.text || val.result || '') : String(val).trim();
    s = String(s).trim();
    if (s.length > 10) s = s.slice(-8);
    const num = s.replace(/^0+/, '');
    return num ? num : s;
  },

  cleanDSRName: function(rawName) {
    if (!rawName || rawName === 'Unassigned') return "Unassigned";
    let s = String(rawName).trim();
    if (s.includes("-")) {
      const parts = s.split("-");
      if (parts[0].trim().length <= 6 && parts.length > 1) {
        s = s.substring(s.indexOf("-") + 1).trim();
      }
    }
    s = s.replace(/-Merge/gi, "").trim();
    if (s.includes("(")) s = s.substring(0, s.indexOf("(")).trim();
    s = s.replace(/-WS/gi, "").trim();
    if (s.endsWith("-")) s = s.slice(0, -1).trim();
    return s || "Unassigned";
  },

  renderHTML: function() {
    return `
      <!-- TOP ACTION BAR -->
      <div class="filter-bar-compact" style="margin-bottom:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div class="filter-group">
          <span class="filter-label">DSR:</span>
          <select id="selectZeroShopDSR" class="custom-select" style="min-width:150px;" onchange="ZeroShopModule.onDsrChange(this.value)">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Section:</span>
          <select id="selectZeroShopSection" class="custom-select" style="min-width:150px;" onchange="ZeroShopModule.onSectionChange(this.value)">
            <option value="ALL">ALL SECTIONS</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Search Shop:</span>
          <input type="text" id="inputZeroShopSearch" class="date-input-field" placeholder="🔍 Search Code / Name..." oninput="ZeroShopModule.renderTable()" style="width:160px;" />
        </div>

        <div class="mode-buttons" style="background:var(--bg-main); padding:2px; border-radius:4px; border:1px solid var(--border-color);">
          <button id="btnShopFilterAll" class="btn-mode active" onclick="ZeroShopModule.setStatusFilter('ALL')">All Shops (<span id="cntShopAll">0</span>)</button>
          <button id="btnShopFilterZero" class="btn-mode" onclick="ZeroShopModule.setStatusFilter('ZERO_ONLY')" style="color:#ef4444;">Zero Purchase (<span id="cntShopZero">0</span>)</button>
          <button id="btnShopFilterPur" class="btn-mode" onclick="ZeroShopModule.setStatusFilter('PURCHASED_ONLY')" style="color:#10b981;">Purchased (<span id="cntShopPur">0</span>)</button>
        </div>

        <div class="filter-group" style="margin-left:auto; display:flex; gap:6px; align-items:center;">
          <span id="shopBuyingRateBadge" style="background:var(--table-header-bg); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:4px; font-family:'Consolas', monospace;">
            Buying Ratio: 0.0%
          </span>
          <button class="btn-act btn-copy-text" onclick="copyTableAsImage('zeroShopTable')">📸 Copy Image (Ctrl+C)</button>
          <button class="btn-act" style="background:#0284c7;" onclick="ZeroShopModule.renderTable()">🔄 Sync</button>
        </div>
      </div>

      <!-- FULL-WIDTH SHOP ZERO PURCHASE TABLE -->
      <div class="table-chart-container">
        <div class="table-wrapper" tabindex="0">
          <table id="zeroShopTable">
            <thead>
              <tr>
                <th style="color:#ffffff !important; width:110px;">Shop Code (Col B)</th>
                <th style="color:#ffffff !important; width:220px;">Shop / Customer Name</th>
                <th style="color:#ffffff !important; width:160px;">DSR Name</th>
                <th style="color:#ffffff !important; width:160px;">Section / Town</th>
                <th style="color:#ffffff !important; text-align:center; width:120px;">Purchase Status</th>
                <th class="num" style="color:#ffffff !important; width:70px;">Brands</th>
              </tr>
            </thead>
            <tbody id="zeroShopTbody">
              <tr><td colspan="6" style="text-align:center; padding:35px; color:var(--text-muted); font-weight:bold;">Loading Shop Data...</td></tr>
            </tbody>
            <tfoot id="zeroShopTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  setStatusFilter: function(status) {
    this.statusFilter = status;
    const bAll = document.getElementById('btnShopFilterAll');
    const bZero = document.getElementById('btnShopFilterZero');
    const bPur = document.getElementById('btnShopFilterPur');
    if (bAll) bAll.classList.toggle('active', status === 'ALL');
    if (bZero) bZero.classList.toggle('active', status === 'ZERO_ONLY');
    if (bPur) bPur.classList.toggle('active', status === 'PURCHASED_ONLY');
    this.renderTable();
  },

  onDsrChange: function(val) {
    this.selectedDsr = val;
    this.selectedSection = 'ALL';
    this.updateSectionDropdown();
    this.renderTable();
  },

  onSectionChange: function(val) {
    this.selectedSection = val;
    this.renderTable();
  },

  updateSectionDropdown: function() {
    const rawShopList = window.shopDataMaster || [];
    const secSelect = document.getElementById('selectZeroShopSection');
    if (!secSelect) return;

    const sections = new Set();
    rawShopList.forEach(s => {
      const d = this.cleanDSRName(s.dsr);
      if (this.selectedDsr === 'ALL' || d === this.selectedDsr) {
        const sec = (s.section || '').trim();
        if (sec) sections.add(sec);
      }
    });

    const sortedSec = Array.from(sections).sort();
    secSelect.innerHTML = `<option value="ALL">ALL SECTIONS</option>` + sortedSec.map(sec => `<option value="${sec}">${sec}</option>`).join('');
    secSelect.value = this.selectedSection;
  },

  renderTable: function() {
    const tbody = document.getElementById('zeroShopTbody');
    const tfoot = document.getElementById('zeroShopTfoot');
    if (!tbody) return;

    const rawShopList = window.shopDataMaster || [];
    if (rawShopList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:35px; color:#ef4444; font-weight:bold;">'Source Files' tab mein jaa kar Shop Data Master upload karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    const activeShopDict = new Map();
    const dumpDsrByPop = new Map();
    const salesDumpRecords = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    salesDumpRecords.forEach(r => {
      const q = parseFloat(r.qty || 0);
      const stdPop = this.standardizePop(r.pop);
      const dsrFromDump = this.cleanDSRName(r.rawDsr || r.dsr);

      if (stdPop && dsrFromDump && dsrFromDump !== 'Unassigned') {
        dumpDsrByPop.set(stdPop, dsrFromDump);
      }

      if (q > 0 && stdPop) {
        if (!activeShopDict.has(stdPop)) activeShopDict.set(stdPop, new Set());
        if (r.brand) activeShopDict.get(stdPop).add(r.brand.trim());
      }
    });

    const dsrSelect = document.getElementById('selectZeroShopDSR');
    if (dsrSelect && dsrSelect.options.length <= 1) {
      const allDsrs = new Set();
      rawShopList.forEach(s => {
        const stdCode = this.standardizePop(s.pop);
        let d = this.cleanDSRName(s.dsr);
        if (d === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
          d = dumpDsrByPop.get(stdCode);
        }
        if (d && d !== 'Unassigned') allDsrs.add(d);
      });
      const sortedDsrs = Array.from(allDsrs).sort();
      dsrSelect.innerHTML = `<option value="ALL">ALL DSRs</option>` + sortedDsrs.map(d => `<option value="${d}">${d}</option>`).join('');
      dsrSelect.value = this.selectedDsr;
      this.updateSectionDropdown();
    }

    const searchText = (document.getElementById('inputZeroShopSearch')?.value || '').toLowerCase().trim();
    const rowsData = [];
    let totalAllCount = 0;
    let totalPurchasedCount = 0;
    let totalZeroCount = 0;

    rawShopList.forEach(shop => {
      let rawCode = '';
      if (typeof shop.pop === 'string' && shop.pop !== '[object Object]') {
        rawCode = shop.pop.trim();
      } else if (typeof shop.pop === 'number') {
        rawCode = String(shop.pop);
      } else if (typeof shop.pop === 'object' && shop.pop !== null) {
        rawCode = String(shop.pop.result || shop.pop.text || '');
      }

      if (!rawCode || rawCode === '[object Object]') {
        const fp = String(shop.fullPop || '').trim();
        rawCode = fp.length >= 7 ? fp.slice(-7) : fp;
      }
      rawCode = rawCode.replace(/^0+/, '');

      const stdCode = this.standardizePop(rawCode);

      let dsrName = this.cleanDSRName(shop.dsr);
      if (dsrName === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
        dsrName = dumpDsrByPop.get(stdCode);
      }

      const section = (shop.section || '').trim();
      const shopName = (shop.name || 'Unnamed Outlet').trim();

      if (this.selectedDsr !== 'ALL' && dsrName !== this.selectedDsr) return;
      if (this.selectedSection !== 'ALL' && section !== this.selectedSection) return;

      if (searchText) {
        if (!rawCode.toLowerCase().includes(searchText) &&
            !shopName.toLowerCase().includes(searchText) &&
            !dsrName.toLowerCase().includes(searchText) &&
            !section.toLowerCase().includes(searchText)) {
          return;
        }
      }

      const isPurchased = activeShopDict.has(stdCode) || activeShopDict.has(this.standardizePop(shop.fullPop));
      let brandCount = 0;
      if (activeShopDict.has(stdCode)) {
        brandCount = activeShopDict.get(stdCode).size;
      } else if (activeShopDict.has(this.standardizePop(shop.fullPop))) {
        brandCount = activeShopDict.get(this.standardizePop(shop.fullPop)).size;
      }

      if (this.statusFilter === 'ZERO_ONLY' && isPurchased) return;
      if (this.statusFilter === 'PURCHASED_ONLY' && !isPurchased) return;

      if (isPurchased) totalPurchasedCount++; else totalZeroCount++;
      totalAllCount++;

      rowsData.push({
        code: rawCode,
        name: shopName,
        dsr: dsrName,
        section: section,
        isPurchased: isPurchased,
        brands: brandCount
      });
    });

    const cntAll = document.getElementById('cntShopAll');
    const cntZero = document.getElementById('cntShopZero');
    const cntPur = document.getElementById('cntShopPur');
    const rateBadge = document.getElementById('shopBuyingRateBadge');

    if (cntAll) cntAll.innerText = totalAllCount.toLocaleString();
    if (cntZero) cntZero.innerText = totalZeroCount.toLocaleString();
    if (cntPur) cntPur.innerText = totalPurchasedCount.toLocaleString();
    if (rateBadge) {
      const rate = totalAllCount > 0 ? ((totalPurchasedCount / totalAllCount) * 100).toFixed(1) : '0.0';
      rateBadge.innerText = `Buying Ratio: ${rate}%`;
    }

    let rowsHtml = '';
    rowsData.forEach(r => {
      const statusBadge = r.isPurchased
        ? `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Purchased</span>`
        : `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Zero Purchase</span>`;

      rowsHtml += `
        <tr>
          <td style="font-family:'Consolas', monospace; font-weight:700; color:#0284c7;">${r.code}</td>
          <td style="font-weight:700; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.name}">${r.name}</td>
          <td style="font-weight:700; color:#0f172a;">${r.dsr}</td>
          <td style="color:#475569; font-size:11.5px;">${r.section}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td class="num" style="font-weight:700;">${r.brands}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;">No matching shops found.</td></tr>`;

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="total-row">
          <td>GRAND TOTAL</td>
          <td>Visible Shops: ${rowsData.length.toLocaleString()}</td>
          <td colspan="2"></td>
          <td style="text-align:center; font-size:11px; color:#ffffff !important;">Purchased: ${totalPurchasedCount} | Zero: ${totalZeroCount}</td>
          <td class="num" style="color:#ffffff !important;">${rowsData.reduce((acc, x) => acc + x.brands, 0)}</td>
        </tr>
      `;
    }

    if (typeof attachExcelSelectionListeners === 'function') {
      attachExcelSelectionListeners();
    }
  }
};
===END===
===FILE:modules/zeroBrandWise.js===
window.ZeroBrandModule = {
  selectedDsr: 'ALL',
  selectedSection: 'ALL',
  selectedBrand: 'NONE',
  statusFilter: 'ALL',

  standardizePop: function(val) {
    if (!val) return "";
    let s = typeof val === 'object' ? (val.text || val.result || '') : String(val).trim();
    s = String(s).trim();
    if (s.length > 10) s = s.slice(-8);
    const num = s.replace(/^0+/, '');
    return num ? num : s;
  },

  cleanDSRName: function(rawName) {
    if (!rawName || rawName === 'Unassigned') return "Unassigned";
    let s = String(rawName).trim();
    if (s.includes("-")) {
      const parts = s.split("-");
      if (parts[0].trim().length <= 6 && parts.length > 1) {
        s = s.substring(s.indexOf("-") + 1).trim();
      }
    }
    s = s.replace(/-Merge/gi, "").trim();
    if (s.includes("(")) s = s.substring(0, s.indexOf("(")).trim();
    s = s.replace(/-WS/gi, "").trim();
    if (s.endsWith("-")) s = s.slice(0, -1).trim();
    return s || "Unassigned";
  },

  renderHTML: function() {
    return `
      <!-- TOP ACTION BAR -->
      <div class="filter-bar-compact" style="margin-bottom:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div class="filter-group">
          <span class="filter-label">DSR:</span>
          <select id="selectZeroBrandDSR" class="custom-select" style="min-width:150px;" onchange="ZeroBrandModule.onDsrChange(this.value)">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Section:</span>
          <select id="selectZeroBrandSection" class="custom-select" style="min-width:150px;" onchange="ZeroBrandModule.onSectionChange(this.value)">
            <option value="ALL">ALL SECTIONS</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label" style="color:#f59e0b;">Select Brand:</span>
          <select id="selectZeroBrandName" class="custom-select" style="min-width:160px; border-color:#f59e0b;" onchange="ZeroBrandModule.onBrandChange(this.value)">
            <option value="NONE">-- Select Brand --</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Search Shop:</span>
          <input type="text" id="inputZeroBrandSearch" class="date-input-field" placeholder="🔍 Search Code / Name..." oninput="ZeroBrandModule.renderTable()" style="width:160px;" />
        </div>

        <div class="mode-buttons" style="background:var(--bg-main); padding:2px; border-radius:4px; border:1px solid var(--border-color);">
          <button id="btnBrandFilterAll" class="btn-mode active" onclick="ZeroBrandModule.setStatusFilter('ALL')">All (<span id="cntBrandAll">0</span>)</button>
          <button id="btnBrandFilterZero" class="btn-mode" onclick="ZeroBrandModule.setStatusFilter('ZERO_ONLY')" style="color:#ef4444;">Zero Only (<span id="cntBrandZero">0</span>)</button>
          <button id="btnBrandFilterPur" class="btn-mode" onclick="ZeroBrandModule.setStatusFilter('PURCHASED_ONLY')" style="color:#10b981;">Purchased Only (<span id="cntBrandPur">0</span>)</button>
        </div>

        <div class="filter-group" style="margin-left:auto; display:flex; gap:6px; align-items:center;">
          <span id="brandBuyingRateBadge" style="background:var(--table-header-bg); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:4px; font-family:'Consolas', monospace;">
            Buying Rate: 0.0%
          </span>
          <button class="btn-act btn-copy-text" onclick="copyTableAsImage('zeroBrandTable')">📸 Copy Image (Ctrl+C)</button>
          <button class="btn-act" style="background:#0284c7;" onclick="ZeroBrandModule.renderTable()">🔄 Sync</button>
        </div>
      </div>

      <!-- FULL-WIDTH BRAND ZERO PURCHASE TABLE -->
      <div class="table-chart-container">
        <div class="table-wrapper" tabindex="0">
          <table id="zeroBrandTable">
            <thead id="zeroBrandThead">
              <tr>
                <th style="color:#ffffff !important; width:100px;">Shop Code</th>
                <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
                <th style="color:#ffffff !important; width:160px;">DSR Name</th>
                <th style="color:#ffffff !important; width:160px;">Section / Town</th>
                <th style="color:#ffffff !important; text-align:center; width:130px;">Status</th>
              </tr>
            </thead>
            <tbody id="zeroBrandTbody">
              <tr><td colspan="5" style="text-align:center; padding:35px; color:#f59e0b; font-weight:bold;">Report dekhne ke liye upar se Brand select karein.</td></tr>
            </tbody>
            <tfoot id="zeroBrandTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  setStatusFilter: function(status) {
    this.statusFilter = status;
    const bAll = document.getElementById('btnBrandFilterAll');
    const bZero = document.getElementById('btnBrandFilterZero');
    const bPur = document.getElementById('btnBrandFilterPur');
    if (bAll) bAll.classList.toggle('active', status === 'ALL');
    if (bZero) bZero.classList.toggle('active', status === 'ZERO_ONLY');
    if (bPur) bPur.classList.toggle('active', status === 'PURCHASED_ONLY');
    this.renderTable();
  },

  onDsrChange: function(val) {
    this.selectedDsr = val;
    this.selectedSection = 'ALL';
    this.updateSectionDropdown();
    this.renderTable();
  },

  onSectionChange: function(val) {
    this.selectedSection = val;
    this.renderTable();
  },

  onBrandChange: function(val) {
    this.selectedBrand = val;
    this.renderTable();
  },

  updateSectionDropdown: function() {
    const rawShopList = window.shopDataMaster || [];
    const secSelect = document.getElementById('selectZeroBrandSection');
    if (!secSelect) return;

    const sections = new Set();
    rawShopList.forEach(s => {
      let dsrName = this.cleanDSRName(s.dsr);
      if (this.selectedDsr === 'ALL' || dsrName === this.selectedDsr) {
        const sec = (s.section || '').trim();
        if (sec) sections.add(sec);
      }
    });

    const sortedSec = Array.from(sections).sort();
    secSelect.innerHTML = `<option value="ALL">ALL SECTIONS</option>` + sortedSec.map(sec => `<option value="${sec}">${sec}</option>`).join('');
    secSelect.value = this.selectedSection;
  },

  renderTable: function() {
    const thead = document.getElementById('zeroBrandThead');
    const tbody = document.getElementById('zeroBrandTbody');
    const tfoot = document.getElementById('zeroBrandTfoot');
    if (!tbody || !thead) return;

    const rawShopList = window.shopDataMaster || [];
    if (rawShopList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:35px; color:#ef4444; font-weight:bold;">'Source Files' tab mein jaa kar Shop Data Master upload karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    const allDumpBrands = new Set();
    const dumpDsrByPop = new Map();
    const salesDumpRecords = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    salesDumpRecords.forEach(r => {
      const brandName = (r.brand || '').trim().toUpperCase();
      if (brandName) allDumpBrands.add(brandName);

      const stdPop = this.standardizePop(r.pop);
      const dsrFromDump = this.cleanDSRName(r.rawDsr || r.dsr);
      if (stdPop && dsrFromDump && dsrFromDump !== 'Unassigned') {
        dumpDsrByPop.set(stdPop, dsrFromDump);
      }
    });

    const sortedBrands = Array.from(allDumpBrands).sort();
    const brandSelect = document.getElementById('selectZeroBrandName');
    if (brandSelect && brandSelect.options.length <= 1) {
      brandSelect.innerHTML = `<option value="NONE">-- Select Brand --</option>` + sortedBrands.map(b => `<option value="${b}">${b}</option>`).join('');
      brandSelect.value = this.selectedBrand;
    }

    const dsrSelect = document.getElementById('selectZeroBrandDSR');
    if (dsrSelect && dsrSelect.options.length <= 1) {
      const allDsrs = new Set();
      rawShopList.forEach(s => {
        const stdCode = this.standardizePop(s.pop);
        let d = this.cleanDSRName(s.dsr);
        if (d === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
          d = dumpDsrByPop.get(stdCode);
        }
        if (d && d !== 'Unassigned') allDsrs.add(d);
      });
      const sortedDsrs = Array.from(allDsrs).sort();
      dsrSelect.innerHTML = `<option value="ALL">ALL DSRs</option>` + sortedDsrs.map(d => `<option value="${d}">${d}</option>`).join('');
      dsrSelect.value = this.selectedDsr;
      this.updateSectionDropdown();
    }

    if (this.selectedBrand === 'NONE') {
      thead.innerHTML = `
        <tr>
          <th style="color:#ffffff !important; width:100px;">Shop Code</th>
          <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
          <th style="color:#ffffff !important; width:160px;">DSR Name</th>
          <th style="color:#ffffff !important; width:160px;">Section / Town</th>
          <th style="color:#ffffff !important; text-align:center; width:130px;">Status</th>
        </tr>
      `;
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:45px; color:#f59e0b; font-weight:bold; font-size:13px;">⚡ Fast Mode: Meharbani karke upar dropdown se Brand select karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      document.getElementById('cntBrandAll').innerText = '0';
      document.getElementById('cntBrandZero').innerText = '0';
      document.getElementById('cntBrandPur').innerText = '0';
      document.getElementById('brandBuyingRateBadge').innerText = 'Buying Rate: 0.0%';
      return;
    }

    const targetBrand = this.selectedBrand.toUpperCase();
    const purchaseSet = new Set();
    salesDumpRecords.forEach(r => {
      const q = parseFloat(r.qty || 0);
      if (q > 0) {
        const stdPop = this.standardizePop(r.pop);
        const bName = (r.brand || '').trim().toUpperCase();
        if (stdPop && bName === targetBrand) {
          purchaseSet.add(stdPop);
        }
      }
    });

    thead.innerHTML = `
      <tr>
        <th style="color:#ffffff !important; width:100px;">Shop Code</th>
        <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
        <th style="color:#ffffff !important; width:160px;">DSR Name</th>
        <th style="color:#ffffff !important; width:160px;">Section / Town</th>
        <th style="color:#ffffff !important; text-align:center; width:140px;">${targetBrand} Status</th>
      </tr>
    `;

    const searchText = (document.getElementById('inputZeroBrandSearch')?.value || '').toLowerCase().trim();
    const rowsData = [];

    let totalShopsCount = 0;
    let totalPurchasedCount = 0;
    let totalZeroCount = 0;

    rawShopList.forEach(shop => {
      let rawCode = '';
      if (typeof shop.pop === 'string' && shop.pop !== '[object Object]') {
        rawCode = shop.pop.trim();
      } else if (typeof shop.pop === 'number') {
        rawCode = String(shop.pop);
      } else if (typeof shop.pop === 'object' && shop.pop !== null) {
        rawCode = String(shop.pop.result || shop.pop.text || '');
      }

      if (!rawCode || rawCode === '[object Object]') {
        const fp = String(shop.fullPop || '').trim();
        rawCode = fp.length >= 7 ? fp.slice(-7) : fp;
      }
      rawCode = rawCode.replace(/^0+/, '');

      const stdCode = this.standardizePop(rawCode);

      let dsrName = this.cleanDSRName(shop.dsr);
      if (dsrName === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
        dsrName = dumpDsrByPop.get(stdCode);
      }

      const section = (shop.section || '').trim();
      const shopName = (shop.name || 'Unnamed Outlet').trim();

      if (this.selectedDsr !== 'ALL' && dsrName !== this.selectedDsr) return;
      if (this.selectedSection !== 'ALL' && section !== this.selectedSection) return;

      if (searchText) {
        if (!rawCode.toLowerCase().includes(searchText) &&
            !shopName.toLowerCase().includes(searchText) &&
            !dsrName.toLowerCase().includes(searchText) &&
            !section.toLowerCase().includes(searchText)) {
          return;
        }
      }

      const isPurchased = purchaseSet.has(stdCode) || purchaseSet.has(this.standardizePop(shop.fullPop));

      if (this.statusFilter === 'ZERO_ONLY' && isPurchased) return;
      if (this.statusFilter === 'PURCHASED_ONLY' && !isPurchased) return;

      if (isPurchased) totalPurchasedCount++; else totalZeroCount++;
      totalShopsCount++;

      rowsData.push({
        code: rawCode,
        name: shopName,
        dsr: dsrName,
        section: section,
        isPurchased: isPurchased
      });
    });

    const cntAll = document.getElementById('cntBrandAll');
    const cntZero = document.getElementById('cntBrandZero');
    const cntPur = document.getElementById('cntBrandPur');
    const rateBadge = document.getElementById('brandBuyingRateBadge');

    if (cntAll) cntAll.innerText = totalShopsCount.toLocaleString();
    if (cntZero) cntZero.innerText = totalZeroCount.toLocaleString();
    if (cntPur) cntPur.innerText = totalPurchasedCount.toLocaleString();
    if (rateBadge) {
      const rate = totalShopsCount > 0 ? ((totalPurchasedCount / totalShopsCount) * 100).toFixed(1) : '0.0';
      rateBadge.innerText = `Buying Rate: ${rate}%`;
    }

    let rowsHtml = '';
    rowsData.forEach(r => {
      const statusBadge = r.isPurchased
        ? `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Purchased</span>`
        : `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Zero</span>`;

      rowsHtml += `
        <tr>
          <td style="font-family:'Consolas', monospace; font-weight:700; color:#0284c7;">${r.code}</td>
          <td style="font-weight:700; max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.name}">${r.name}</td>
          <td style="font-weight:700; color:#0f172a;">${r.dsr}</td>
          <td style="color:#475569; font-size:11.5px;">${r.section}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;">No matching shops found.</td></tr>`;

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="total-row">
          <td>GRAND TOTAL</td>
          <td>Visible Shops: ${rowsData.length.toLocaleString()}</td>
          <td colspan="2"></td>
          <td style="text-align:center; font-size:11px; color:#ffffff !important;">Active: ${totalPurchasedCount} | Zero: ${totalZeroCount}</td>
        </tr>
      `;
    }

    if (typeof attachExcelSelectionListeners === 'function') {
      attachExcelSelectionListeners();
    }
  }
};
===END===
===FILE:modules/zeroSkuWise.js===
window.ZeroSkuModule = {
  selectedDsr: 'ALL',
  selectedSection: 'ALL',
  selectedBrand: 'ALL',
  selectedSku: 'NONE',
  statusFilter: 'ALL',

  standardizePop: function(val) {
    if (!val) return "";
    let s = typeof val === 'object' ? (val.text || val.result || '') : String(val).trim();
    s = String(s).trim();
    if (s.length > 10) s = s.slice(-8);
    const num = s.replace(/^0+/, '');
    return num ? num : s;
  },

  cleanDSRName: function(rawName) {
    if (!rawName || rawName === 'Unassigned') return "Unassigned";
    let s = String(rawName).trim();
    if (s.includes("-")) {
      const parts = s.split("-");
      if (parts[0].trim().length <= 6 && parts.length > 1) {
        s = s.substring(s.indexOf("-") + 1).trim();
      }
    }
    s = s.replace(/-Merge/gi, "").trim();
    if (s.includes("(")) s = s.substring(0, s.indexOf("(")).trim();
    s = s.replace(/-WS/gi, "").trim();
    if (s.endsWith("-")) s = s.slice(0, -1).trim();
    return s || "Unassigned";
  },

  renderHTML: function() {
    return `
      <!-- TOP ACTION BAR -->
      <div class="filter-bar-compact" style="margin-bottom:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div class="filter-group">
          <span class="filter-label">DSR:</span>
          <select id="selectZeroSkuDSR" class="custom-select" style="min-width:140px;" onchange="ZeroSkuModule.onDsrChange(this.value)">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Section:</span>
          <select id="selectZeroSkuSection" class="custom-select" style="min-width:140px;" onchange="ZeroSkuModule.onSectionChange(this.value)">
            <option value="ALL">ALL SECTIONS</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Brand:</span>
          <select id="selectZeroSkuBrand" class="custom-select" style="min-width:130px;" onchange="ZeroSkuModule.onBrandChange(this.value)">
            <option value="ALL">ALL BRANDS</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label" style="color:#f59e0b;">Select SKU:</span>
          <select id="selectZeroSkuName" class="custom-select" style="min-width:200px; border-color:#f59e0b;" onchange="ZeroSkuModule.onSkuChange(this.value)">
            <option value="NONE">-- Select SKU --</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Search:</span>
          <input type="text" id="inputZeroSkuSearch" class="date-input-field" placeholder="🔍 Search Code / Name..." oninput="ZeroSkuModule.renderTable()" style="width:150px;" />
        </div>

        <div class="mode-buttons" style="background:var(--bg-main); padding:2px; border-radius:4px; border:1px solid var(--border-color);">
          <button id="btnSkuFilterAll" class="btn-mode active" onclick="ZeroSkuModule.setStatusFilter('ALL')">All (<span id="cntSkuAll">0</span>)</button>
          <button id="btnSkuFilterZero" class="btn-mode" onclick="ZeroSkuModule.setStatusFilter('ZERO_ONLY')" style="color:#ef4444;">Zero Only (<span id="cntSkuZero">0</span>)</button>
          <button id="btnSkuFilterPur" class="btn-mode" onclick="ZeroSkuModule.setStatusFilter('PURCHASED_ONLY')" style="color:#10b981;">Purchased Only (<span id="cntSkuPur">0</span>)</button>
        </div>

        <div class="filter-group" style="margin-left:auto; display:flex; gap:6px; align-items:center;">
          <span id="skuBuyingRateBadge" style="background:var(--table-header-bg); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:4px; font-family:'Consolas', monospace;">
            Buying Rate: 0.0%
          </span>
          <button class="btn-act btn-copy-text" onclick="copyTableAsImage('zeroSkuTable')">📸 Copy Image (Ctrl+C)</button>
          <button class="btn-act" style="background:#0284c7;" onclick="ZeroSkuModule.renderTable()">🔄 Sync</button>
        </div>
      </div>

      <!-- FULL-WIDTH SKU ZERO PURCHASE TABLE -->
      <div class="table-chart-container">
        <div class="table-wrapper" tabindex="0">
          <table id="zeroSkuTable">
            <thead id="zeroSkuThead">
              <tr>
                <th style="color:#ffffff !important; width:100px;">Shop Code</th>
                <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
                <th style="color:#ffffff !important; width:160px;">DSR Name</th>
                <th style="color:#ffffff !important; width:160px;">Section / Town</th>
                <th style="color:#ffffff !important; text-align:center; width:130px;">Status</th>
              </tr>
            </thead>
            <tbody id="zeroSkuTbody">
              <tr><td colspan="5" style="text-align:center; padding:35px; color:#f59e0b; font-weight:bold;">Report dekhne ke liye upar dropdown se SKU select karein.</td></tr>
            </tbody>
            <tfoot id="zeroSkuTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  setStatusFilter: function(status) {
    this.statusFilter = status;
    const bAll = document.getElementById('btnSkuFilterAll');
    const bZero = document.getElementById('btnSkuFilterZero');
    const bPur = document.getElementById('btnSkuFilterPur');
    if (bAll) bAll.classList.toggle('active', status === 'ALL');
    if (bZero) bZero.classList.toggle('active', status === 'ZERO_ONLY');
    if (bPur) bPur.classList.toggle('active', status === 'PURCHASED_ONLY');
    this.renderTable();
  },

  onDsrChange: function(val) {
    this.selectedDsr = val;
    this.selectedSection = 'ALL';
    this.updateSectionDropdown();
    this.renderTable();
  },

  onSectionChange: function(val) {
    this.selectedSection = val;
    this.renderTable();
  },

  onBrandChange: function(val) {
    this.selectedBrand = val;
    this.populateSkuDropdown();
    this.renderTable();
  },

  onSkuChange: function(val) {
    this.selectedSku = val;
    this.renderTable();
  },

  populateSkuDropdown: function() {
    const skuSelect = document.getElementById('selectZeroSkuName');
    if (!skuSelect) return;

    const salesDumpRecords = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];
    const skuSet = new Set();

    salesDumpRecords.forEach(r => {
      const b = (r.brand || '').trim().toUpperCase();
      const s = (r.sku || '').trim();
      if (s) {
        if (this.selectedBrand === 'ALL' || b === this.selectedBrand.toUpperCase()) {
          skuSet.add(s);
        }
      }
    });

    const sortedSkus = Array.from(skuSet).sort();
    skuSelect.innerHTML = `<option value="NONE">-- Select SKU --</option>` + sortedSkus.map(s => `<option value="${s}">${s}</option>`).join('');
    if (sortedSkus.includes(this.selectedSku)) {
      skuSelect.value = this.selectedSku;
    } else {
      this.selectedSku = 'NONE';
      skuSelect.value = 'NONE';
    }
  },

  updateSectionDropdown: function() {
    const rawShopList = window.shopDataMaster || [];
    const secSelect = document.getElementById('selectZeroSkuSection');
    if (!secSelect) return;

    const sections = new Set();
    rawShopList.forEach(s => {
      let dsrName = this.cleanDSRName(s.dsr);
      if (this.selectedDsr === 'ALL' || dsrName === this.selectedDsr) {
        const sec = (s.section || '').trim();
        if (sec) sections.add(sec);
      }
    });

    const sortedSec = Array.from(sections).sort();
    secSelect.innerHTML = `<option value="ALL">ALL SECTIONS</option>` + sortedSec.map(sec => `<option value="${sec}">${sec}</option>`).join('');
    secSelect.value = this.selectedSection;
  },

  renderTable: function() {
    const thead = document.getElementById('zeroSkuThead');
    const tbody = document.getElementById('zeroSkuTbody');
    const tfoot = document.getElementById('zeroSkuTfoot');
    if (!tbody || !thead) return;

    const rawShopList = window.shopDataMaster || [];
    if (rawShopList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:35px; color:#ef4444; font-weight:bold;">'Source Files' tab mein jaa kar Shop Data Master upload karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    const salesDumpRecords = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];
    const dumpDsrByPop = new Map();
    const brandsSet = new Set();

    salesDumpRecords.forEach(r => {
      const b = (r.brand || '').trim().toUpperCase();
      if (b) brandsSet.add(b);

      const stdPop = this.standardizePop(r.pop);
      const dsrFromDump = this.cleanDSRName(r.rawDsr || r.dsr);
      if (stdPop && dsrFromDump && dsrFromDump !== 'Unassigned') {
        dumpDsrByPop.set(stdPop, dsrFromDump);
      }
    });

    const brandSelect = document.getElementById('selectZeroSkuBrand');
    if (brandSelect && brandSelect.options.length <= 1) {
      const sortedB = Array.from(brandsSet).sort();
      brandSelect.innerHTML = `<option value="ALL">ALL BRANDS</option>` + sortedB.map(b => `<option value="${b}">${b}</option>`).join('');
      brandSelect.value = this.selectedBrand;
      this.populateSkuDropdown();
    }

    const dsrSelect = document.getElementById('selectZeroSkuDSR');
    if (dsrSelect && dsrSelect.options.length <= 1) {
      const allDsrs = new Set();
      rawShopList.forEach(s => {
        const stdCode = this.standardizePop(s.pop);
        let d = this.cleanDSRName(s.dsr);
        if (d === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
          d = dumpDsrByPop.get(stdCode);
        }
        if (d && d !== 'Unassigned') allDsrs.add(d);
      });
      const sortedDsrs = Array.from(allDsrs).sort();
      dsrSelect.innerHTML = `<option value="ALL">ALL DSRs</option>` + sortedDsrs.map(d => `<option value="${d}">${d}</option>`).join('');
      dsrSelect.value = this.selectedDsr;
      this.updateSectionDropdown();
    }

    if (this.selectedSku === 'NONE') {
      thead.innerHTML = `
        <tr>
          <th style="color:#ffffff !important; width:100px;">Shop Code</th>
          <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
          <th style="color:#ffffff !important; width:160px;">DSR Name</th>
          <th style="color:#ffffff !important; width:160px;">Section / Town</th>
          <th style="color:#ffffff !important; text-align:center; width:130px;">Status</th>
        </tr>
      `;
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:45px; color:#f59e0b; font-weight:bold; font-size:13px;">⚡ Fast Mode: Meharbani karke upar dropdown se SKU select karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      document.getElementById('cntSkuAll').innerText = '0';
      document.getElementById('cntSkuZero').innerText = '0';
      document.getElementById('cntSkuPur').innerText = '0';
      document.getElementById('skuBuyingRateBadge').innerText = 'Buying Rate: 0.0%';
      return;
    }

    const targetSku = this.selectedSku.toUpperCase();
    const purchaseSet = new Set();
    salesDumpRecords.forEach(r => {
      const q = parseFloat(r.qty || 0);
      if (q > 0) {
        const stdPop = this.standardizePop(r.pop);
        const sName = (r.sku || '').trim().toUpperCase();
        if (stdPop && sName === targetSku) {
          purchaseSet.add(stdPop);
        }
      }
    });

    thead.innerHTML = `
      <tr>
        <th style="color:#ffffff !important; width:100px;">Shop Code</th>
        <th style="color:#ffffff !important; width:170px;">Shop / Customer Name</th>
        <th style="color:#ffffff !important; width:160px;">DSR Name</th>
        <th style="color:#ffffff !important; width:160px;">Section / Town</th>
        <th style="color:#ffffff !important; text-align:center; width:140px;">SKU Status</th>
      </tr>
    `;

    const searchText = (document.getElementById('inputZeroSkuSearch')?.value || '').toLowerCase().trim();
    const rowsData = [];

    let totalShopsCount = 0;
    let totalPurchasedCount = 0;
    let totalZeroCount = 0;

    rawShopList.forEach(shop => {
      let rawCode = '';
      if (typeof shop.pop === 'string' && shop.pop !== '[object Object]') {
        rawCode = shop.pop.trim();
      } else if (typeof shop.pop === 'number') {
        rawCode = String(shop.pop);
      } else if (typeof shop.pop === 'object' && shop.pop !== null) {
        rawCode = String(shop.pop.result || shop.pop.text || '');
      }

      if (!rawCode || rawCode === '[object Object]') {
        const fp = String(shop.fullPop || '').trim();
        rawCode = fp.length >= 7 ? fp.slice(-7) : fp;
      }
      rawCode = rawCode.replace(/^0+/, '');

      const stdCode = this.standardizePop(rawCode);

      let dsrName = this.cleanDSRName(shop.dsr);
      if (dsrName === 'Unassigned' && dumpDsrByPop.has(stdCode)) {
        dsrName = dumpDsrByPop.get(stdCode);
      }

      const section = (shop.section || '').trim();
      const shopName = (shop.name || 'Unnamed Outlet').trim();

      if (this.selectedDsr !== 'ALL' && dsrName !== this.selectedDsr) return;
      if (this.selectedSection !== 'ALL' && section !== this.selectedSection) return;

      if (searchText) {
        if (!rawCode.toLowerCase().includes(searchText) &&
            !shopName.toLowerCase().includes(searchText) &&
            !dsrName.toLowerCase().includes(searchText) &&
            !section.toLowerCase().includes(searchText)) {
          return;
        }
      }

      const isPurchased = purchaseSet.has(stdCode) || purchaseSet.has(this.standardizePop(shop.fullPop));

      if (this.statusFilter === 'ZERO_ONLY' && isPurchased) return;
      if (this.statusFilter === 'PURCHASED_ONLY' && !isPurchased) return;

      if (isPurchased) totalPurchasedCount++; else totalZeroCount++;
      totalShopsCount++;

      rowsData.push({
        code: rawCode,
        name: shopName,
        dsr: dsrName,
        section: section,
        isPurchased: isPurchased
      });
    });

    const cntAll = document.getElementById('cntSkuAll');
    const cntZero = document.getElementById('cntSkuZero');
    const cntPur = document.getElementById('cntSkuPur');
    const rateBadge = document.getElementById('skuBuyingRateBadge');

    if (cntAll) cntAll.innerText = totalShopsCount.toLocaleString();
    if (cntZero) cntZero.innerText = totalZeroCount.toLocaleString();
    if (cntPur) cntPur.innerText = totalPurchasedCount.toLocaleString();
    if (rateBadge) {
      const rate = totalShopsCount > 0 ? ((totalPurchasedCount / totalShopsCount) * 100).toFixed(1) : '0.0';
      rateBadge.innerText = `Buying Rate: ${rate}%`;
    }

    let rowsHtml = '';
    rowsData.forEach(r => {
      const statusBadge = r.isPurchased
        ? `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Purchased</span>`
        : `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Zero</span>`;

      rowsHtml += `
        <tr>
          <td style="font-family:'Consolas', monospace; font-weight:700; color:#0284c7;">${r.code}</td>
          <td style="font-weight:700; max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.name}">${r.name}</td>
          <td style="font-weight:700; color:#0f172a;">${r.dsr}</td>
          <td style="color:#475569; font-size:11.5px;">${r.section}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;">No matching shops found.</td></tr>`;

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="total-row">
          <td>GRAND TOTAL</td>
          <td>Visible Shops: ${rowsData.length.toLocaleString()}</td>
          <td colspan="2"></td>
          <td style="text-align:center; font-size:11px; color:#ffffff !important;">Active: ${totalPurchasedCount} | Zero: ${totalZeroCount}</td>
        </tr>
      `;
    }

    if (typeof attachExcelSelectionListeners === 'function') {
      attachExcelSelectionListeners();
    }
  }
};
===END===