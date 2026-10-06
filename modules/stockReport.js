window.StockReportModule = {
  hideColumnsEFG: false,
  searchTerm: '',

  // Built-in Hardcoded Master Mapping Dictionary from VBA
  hardcodedMapping: {
    "16492": "267", "16466": "183", "16198": "342", "16701": "363", "16468": "364",
    "16524": "132", "14944": "133", "16518": "335", "16523": "308", "15985": "325",
    "16640": "395", "16520": "382", "16519": "334", "16641": "328", "16798": "164",
    "16487": "134", "16486": "338", "16724": "287", "16691": "165", "16799": "397",
    "16126": "331", "16125": "336", "16124": "330", "16258": "360", "15973": "326",
    "15839": "311", "16463": "271", "16038": "337", "15837": "313", "15836": "312",
    "15829": "321", "16664": "160", "16800": "171", "16517": "333", "16238": "370",
    "16666": "286", "15365": "193", "16638": "167", "15429": "396", "16444": "354",
    "16455": "371", "16482": "391", "16484": "392", "16483": "393", "16209": "358",
    "16234": "369", "16233": "379", "15722": "356", "16201": "357", "16422": "380",
    "16477": "320", "16478": "300", "16475": "169", "16474": "240", "16476": "232",
    "15716": "314", "15720": "318", "15719": "317", "15717": "315", "15718": "316",
    "15721": "319", "15188": "228", "15211": "179", "15186": "226", "15189": "229",
    "15184": "224", "15185": "225", "15183": "223", "15140": "206", "15143": "209",
    "15138": "204", "15139": "205", "15142": "208", "15137": "203", "15304": "248",
    "15300": "244", "15298": "242", "15299": "243", "15305": "249", "15303": "247",
    "15297": "241", "16424": "343", "16132": "347", "16431": "346", "16135": "350",
    "16426": "344", "16427": "348", "16429": "345", "16134": "349", "16421": "366",
    "16420": "365", "16473": "351", "16472": "352", "16423": "386", "16489": "263",
    "16498": "250", "16491": "265", "16496": "252", "16494": "266", "16499": "253",
    "16500": "255", "16493": "268", "16495": "269", "16502": "256", "16501": "254",
    "16497": "251", "16490": "264", "16232": "341", "16231": "162", "16259": "324",
    "16432": "294", "16433": "293", "16434": "257", "16435": "238", "16081": "296",
    "16436": "295", "15943": "262", "16086": "237", "16202": "359", "16479": "394",
    "16450": "389", "16451": "387", "16452": "388", "16453": "390", "16581": "220",
    "16580": "222", "16122": "340", "16569": "399", "16716": "361", "16512": "275",
    "16513": "276", "16511": "277"
  },

  reverseHardcodedMapping: {},

  initReverseMapping: function() {
    this.reverseHardcodedMapping = {};
    for (const [mat, sku] of Object.entries(this.hardcodedMapping)) {
      this.reverseHardcodedMapping[sku] = mat;
    }
  },

  // STRICT 3-DIVISION RESOLVER
  getCategoryFromBrand: function(brandName, customDivMap = {}) {
    const uBrand = (brandName || '').toString().trim().toUpperCase();

    if (customDivMap && customDivMap[uBrand]) {
      return customDivMap[uBrand];
    }

    if (["BAKED CROISSANT", "MAYFAIR DELIGHT", "HEARTS"].includes(uBrand) ||
        uBrand.includes("CROISSANT") || uBrand.includes("HEARTS") || uBrand.includes("CAKE") || uBrand.includes("RUSK")) {
      return "BAK";
    }

    if (["A1", "BESTO", "CAFE", "CREMO", "SPECIAL", "WOW"].includes(uBrand) ||
        uBrand.includes("CREMO") || uBrand.includes("SPECIAL") || uBrand.includes("CAFE") || 
        uBrand.includes("BESTO") || uBrand.includes("WOW") || uBrand.includes("A1") || 
        uBrand.includes("COOKIE") || uBrand.includes("CRACKER")) {
      return "BIS";
    }

    return "CONF";
  },

  getLastNumberFromBracket: function(txt) {
    const str = (txt || '').toString();
    const startPos = str.lastIndexOf('(');
    const endPos = str.lastIndexOf(')');
    if (startPos > -1 && endPos > startPos) {
      const bracketContent = str.substring(startPos + 1, endPos);
      const parts = bracketContent.split(/X/i);
      if (parts.length > 0) {
        const lastVal = parseFloat(parts[parts.length - 1].trim());
        if (!isNaN(lastVal) && lastVal > 0) return lastVal;
      }
    }
    return 12; // VBA Default Fallback
  },

  renderHTML: function() {
    this.initReverseMapping();
    return `
      <style>
        .stock-report-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 52px);
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
          gap: 6px;
          position: relative;
        }

        /* 1. TOP STICKY TOOLBAR */
        .stock-action-bar-top {
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        body:not(.light-theme) .stock-action-bar-top {
          background: #0b1526;
          border-color: #1e2e4a;
        }

        .btn-stock-action {
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 800;
          color: #ffffff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: 0.15s;
        }
        .btn-stock-action:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-stk-update { background: #2563eb; }
        .btn-stk-mapping { background: #d97706; }
        .btn-stk-divmap { background: #059669; }
        .btn-stk-hideform { background: #9333ea; }
        .btn-stk-hidecols { background: #475569; }
        .btn-stk-unhidecols { background: #334155; }
        .btn-stk-upload-disp { background: #0284c7; }

        /* 2. SPLIT WORKSPACE */
        .stock-split-workspace {
          display: grid;
          grid-template-columns: 3.3fr 1.1fr;
          gap: 10px;
          flex: 1;
          height: calc(100% - 48px);
          overflow: hidden;
        }

        .stock-table-card {
          background: var(--bg-panel);
          border: 1.5px solid var(--border-color);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .stock-scroll-box {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          width: 100%;
          height: 100%;
        }

        .stock-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 11px;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .stock-table th {
          background: #2980b9 !important;
          color: #ffffff !important;
          font-weight: 800;
          padding: 6px 8px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 20;
          user-select: text !important;
        }
        .stock-table td {
          padding: 4px 8px;
          border: 1px solid #dcdcdc;
          white-space: nowrap;
          vertical-align: middle;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        body.light-theme .stock-table td { border-color: #cbd5e1; }

        .brand-total-row { background-color: #fff3cd !important; font-weight: bold; color: #000000 !important; }
        .brand-total-row td {
          background-color: #fff3cd !important; color: #000000 !important; font-weight: bold;
          border-top: 1.5px solid #b4b4b4 !important; border-bottom: 1.5px solid #b4b4b4 !important;
        }

        .cat-total-row { background-color: #e2efda !important; font-weight: 900; color: #000000 !important; }
        .cat-total-row td {
          background-color: #e2efda !important; color: #000000 !important; font-weight: 900;
          border-top: 1.5px solid #969696 !important; border-bottom: 1.5px solid #969696 !important;
        }

        .stock-grand-total { background-color: #d6eaf8 !important; font-weight: 900; font-size: 11.5px; color: #000000 !important; }
        .stock-grand-total td {
          background-color: #d6eaf8 !important; color: #000000 !important; font-weight: 900;
          border-top: 2px solid #2980b9 !important; border-bottom: 3px double #2980b9 !important;
        }

        .unmatched-item-row { background-color: #fef9e7 !important; }
        .unmatched-mat-cell { background-color: #fcd451 !important; font-weight: bold; color: #000000 !important; }

        .missing-table th {
          background: #ffc7ce !important;
          color: #9c0006 !important;
          font-weight: 900;
          border: 1px solid #f5b7b1;
          padding: 6px 8px;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .missing-row td { background-color: #ffebee !important; color: #000000; border: 1px solid #ffcdd2; }
        .missing-total-row td {
          background-color: #ffcccc !important; font-weight: 900; color: #78281f;
          border-top: 1.5px solid #b4b4b4 !important; border-bottom: 3px double #b4b4b4 !important;
        }

        /* 3. MOVABLE / FLOATING USERFORM PALETTES */
        .stock-floating-window {
          position: fixed;
          top: 90px;
          left: calc(50% - 270px);
          width: 540px;
          max-width: 95vw;
          max-height: 82vh;
          background: #ffffff;
          border: 2px solid #0284c7;
          border-radius: 8px;
          box-shadow: 0 14px 38px rgba(0,0,0,0.5), 0 0 15px rgba(2, 132, 199, 0.4);
          z-index: 9999999 !important;
          display: none;
          flex-direction: column;
          color: #0f172a;
          pointer-events: auto !important;
          user-select: text;
        }
        body:not(.light-theme) .stock-floating-window {
          background: #0b1526;
          color: #f8fafc;
        }

        .floating-window-header {
          background: #0f2444;
          color: #ffffff;
          padding: 8px 12px;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          user-select: none;
        }
        .floating-window-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .floating-window-close {
          cursor: pointer;
          color: #94a3b8;
          font-size: 15px;
          font-weight: bold;
          line-height: 1;
        }
        .floating-window-close:hover { color: #ef4444; }

        .floating-window-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          flex: 1;
        }

        .stock-form-input {
          width: 100% !important;
          background: #ffffff !important;
          border: 1.5px solid #0284c7 !important;
          color: #0f172a !important;
          padding: 6px 10px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          outline: none !important;
          box-sizing: border-box !important;
          user-select: text !important;
          cursor: text !important;
        }
        body:not(.light-theme) .stock-form-input {
          background: #070e1c !important;
          color: #ffffff !important;
          border-color: #0284c7 !important;
        }
        .stock-form-input:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.6) !important;
        }

        .map-entry-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(2, 132, 199, 0.05);
          padding: 5px 8px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 11.5px;
        }
        body:not(.light-theme) .map-entry-item {
          background: #091222;
          border-color: #1e2e4a;
        }

        .div-mapper-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-card);
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }
        .div-mapper-select {
          background: var(--bg-panel);
          color: var(--text-main);
          border: 1px solid #0284c7;
          border-radius: 3px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: bold;
          outline: none;
        }

        .chk-label-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 6px;
          border-radius: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          font-size: 11px;
          cursor: pointer;
        }
        .chk-label-box:hover {
          background: var(--bg-row-hover);
        }
        .chk-is-total {
          background: rgba(245, 158, 11, 0.12) !important;
          border-color: #f59e0b !important;
          font-weight: 800 !important;
          color: #f59e0b !important;
        }
      </style>

      <div class="stock-report-wrapper">
        
        <!-- 1. FREEZE ACTION BAR -->
        <div class="stock-action-bar-top">
          <button class="btn-stock-action btn-stk-update" onclick="StockReportModule.renderTable()">
            🔄 UPDATE REPORT
          </button>
          
          <button class="btn-stock-action btn-stk-upload-disp" onclick="StockReportModule.uploadDispatchFile()">
            📥 UPLOAD TODAY DISPATCH
          </button>

          <!-- DIVISION MAPPER BUTTON -->
          <button class="btn-stock-action btn-stk-divmap" onclick="StockReportModule.openDivisionMapperModal()">
            🗂️ DIVISION MAPPER
          </button>

          <!-- MAPPING MANAGER (CHECKBOXES & BULK REMOVE) -->
          <button class="btn-stock-action btn-stk-mapping" onclick="StockReportModule.openMappingManagerModal()">
            ⚙️ MAPPING MANAGER
          </button>

          <button class="btn-stock-action btn-stk-hideform" onclick="StockReportModule.openSkuHideModal()">
            👁️ SKU HIDE FORM
          </button>

          <button class="btn-stock-action btn-stk-hidecols" onclick="StockReportModule.toggleColumnsEFG(true)">
            🔒 HIDE E:G
          </button>

          <button class="btn-stock-action btn-stk-unhidecols" onclick="StockReportModule.toggleColumnsEFG(false)">
            🔓 UNHIDE E:G
          </button>

          <button class="btn-stock-action" style="background:#2563eb; margin-left:auto;" onclick="copyTableAsImage('stockMainTable')">
            📸 Copy Stock Table (Ctrl+C)
          </button>
        </div>

        <!-- 2. SPLIT WORKSPACE -->
        <div class="stock-split-workspace">
          
          <!-- MAIN STOCK TABLE -->
          <div class="stock-table-card">
            <div class="stock-scroll-box" id="stockMainScrollBox">
              <table class="stock-table" id="stockMainTable">
                <thead>
                  <tr>
                    <th style="min-width:130px;">Brand Name</th>
                    <th style="width:85px;">SKU Code</th>
                    <th style="min-width:240px; text-align:left;">Product Name</th>
                    <th class="num col-efg" style="width:80px;">QTY in CTN</th>
                    <th class="num col-efg" style="width:80px;">QTY in BOX</th>
                    <th class="num col-efg" style="width:90px;">Dispatch QTY</th>
                    <th class="num" style="width:90px;">Total QTY</th>
                  </tr>
                </thead>
                <tbody id="stockMainTbody"></tbody>
              </table>
            </div>
          </div>

          <!-- MISSING MATERIAL CODES TABLE -->
          <div class="stock-table-card">
            <div class="stock-scroll-box" id="stockMissingScrollBox">
              <table class="stock-table missing-table" id="stockMissingTable">
                <thead>
                  <tr>
                    <th style="width:125px;">Missing Material Code</th>
                    <th style="min-width:170px; text-align:left;">SKU / Product Name</th>
                    <th class="num" style="width:95px;">Dispatch QTY</th>
                  </tr>
                </thead>
                <tbody id="stockMissingTbody"></tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <!-- MOVABLE FLOATING PALETTE 1: MAPPING MANAGER -->
      <div id="stockMappingModal" class="stock-floating-window">
        <div class="floating-window-header" id="stockMappingHeader">
          <h4>⚙️ Mapping Manager (SKU ⟷ Material Code)</h4>
          <span class="floating-window-close" onclick="StockReportModule.closeMappingModal()">✕</span>
        </div>
        <div class="floating-window-body">
          <p style="font-size:11px; margin:0; opacity:0.8;">
            Dispatch file ke Material Code ko SnD SKU Code ke sath link karein:
          </p>
          
          <div style="display:flex; gap:8px;">
            <input type="text" id="mapInputSku" class="stock-form-input" placeholder="SKU Code (e.g. 183)" style="flex:1;" onkeydown="event.stopPropagation(); if(event.key==='Enter') StockReportModule.saveNewMappingPair();" />
            <input type="text" id="mapInputMat" class="stock-form-input" placeholder="Material Code (e.g. 16700)" style="flex:1;" onkeydown="event.stopPropagation(); if(event.key==='Enter') StockReportModule.saveNewMappingPair();" />
            <button class="btn-stock-action btn-stk-update" onclick="StockReportModule.saveNewMappingPair()">Add / Save</button>
          </div>

          <!-- BULK DELETE BAR -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1; padding-bottom:5px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; cursor:pointer;">
              <input type="checkbox" id="chkSelectAllMappings" onchange="StockReportModule.toggleSelectAllMappings(this.checked)" />
              <span>Select All</span>
            </label>
            <button class="btn-stock-action" style="background:#dc2626; padding:3px 8px; font-size:10px;" onclick="StockReportModule.deleteSelectedMappings()">
              🗑️ Delete Selected
            </button>
          </div>

          <div id="stockMappingList" style="flex:1; max-height:240px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:4px; padding:6px; display:flex; flex-direction:column; gap:4px;"></div>

          <div style="display:flex; justify-content:flex-end; gap:6px;">
            <button class="btn-stock-action" style="background:#64748b;" onclick="StockReportModule.closeMappingModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- MOVABLE FLOATING PALETTE 2: DIVISION MAPPER -->
      <div id="stockDivisionModal" class="stock-floating-window" style="width:520px; left:calc(50% - 260px);">
        <div class="floating-window-header" id="stockDivisionHeader" style="background:#065f46;">
          <h4 style="color:#6ee7b7;">🗂️ Division Mapper (Bakery, Biscuits, Confectionery)</h4>
          <span class="floating-window-close" onclick="StockReportModule.closeDivisionMapperModal()">✕</span>
        </div>
        <div class="floating-window-body">
          <p style="font-size:11px; margin:0; opacity:0.8;">
            Har Brand ko strictly uski sahi Division me assign karein (Koi Brand "OTHER" nahi hoga):
          </p>

          <input type="text" id="divSearchInput" class="stock-form-input" placeholder="🔍 Search Brand..." oninput="StockReportModule.filterDivModalList()" onkeydown="event.stopPropagation();" />

          <div id="stockDivisionList" style="flex:1; max-height:270px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:4px; padding:6px; display:flex; flex-direction:column; gap:4px;"></div>

          <div style="display:flex; justify-content:flex-end; gap:6px;">
            <button class="btn-stock-action" style="background:#64748b;" onclick="StockReportModule.closeDivisionMapperModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- MOVABLE FLOATING PALETTE 3: SKU HIDE FORM (DOES NOT AUTO CLOSE ON SAVE) -->
      <div id="stockHideModal" class="stock-floating-window" style="width:580px; left:calc(50% - 290px);">
        <div class="floating-window-header" id="stockHideHeader" style="background:#4a154b;">
          <h4 style="color:#e879f9;">👁️ SKU & Total Rows Hide Form</h4>
          <span class="floating-window-close" onclick="StockReportModule.closeHideModal()">✕</span>
        </div>
        <div class="floating-window-body">
          <p style="font-size:11px; margin:0; opacity:0.8;">
            Check lagane par relevant SKUs, Brand Totals ya Category Totals report mein hide rahenge (Manual Close):
          </p>

          <input type="text" id="hideSearchInput" class="stock-form-input" placeholder="🔍 Search SKU, Brand ya Total..." oninput="StockReportModule.filterHideModalList()" onkeydown="event.stopPropagation();" />

          <div id="stockHideCheckboxList" style="flex:1; max-height:280px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:4px; padding:6px; display:flex; flex-direction:column; gap:4px;"></div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span id="hiddenCountBadge" style="font-size:11px; font-weight:bold; color:#f59e0b;">0 Rows Hidden</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-stock-action" style="background:#64748b;" onclick="StockReportModule.closeHideModal()">Close</button>
              <button class="btn-stock-action btn-stk-update" onclick="StockReportModule.applyAndSaveHiddenSKUs()">Apply & Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  makeDraggable: function(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px";
      el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },

  toggleColumnsEFG: function(hide) {
    this.hideColumnsEFG = hide;
    const cols = document.querySelectorAll('.col-efg');
    cols.forEach(c => {
      c.style.display = hide ? 'none' : '';
    });
    showBannerAlert(hide ? "🔒 Columns E:G Hidden!" : "🔓 Columns E:G Unhidden!", "#0284c7");
  },

  uploadDispatchFile: async function() {
    showBannerAlert("⏳ Uploading Today Dispatch Excel...", "#0284c7");
    const res = await ipcRenderer.invoke('upload-total-dispatch-file');
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
      this.renderTable();
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  // RENDER REPORT ENGINE
  renderTable: async function() {
    showBannerAlert("⏳ Compiling Stock & Dispatch Balance...", "#0284c7");

    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    if (!dataRes || !dataRes.success) return;

    const stockData = dataRes.stockData || [];
    const dispatchData = dataRes.dispatchData || [];
    const customMapping = dataRes.mappingConfig || {};
    const hiddenConfig = dataRes.hiddenConfig || {};
    const customDivMap = dataRes.divisionMapConfig || {};

    // 1. Compile Dispatch Dictionary (Strictly Rehman Ent)
    const dispDict = {};
    dispatchData.forEach(d => {
      const mCode = (d.materialCode || '').toString().trim();
      if (mCode) {
        dispDict[mCode] = (dispDict[mCode] || 0) + (parseFloat(d.qty) || 0);
      }
    });

    // 2. Build Mapping Dictionary
    const mappingDict = { ...this.hardcodedMapping, ...customMapping };
    const reverseMapping = {};
    for (const [mat, sku] of Object.entries(mappingDict)) {
      reverseMapping[sku] = mat;
    }

    // 3. Compile Stock Data by Brand -> SKU
    const brandDict = {};
    const brandOrder = [];
    const categoryDict = {};

    stockData.forEach(item => {
      let currentBrand = item.brand || "CONFECTIONERY";
      if (currentBrand.toUpperCase().includes("OTHER")) currentBrand = "CHASKA";
      const skuCode = (item.sku || '').toString().trim();
      const prodName = (item.name || '').toString().trim();

      if (!categoryDict[currentBrand]) {
        categoryDict[currentBrand] = this.getCategoryFromBrand(currentBrand, customDivMap);
      }

      if (skuCode && !skuCode.toUpperCase().includes('TOTAL')) {
        if (!brandDict[currentBrand]) {
          brandDict[currentBrand] = {};
          brandOrder.push(currentBrand);
        }

        if (brandDict[currentBrand][skuCode]) {
          brandDict[currentBrand][skuCode].ctn += item.ctn;
          brandDict[currentBrand][skuCode].box += item.box;
        } else {
          brandDict[currentBrand][skuCode] = {
            sku: skuCode,
            name: prodName,
            ctn: item.ctn,
            box: item.box
          };
        }
      }
    });

    // 4. Sort Brands by Strict Priority: BAK -> BIS -> CONF
    const sortedBrands = [];
    const addBrandsByCat = (cat) => {
      brandOrder.forEach(b => {
        if (categoryDict[b] === cat && !sortedBrands.includes(b)) sortedBrands.push(b);
      });
    };
    addBrandsByCat("BAK");
    addBrandsByCat("BIS");
    addBrandsByCat("CONF");
    brandOrder.forEach(b => {
      if (!sortedBrands.includes(b)) sortedBrands.push(b);
    });

    // 5. Handle Unmatched Dispatch Items
    dispatchData.forEach(d => {
      const matCode = (d.materialCode || '').toString().trim();
      const prodName = (d.productName || '').toString().trim();
      if (matCode) {
        let targetSku = mappingDict[matCode] || ("M-" + matCode);

        let foundInStock = false;
        for (const b of sortedBrands) {
          if (brandDict[b] && brandDict[b][targetSku]) { foundInStock = true; break; }
        }

        if (!foundInStock) {
          let detectedBrand = "CONFECTIONERY";
          const uProd = prodName.toUpperCase();
          if (uProd.includes("HEARTS") || uProd.includes("CROISSANT")) detectedBrand = "BAKED CROISSANT";
          else if (uProd.includes("SPECIAL")) detectedBrand = "SPECIAL";
          else if (uProd.includes("CAFE")) detectedBrand = "CAFE";
          else if (uProd.includes("BESTO")) detectedBrand = "BESTO";
          else if (uProd.includes("CREMO")) detectedBrand = "CREMO";
          else if (uProd.includes("WOW")) detectedBrand = "WOW";
          else if (uProd.includes("FRUIT GALA")) detectedBrand = "FRUIT GALA";
          else if (uProd.includes("MAYFAIR")) detectedBrand = "MAYFAIR BUBBLE";
          else if (uProd.includes("TIGER")) detectedBrand = "TIGER";
          else if (uProd.includes("WOBBLY")) detectedBrand = "WOBBLY";
          else if (uProd.includes("CHASKA")) detectedBrand = "CHASKA";
          else if (uProd.includes("MILKO")) detectedBrand = "MILKO";

          if (!categoryDict[detectedBrand]) categoryDict[detectedBrand] = this.getCategoryFromBrand(detectedBrand, customDivMap);
          if (!brandDict[detectedBrand]) {
            brandDict[detectedBrand] = {};
            sortedBrands.push(detectedBrand);
          }
          if (!brandDict[detectedBrand][targetSku]) {
            brandDict[detectedBrand][targetSku] = {
              sku: targetSku,
              name: prodName,
              ctn: 0,
              box: 0
            };
          }
        }
      }
    });

    // 6. Build Main Table Rows (STRICTLY 3 CATEGORIES: BAK, BIS, CONF)
    let mainHtml = '';
    const catTotals = {
      BAK: { ctn: 0, box: 0, disp: 0, total: 0 },
      BIS: { ctn: 0, box: 0, disp: 0, total: 0 },
      CONF: { ctn: 0, box: 0, disp: 0, total: 0 }
    };
    const grandTotals = { ctn: 0, box: 0, disp: 0, total: 0 };

    sortedBrands.forEach(brandKey => {
      const skusObj = brandDict[brandKey] || {};
      const skuKeys = Object.keys(skusObj);
      if (skuKeys.length === 0) return;

      const brandSubtotal = { ctn: 0, box: 0, disp: 0, total: 0 };
      const currentCat = categoryDict[brandKey] || "CONF";

      let brandRowsHtml = '';

      skuKeys.forEach(sKey => {
        const item = skusObj[sKey];
        const isUnmatched = sKey.startsWith("M-");
        const matchedMatCode = isUnmatched ? sKey.substring(2) : (reverseMapping[sKey] || "");

        const foundDispQty = (matchedMatCode && dispDict[matchedMatCode]) ? dispDict[matchedMatCode] : 0;
        const ctnSize = this.getLastNumberFromBracket(item.name);
        const itemTotal = item.ctn + (item.box / ctnSize) + foundDispQty;

        brandSubtotal.ctn += item.ctn;
        brandSubtotal.box += item.box;
        brandSubtotal.disp += foundDispQty;
        brandSubtotal.total += itemTotal;

        const hideKey = "SKU|" + sKey;
        const isHidden = hiddenConfig[hideKey];
        const hideStyle = isHidden ? 'style="display:none;"' : '';

        const rowBgClass = isUnmatched ? 'unmatched-item-row' : '';
        const matCellClass = isUnmatched ? 'unmatched-mat-cell' : '';

        brandRowsHtml += `
          <tr class="${rowBgClass}" ${hideStyle}>
            <td style="font-weight:700;">${brandKey}</td>
            <td class="${matCellClass}" style="text-align:center;">${isUnmatched ? matchedMatCode : sKey}</td>
            <td>${item.name}</td>
            <td class="num col-efg">${item.ctn.toFixed(2)}</td>
            <td class="num col-efg">${item.box.toFixed(2)}</td>
            <td class="num col-efg">${foundDispQty.toFixed(2)}</td>
            <td class="num" style="font-weight:700;">${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      const bHideKey = "TOTAL|" + (brandKey + " - TOTAL:").toUpperCase();
      const isBrandHidden = hiddenConfig[bHideKey];
      const bHideStyle = isBrandHidden ? 'style="display:none;"' : '';

      mainHtml += brandRowsHtml;
      mainHtml += `
        <tr class="brand-total-row" ${bHideStyle}>
          <td></td>
          <td colspan="2" style="font-weight:900;">${brandKey} - Total:</td>
          <td class="num col-efg">${brandSubtotal.ctn.toFixed(2)}</td>
          <td class="num col-efg">${brandSubtotal.box.toFixed(2)}</td>
          <td class="num col-efg">${brandSubtotal.disp.toFixed(2)}</td>
          <td class="num">${brandSubtotal.total.toFixed(2)}</td>
        </tr>
      `;

      if (catTotals[currentCat]) {
        catTotals[currentCat].ctn += brandSubtotal.ctn;
        catTotals[currentCat].box += brandSubtotal.box;
        catTotals[currentCat].disp += brandSubtotal.disp;
        catTotals[currentCat].total += brandSubtotal.total;
      }
    });

    const catLabels = [
      { key: "BAK", label: "BAKERY TOTAL" },
      { key: "BIS", label: "BISCUITS TOTAL" },
      { key: "CONF", label: "CONFECTIONERY TOTAL" }
    ];

    catLabels.forEach(cat => {
      const ct = catTotals[cat.key];
      if (ct && (ct.ctn > 0 || ct.box > 0 || ct.disp > 0 || ct.total > 0)) {
        const catHideKey = "TOTAL|" + cat.label.toUpperCase();
        const isCatHidden = hiddenConfig[catHideKey];
        const cHideStyle = isCatHidden ? 'style="display:none;"' : '';

        mainHtml += `
          <tr class="cat-total-row" ${cHideStyle}>
            <td></td>
            <td colspan="2" style="font-weight:900;">${cat.label}</td>
            <td class="num col-efg">${ct.ctn.toFixed(2)}</td>
            <td class="num col-efg">${ct.box.toFixed(2)}</td>
            <td class="num col-efg">${ct.disp.toFixed(2)}</td>
            <td class="num">${ct.total.toFixed(2)}</td>
          </tr>
        `;

        grandTotals.ctn += ct.ctn;
        grandTotals.box += ct.box;
        grandTotals.disp += ct.disp;
        grandTotals.total += ct.total;
      }
    });

    // GRAND TOTAL ROW
    mainHtml += `
      <tr class="stock-grand-total">
        <td></td>
        <td colspan="2" style="font-weight:900;">GRAND TOTAL</td>
        <td class="num col-efg">${grandTotals.ctn.toFixed(2)}</td>
        <td class="num col-efg">${grandTotals.box.toFixed(2)}</td>
        <td class="num col-efg">${grandTotals.disp.toFixed(2)}</td>
        <td class="num" style="color:#0284c7; font-weight:900;">${grandTotals.total.toFixed(2)}</td>
      </tr>
    `;

    document.getElementById('stockMainTbody').innerHTML = mainHtml;

    // 7. Build Missing Material Codes Table
    let missHtml = '';
    let missTotal = 0;
    const checkedMatCodes = new Set();

    dispatchData.forEach(d => {
      const matCode = (d.materialCode || '').toString().trim();
      const prodName = (d.productName || '').toString().trim();

      if (matCode && !checkedMatCodes.has(matCode)) {
        checkedMatCodes.add(matCode);

        const isMatched = mappingDict[matCode] !== undefined;
        if (!isMatched) {
          const dispQty = parseFloat(d.qty) || 0;
          missTotal += dispQty;

          missHtml += `
            <tr class="missing-row">
              <td style="text-align:center; font-weight:700;">${matCode}</td>
              <td>${prodName}</td>
              <td class="num">${dispQty.toFixed(2)}</td>
            </tr>
          `;
        }
      }
    });

    if (missHtml) {
      missHtml += `
        <tr class="missing-total-row">
          <td></td>
          <td style="font-weight:900;">Total:</td>
          <td class="num">${missTotal.toFixed(2)}</td>
        </tr>
      `;
    } else {
      missHtml = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#10b981; font-weight:bold;">🎉 All Material Codes mapped perfectly!</td></tr>`;
    }

    document.getElementById('stockMissingTbody').innerHTML = missHtml;

    if (this.hideColumnsEFG) {
      this.toggleColumnsEFG(true);
    }

    showBannerAlert("✅ Stock Report Updated!", "#10b981");
  },

  // USERFORM 1: MAPPING MANAGER
  openMappingManagerModal: async function() {
    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    const customMapping = (dataRes && dataRes.mappingConfig) || {};
    const listEl = document.getElementById('stockMappingList');
    if (!listEl) return;

    let html = '';
    const chkSelectAll = document.getElementById('chkSelectAllMappings');
    if (chkSelectAll) chkSelectAll.checked = false;

    for (const [mat, sku] of Object.entries(customMapping)) {
      html += `
        <div class="map-entry-item">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;">
            <input type="checkbox" value="${mat}" class="chk-map-row" />
            <span>SKU: <b style="color:#38bdf8;">${sku}</b> ⟷ Material: <b style="color:#f59e0b;">${mat}</b></span>
          </label>
          <span style="color:#ef4444; cursor:pointer; font-weight:bold; font-size:13px; padding:0 6px;" title="Delete single" onclick="StockReportModule.deleteMappingPair('${mat}')">✕</span>
        </div>
      `;
    }
    if (!html) html = '<div style="text-align:center; padding:15px; opacity:0.6;">No custom mappings saved yet.</div>';
    listEl.innerHTML = html;

    const modal = document.getElementById('stockMappingModal');
    modal.style.display = 'flex';

    const header = document.getElementById('stockMappingHeader');
    if (header) this.makeDraggable(modal, header);

    setTimeout(() => {
      const inp = document.getElementById('mapInputSku');
      if (inp) {
        inp.focus();
        inp.select();
      }
    }, 100);
  },

  closeMappingModal: function() {
    document.getElementById('stockMappingModal').style.display = 'none';
  },

  toggleSelectAllMappings: function(isChecked) {
    const chks = document.querySelectorAll('.chk-map-row');
    chks.forEach(c => c.checked = isChecked);
  },

  deleteSelectedMappings: async function() {
    const selected = Array.from(document.querySelectorAll('.chk-map-row:checked')).map(c => c.value);
    if (selected.length === 0) return alert("Pehle delete karne ke liye mappings select karein!");

    if (confirm(`Kya aap select ki gayi ${selected.length} mappings ko remove karna chahte hain?`)) {
      const dataRes = await ipcRenderer.invoke('get-stock-report-data');
      const customMapping = (dataRes && dataRes.mappingConfig) || {};
      
      selected.forEach(mat => {
        delete customMapping[mat];
      });

      await ipcRenderer.invoke('save-stock-mapping-config', customMapping);
      this.openMappingManagerModal();
      this.renderTable();
      showBannerAlert(`🗑️ ${selected.length} Mappings successfully removed!`, "#dc2626");
    }
  },

  saveNewMappingPair: async function() {
    const sInput = document.getElementById('mapInputSku');
    const mInput = document.getElementById('mapInputMat');
    const sCode = sInput ? sInput.value.trim() : '';
    const mCode = mInput ? mInput.value.trim() : '';
    if (!sCode || !mCode) return alert("SKU Code aur Material Code dono likhein!");

    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    const customMapping = (dataRes && dataRes.mappingConfig) || {};
    customMapping[mCode] = sCode;

    await ipcRenderer.invoke('save-stock-mapping-config', customMapping);
    if (sInput) sInput.value = '';
    if (mInput) mInput.value = '';
    this.openMappingManagerModal();
    this.renderTable();
    showBannerAlert(`Mapping saved: SKU ${sCode} ⟷ Mat ${mCode}`, "#059669");
  },

  deleteMappingPair: async function(mCode) {
    if (confirm(`Mapping ${mCode} delete karein?`)) {
      const dataRes = await ipcRenderer.invoke('get-stock-report-data');
      const customMapping = (dataRes && dataRes.mappingConfig) || {};
      delete customMapping[mCode];
      await ipcRenderer.invoke('save-stock-mapping-config', customMapping);
      this.openMappingManagerModal();
      this.renderTable();
    }
  },

  // USERFORM 2: DIVISION MAPPER MODAL
  openDivisionMapperModal: async function() {
    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    const stockData = (dataRes && dataRes.stockData) || [];
    const customDivMap = (dataRes && dataRes.divisionMapConfig) || {};

    const brandSet = new Set();
    stockData.forEach(item => {
      let b = (item.brand || '').trim();
      if (b && !b.toUpperCase().includes('TOTAL')) {
        if (b.toUpperCase().includes('OTHER')) b = "CHASKA";
        brandSet.add(b);
      }
    });

    const listEl = document.getElementById('stockDivisionList');
    let html = '';

    Array.from(brandSet).sort().forEach(bName => {
      const currentCat = this.getCategoryFromBrand(bName, customDivMap);
      html += `
        <div class="div-mapper-row">
          <span style="font-weight:700;">🏷️ ${bName}</span>
          <select class="div-mapper-select" onchange="StockReportModule.onDivisionChange('${bName.replace(/'/g, "\\'")}', this.value)">
            <option value="BAK" ${currentCat === 'BAK' ? 'selected' : ''}>Bakery (BAK)</option>
            <option value="BIS" ${currentCat === 'BIS' ? 'selected' : ''}>Biscuits (BIS)</option>
            <option value="CONF" ${currentCat === 'CONF' ? 'selected' : ''}>Confectionery (CONF)</option>
          </select>
        </div>
      `;
    });

    listEl.innerHTML = html;
    const modal = document.getElementById('stockDivisionModal');
    modal.style.display = 'flex';

    const header = document.getElementById('stockDivisionHeader');
    if (header) this.makeDraggable(modal, header);
  },

  closeDivisionMapperModal: function() {
    document.getElementById('stockDivisionModal').style.display = 'none';
  },

  onDivisionChange: async function(bName, newCat) {
    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    const customDivMap = (dataRes && dataRes.divisionMapConfig) || {};
    customDivMap[bName.toUpperCase()] = newCat;

    await ipcRenderer.invoke('save-division-mapper-config', customDivMap);
    await this.renderTable();
    showBannerAlert(`Brand '${bName}' mapped to ${newCat}!`, "#059669");
  },

  filterDivModalList: function() {
    const query = (document.getElementById('divSearchInput').value || '').toLowerCase();
    const rows = document.querySelectorAll('#stockDivisionList .div-mapper-row');
    rows.forEach(r => {
      const txt = r.innerText.toLowerCase();
      r.style.display = txt.includes(query) ? '' : 'none';
    });
  },

  // USERFORM 3: SKU HIDE FORM (DOES NOT AUTO-CLOSE ON APPLY & SAVE)
  openSkuHideModal: async function() {
    const dataRes = await ipcRenderer.invoke('get-stock-report-data');
    const stockData = (dataRes && dataRes.stockData) || [];
    const hiddenConfig = (dataRes && dataRes.hiddenConfig) || {};

    const uniqueRows = new Map();
    const brandSet = new Set();

    stockData.forEach(item => {
      const sku = (item.sku || '').trim();
      const name = (item.name || '').trim();
      const brand = (item.brand || '').trim();
      if (brand) brandSet.add(brand);

      if (sku && !sku.toUpperCase().includes('TOTAL')) {
        uniqueRows.set("SKU|" + sku, { label: `${sku} - ${name}`, isTotal: false });
      }
    });

    brandSet.forEach(b => {
      const bKey = "TOTAL|" + (b + " - TOTAL:").toUpperCase();
      uniqueRows.set(bKey, { label: `🏷️ ${b} - Total Row`, isTotal: true });
    });

    const catTotals = ["BAKERY TOTAL", "BISCUITS TOTAL", "CONFECTIONERY TOTAL"];
    catTotals.forEach(c => {
      const cKey = "TOTAL|" + c.toUpperCase();
      uniqueRows.set(cKey, { label: `⭐ ${c} Row`, isTotal: true });
    });

    const listEl = document.getElementById('stockHideCheckboxList');
    let html = '';
    let hiddenCount = 0;

    uniqueRows.forEach((val, key) => {
      const isChecked = hiddenConfig[key] ? 'checked' : '';
      if (isChecked) hiddenCount++;
      const totalClass = val.isTotal ? 'chk-is-total' : '';
      html += `
        <label class="chk-label-box ${totalClass}">
          <input type="checkbox" value="${key}" ${isChecked} class="chk-hide-sku" onchange="StockReportModule.updateHiddenCountBadge()" />
          <span>${val.label}</span>
        </label>
      `;
    });

    listEl.innerHTML = html;
    document.getElementById('hiddenCountBadge').innerText = `${hiddenCount} Rows Hidden`;
    
    const modal = document.getElementById('stockHideModal');
    modal.style.display = 'flex';

    const header = document.getElementById('stockHideHeader');
    if (header) this.makeDraggable(modal, header);
  },

  closeHideModal: function() {
    document.getElementById('stockHideModal').style.display = 'none';
  },

  updateHiddenCountBadge: function() {
    const checked = document.querySelectorAll('.chk-hide-sku:checked').length;
    document.getElementById('hiddenCountBadge').innerText = `${checked} Rows Hidden`;
  },

  filterHideModalList: function() {
    const query = (document.getElementById('hideSearchInput').value || '').toLowerCase();
    const items = document.querySelectorAll('#stockHideCheckboxList .chk-label-box');
    items.forEach(it => {
      const txt = it.innerText.toLowerCase();
      it.style.display = txt.includes(query) ? '' : 'none';
    });
  },

  applyAndSaveHiddenSKUs: async function() {
    const chks = document.querySelectorAll('.chk-hide-sku');
    const newHidden = {};
    chks.forEach(c => {
      if (c.checked) newHidden[c.value] = true;
    });

    await ipcRenderer.invoke('save-hidden-sku-config', newHidden);
    await this.renderTable();
    showBannerAlert("👁️ Hidden SKU & Total Configurations Applied! (Form kept open)", "#9333ea");
  }
};