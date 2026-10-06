window.ZeroShopModule = {
  activeFilter: 'ALL', // 'ALL', 'ZERO_ONLY', 'PURCHASED_ONLY'
  selectedDsr: 'ALL',
  selectedSection: 'ALL',

  standardizePop: function(val) {
    if (!val) return "";
    let s = String(val).trim();
    if (s.length > 10) s = s.slice(-8);
    const num = s.replace(/^0+/, '');
    return num ? num : s;
  },

  cleanDSRName: function(rawName) {
    if (!rawName) return "Unassigned";
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
          <select id="selectZeroShopDSR" class="custom-select" style="min-width:160px;" onchange="ZeroShopModule.onDsrChange(this.value)">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Section:</span>
          <select id="selectZeroShopSection" class="custom-select" style="min-width:160px;" onchange="ZeroShopModule.onSectionChange(this.value)">
            <option value="ALL">ALL SECTIONS</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Search Shop:</span>
          <input type="text" id="inputZeroShopSearch" class="date-input-field" placeholder="🔍 Search Code / Name..." oninput="ZeroShopModule.renderTable()" style="width:180px;" />
        </div>

        <!-- Quick View Mode Buttons -->
        <div class="mode-buttons" style="background:var(--bg-main); padding:2px; border-radius:4px; border:1px solid var(--border-color);">
          <button id="btnFilterShowAll" class="btn-mode active" onclick="ZeroShopModule.setFilterMode('ALL')">All Shops (<span id="cntAll">0</span>)</button>
          <button id="btnFilterZeroOnly" class="btn-mode" onclick="ZeroShopModule.setFilterMode('ZERO_ONLY')" style="color:#ef4444;">Zero Purchase (<span id="cntZero">0</span>)</button>
          <button id="btnFilterPurOnly" class="btn-mode" onclick="ZeroShopModule.setFilterMode('PURCHASED_ONLY')" style="color:#10b981;">Purchased (<span id="cntPur">0</span>)</button>
        </div>

        <div class="filter-group" style="margin-left:auto; display:flex; gap:6px; align-items:center;">
          <span id="buyingRatioBadge" style="background:var(--table-header-bg); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:4px; font-family:'Consolas', monospace;">
            Buying Ratio: 0.0%
          </span>
          <button class="btn-act btn-copy-text" onclick="copyTableAsImage('zeroShopTable')">📸 Copy Image (Ctrl+C)</button>
          <button class="btn-act" style="background:#0284c7;" onclick="ZeroShopModule.renderTable()">🔄 Sync</button>
        </div>
      </div>

      <!-- FULL PAGE TABLE -->
      <div class="table-chart-container">
        <div class="table-wrapper" tabindex="0">
          <table id="zeroShopTable">
            <thead>
              <tr>
                <th style="color:#ffffff !important; width:110px;">Shop Code (Col B)</th>
                <th style="color:#ffffff !important; min-width:240px;">Shop / Customer Name</th>
                <th style="color:#ffffff !important; width:180px;">DSR Name</th>
                <th style="color:#ffffff !important; width:180px;">Section / Town</th>
                <th style="color:#ffffff !important; text-align:center; width:130px;">Purchase Status</th>
                <th class="num highlight-pct" style="color:#ffffff !important; width:95px; text-align:right;">Brands</th>
              </tr>
            </thead>
            <tbody id="zeroShopTbody">
              <tr><td colspan="6" style="text-align:center; padding:35px; color:var(--text-muted); font-weight:bold;">Loading Shop Zero Data...</td></tr>
            </tbody>
            <tfoot id="zeroShopTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  setFilterMode: function(mode) {
    this.activeFilter = mode;
    const bAll = document.getElementById('btnFilterShowAll');
    const bZero = document.getElementById('btnFilterZeroOnly');
    const bPur = document.getElementById('btnFilterPurOnly');
    if (bAll) bAll.classList.toggle('active', mode === 'ALL');
    if (bZero) bZero.classList.toggle('active', mode === 'ZERO_ONLY');
    if (bPur) bPur.classList.toggle('active', mode === 'PURCHASED_ONLY');
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
      const dsrName = this.cleanDSRName(s.dsr);
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
    const tbody = document.getElementById('zeroShopTbody');
    const tfoot = document.getElementById('zeroShopTfoot');
    if (!tbody) return;

    const rawShopList = window.shopDataMaster || [];
    if (rawShopList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:35px; color:#f59e0b; font-weight:bold;">'Source Files' tab mein jaa kar 'MF Outlet List Detail.xlsx' upload karein.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    // 1. Sales Dump Match Set
    const activeShopDict = new Map();
    const salesDumpRecords = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    salesDumpRecords.forEach(r => {
      const q = parseFloat(r.qty || 0);
      if (q > 0) {
        const stdPop = this.standardizePop(r.pop);
        const brandName = (r.brand || '').trim();
        if (stdPop) {
          if (!activeShopDict.has(stdPop)) activeShopDict.set(stdPop, new Set());
          if (brandName) activeShopDict.get(stdPop).add(brandName);
        }
      }
    });

    // 2. Process Shops from Master
    const popCodeSeen = new Set();
    const processedShops = [];
    const allDsrs = new Set();

    let totalShops = 0;
    let totalPurchased = 0;
    let totalZero = 0;

    rawShopList.forEach(shop => {
      const rawCode = String(shop.pop || '').trim();
      const stdCode = this.standardizePop(rawCode);
      const dsrName = this.cleanDSRName(shop.dsr);
      const section = (shop.section || '').trim();

      if (stdCode && !popCodeSeen.has(stdCode)) {
        popCodeSeen.add(stdCode);
        totalShops++;
        allDsrs.add(dsrName);

        const isPurchased = activeShopDict.has(stdCode) || activeShopDict.has(this.standardizePop(shop.fullPop));
        let brandsCount = 0;
        if (activeShopDict.has(stdCode)) {
          brandsCount = activeShopDict.get(stdCode).size;
        } else if (activeShopDict.has(this.standardizePop(shop.fullPop))) {
          brandsCount = activeShopDict.get(this.standardizePop(shop.fullPop)).size;
        }

        if (isPurchased) totalPurchased++; else totalZero++;

        processedShops.push({
          shopCode: rawCode,
          name: shop.name || 'Unnamed Outlet',
          dsr: dsrName,
          section: section,
          status: isPurchased ? 'Purchased' : 'Zero Purchase',
          brandsBought: brandsCount
        });
      }
    });

    // Dropdown sync
    const dsrSelect = document.getElementById('selectZeroShopDSR');
    if (dsrSelect && dsrSelect.options.length <= 1) {
      const sortedDsrs = Array.from(allDsrs).sort();
      dsrSelect.innerHTML = `<option value="ALL">ALL DSRs</option>` + sortedDsrs.map(d => `<option value="${d}">${d}</option>`).join('');
      dsrSelect.value = this.selectedDsr;
      this.updateSectionDropdown();
    }

    // Counters update
    const cntAll = document.getElementById('cntAll');
    const cntZero = document.getElementById('cntZero');
    const cntPur = document.getElementById('cntPur');
    const ratioBadge = document.getElementById('buyingRatioBadge');

    if (cntAll) cntAll.innerText = totalShops.toLocaleString();
    if (cntZero) cntZero.innerText = totalZero.toLocaleString();
    if (cntPur) cntPur.innerText = totalPurchased.toLocaleString();
    if (ratioBadge) {
      const ratio = totalShops > 0 ? ((totalPurchased / totalShops) * 100).toFixed(1) : '0.0';
      ratioBadge.innerText = `Buying Ratio: ${ratio}%`;
    }

    // Filter Table
    const searchText = (document.getElementById('inputZeroShopSearch')?.value || '').toLowerCase().trim();
    const filteredShops = processedShops.filter(s => {
      if (this.activeFilter === 'ZERO_ONLY' && s.status !== 'Zero Purchase') return false;
      if (this.activeFilter === 'PURCHASED_ONLY' && s.status !== 'Purchased') return false;
      if (this.selectedDsr !== 'ALL' && s.dsr !== this.selectedDsr) return false;
      if (this.selectedSection !== 'ALL' && s.section !== this.selectedSection) return false;
      if (searchText) {
        if (!s.shopCode.toLowerCase().includes(searchText) && 
            !s.name.toLowerCase().includes(searchText) && 
            !s.dsr.toLowerCase().includes(searchText) && 
            !s.section.toLowerCase().includes(searchText)) {
          return false;
        }
      }
      return true;
    });

    let shopRowsHtml = '';
    let visiblePurchased = 0;
    let visibleZero = 0;
    let visibleBrandsSum = 0;

    filteredShops.forEach(s => {
      const isZero = s.status === 'Zero Purchase';
      if (isZero) visibleZero++; else visiblePurchased++;
      visibleBrandsSum += s.brandsBought;

      const statusBadge = isZero
        ? `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:3px 10px; border-radius:4px; font-weight:800; font-size:11px;">Zero Purchase</span>`
        : `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:3px 10px; border-radius:4px; font-weight:800; font-size:11px;">Purchased</span>`;

      shopRowsHtml += `
        <tr>
          <td style="font-family:'Consolas', monospace; font-weight:700; color:#38bdf8;">${s.shopCode}</td>
          <td style="font-weight:700;">${s.name}</td>
          <td>${s.dsr}</td>
          <td style="color:var(--text-muted); font-size:11px;">${s.section}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td class="num highlight-pct" style="font-weight:800; font-size:12px; text-align:right;">${s.brandsBought}</td>
        </tr>
      `;
    });

    tbody.innerHTML = shopRowsHtml || `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;">No matching shops found.</td></tr>`;

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="total-row">
          <td>GRAND TOTAL</td>
          <td>Visible Shops: ${filteredShops.length.toLocaleString()}</td>
          <td colspan="2"></td>
          <td style="text-align:center; font-size:11.5px;">Purchased: ${visiblePurchased} | Zero: ${visibleZero}</td>
          <td class="num highlight-pct" style="color:#ffffff !important; text-align:right;">${visibleBrandsSum}</td>
        </tr>
      `;
    }

    attachExcelSelectionListeners();
  }
};