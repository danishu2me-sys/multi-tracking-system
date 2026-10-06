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
      if (typeof shop.pop === 'object') {
        rawCode = String(shop.pop?.text || shop.pop?.result || '');
      } else {
        rawCode = String(shop.pop || '').trim();
      }
      if (!rawCode && shop.fullPop) {
        rawCode = String(shop.fullPop).slice(-8);
      }

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