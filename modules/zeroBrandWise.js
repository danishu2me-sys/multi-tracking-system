window.ZeroBrandModule = {
  selectedDsr: 'ALL',
  selectedSection: 'ALL',
  selectedBrand: 'NONE', // Default par koi brand auto-load nahi hoga
  statusFilter: 'ALL', // 'ALL', 'ZERO_ONLY', 'PURCHASED_ONLY'

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

        <!-- Quick View Mode Buttons -->
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
                <th style="color:#ffffff !important; width:110px;">Shop Code</th>
                <th style="color:#ffffff !important; min-width:230px;">Shop Name</th>
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

    // Dropdown populate brands from Sales Dump
    const allDumpBrands = new Set();
    const salesDumpRecords = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    salesDumpRecords.forEach(r => {
      const brandName = (r.brand || '').trim().toUpperCase();
      if (brandName) allDumpBrands.add(brandName);
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
      rawShopList.forEach(s => allDsrs.add(this.cleanDSRName(s.dsr)));
      const sortedDsrs = Array.from(allDsrs).sort();
      dsrSelect.innerHTML = `<option value="ALL">ALL DSRs</option>` + sortedDsrs.map(d => `<option value="${d}">${d}</option>`).join('');
      dsrSelect.value = this.selectedDsr;
      this.updateSectionDropdown();
    }

    // AGAR USER NE BRAND SELECT NAHI KIYA TO TABLE RENDER NA KAREIN (FAST LOAD)
    if (this.selectedBrand === 'NONE') {
      thead.innerHTML = `
        <tr>
          <th style="color:#ffffff !important; width:110px;">Shop Code</th>
          <th style="color:#ffffff !important; min-width:230px;">Shop Name</th>
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

    // 1. Target Single Brand Matrix
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
        <th style="color:#ffffff !important; width:110px;">Shop Code</th>
        <th style="color:#ffffff !important; min-width:230px;">Shop / Customer Name</th>
        <th style="color:#ffffff !important; width:160px;">DSR Name</th>
        <th style="color:#ffffff !important; width:160px;">Section / Town</th>
        <th style="color:#ffffff !important; text-align:center; width:140px;">${targetBrand} Status</th>
      </tr>
    `;

    // 2. Filter Shops
    const searchText = (document.getElementById('inputZeroBrandSearch')?.value || '').toLowerCase().trim();
    const popCodeSeen = new Set();
    const rowsData = [];

    let totalShopsCount = 0;
    let totalPurchasedCount = 0;
    let totalZeroCount = 0;

    rawShopList.forEach(shop => {
      const rawCode = String(shop.pop || '').trim();
      const stdCode = this.standardizePop(rawCode);
      const dsrName = this.cleanDSRName(shop.dsr);
      const section = (shop.section || '').trim();

      if (stdCode && !popCodeSeen.has(stdCode)) {
        popCodeSeen.add(stdCode);

        if (this.selectedDsr !== 'ALL' && dsrName !== this.selectedDsr) return;
        if (this.selectedSection !== 'ALL' && section !== this.selectedSection) return;

        if (searchText) {
          if (!rawCode.toLowerCase().includes(searchText) &&
              !String(shop.name || '').toLowerCase().includes(searchText) &&
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
          name: shop.name || 'Unnamed Outlet',
          dsr: dsrName,
          section: section,
          isPurchased: isPurchased
        });
      }
    });

    // Counters update
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

    // 3. Render Rows
    let rowsHtml = '';
    rowsData.forEach(r => {
      const statusBadge = r.isPurchased
        ? `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Purchased</span>`
        : `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10.5px;">Zero</span>`;

      rowsHtml += `
        <tr>
          <td style="font-family:'Consolas', monospace; font-weight:700; color:#38bdf8;">${r.code}</td>
          <td style="font-weight:700;">${r.name}</td>
          <td>${r.dsr}</td>
          <td style="color:var(--text-muted); font-size:11px;">${r.section}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;">No matching shops found.</td></tr>`;

    // 4. Total Row
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

    attachExcelSelectionListeners();
  }
};