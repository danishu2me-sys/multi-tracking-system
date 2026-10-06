window.TargetModule = {
  defaultDivisions: {
    bakery: ['MAYFAIR DELIGHT', 'HEARTS'],
    biscuits: ['A1', 'CAFE', 'SPECIAL', 'BESTO', 'CREMO', 'WOW', 'BLISS'],
    confectionery: []
  },

  getDivisionConfig: function() {
    try {
      const saved = localStorage.getItem('customDivisionConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.confectionery) parsed.confectionery = [];
        return parsed;
      }
    } catch (e) {}
    return this.defaultDivisions;
  },

  saveDivisionConfig: function(cfg) {
    localStorage.setItem('customDivisionConfig', JSON.stringify(cfg));
  },

  parseDateToNum: function(d) {
    if (!d) return 0;
    const str = d.toString().split('T')[0].split(' ')[0].trim();
    if (str.includes('-')) {
      const p = str.split('-');
      if (p.length === 3) return parseInt(p[0] + p[1].padStart(2, '0') + p[2].padStart(2, '0'), 10);
    }
    if (str.includes('/')) {
      const p = str.split('/');
      if (p.length === 3) {
        let y = p[2].length === 4 ? p[2] : ('20' + p[2]);
        let part1 = parseInt(p[0], 10);
        let part2 = parseInt(p[1], 10);
        let m = part1 > 12 ? part2 : part1;
        let dVal = part1 > 12 ? part1 : part2;
        return parseInt(y + String(m).padStart(2, '0') + String(dVal).padStart(2, '0'), 10);
      }
    }
    return 0;
  },

  renderHTML: function() {
    const savedTotalDays = parseInt(localStorage.getItem('savedTotalDays') || '26', 10);
    const savedDaysGone = parseInt(localStorage.getItem('savedDaysGone') || '2', 10);
    const savedDaysLeft = Math.max(1, savedTotalDays - savedDaysGone);
    const savedTimeGonePct = savedTotalDays > 0 ? (savedDaysGone / savedTotalDays) : 1;

    return `
      <div class="control-row">
        <div class="time-gone-card">
          <div class="tg-col">
            <div class="tg-label">Month / Year</div>
            <div class="tg-val" id="tgMonth">Oct-26</div>
          </div>
          <div class="tg-col">
            <div class="tg-label">Total Days</div>
            <input type="number" id="inputTotalDays" class="tg-input" min="1" max="31" value="${savedTotalDays}" onchange="TargetModule.onAdjustTimeGone()" />
          </div>
          <div class="tg-col">
            <div class="tg-label">Days Gone</div>
            <input type="number" id="inputDaysGone" class="tg-input" min="1" max="31" value="${savedDaysGone}" onchange="TargetModule.onAdjustTimeGone()" />
          </div>
          <div class="tg-col">
            <div class="tg-label">Days Left</div>
            <div class="tg-val" id="tgDaysLeft">${savedDaysLeft}</div>
          </div>
          <div class="tg-col">
            <div class="tg-label">Time Gone %</div>
            <div class="tg-val" id="tgTimeGone">${(savedTimeGonePct * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div class="view-mode-container">
          <div class="view-mode-title">• VIEW MODE •</div>
          <div class="mode-buttons">
            <button id="btnModeDSR" class="btn-mode active" onclick="switchMode('DSR')">DSR Wise</button>
            <button id="btnModeBrand" class="btn-mode" onclick="switchMode('BRAND')">Brand Club</button>
            <button id="btnModeDivision" class="btn-mode" onclick="switchMode('DIVISION')" style="color:#000000 !important; font-weight:800;">Division Wise</button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-act btn-all" onclick="showAllData()">Show All Data</button>
          <button class="btn-act btn-custom" onclick="openCustomBrandModal()">🏷️ Custom Brand</button>
          <button class="btn-save-date btn-act" onclick="openSaveDateModal()">💾 Save Today's Report</button>
          <button class="btn-copy-text btn-act" onclick="copyReportText()">📋 Copy Text</button>
          <button class="btn-update btn-act" onclick="updateReportLive()">🔄 Sync Report</button>
        </div>
      </div>

      <div class="history-bar">
        <span style="font-weight:bold; color:#f59e0b; font-size:11px;">📅 History Date Range:</span>
        <label style="font-size:11px; color:var(--text-muted);">From:</label>
        <input type="date" id="historyFromDate" class="date-input-field" value="2026-10-01" />
        <label style="font-size:11px; color:var(--text-muted);">To:</label>
        <input type="date" id="historyToDate" class="date-input-field" value="2026-10-05" />
        <button class="btn-act btn-all" id="btnApplyRangeAction" style="padding:3px 9px;" onclick="applyHistoryDateRange()">🔍 Apply Range / Combine</button>
        <button class="btn-act" id="btnLiveViewAction" style="background:#475569; padding:3px 9px;" onclick="revertToLiveView()">⚡ Live View</button>
        <button class="btn-act" style="background:#334155; padding:3px 9px; font-size:11px;" onclick="TargetModule.openDivisionSettingsModal()" title="Customize Bakery, Biscuits & Confectionery Brands">⚙️ Division Settings</button>
        <span id="historyStatusBadge" style="font-size:10.5px; color:#10b981; margin-left:auto; font-weight:bold;">Live Report Active</span>
      </div>

      <div class="filter-bar-compact" id="targetFilterBar">
        <div class="filter-group">
          <span class="filter-label">Area:</span>
          <select id="selectArea" class="custom-select" onchange="onDropdownFilterChange('area', this.value)">
            <option value="ALL">ALL AREAS</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Distributor:</span>
          <select id="selectDist" class="custom-select" onchange="onDropdownFilterChange('dist', this.value)">
            <option value="ALL">ALL DISTRIBUTORS</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Brand:</span>
          <select id="selectBrand" class="custom-select" onchange="onDropdownFilterChange('brand', this.value)">
            <option value="ALL">ALL BRANDS</option>
          </select>
          <button id="btnDeleteCustomBrand" class="btn-del-brand" onclick="deleteActiveCustomBrand()">🗑️️ Delete</button>
        </div>
        <div class="filter-group" id="dsrFilterGroup">
          <span class="filter-label">DSR:</span>
          <select id="selectDSR" class="custom-select" onchange="onDropdownFilterChange('dsr', this.value)">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>
      </div>

      <div id="liveBanner" class="live-alert-banner"></div>

      <div class="table-chart-container">
        <div class="table-wrapper" id="mainTableWrapper" tabindex="0">
          <table id="mainTable">
            <thead id="mainThead"></thead>
            <tbody id="mainTbody">
              <tr><td colspan="11" style="text-align:center; padding:30px; color:var(--text-muted);">Go to 'Source Files' tab to upload Target Master file or sync data.</td></tr>
            </tbody>
            <tfoot id="mainTfoot"></tfoot>
          </table>
        </div>
      </div>

      <div id="divSettingsModal" class="modal-overlay">
        <div class="modal-box" style="width: 580px;">
          <div style="font-size:14px; font-weight:bold; color:#38bdf8; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            ⚙️ Division Brand Mapping Settings
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">Comma-separated brands enter karein.</p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="background:var(--bg-card); padding:10px; border-radius:6px; border:1px solid var(--border-color);">
              <label style="font-size:11px; font-weight:bold; color:#f59e0b; display:block; margin-bottom:4px;">🍞 BAKERY BRANDS:</label>
              <input type="text" id="divInputBakery" class="modal-input" placeholder="MAYFAIR DELIGHT, HEARTS" />
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:6px; border:1px solid var(--border-color);">
              <label style="font-size:11px; font-weight:bold; color:#10b981; display:block; margin-bottom:4px;">🍪 BISCUITS BRANDS:</label>
              <input type="text" id="divInputBiscuits" class="modal-input" placeholder="A1, CAFE, SPECIAL, BESTO, CREMO, WOW, BLISS" />
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:6px; border:1px solid var(--border-color);">
              <label style="font-size:11px; font-weight:bold; color:#38bdf8; display:block; margin-bottom:4px;">🍬 CONFECTIONERY BRANDS (CONF):</label>
              <input type="text" id="divInputConf" class="modal-input" placeholder="Agar blank rakhenge to baqi tamam brands auto Confectionery me count honge" />
            </div>
          </div>
          <div class="modal-actions" style="margin-top:14px;">
            <button onclick="TargetModule.closeDivisionSettingsModal()" style="background:#475569; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Cancel</button>
            <button onclick="TargetModule.saveCustomDivisionSettings()" style="background:#059669; color:#fff; border:none; padding:6px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">💾 Save Settings</button>
          </div>
        </div>
      </div>
    `;
  },

  openDivisionSettingsModal: function() {
    const cfg = this.getDivisionConfig();
    const bInp = document.getElementById('divInputBakery');
    const bisInp = document.getElementById('divInputBiscuits');
    const confInp = document.getElementById('divInputConf');
    if (bInp) bInp.value = (cfg.bakery || []).join(', ');
    if (bisInp) bisInp.value = (cfg.biscuits || []).join(', ');
    if (confInp) confInp.value = (cfg.confectionery || []).join(', ');
    const modal = document.getElementById('divSettingsModal');
    if (modal) modal.style.display = 'flex';
  },

  closeDivisionSettingsModal: function() {
    const modal = document.getElementById('divSettingsModal');
    if (modal) modal.style.display = 'none';
  },

  saveCustomDivisionSettings: function() {
    const bVal = document.getElementById('divInputBakery').value;
    const bisVal = document.getElementById('divInputBiscuits').value;
    const confVal = document.getElementById('divInputConf').value;

    const parseList = (str) => str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const newCfg = {
      bakery: parseList(bVal),
      biscuits: parseList(bisVal),
      confectionery: parseList(confVal)
    };

    this.saveDivisionConfig(newCfg);
    this.closeDivisionSettingsModal();
    if (typeof showBannerAlert === 'function') showBannerAlert("⚙️ Division brand settings saved!", "#059669");
    if (currentMode === 'DIVISION') this.renderTable();
  },

  switchMode: function(m) {
    currentMode = m;
    localStorage.setItem('savedTargetViewMode', m);
    this.renderTable();
  },

  onAdjustTimeGone: function() {
    const td = parseInt(document.getElementById('inputTotalDays')?.value, 10);
    const dg = parseInt(document.getElementById('inputDaysGone')?.value, 10);
    if (!isNaN(td) && td > 0) totalDays = td;
    if (!isNaN(dg) && dg >= 0) daysGone = dg;
    daysLeft = Math.max(1, totalDays - daysGone);
    timeGonePct = totalDays > 0 ? (daysGone / totalDays) : 1;

    // Settings ko localStorage me permanent save karein
    localStorage.setItem('savedTotalDays', totalDays);
    localStorage.setItem('savedDaysGone', daysGone);

    const dl = document.getElementById('tgDaysLeft');
    const tg = document.getElementById('tgTimeGone');
    if (dl) dl.innerText = daysLeft;
    if (tg) tg.innerText = (timeGonePct * 100).toFixed(1) + '%';
    this.renderTable();
  },

  showAllData: function() {
    activeArea = 'ALL'; activeDist = 'ALL'; activeBrand = 'ALL'; activeDSR = 'ALL';
    populateDropdowns();
    this.renderTable();
  },

  copyReportText: function() {
    const tbl = document.getElementById('mainTable');
    if (!tbl) return;
    let txt = '';
    tbl.querySelectorAll('tr').forEach(r => {
      txt += Array.from(r.querySelectorAll('th, td')).map(c => c.innerText.trim()).join('\t') + '\n';
    });
    try {
      const { clipboard } = require('electron');
      clipboard.writeText(txt);
      if (typeof showBannerAlert === 'function') showBannerAlert("📋 Report copied to clipboard!", "#10b981");
    } catch(e) {}
  },

  updateReportLive: async function() {
    if (typeof showBannerAlert === 'function') showBannerAlert("⏳ Syncing Live Report...", "#0284c7");
    if (typeof loadBothDumps === 'function') await loadBothDumps();
    if (typeof loadSavedData === 'function') await loadSavedData();
    this.renderTable();
    if (typeof showBannerAlert === 'function') showBannerAlert("✅ Live Report Synced!", "#10b981");
  },

  onDropdownFilterChange: function(type, val) {
    if (type === 'area') { activeArea = val; activeDist = 'ALL'; activeDSR = 'ALL'; }
    else if (type === 'dist') { activeDist = val; activeDSR = 'ALL'; }
    else if (type === 'brand') activeBrand = val;
    else if (type === 'dsr') activeDSR = val;
    populateDropdowns();
    this.renderTable();
  },

  applyHistoryDateRange: async function() {
    const rawFrom = document.getElementById('historyFromDate')?.value;
    const rawTo = document.getElementById('historyToDate')?.value;
    const badge = document.getElementById('historyStatusBadge');

    if (!rawFrom || !rawTo) {
      alert("From Date aur To Date dono select karein!");
      return;
    }

    const fromNum = this.parseDateToNum(rawFrom);
    const toNum = this.parseDateToNum(rawTo);

    if (badge) {
      badge.style.color = "#f59e0b";
      badge.innerText = `Range: ${rawFrom} to ${rawTo}`;
    }

    if (typeof showBannerAlert === 'function') {
      showBannerAlert(`⏳ History combining from ${rawFrom} to ${rawTo}...`, "#0284c7");
    }

    const { ipcRenderer } = require('electron');
    const histRes = await ipcRenderer.invoke('get-daily-sales-history');
    let loadedDays = 0;

    if (histRes && histRes.success && histRes.history) {
      const history = histRes.history;
      const combinedMap = new Map();

      for (const [savedKey, recordsList] of Object.entries(history)) {
        const savedNum = TargetModule.parseDateToNum(savedKey);

        if (savedNum >= fromNum && savedNum <= toNum && Array.isArray(recordsList)) {
          loadedDays++;
          recordsList.forEach(r => {
            const dName = (r.dsrName || '').trim();
            const bName = (r.brand || '').trim();
            const sName = (r.sku || '').trim();
            const mapKey = `${dName.toUpperCase()}|${bName.toUpperCase()}|${sName.toUpperCase()}`;

            if (!combinedMap.has(mapKey)) {
              combinedMap.set(mapKey, {
                area: r.area || 'MAIN AREA',
                distributor: r.distributor || 'KHI - REHMAN ENT-BR2',
                dsrName: dName,
                rawDsr: r.rawDsr || dName,
                brand: bName,
                sku: sName,
                baseKey: r.baseKey || sName,
                target: (parseFloat(r.target) || 0),
                achiv: (parseFloat(r.achiv) || 0),
                bills: (parseInt(r.bills, 10) || 0)
              });
            } else {
              const item = combinedMap.get(mapKey);
              item.achiv += (parseFloat(r.achiv) || 0);
              item.bills += (parseInt(r.bills, 10) || 0);
              if (!item.target && r.target) item.target = parseFloat(r.target);
            }
          });
        }
      }

      if (loadedDays > 0) {
        allRecords = Array.from(combinedMap.values());
        activeArea = 'ALL'; activeDist = 'ALL'; activeBrand = 'ALL'; activeDSR = 'ALL';
        if (typeof showBannerAlert === 'function') {
          showBannerAlert(`✅ ${loadedDays} din ki saved history successfully combine ho gayi!`, "#10b981");
        }
        populateDropdowns();
        this.renderTable();
        return;
      }
    }

    if (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) {
      const dumpMatches = cmDump.deliveredRecords.filter(r => {
        if (!r.date) return false;
        const dNum = TargetModule.parseDateToNum(r.date);
        return (dNum >= fromNum && dNum <= toNum);
      });

      if (dumpMatches.length > 0) {
        const synthMap = new Map();
        dumpMatches.forEach(r => {
          const dName = typeof cleanDSRName === 'function' ? cleanDSRName(r.rawDsr || r.dsr) : (r.rawDsr || r.dsr);
          const bName = (r.brand || '').trim();
          const sName = (r.sku || '').trim();
          const mapKey = `${dName.toUpperCase()}|${bName.toUpperCase()}|${sName.toUpperCase()}`;

          if (!synthMap.has(mapKey)) {
            synthMap.set(mapKey, {
              area: 'MAIN AREA', distributor: 'KHI - REHMAN ENT-BR2', dsrName: dName, rawDsr: r.rawDsr,
              brand: bName, sku: sName, baseKey: sName, target: 0,
              achiv: (parseFloat(r.qty) || 0), bills: 1
            });
          } else {
            const item = synthMap.get(mapKey);
            item.achiv += (parseFloat(r.qty) || 0);
            item.bills += 1;
          }
        });
        allRecords = Array.from(synthMap.values());
        activeArea = 'ALL'; activeDist = 'ALL'; activeBrand = 'ALL'; activeDSR = 'ALL';
        if (typeof showBannerAlert === 'function') {
          showBannerAlert(`✅ Sales Dump se ${rawFrom} se ${rawTo} filter ho gaya!`, "#10b981");
        }
      } else {
        allRecords = [];
        if (typeof showBannerAlert === 'function') {
          showBannerAlert(`⚠️ Is Date Range mein koi record save nahi mila!`, "#dc2626");
        }
      }
    }

    populateDropdowns();
    this.renderTable();
  },

  revertToLiveView: function() {
    const badge = document.getElementById('historyStatusBadge');
    if (badge) {
      badge.style.color = "#10b981";
      badge.innerText = "Live Report Active";
    }

    if (typeof showBannerAlert === 'function') {
      showBannerAlert("⚡ Reverting to Live Report...", "#0284c7");
    }

    if (typeof window.LIVE_CURRENT_SNAPSHOT !== 'undefined' && window.LIVE_CURRENT_SNAPSHOT.length > 0) {
      allRecords = JSON.parse(JSON.stringify(window.LIVE_CURRENT_SNAPSHOT));
    } else if (typeof liveCachedRecords !== 'undefined' && liveCachedRecords.length > 0) {
      allRecords = JSON.parse(JSON.stringify(liveCachedRecords));
    }

    activeArea = 'ALL'; activeDist = 'ALL'; activeBrand = 'ALL'; activeDSR = 'ALL';
    populateDropdowns();
    this.renderTable();
    if (typeof showBannerAlert === 'function') {
      showBannerAlert("✅ Live SnD Report Restored!", "#10b981");
    }
  },

  renderTable: function() {
    const thead = document.getElementById('mainThead');
    const tbody = document.getElementById('mainTbody');
    const tfoot = document.getElementById('mainTfoot');
    if (!thead || !tbody || !tfoot) return;

    const btnDsr = document.getElementById('btnModeDSR');
    const btnBrand = document.getElementById('btnModeBrand');
    const btnDiv = document.getElementById('btnModeDivision');
    if (btnDsr) btnDsr.classList.toggle('active', currentMode === 'DSR');
    if (btnBrand) btnBrand.classList.toggle('active', currentMode === 'BRAND');
    if (btnDiv) btnDiv.classList.toggle('active', currentMode === 'DIVISION');

    const filtered = getFilteredRecords();

    const tDays = parseInt(document.getElementById('inputTotalDays')?.value, 10) || totalDays || 26;
    const dGone = parseInt(document.getElementById('inputDaysGone')?.value, 10) || daysGone || 2;
    const dLeft = Math.max(1, tDays - dGone);
    const tgPct = tDays > 0 ? (dGone / tDays) : 1;

    // =========================================================================
    // MODE 3: DSR WISE DIVISION SUMMARY (CTN ONLY - 5 COLUMNS)
    // =========================================================================
    if (currentMode === 'DIVISION') {
      thead.innerHTML = `
        <tr>
          <th colspan="5" style="background:#111e38 !important; text-align:center; font-size:13px; font-weight:900; letter-spacing:0.5px; border-bottom:2px solid #38bdf8;">
            DSR WISE DIVISION SUMMARY (CTN ONLY)
          </th>
        </tr>
        <tr>
          <th style="min-width:220px; color:#ffffff !important;">DSR Name</th>
          <th class="num" style="min-width:130px; color:#f59e0b !important;">BAKERY</th>
          <th class="num" style="min-width:130px; color:#10b981 !important;">BISCUITS</th>
          <th class="num" style="min-width:150px; color:#38bdf8 !important;">CONFECTIONERY</th>
          <th class="num" style="min-width:140px; color:#ffffff !important; background:#1b3860 !important;">TOTAL CTN</th>
        </tr>
      `;

      const cfg = this.getDivisionConfig();
      const isBakery = (brand) => (cfg.bakery || []).some(b => brand.includes(b));
      const isBiscuits = (brand) => (cfg.biscuits || []).some(b => brand.includes(b));
      const isExplicitConf = (brand) => (cfg.confectionery && cfg.confectionery.length > 0) ? cfg.confectionery.some(c => brand.includes(c)) : false;

      const dsrDivMap = new Map();

      filtered.forEach(r => {
        const dName = r.dsrName;
        if (!dsrDivMap.has(dName)) {
          dsrDivMap.set(dName, { bakery: 0, biscuits: 0, confectionery: 0 });
        }
        const item = dsrDivMap.get(dName);
        const bUpper = (r.brand || '').toUpperCase();
        const ach = (parseFloat(r.achiv) || 0);

        if (isBakery(bUpper)) {
          item.bakery += ach;
        } else if (isBiscuits(bUpper)) {
          item.biscuits += ach;
        } else if (isExplicitConf(bUpper)) {
          item.confectionery += ach;
        } else {
          item.confectionery += ach;
        }
      });

      let totBakery = 0, totBiscuits = 0, totConf = 0, totGrand = 0;
      let rowsHtml = '';
      const sortedDsrs = Array.from(dsrDivMap.keys()).sort();

      sortedDsrs.forEach(dName => {
        const item = dsrDivMap.get(dName);
        const rowTotal = item.bakery + item.biscuits + item.confectionery;

        totBakery += item.bakery;
        totBiscuits += item.biscuits;
        totConf += item.confectionery;
        totGrand += rowTotal;

        rowsHtml += `
          <tr>
            <td class="cell-dsr-name">${dName}</td>
            <td class="num" style="font-weight:700;">${item.bakery.toFixed(2)}</td>
            <td class="num" style="font-weight:700;">${item.biscuits.toFixed(2)}</td>
            <td class="num" style="font-weight:700;">${item.confectionery.toFixed(2)}</td>
            <td class="num" style="font-weight:800; color:#38bdf8;">${rowTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      tbody.innerHTML = rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:30px;">No Records Match Filters</td></tr>`;

      tfoot.innerHTML = `
        <tr class="total-row" style="background:#132b4f !important; font-size:12.5px;">
          <td>TOTAL</td>
          <td class="num" style="color:#f59e0b;">${totBakery.toFixed(2)}</td>
          <td class="num" style="color:#10b981;">${totBiscuits.toFixed(2)}</td>
          <td class="num" style="color:#38bdf8;">${totConf.toFixed(2)}</td>
          <td class="num" style="color:#ffffff; font-weight:900;">${totGrand.toFixed(2)}</td>
        </tr>
      `;

      if (typeof attachExcelSelectionListeners === 'function') attachExcelSelectionListeners();
      return;
    }

    // =========================================================================
    // MODE 2: BRAND CLUB (9 COLUMNS)
    // =========================================================================
    if (currentMode === 'BRAND') {
      thead.innerHTML = `<tr>
        <th style="color:#ffffff !important;">Brand</th>
        <th class="num" style="color:#ffffff !important;">TARGET</th>
        <th class="num" style="color:#ffffff !important;">Achiv</th>
        <th class="num" style="color:#ffffff !important;">Achiv %</th>
        <th class="num" style="color:#ffffff !important;">MTD %</th>
        <th class="num" style="color:#ffffff !important;">BTG</th>
        <th class="num" style="color:#ffffff !important;">RDP</th>
        <th class="num" style="color:#ffffff !important;">MTD in CTN</th>
        <th class="num" style="background:#132b4f; color:#ffffff !important;">Bills</th>
      </tr>`;

      const brandMap = new Map();
      filtered.forEach(r => {
        let gKey = activeBrand.startsWith('CUSTOM:') ? activeBrand.replace('CUSTOM:', '') + ' (Custom)' : r.brand;
        if (!brandMap.has(gKey)) brandMap.set(gKey, { brand: gKey, target: 0, achiv: 0, bills: 0 });
        const item = brandMap.get(gKey);
        item.target += (parseFloat(r.target) || 0);
        item.achiv += (parseFloat(r.achiv) || 0);
        item.bills += (parseInt(r.bills, 10) || 0);
      });

      let totTgt = 0, totAch = 0, totBTG = 0, totRDP = 0, totMTDCTN = 0, totBills = 0;
      let rowsHtml = '';
      brandMap.forEach(item => {
        const target = item.target || 0;
        const achiv = item.achiv || 0;
        const bills = item.bills || 0;

        const achPct = target > 0 ? (achiv / target) * 100 : 0;
        const mtdPct = (tgPct > 0 && target > 0) ? (achPct / (tgPct * 100)) * 100 : 0;
        const btg = Math.max(0, target - achiv);
        const rdp = dLeft > 0 ? (btg / dLeft) : 0;
        const mtdInCtn = tgPct > 0 ? (achiv / tgPct) : 0;

        totTgt += target;
        totAch += achiv;
        totBTG += btg;
        totRDP += rdp;
        totMTDCTN += mtdInCtn;
        totBills += bills;

        rowsHtml += `<tr>
          <td class="cell-dsr-name">${item.brand}</td>
          <td class="num">${target.toFixed(2)}</td>
          <td class="num">${achiv.toFixed(2)}</td>
          <td class="num ${achPct >= (tgPct * 100) ? 'cf-green' : 'cf-red'}">${achPct.toFixed(1)}%</td>
          <td class="num ${mtdPct >= 100 ? 'cf-green' : 'cf-red'}">${mtdPct.toFixed(1)}%</td>
          <td class="num">${btg.toFixed(2)}</td>
          <td class="num">${rdp.toFixed(2)}</td>
          <td class="num">${mtdInCtn.toFixed(2)}</td>
          <td class="num" style="color:#0284c7 !important; font-weight:bold;">${bills}</td>
        </tr>`;
      });

      tbody.innerHTML = rowsHtml || '<tr><td colspan="9" style="text-align:center; padding:20px;">No Records Match Filters</td></tr>';
      
      const totAchPct = totTgt > 0 ? (totAch / totTgt) * 100 : 0;
      const totMtdPct = (tgPct > 0 && totTgt > 0) ? (totAchPct / (tgPct * 100)) * 100 : 0;

      tfoot.innerHTML = `<tr class="total-row">
        <td>Grand Total</td>
        <td class="num">${totTgt.toFixed(2)}</td>
        <td class="num">${totAch.toFixed(2)}</td>
        <td class="num">${totAchPct.toFixed(1)}%</td>
        <td class="num">${totMtdPct.toFixed(1)}%</td>
        <td class="num">${totBTG.toFixed(2)}</td>
        <td class="num">${totRDP.toFixed(2)}</td>
        <td class="num">${totMTDCTN.toFixed(2)}</td>
        <td class="num" style="color:#ffffff;">${totBills}</td>
      </tr>`;

    } else {
      // =========================================================================
      // MODE 1: DSR WISE DETAILED (11 COLUMNS)
      // =========================================================================
      thead.innerHTML = `<tr>
        <th style="color:#ffffff !important;">DSR Name</th>
        <th style="color:#ffffff !important;">Brand</th>
        <th style="max-width:250px; color:#ffffff !important;">SKU / Description</th>
        <th class="num" style="color:#ffffff !important;">TARGET</th>
        <th class="num" style="color:#ffffff !important;">Achiv</th>
        <th class="num" style="color:#ffffff !important;">Achiv %</th>
        <th class="num" style="color:#ffffff !important;">MTD %</th>
        <th class="num" style="color:#ffffff !important;">BTG</th>
        <th class="num" style="color:#ffffff !important;">RDP</th>
        <th class="num" style="color:#ffffff !important;">MTD in CTN</th>
        <th class="num" style="background:#132b4f; color:#ffffff !important;">Bills</th>
      </tr>`;

      let totTgt = 0, totAch = 0, totBTG = 0, totRDP = 0, totMTDCTN = 0, totBills = 0;
      let rowsHtml = '';
      
      filtered.sort((a,b) => {
        if (a.dsrName !== b.dsrName) return (a.dsrName || '').localeCompare(b.dsrName || '');
        if (a.brand !== b.brand) return (a.brand || '').localeCompare(b.brand || '');
        return (a.sku || '').localeCompare(b.sku || '');
      });

      filtered.forEach(r => {
        const target = parseFloat(r.target) || 0;
        const achiv = parseFloat(r.achiv) || 0;
        const bCount = parseInt(r.bills, 10) || 0;

        const achPct = target > 0 ? (achiv / target) * 100 : 0;
        const mtdPct = (tgPct > 0 && target > 0) ? (achPct / (tgPct * 100)) * 100 : 0;
        const btg = Math.max(0, target - achiv);
        const rdp = dLeft > 0 ? (btg / dLeft) : 0;
        const mtdInCtn = dGone > 0 ? (achiv / dGone) * tDays : 0;

        totTgt += target;
        totAch += achiv;
        totBTG += btg;
        totRDP += rdp;
        totMTDCTN += mtdInCtn;
        totBills += bCount;

        rowsHtml += `<tr>
          <td class="cell-dsr-name">${r.dsrName}</td>
          <td>${r.brand}</td>
          <td class="sku-cell" title="${r.sku}">${r.sku}</td>
          <td class="num">${target.toFixed(2)}</td>
          <td class="num">${achiv.toFixed(2)}</td>
          <td class="num ${achPct >= (tgPct * 100) ? 'cf-green' : 'cf-red'}">${achPct.toFixed(1)}%</td>
          <td class="num ${mtdPct >= 100 ? 'cf-green' : 'cf-red'}">${mtdPct.toFixed(1)}%</td>
          <td class="num">${btg.toFixed(2)}</td>
          <td class="num">${rdp.toFixed(2)}</td>
          <td class="num">${mtdInCtn.toFixed(2)}</td>
          <td class="num" style="color:#0284c7 !important; font-weight:bold;">${bCount}</td>
        </tr>`;
      });

      tbody.innerHTML = rowsHtml || '<tr><td colspan="11" style="text-align:center; padding:20px;">No Records Match Filters</td></tr>';
      
      const totAchPct = totTgt > 0 ? (totAch / totTgt) * 100 : 0;
      const totMtdPct = (tgPct > 0 && totTgt > 0) ? (totAchPct / (tgPct * 100)) * 100 : 0;
      
      tfoot.innerHTML = `<tr class="total-row">
        <td>Grand Total</td>
        <td></td>
        <td></td>
        <td class="num">${totTgt.toFixed(2)}</td>
        <td class="num">${totAch.toFixed(2)}</td>
        <td class="num">${totAchPct.toFixed(1)}%</td>
        <td class="num">${totMtdPct.toFixed(1)}%</td>
        <td class="num">${totBTG.toFixed(2)}</td>
        <td class="num">${totRDP.toFixed(2)}</td>
        <td class="num">${totMTDCTN.toFixed(2)}</td>
        <td class="num" style="color:#ffffff;">${totBills}</td>
      </tr>`;
    }

    if (typeof attachExcelSelectionListeners === 'function') {
      attachExcelSelectionListeners();
    }
  }
};