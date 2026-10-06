// Persistent Date State Memory across tab switches
if (!window.prodDateState) {
  window.prodDateState = {
    lmFrom: window.lmSelectedFrom || '',
    lmTo: window.lmSelectedTo || '',
    cmFrom: window.cmSelectedFrom || '',
    cmTo: window.cmSelectedTo || ''
  };
}

window.ProductivityModule = {
  // Ensure dates are read from dump if state is initially empty
  syncInitialDatesFromDumps: function() {
    if (!window.prodDateState.lmFrom || !window.prodDateState.lmTo) {
      if (typeof lmDump !== 'undefined' && lmDump && lmDump.allDates && lmDump.allDates.length > 0) {
        window.prodDateState.lmFrom = lmDump.allDates[0];
        window.prodDateState.lmTo = lmDump.allDates[lmDump.allDates.length - 1];
        window.lmSelectedFrom = window.prodDateState.lmFrom;
        window.lmSelectedTo = window.prodDateState.lmTo;
      }
    }
    if (!window.prodDateState.cmFrom || !window.prodDateState.cmTo) {
      if (typeof cmDump !== 'undefined' && cmDump && cmDump.allDates && cmDump.allDates.length > 0) {
        window.prodDateState.cmFrom = cmDump.allDates[0];
        window.prodDateState.cmTo = cmDump.allDates[cmDump.allDates.length - 1];
        window.cmSelectedFrom = window.prodDateState.cmFrom;
        window.cmSelectedTo = window.prodDateState.cmTo;
      }
    }
  },

  getDumpMonthName: function() {
    const targetDump = (currentMonthView === 'CM') ? cmDump : lmDump;
    if (targetDump && targetDump.deliveredRecords && targetDump.deliveredRecords.length > 0) {
      const sample = targetDump.deliveredRecords.find(r => r.date);
      if (sample && sample.date) {
        const d = new Date(sample.date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        }
      }
    }
    return (currentMonthView === 'CM') ? 'Current Month' : 'Last Month';
  },

  renderHTML: function() {
    this.syncInitialDatesFromDumps();
    const isCompare = (typeof currentMonthView !== 'undefined' && currentMonthView === 'COMPARE');
    const isCM = (typeof currentMonthView !== 'undefined' && currentMonthView === 'CM');

    const curSingleFrom = isCM ? window.prodDateState.cmFrom : window.prodDateState.lmFrom;
    const curSingleTo = isCM ? window.prodDateState.cmTo : window.prodDateState.lmTo;

    return `
      <!-- TOP CONTROL & METRICS BAR -->
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:8px;">
        
        <!-- ROW 1: DUAL RANGE & TIME GONE (Only for COMPARE View) -->
        <div id="compareHeaderControls" style="display:${isCompare ? 'flex' : 'none'}; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="display:flex; align-items:center; gap:6px; background:var(--bg-panel); border:1px solid var(--border-color); padding:3px 8px; border-radius:4px;">
              <span style="font-weight:700; font-size:10.5px; color:var(--text-main);">📅 LM RANGE:</span>
              <input type="date" id="lmFromDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${window.prodDateState.lmFrom || ''}" onchange="ProductivityModule.onDateRangeFilter('LM', 'from', this.value)" />
              <span style="font-size:10px; color:var(--text-muted);">to</span>
              <input type="date" id="lmToDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${window.prodDateState.lmTo || ''}" onchange="ProductivityModule.onDateRangeFilter('LM', 'to', this.value)" />
            </div>

            <div style="display:flex; align-items:center; gap:6px; background:var(--bg-panel); border:1px solid var(--border-color); padding:3px 8px; border-radius:4px;">
              <span style="font-weight:700; font-size:10.5px; color:var(--text-main);">⚡ CM RANGE:</span>
              <input type="date" id="cmFromDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${window.prodDateState.cmFrom || ''}" onchange="ProductivityModule.onDateRangeFilter('CM', 'from', this.value)" />
              <span style="font-size:10px; color:var(--text-muted);">to</span>
              <input type="date" id="cmToDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${window.prodDateState.cmTo || ''}" onchange="ProductivityModule.onDateRangeFilter('CM', 'to', this.value)" />
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <div class="time-gone-card">
              <div class="tg-col">
                <span class="tg-label">Total Days</span>
                <input type="number" id="prodTotalDays" class="tg-input" value="${typeof prodTotalDays !== 'undefined' ? prodTotalDays : 26}" min="1" max="31" onchange="onAdjustProdTimeGone()" />
              </div>
              <div class="tg-col">
                <span class="tg-label">Days Gone</span>
                <input type="number" id="prodDaysPassed" class="tg-input" value="${typeof prodDaysGone !== 'undefined' ? prodDaysGone : 2}" min="0" max="31" onchange="onAdjustProdTimeGone()" />
              </div>
              <div class="tg-col">
                <span class="tg-label">Days Left</span>
                <span id="prodDaysLeft" class="tg-val">${typeof prodDaysLeft !== 'undefined' ? prodDaysLeft : 24}</span>
              </div>
              <div class="tg-col">
                <span class="tg-label">Time Gone %</span>
                <span id="prodTimeGonePct" class="tg-val">${typeof prodTimeGonePct !== 'undefined' ? (prodTimeGonePct * 100).toFixed(1) + '%' : '7.7%'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 1 (ALT): ACTION BUTTONS FOR COMPARE -->
        <div id="compareActionBtns" style="display:${isCompare ? 'flex' : 'none'}; align-items:center; gap:8px;">
          <button class="btn-act btn-all" onclick="SourceFilesModule.uploadDumpFile('LM')">📤 Upload LM</button>
          <button class="btn-act btn-all" style="background:#059669;" onclick="SourceFilesModule.uploadDumpFile('CM')">📤 Upload CM</button>
          <button class="btn-act btn-copy-text" onclick="copyProductivitySummary()">📋 Copy Text</button>
          <button class="btn-act btn-all" style="background:#0284c7;" onclick="copyTableAsImage('prodTable')">📸 Copy Image (Ctrl+C)</button>
        </div>

        <!-- ROW 2: TABS & FILTERS -->
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <div class="mode-buttons">
              <button id="btnMonthLM" class="btn-mode ${currentMonthView === 'LM' ? 'active' : ''}" onclick="switchMonthView('LM')">📅 LM (Last Month)</button>
              <button id="btnMonthCM" class="btn-mode ${currentMonthView === 'CM' ? 'active' : ''}" onclick="switchMonthView('CM')">⚡ CM (Current Month)</button>
              <button id="btnMonthCompare" class="btn-mode ${currentMonthView === 'COMPARE' ? 'active' : ''}" onclick="switchMonthView('COMPARE')">⚔️ CM vs LM Comparison</button>
            </div>

            <div class="mode-buttons">
              <button id="tabProdDSR" class="btn-mode ${currentProdTab === 'DSR' ? 'active' : ''}" onclick="switchProductivitySubTab('DSR')">👤 DSR Wise</button>
              <button id="tabProdBrand" class="btn-mode ${currentProdTab === 'BRAND' ? 'active' : ''}" onclick="switchProductivitySubTab('BRAND')">🏷️ Brand Wise</button>
              <button id="tabProdSKU" class="btn-mode ${currentProdTab === 'SKU' ? 'active' : ''}" onclick="switchProductivitySubTab('SKU')">📦 SKU Wise</button>
            </div>

            <div class="filter-group" id="filterGroupDSR">
              <span class="filter-label">DSR:</span>
              <select id="selectDSRFilterProd" class="custom-select" onchange="ProductivityModule.renderTable()" style="min-width:200px;">
                <option value="ALL" selected>ALL DSRs</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ROW 3: SINGLE MONTH FILTERS (STRICT LABEL & PERSISTENT DATES) -->
        <div id="singleMonthFilterRow" style="display:${!isCompare ? 'flex' : (currentProdTab !== 'DSR' ? 'flex' : 'none')}; align-items:center; gap:10px; flex-wrap:wrap; margin-top:2px;">
          <div class="filter-group" id="filterGroupBrand">
            <span class="filter-label">BRAND:</span>
            <select id="selectBrandFilterProd" class="custom-select" onchange="ProductivityModule.renderTable()" style="min-width:160px;">
              <option value="ALL" selected>ALL BRANDS</option>
            </select>
          </div>

          <div id="singleDateRangeBox" style="display:${!isCompare ? 'flex' : 'none'}; align-items:center; gap:6px; background:var(--bg-panel); border:1px solid var(--border-color); padding:3px 8px; border-radius:4px;">
            <span id="singleDateLabel" style="font-weight:700; font-size:10.5px; color:var(--text-main);">${isCM ? 'CM DATE:' : 'LM DATE:'}</span>
            <input type="date" id="singleFromDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${curSingleFrom || ''}" onchange="ProductivityModule.onSingleDateChange('from', this.value)" />
            <span style="font-size:10px; color:var(--text-muted);">to</span>
            <input type="date" id="singleToDate" class="date-input-field" style="padding:2px 4px; font-size:11px;" value="${curSingleTo || ''}" onchange="ProductivityModule.onSingleDateChange('to', this.value)" />
          </div>

          <button id="btnResetSingleDate" class="btn-act btn-all" style="display:${!isCompare ? 'inline-flex' : 'none'}; padding:3px 12px; font-size:11px;" onclick="ProductivityModule.resetDates()">Reset</button>
        </div>

        <!-- 3 EXECUTIVE SUMMARY CARDS -->
        <div id="compareSummaryCards" style="display:${isCompare ? 'grid' : 'none'}; grid-template-columns: repeat(3, 1fr); gap:8px; margin-top:4px;"></div>

        <!-- DYNAMIC AUTO MONTH BANNER -->
        <div id="reportDynamicHeaderBanner" style="display:${!isCompare ? 'flex' : 'none'}; justify-content:space-between; align-items:center; background:var(--bg-panel); border:1px solid var(--border-color); padding:6px 14px; border-radius:5px; margin-top:3px;">
          <div style="font-size:12px; font-weight:800; color:var(--text-main); letter-spacing:0.3px;">
            📊 <span id="reportTabModeTitle">DSR-Wise</span> Complete Analysis Summary (<span id="reportDynamicMonthLabel" style="color:#38bdf8;">${this.getDumpMonthName()}</span>)
          </div>
          <button class="btn-act btn-all" style="padding:3px 10px; font-size:10.5px;" onclick="copyTableAsImage('prodTable')">📸 Copy Table</button>
        </div>

      </div>

      <div id="prodAlertBanner" class="live-alert-banner"></div>

      <!-- MAIN PRODUCTIVITY TABLE -->
      <div class="table-chart-container">
        <div class="table-wrapper" tabindex="0">
          <table id="prodTable">
            <thead id="prodThead"></thead>
            <tbody id="prodTbody"></tbody>
            <tfoot id="prodTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  onDateRangeFilter: function(dumpType, boundary, val) {
    if (dumpType === 'LM') {
      if (boundary === 'from') { window.prodDateState.lmFrom = val; window.lmSelectedFrom = val; }
      if (boundary === 'to') { window.prodDateState.lmTo = val; window.lmSelectedTo = val; }
    } else {
      if (boundary === 'from') { window.prodDateState.cmFrom = val; window.cmSelectedFrom = val; }
      if (boundary === 'to') { window.prodDateState.cmTo = val; window.cmSelectedTo = val; }
    }
    this.renderTable();
  },

  onSingleDateChange: function(boundary, val) {
    if (currentMonthView === 'CM') {
      if (boundary === 'from') { window.prodDateState.cmFrom = val; window.cmSelectedFrom = val; }
      if (boundary === 'to') { window.prodDateState.cmTo = val; window.cmSelectedTo = val; }
    } else {
      if (boundary === 'from') { window.prodDateState.lmFrom = val; window.lmSelectedFrom = val; }
      if (boundary === 'to') { window.prodDateState.lmTo = val; window.lmSelectedTo = val; }
    }
    this.renderTable();
  },

  resetDates: function() {
    if (currentMonthView === 'CM') {
      if (typeof cmDump !== 'undefined' && cmDump && cmDump.allDates && cmDump.allDates.length > 0) {
        window.prodDateState.cmFrom = cmDump.allDates[0];
        window.prodDateState.cmTo = cmDump.allDates[cmDump.allDates.length - 1];
      } else {
        window.prodDateState.cmFrom = '';
        window.prodDateState.cmTo = '';
      }
      window.cmSelectedFrom = window.prodDateState.cmFrom;
      window.cmSelectedTo = window.prodDateState.cmTo;
    } else {
      if (typeof lmDump !== 'undefined' && lmDump && lmDump.allDates && lmDump.allDates.length > 0) {
        window.prodDateState.lmFrom = lmDump.allDates[0];
        window.prodDateState.lmTo = lmDump.allDates[lmDump.allDates.length - 1];
      } else {
        window.prodDateState.lmFrom = '';
        window.prodDateState.lmTo = '';
      }
      window.lmSelectedFrom = window.prodDateState.lmFrom;
      window.lmSelectedTo = window.prodDateState.lmTo;
    }

    const sf = document.getElementById('singleFromDate');
    const st = document.getElementById('singleToDate');
    if (sf) sf.value = (currentMonthView === 'CM') ? window.prodDateState.cmFrom : window.prodDateState.lmFrom;
    if (st) st.value = (currentMonthView === 'CM') ? window.prodDateState.cmTo : window.prodDateState.lmTo;

    this.renderTable();
  },

  getFilteredDumpRecords: function() {
    const targetDump = (currentMonthView === 'CM') ? cmDump : lmDump;
    if (!targetDump || !targetDump.deliveredRecords) return [];

    const activeDSR = document.getElementById('selectDSRFilterProd')?.value || 'ALL';
    const activeBrand = document.getElementById('selectBrandFilterProd')?.value || 'ALL';
    
    // Exact persistent range
    const fDate = (currentMonthView === 'CM') ? window.prodDateState.cmFrom : window.prodDateState.lmFrom;
    const tDate = (currentMonthView === 'CM') ? window.prodDateState.cmTo : window.prodDateState.lmTo;

    return targetDump.deliveredRecords.filter(r => {
      const dName = (r.rawDsr || r.dsr);
      const matchDSR = (activeDSR === 'ALL' || dName === activeDSR);
      const matchBrand = (activeBrand === 'ALL' || r.brand === activeBrand);
      let matchDate = true;
      if (fDate && r.date && r.date < fDate) matchDate = false;
      if (tDate && r.date && r.date > tDate) matchDate = false;
      return matchDSR && matchBrand && matchDate;
    });
  },

  renderTable: function() {
    const thead = document.getElementById('prodThead');
    const tbody = document.getElementById('prodTbody');
    const tfoot = document.getElementById('prodTfoot');
    if (!thead || !tbody || !tfoot) return;

    this.syncInitialDatesFromDumps();

    const isCompare = (currentMonthView === 'COMPARE');
    const isCM = (currentMonthView === 'CM');

    document.getElementById('btnMonthLM')?.classList.toggle('active', currentMonthView === 'LM');
    document.getElementById('btnMonthCM')?.classList.toggle('active', currentMonthView === 'CM');
    document.getElementById('btnMonthCompare')?.classList.toggle('active', isCompare);

    document.getElementById('tabProdDSR')?.classList.toggle('active', currentProdTab === 'DSR');
    document.getElementById('tabProdBrand')?.classList.toggle('active', currentProdTab === 'BRAND');
    document.getElementById('tabProdSKU')?.classList.toggle('active', currentProdTab === 'SKU');

    const cmpCtrls = document.getElementById('compareHeaderControls');
    const cmpBtns = document.getElementById('compareActionBtns');
    const cmpCards = document.getElementById('compareSummaryCards');
    const singleFilterRow = document.getElementById('singleMonthFilterRow');
    const singleDateBox = document.getElementById('singleDateRangeBox');
    const btnReset = document.getElementById('btnResetSingleDate');
    const dateLbl = document.getElementById('singleDateLabel');
    const dynamicBanner = document.getElementById('reportDynamicHeaderBanner');
    const monthLabel = document.getElementById('reportDynamicMonthLabel');
    const modeTitle = document.getElementById('reportTabModeTitle');

    if (cmpCtrls) cmpCtrls.style.display = isCompare ? 'flex' : 'none';
    if (cmpBtns) cmpBtns.style.display = isCompare ? 'flex' : 'none';
    if (cmpCards) cmpCards.style.display = isCompare ? 'grid' : 'none';
    if (singleFilterRow) singleFilterRow.style.display = (!isCompare || currentProdTab !== 'DSR') ? 'flex' : 'none';
    if (singleDateBox) singleDateBox.style.display = !isCompare ? 'flex' : 'none';
    if (btnReset) btnReset.style.display = !isCompare ? 'inline-flex' : 'none';
    if (dynamicBanner) dynamicBanner.style.display = !isCompare ? 'flex' : 'none';

    // Strict Fix: Label reflects exact mode
    if (dateLbl) {
      dateLbl.innerText = isCM ? 'CM DATE:' : 'LM DATE:';
    }

    if (monthLabel) monthLabel.innerText = this.getDumpMonthName();
    if (modeTitle) {
      if (currentProdTab === 'BRAND') modeTitle.innerText = 'Brand-Wise';
      else if (currentProdTab === 'SKU') modeTitle.innerText = 'SKU-Wise';
      else modeTitle.innerText = 'DSR-Wise';
    }

    // Retain date inputs with persistent memory
    const sf = document.getElementById('singleFromDate');
    const st = document.getElementById('singleToDate');
    if (sf && st && !isCompare) {
      sf.value = isCM ? (window.prodDateState.cmFrom || '') : (window.prodDateState.lmFrom || '');
      st.value = isCM ? (window.prodDateState.cmTo || '') : (window.prodDateState.lmTo || '');
    }

    const lmFromEl = document.getElementById('lmFromDate');
    const lmToEl = document.getElementById('lmToDate');
    const cmFromEl = document.getElementById('cmFromDate');
    const cmToEl = document.getElementById('cmToDate');
    if (lmFromEl) lmFromEl.value = window.prodDateState.lmFrom || '';
    if (lmToEl) lmToEl.value = window.prodDateState.lmTo || '';
    if (cmFromEl) cmFromEl.value = window.prodDateState.cmFrom || '';
    if (cmToEl) cmToEl.value = window.prodDateState.cmTo || '';

    // 1. COMPARISON VIEW
    if (isCompare) {
      this.renderCompareTable(thead, tbody, tfoot);
      if (typeof attachExcelSelectionListeners === 'function') attachExcelSelectionListeners();
      return;
    }

    // 2. SINGLE MONTH VIEW (LM / CM)
    let colTitle = 'DSR Name';
    if (currentProdTab === 'BRAND') colTitle = 'Brand Name';
    else if (currentProdTab === 'SKU') colTitle = 'SKU Description';

    thead.innerHTML = `
      <tr>
        <th style="min-width:220px;">${colTitle}</th>
        <th class="num" style="min-width:110px;">Total Outlets</th>
        <th class="num" style="min-width:150px;">UNIQUE PRODUCTIVE SHOPS</th>
        <th class="num" style="min-width:130px;">PRODUCTIVITY %</th>
        <th class="num" style="min-width:110px;">SALE IN CTN</th>
        <th class="num" style="min-width:130px;">NET_SALE</th>
        <th class="num" style="min-width:125px;">Drop_Size_Value</th>
        <th class="num" style="min-width:110px;">SKU_Per_Bill</th>
      </tr>
    `;

    const records = this.getFilteredDumpRecords();
    const grouped = new Map();
    const overallBillMap = new Map();

    records.forEach(r => {
      let key = (r.rawDsr || r.dsr);
      if (currentProdTab === 'BRAND') key = r.brand;
      else if (currentProdTab === 'SKU') key = r.sku;
      if (!key) return;

      if (!grouped.has(key)) {
        grouped.set(key, { 
          key, 
          pops: new Set(), 
          billMap: new Map(),
          ctn: 0,
          net: 0 
        });
      }
      const item = grouped.get(key);
      const popKey = String(r.pop || '').trim();
      const skuName = String(r.sku || '').trim();
      const billKey = r.billId || (popKey + '_' + (r.date || ''));

      if (popKey) item.pops.add(popKey);

      if (billKey) {
        if (!item.billMap.has(billKey)) item.billMap.set(billKey, new Set());
        if (skuName) item.billMap.get(billKey).add(skuName);

        if (!overallBillMap.has(billKey)) overallBillMap.set(billKey, new Set());
        if (skuName) overallBillMap.get(billKey).add(skuName);
      }

      item.ctn += (r.qty || 0);
      item.net += (r.net || 0);
    });

    const activeUniverse = typeof getActiveUniverse === 'function' ? getActiveUniverse() : 2394;
    const sorted = Array.from(grouped.values()).sort((a,b) => b.pops.size - a.pops.size);

    let totUniqueSet = new Set();
    let totCtn = 0;
    let totNet = 0;

    let bHtml = '';
    sorted.forEach(row => {
      let rowUniverse = activeUniverse;
      if (currentProdTab === 'DSR') {
        rowUniverse = (typeof manualUniverseMap !== 'undefined' && manualUniverseMap[row.key] !== undefined)
          ? manualUniverseMap[row.key] 
          : (typeof PRESET_UNIVERSE !== 'undefined' ? (PRESET_UNIVERSE[row.key] || 0) : 0);
        if (!rowUniverse) rowUniverse = row.pops.size;
      }

      const uShops = row.pops.size;
      const prodPct = rowUniverse > 0 ? (uShops / rowUniverse) * 100 : 0;
      const totalBills = row.billMap.size || uShops || 1;
      const dropSizeVal = totalBills > 0 ? (row.net / totalBills) : 0;

      let totalSkuHits = 0;
      row.billMap.forEach(skuSet => { totalSkuHits += skuSet.size; });
      const skuPerBill = totalBills > 0 ? (totalSkuHits / totalBills) : 0;

      row.pops.forEach(p => totUniqueSet.add(p));
      totCtn += row.ctn;
      totNet += row.net;

      bHtml += `
        <tr>
          <td class="cell-dsr-name" title="${row.key}" style="font-weight:700;">${row.key}</td>
          <td class="num">${rowUniverse.toFixed(2)}</td>
          <td class="num" style="font-weight:700;">${uShops.toFixed(2)}</td>
          <td class="num" style="font-weight:700;">${prodPct.toFixed(2)}%</td>
          <td class="num">${row.ctn.toFixed(2)}</td>
          <td class="num">${row.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="num">${dropSizeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="num" style="font-weight:700;">${skuPerBill.toFixed(2)}</td>
        </tr>
      `;
    });

    if (sorted.length === 0) {
      bHtml = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No data found for selected criteria.</td></tr>`;
    }
    tbody.innerHTML = bHtml;

    const grandUnique = totUniqueSet.size;
    const grandPct = activeUniverse > 0 ? (grandUnique / activeUniverse) * 100 : 0;
    const grandTotalBills = overallBillMap.size || grandUnique || 1;
    const grandDropSize = grandTotalBills > 0 ? (totNet / grandTotalBills) : 0;

    let grandSkuHits = 0;
    overallBillMap.forEach(skuSet => { grandSkuHits += skuSet.size; });
    const grandSkuPerBill = grandTotalBills > 0 ? (grandSkuHits / grandTotalBills) : 0;

    tfoot.innerHTML = `
      <tr class="total-row">
        <td style="font-weight:800;">Total</td>
        <td class="num">${activeUniverse.toFixed(2)}</td>
        <td class="num">${grandUnique.toFixed(2)}</td>
        <td class="num">${grandPct.toFixed(2)}%</td>
        <td class="num">${totCtn.toFixed(2)}</td>
        <td class="num">${totNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="num">${grandDropSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="num">${grandSkuPerBill.toFixed(2)}</td>
      </tr>
    `;

    if (typeof attachExcelSelectionListeners === 'function') attachExcelSelectionListeners();
  },

  // -------------------------------------------------------------
  // ADVANCED COMPARISON: WITH PERSISTENT DATE-TO-DATE ENGINE
  // -------------------------------------------------------------
  renderCompareTable: function(thead, tbody, tfoot) {
    const lmRecs = (typeof lmDump !== 'undefined' && lmDump && lmDump.deliveredRecords) ? lmDump.deliveredRecords : [];
    const cmRecs = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    const activeDSR = document.getElementById('selectDSRFilterProd')?.value || 'ALL';
    const activeBrand = document.getElementById('selectBrandFilterProd')?.value || 'ALL';

    const filterFn = (r) => {
      const dName = (r.rawDsr || r.dsr);
      const matchDSR = (activeDSR === 'ALL' || dName === activeDSR);
      const matchBrand = (activeBrand === 'ALL' || r.brand === activeBrand);
      return matchDSR && matchBrand;
    };

    const lmFrom = window.prodDateState.lmFrom;
    const lmTo = window.prodDateState.lmTo;
    const cmFrom = window.prodDateState.cmFrom;
    const cmTo = window.prodDateState.cmTo;

    const lmFiltered = lmRecs.filter(filterFn).filter(r => {
      if (lmFrom && r.date && r.date < lmFrom) return false;
      if (lmTo && r.date && r.date > lmTo) return false;
      return true;
    });

    const cmFiltered = cmRecs.filter(filterFn).filter(r => {
      if (cmFrom && r.date && r.date < cmFrom) return false;
      if (cmTo && r.date && r.date > cmTo) return false;
      return true;
    });

    let colTitle = 'DSR Name';
    if (currentProdTab === 'BRAND') colTitle = 'Brand Name';
    else if (currentProdTab === 'SKU') colTitle = 'SKU Description';

    thead.innerHTML = `
      <tr>
        <th style="min-width:180px;">${colTitle}</th>
        <th class="num" style="min-width:85px;">Universe</th>
        <th class="num" style="min-width:90px;">LM Shops</th>
        <th class="num" style="min-width:85px;">LM %</th>
        <th class="num" style="min-width:90px;">CM Shops</th>
        <th class="num" style="min-width:85px;">CM %</th>
        <th class="num" style="min-width:85px;">Shop Gap</th>
        <th class="num" style="min-width:85px;">LM CTN</th>
        <th class="num" style="min-width:85px;">CM CTN</th>
        <th class="num" style="min-width:85px;">Qty Gap</th>
        <th class="num" style="min-width:85px;">Growth %</th>
        <th class="num" style="min-width:95px;">LM Sales</th>
        <th class="num" style="min-width:95px;">CM Sales</th>
        <th class="num" style="min-width:95px;">Value Gap</th>
        <th class="num" style="min-width:95px;">CM MTD CTN</th>
        <th style="min-width:95px; text-align:center;">Status</th>
      </tr>
    `;

    const lmMap = new Map();
    lmFiltered.forEach(r => {
      let key = (r.rawDsr || r.dsr);
      if (currentProdTab === 'BRAND') key = r.brand;
      else if (currentProdTab === 'SKU') key = r.sku;
      if (!key) return;

      if (!lmMap.has(key)) lmMap.set(key, { pops: new Set(), ctn: 0, net: 0 });
      const item = lmMap.get(key);
      if (r.pop) item.pops.add(r.pop);
      item.ctn += (r.qty || 0);
      item.net += (r.net || 0);
    });

    const cmMap = new Map();
    cmFiltered.forEach(r => {
      let key = (r.rawDsr || r.dsr);
      if (currentProdTab === 'BRAND') key = r.brand;
      else if (currentProdTab === 'SKU') key = r.sku;
      if (!key) return;

      if (!cmMap.has(key)) cmMap.set(key, { pops: new Set(), ctn: 0, net: 0 });
      const item = cmMap.get(key);
      if (r.pop) item.pops.add(r.pop);
      item.ctn += (r.qty || 0);
      item.net += (r.net || 0);
    });

    const allKeys = Array.from(new Set([...lmMap.keys(), ...cmMap.keys()])).sort();
    let totalUniverse = typeof getActiveUniverse === 'function' ? getActiveUniverse() : 2394;

    let totLmUnique = new Set();
    let totCmUnique = new Set();
    let totLmCtn = 0;
    let totCmCtn = 0;
    let totCmMtdCtn = 0;
    let totLmNet = 0;
    let totCmNet = 0;

    const tDays = (typeof prodTotalDays !== 'undefined' && prodTotalDays > 0) ? prodTotalDays : 26;
    const dGone = (typeof prodDaysGone !== 'undefined' && prodDaysGone > 0) ? prodDaysGone : 2;

    let winningCount = 0;
    let laggingCount = 0;

    let bHtml = '';
    allKeys.forEach(k => {
      const lm = lmMap.get(k) || { pops: new Set(), ctn: 0, net: 0 };
      const cm = cmMap.get(k) || { pops: new Set(), ctn: 0, net: 0 };

      lm.pops.forEach(p => totLmUnique.add(p));
      cm.pops.forEach(p => totCmUnique.add(p));
      totLmCtn += lm.ctn;
      totCmCtn += cm.ctn;
      totLmNet += lm.net;
      totCmNet += cm.net;

      let rowUniverse = totalUniverse;
      if (currentProdTab === 'DSR') {
        rowUniverse = (typeof manualUniverseMap !== 'undefined' && manualUniverseMap[k] !== undefined)
          ? manualUniverseMap[k] 
          : (typeof PRESET_UNIVERSE !== 'undefined' ? (PRESET_UNIVERSE[k] || 0) : 0);
        if (!rowUniverse) rowUniverse = Math.max(lm.pops.size, cm.pops.size);
      }

      const lmUniqueCount = lm.pops.size;
      const cmUniqueCount = cm.pops.size;

      const lmUniquePct = rowUniverse > 0 ? (lmUniqueCount / rowUniverse) * 100 : 0;
      const cmUniquePct = rowUniverse > 0 ? (cmUniqueCount / rowUniverse) * 100 : 0;

      const growthShops = cmUniqueCount - lmUniqueCount;

      const qtyVariance = cm.ctn - lm.ctn;
      const valVariance = cm.net - lm.net;
      const growthPct = lm.ctn > 0 ? ((cm.ctn - lm.ctn) / lm.ctn) * 100 : 0;

      const cmMtdCtn = dGone > 0 ? ((cm.ctn / dGone) * tDays) : 0;
      totCmMtdCtn += cmMtdCtn;

      let statusBadge = '';
      if (growthPct >= 0) {
        winningCount++;
        statusBadge = `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px;">🟢 LEAD</span>`;
      } else if (growthPct >= -15) {
        laggingCount++;
        statusBadge = `<span style="background:rgba(245, 158, 11, 0.15); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px;">🟡 AT RISK</span>`;
      } else {
        laggingCount++;
        statusBadge = `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px;">🔴 CRITICAL</span>`;
      }

      const shopGapSign = growthShops > 0 ? `+${growthShops}` : growthShops;
      const qtyGapSign = qtyVariance > 0 ? `+${qtyVariance.toFixed(2)}` : qtyVariance.toFixed(2);
      const valGapSign = valVariance > 0 ? `+${Math.round(valVariance).toLocaleString()}` : Math.round(valVariance).toLocaleString();
      const growthSign = growthPct > 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`;

      bHtml += `
        <tr>
          <td class="cell-dsr-name" title="${k}" style="font-weight:700;">${k}</td>
          <td class="num">${rowUniverse.toFixed(0)}</td>
          <td class="num">${lmUniqueCount.toFixed(0)}</td>
          <td class="num" style="font-weight:700;">${lmUniquePct.toFixed(1)}%</td>
          <td class="num" style="font-weight:700;">${cmUniqueCount.toFixed(0)}</td>
          <td class="num" style="font-weight:700;">${cmUniquePct.toFixed(1)}%</td>
          <td class="num ${growthShops >= 0 ? 'cf-green' : 'cf-red'}">${shopGapSign}</td>
          <td class="num">${lm.ctn.toFixed(2)}</td>
          <td class="num" style="font-weight:700;">${cm.ctn.toFixed(2)}</td>
          <td class="num ${qtyVariance >= 0 ? 'cf-green' : 'cf-red'}">${qtyGapSign}</td>
          <td class="num ${growthPct >= 0 ? 'cf-green' : 'cf-red'}" style="font-weight:800;">${growthSign}</td>
          <td class="num">${Math.round(lm.net).toLocaleString()}</td>
          <td class="num" style="font-weight:700;">${Math.round(cm.net).toLocaleString()}</td>
          <td class="num ${valVariance >= 0 ? 'cf-green' : 'cf-red'}">${valGapSign}</td>
          <td class="num" style="font-weight:700;">${cmMtdCtn.toFixed(2)}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    });

    if (allKeys.length === 0) {
      bHtml = `<tr><td colspan="16" style="text-align:center; padding:30px; color:var(--text-muted);">No comparison data available in dumps.</td></tr>`;
    }
    tbody.innerHTML = bHtml;

    const gLmUniqueCount = totLmUnique.size;
    const gCmUniqueCount = totCmUnique.size;
    const gLmUniquePct = totalUniverse > 0 ? (gLmUniqueCount / totalUniverse) * 100 : 0;
    const gCmUniquePct = totalUniverse > 0 ? (gCmUniqueCount / totalUniverse) * 100 : 0;
    const gGrowthShops = gCmUniqueCount - gLmUniqueCount;
    const gQtyVariance = totCmCtn - totLmCtn;
    const gValVariance = totCmNet - totLmNet;
    const gGrowthPct = totLmCtn > 0 ? ((totCmCtn - totLmCtn) / totLmCtn) * 100 : 0;

    tfoot.innerHTML = `
      <tr class="total-row">
        <td style="font-weight:800;">Total</td>
        <td class="num">${totalUniverse.toFixed(0)}</td>
        <td class="num">${gLmUniqueCount.toFixed(0)}</td>
        <td class="num">${gLmUniquePct.toFixed(1)}%</td>
        <td class="num">${gCmUniqueCount.toFixed(0)}</td>
        <td class="num">${gCmUniquePct.toFixed(1)}%</td>
        <td class="num ${gGrowthShops >= 0 ? 'cf-green' : 'cf-red'}">${gGrowthShops > 0 ? '+' + gGrowthShops : gGrowthShops}</td>
        <td class="num">${totLmCtn.toFixed(2)}</td>
        <td class="num">${totCmCtn.toFixed(2)}</td>
        <td class="num ${gQtyVariance >= 0 ? 'cf-green' : 'cf-red'}">${gQtyVariance > 0 ? '+' + gQtyVariance.toFixed(2) : gQtyVariance.toFixed(2)}</td>
        <td class="num ${gGrowthPct >= 0 ? 'cf-green' : 'cf-red'}" style="font-weight:800;">${gGrowthPct > 0 ? '+' + gGrowthPct.toFixed(1) : gGrowthPct.toFixed(1)}%</td>
        <td class="num">${Math.round(totLmNet).toLocaleString()}</td>
        <td class="num">${Math.round(totCmNet).toLocaleString()}</td>
        <td class="num ${gValVariance >= 0 ? 'cf-green' : 'cf-red'}">${gValVariance > 0 ? '+' + Math.round(gValVariance).toLocaleString() : Math.round(gValVariance).toLocaleString()}</td>
        <td class="num" style="font-weight:800;">${totCmMtdCtn.toFixed(2)}</td>
        <td style="text-align:center;">${gGrowthPct >= 0 ? '🟢 AHEAD' : '⚠️ DEFICIT'}</td>
      </tr>
    `;

    const cmpCards = document.getElementById('compareSummaryCards');
    if (cmpCards) {
      cmpCards.innerHTML = `
        <div style="background:var(--bg-panel); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px;">
          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Volume Gap (CTN)</div>
          <div style="font-size:15px; font-weight:800; color:${gQtyVariance >= 0 ? '#10b981' : '#ef4444'}; margin-top:2px;">
            ${gQtyVariance > 0 ? '+' : ''}${gQtyVariance.toFixed(2)} CTN (${gGrowthPct.toFixed(1)}%)
          </div>
        </div>
        <div style="background:var(--bg-panel); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px;">
          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Revenue Gap (PKR)</div>
          <div style="font-size:15px; font-weight:800; color:${gValVariance >= 0 ? '#10b981' : '#ef4444'}; margin-top:2px;">
            ${gValVariance > 0 ? '+' : ''}${Math.round(gValVariance).toLocaleString()} PKR
          </div>
        </div>
        <div style="background:var(--bg-panel); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px;">
          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">DSR Standings</div>
          <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-top:2px;">
            <span style="color:#10b981;">${winningCount} Winning</span> / <span style="color:#ef4444;">${laggingCount} Lagging</span>
          </div>
        </div>
      `;
    }

    if (typeof attachExcelSelectionListeners === 'function') attachExcelSelectionListeners();
  }
};