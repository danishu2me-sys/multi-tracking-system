window.DsrPerformanceModule = {
  // Default TSE Structure from VBA
  defaultTseTeams: [
    {
      name: "ASAD ALI PERFORMANCE",
      dsrs: [
        "OB10-ZIA-UL-HAQ-MERGE-T/W-(A)",
        "OB11-NOMAN BARI KHAN-MERGE-T/W-(A)",
        "OB14-ARSHAD IQBAL-Merge-(A)",
        "OB25-SHAMS TABRREEZ-WS-(G)"
      ]
    },
    {
      name: "WAQAS KHAN PERFORMANCE",
      dsrs: [
        "OB07-MOHSIN QURESHI-Merge-(A)",
        "OB08-FARHAN BAIG-MERGE-T/W-(A)",
        "OB08-MSR SAJJAD HUSSAIN-MERGE-(A)",
        "OB14-MSR WAQAR AHMED-Merge-(A)"
      ]
    },
    {
      name: "DANISH RAIS PERFORMANCE",
      dsrs: [
        "OB09-M QASIM CHISHTI-Merge-(A)",
        "OB09-M.DANISH-Merge-(A)",
        "OB25-MSR FAIZAN UL HASSAN-WS-(G)"
      ]
    }
  ],

  // Active Teams configuration (Saved in localStorage)
  getTeams: function() {
    const saved = localStorage.getItem('savedDsrTeamsConfig');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return JSON.parse(JSON.stringify(this.defaultTseTeams));
  },

  saveTeams: function(teams) {
    localStorage.setItem('savedDsrTeamsConfig', JSON.stringify(teams));
  },

  renderHTML: function() {
    const savedTotalDays = localStorage.getItem('savedPerfTotalDays') || '26';
    const savedDaysPassed = localStorage.getItem('savedPerfDaysPassed') || '4';

    return `
      <style>
        .dsr-perf-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          min-height: 100%;
          padding-bottom: 50px;
        }

        .dash-sticky-freeze-panel {
          position: sticky !important;
          top: 0px !important;
          z-index: 100 !important;
          background: var(--bg-main) !important;
          padding-top: 2px;
          padding-bottom: 5px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        }

        .dash-exec-header {
          display: grid;
          grid-template-columns: 2.2fr 2fr 1.6fr;
          border: 1px solid #132b4f;
          background: #0f1c33;
          border-radius: 4px;
          overflow: hidden;
        }

        .dash-banner-title {
          background: #111e38;
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-right: 1.5px solid #1e3a5f;
        }

        .dash-date-panel {
          background: #132b4f;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1.5px solid #1e3a5f;
        }

        .dash-date-title {
          text-align: center;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .dash-date-inputs { display: flex; background: #ffffff; }

        .dash-date-box {
          flex: 1;
          text-align: center;
          padding: 2px 4px;
          border-right: 1px dashed #cbd5e1;
        }
        .dash-date-box:last-child { border-right: none; }
        .dash-date-box input {
          border: none;
          outline: none;
          font-family: 'Consolas', monospace;
          font-size: 11px;
          font-weight: bold;
          color: #0f172a;
          background: transparent;
          text-align: center;
          width: 100%;
          cursor: pointer;
        }

        .dash-tg-panel { background: #132b4f; display: flex; flex-direction: column; }
        .dash-tg-header {
          text-align: center;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .dash-tg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1.3fr;
          background: #ffffff;
        }

        .dash-tg-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1px 3px;
          border-right: 1px solid #e2e8f0;
        }
        .dash-tg-item:last-child {
          border-right: none;
          background: #fef08a !important;
        }

        .dash-tg-label { font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .dash-tg-input {
          width: 38px;
          text-align: center;
          font-size: 10.5px;
          font-weight: 900;
          font-family: 'Consolas', monospace;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          border-radius: 2px;
          outline: none;
          background: #f8fafc;
          padding: 1px 0;
        }
        .dash-tg-val { font-size: 10.5px; font-weight: 900; font-family: 'Consolas', monospace; color: #0f172a; }
        .dash-tg-item:last-child .dash-tg-val { color: #854d0e; }

        .dash-action-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

        .btn-update-exec {
          background: #0284c7;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 3px;
          border: 1px solid #38bdf8;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: 0.2s;
        }
        .btn-update-exec:hover {
          background: #0369a1;
          box-shadow: 0 0 8px rgba(2, 132, 199, 0.5);
        }

        .btn-template-dl {
          background: #059669;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          padding: 4px 9px;
          border-radius: 3px;
          border: 1px solid #34d399;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .btn-template-dl:hover { background: #047857; }

        .btn-template-up {
          background: #d97706;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          padding: 4px 9px;
          border-radius: 3px;
          border: 1px solid #fbbf24;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .btn-template-up:hover { background: #b45309; }

        .btn-edit-dsrs {
          background: #4f46e5;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 3px;
          border: 1px solid #818cf8;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: 0.2s;
        }
        .btn-edit-dsrs:hover {
          background: #4338ca;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
        }

        .exec-full-table-card {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible !important;
          height: auto !important;
          background: var(--bg-panel);
          border: 1.5px solid var(--border-color);
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          margin-bottom: 14px;
        }

        .exec-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 10px;
          user-select: none;
        }

        .exec-table th, .exec-table td {
          padding: 3px 5px !important;
          border-right: 1px dotted #475569 !important;
          border-bottom: 1px dotted #475569 !important;
          white-space: nowrap;
          vertical-align: middle;
          line-height: 1.25;
        }

        body.light-theme .exec-table th, 
        body.light-theme .exec-table td {
          border-right: 1px dotted #64748b !important;
          border-bottom: 1px dotted #64748b !important;
        }

        /* -------------------------------------------------------------
           FREEZE / STICKY DSR NAME COLUMN (BOTH TABLES)
           ------------------------------------------------------------- */
        .exec-table th.col-freeze-dsr {
          position: sticky !important;
          left: 0 !important;
          z-index: 35 !important;
          background: #101e38 !important;
          color: #ffffff !important;
          border-right: 2px solid #0284c7 !important;
        }

        .exec-table td.col-freeze-dsr {
          position: sticky !important;
          left: 0 !important;
          z-index: 15 !important;
          background: #0f1c33 !important;
          color: #f8fafc !important;
          font-weight: 700 !important;
          border-right: 2px solid #0284c7 !important;
        }

        body.light-theme .exec-table th.col-freeze-dsr {
          background: #1e3a5f !important;
          color: #ffffff !important;
        }

        body.light-theme .exec-table td.col-freeze-dsr {
          background: #ffffff !important;
          color: #0f172a !important;
        }

        /* Group Headers */
        .th-group-dsr { 
          background: #1e3a5f !important; 
          color: #ffffff !important; 
          text-align: center; 
          font-weight: 900; 
          font-size: 10px; 
          border-right: 2.5px solid #0284c7 !important;
        }
        .th-group-target { 
          background: #15803d !important; 
          color: #ffffff !important; 
          text-align: center; 
          font-weight: 900; 
          font-size: 10px; 
          border-right: 2.5px solid #22c55e !important;
        }
        .th-group-booking { 
          background: #7e22ce !important; 
          color: #ffffff !important; 
          text-align: center; 
          font-weight: 900; 
          font-size: 10px; 
          border-right: 2.5px solid #a855f7 !important;
        }
        .th-group-growth { 
          background: #0f766e !important; 
          color: #ffffff !important; 
          text-align: center; 
          font-weight: 900; 
          font-size: 10px; 
        }

        .th-group-bakery { background: #0284c7 !important; color: #ffffff !important; text-align: center; font-weight: 900; font-size: 10px; border-right: 2.5px solid #38bdf8 !important; }
        .th-group-biscuits { background: #16a34a !important; color: #ffffff !important; text-align: center; font-weight: 900; font-size: 10px; border-right: 2.5px solid #4ade80 !important; }
        .th-group-conf { background: #d97706 !important; color: #ffffff !important; text-align: center; font-weight: 900; font-size: 10px; border-right: 2.5px solid #f59e0b !important; }
        .th-group-divtotal { background: #15803d !important; color: #ffffff !important; text-align: center; font-weight: 900; font-size: 10px; }

        .exec-table thead tr:nth-child(2) th {
          background: #101e38 !important;
          color: #ffffff !important;
          font-weight: 800;
          font-size: 9.5px;
          border-bottom: 1.5px solid #38bdf8 !important;
        }

        /* 4 DISTINCT BLOCK COLUMN TINTS & BORDERS */
        .col-block-dsr { background-color: rgba(30, 58, 95, 0.08); }
        .col-block-dsr-end {
          background-color: rgba(30, 58, 95, 0.08);
          border-right: 2px solid #0284c7 !important;
        }

        .col-block-target { background-color: rgba(21, 128, 61, 0.08); }
        .col-block-target-end {
          background-color: rgba(21, 128, 61, 0.08);
          border-right: 2px solid #22c55e !important;
        }

        .col-block-booking { background-color: rgba(126, 34, 206, 0.08); }
        .col-block-booking-end {
          background-color: rgba(126, 34, 206, 0.08);
          border-right: 2px solid #a855f7 !important;
        }

        .col-block-growth { background-color: rgba(15, 118, 110, 0.08); }

        .col-div-bakery-end { border-right: 2px solid #0284c7 !important; background-color: rgba(2, 132, 199, 0.06); }
        .col-div-bis-end { border-right: 2px solid #16a34a !important; background-color: rgba(22, 163, 74, 0.06); }
        .col-div-conf-end { border-right: 2px solid #d97706 !important; background-color: rgba(217, 119, 6, 0.06); }

        /* TSE / SUBTOTAL ROWS */
        tr.subtotal-row {
          background-color: #1e3a5f !important;
          border-top: 2px solid #0284c7 !important;
          border-bottom: 2px solid #0284c7 !important;
        }
        tr.subtotal-row td {
          background-color: #1e3a5f !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          border-right: 1px dotted #60a5fa !important;
          border-bottom: 1.5px solid #0284c7 !important;
        }
        tr.subtotal-row td.col-freeze-dsr {
          position: sticky !important;
          left: 0 !important;
          z-index: 18 !important;
          background-color: #1e3a5f !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          border-right: 2.5px solid #38bdf8 !important;
        }

        /* GRAND TOTAL ROW */
        tr.grandtotal-row {
          background-color: #091322 !important;
          border-top: 3px solid #f59e0b !important;
          border-bottom: 3px solid #f59e0b !important;
        }
        tr.grandtotal-row td {
          background-color: #091322 !important;
          color: #fbbf24 !important;
          font-weight: 900 !important;
          font-size: 12.5px !important;
          padding: 6px 6px !important;
          border-right: 1px dotted #d97706 !important;
          border-bottom: 2px solid #f59e0b !important;
          letter-spacing: 0.3px;
        }
        tr.grandtotal-row td.col-freeze-dsr {
          position: sticky !important;
          left: 0 !important;
          z-index: 18 !important;
          background-color: #091322 !important;
          color: #fbbf24 !important;
          font-weight: 900 !important;
          font-size: 13px !important;
          border-right: 2.5px solid #f59e0b !important;
        }

        .badge-pct-green { background: #dcfce7; color: #15803d; font-weight: 800; padding: 1px 4px; border-radius: 2px; display: inline-block; }
        .badge-pct-red { background: #fee2e2; color: #b91c1c; font-weight: 800; padding: 1px 4px; border-radius: 2px; display: inline-block; }
        .badge-growth-green { background: #dcfce7; color: #166534; font-weight: 800; }
        .badge-growth-red { background: #fee2e2; color: #991b1b; font-weight: 800; }

        /* DSR FORM MODAL STYLES */
        #dsrEditorModal .modal-box {
          width: 720px;
          max-width: 95vw;
          max-height: 90vh;
        }
        .dsr-edit-group {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 10px;
        }
        .dsr-edit-group-title {
          font-weight: 900;
          color: #38bdf8;
          font-size: 11.5px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .dsr-edit-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .dsr-edit-label {
          width: 70px;
          font-size: 10px;
          font-weight: bold;
          color: var(--text-muted);
        }
        .dsr-edit-input {
          flex: 1;
          background: var(--bg-main);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          padding: 5px 8px;
          border-radius: 4px;
          font-size: 11.5px;
          font-family: 'Consolas', monospace;
          outline: none;
        }
        .dsr-edit-input:focus {
          border-color: #0284c7;
          box-shadow: 0 0 5px rgba(2, 132, 199, 0.4);
        }
      </style>

      <div class="dsr-perf-container">
        
        <!-- 1. COMPACT TOP BANNER -->
        <div class="dash-sticky-freeze-panel">
          <div class="dash-exec-header">
            <div class="dash-banner-title">TARGET VS ACHIEVEMENT SUMMARY</div>
            
            <div class="dash-date-panel">
              <div class="dash-date-title">DATE RANGE PANEL</div>
              <div class="dash-date-inputs">
                <div class="dash-date-box"><input type="date" id="perfStartDate" onchange="DsrPerformanceModule.onDateChange()" /></div>
                <div class="dash-date-box"><input type="date" id="perfEndDate" onchange="DsrPerformanceModule.onDateChange()" /></div>
              </div>
            </div>

            <div class="dash-tg-panel">
              <div class="dash-tg-header">TIME GONE</div>
              <div class="dash-tg-grid">
                <div class="dash-tg-item">
                  <span class="dash-tg-label">Total Days</span>
                  <input type="number" id="perfTotalDaysInput" class="dash-tg-input" value="${savedTotalDays}" min="1" max="31" onchange="DsrPerformanceModule.onManualTimeGoneChange()" />
                </div>
                <div class="dash-tg-item">
                  <span class="dash-tg-label">Days Passed</span>
                  <input type="number" id="perfDaysPassedInput" class="dash-tg-input" value="${savedDaysPassed}" min="0" max="31" onchange="DsrPerformanceModule.onManualTimeGoneChange()" />
                </div>
                <div class="dash-tg-item">
                  <span class="dash-tg-label">Days Left</span>
                  <span class="dash-tg-val" id="perfDaysLeft">1</span>
                </div>
                <div class="dash-tg-item">
                  <span class="dash-tg-label">Time Gone %</span>
                  <span class="dash-tg-val" id="perfTimeGonePct">96.2%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dash-action-bar">
            <button class="btn-update-exec" onclick="DsrPerformanceModule.forceUpdateAllData()">🔄 UPDATE REPORT</button>
            <button class="btn-edit-dsrs" onclick="DsrPerformanceModule.openDsrEditorModal()" title="DSR Name change / map karein">
              ⚙️ Edit / Map DSRs
            </button>
            <button class="btn-template-dl" onclick="DsrPerformanceModule.downloadTargetTemplate()" title="DSR Target Entry Excel Template Download Karein">
              📥 Target Template
            </button>
            <button class="btn-template-up" onclick="DsrPerformanceModule.uploadTargetTemplate()" title="Filled Target Excel Upload Karein">
              📤 Upload Targets
            </button>
          </div>
        </div>

        <!-- 2. TABLE 1: MAIN SUMMARY TABLE (DSR FROZEN) -->
        <div class="exec-full-table-card" tabindex="0">
          <table class="exec-table" id="perfMainTable">
            <thead>
              <tr>
                <th colspan="4" class="th-group-dsr">DISTRIBUTOR / DSR METRICS</th>
                <th colspan="7" class="th-group-target">TOTAL TARGET VS ACHIEVEMENT</th>
                <th colspan="3" class="th-group-booking">BOOKING VS EXE</th>
                <th colspan="6" class="th-group-growth">CM VS LM GROWTH</th>
              </tr>
              <tr>
                <th class="col-freeze-dsr" style="min-width:180px;">DSR Name</th>
                <th class="num" style="width:60px;">Total Shops</th>
                <th class="num" style="width:60px;">Unique Shops</th>
                <th class="num" style="width:55px; border-right:2px solid #0284c7 !important;">Unique %</th>

                <th class="num" style="width:60px;">Total Target</th>
                <th class="num" style="width:60px;">Total Achiv</th>
                <th class="num" style="width:80px;">Achiv Amount</th>
                <th class="num" style="width:55px;">Achiv %</th>
                <th class="num" style="width:55px;">MTD %</th>
                <th class="num" style="width:50px;">BTG</th>
                <th class="num" style="width:50px; border-right:2px solid #22c55e !important;">RPD</th>

                <th class="num" style="width:60px;">Today Booking</th>
                <th class="num" style="width:65px;">Yesterday Exe</th>
                <th class="num" style="width:65px; border-right:2px solid #a855f7 !important;">Yesterday RTG</th>

                <th class="num" style="width:60px;">CM MTD</th>
                <th class="num" style="width:65px;">CM P/Day Avg</th>
                <th class="num" style="width:70px;">LM Sales</th>
                <th class="num" style="width:65px;">LM P/Day Avg</th>
                <th class="num" style="width:65px;">Growth in CTN</th>
                <th class="num" style="width:65px;">Growth in %</th>
              </tr>
            </thead>
            <tbody id="perfMainTbody"></tbody>
          </table>
        </div>

        <!-- 3. TABLE 2: DIVISION WISE TARGET VS ACHIEVEMENT (DSR FROZEN) -->
        <div class="exec-full-table-card" tabindex="0">
          <table class="exec-table" id="perfDivTable">
            <thead>
              <tr>
                <th class="th-group-dsr col-freeze-dsr" style="min-width:180px;">DISTRIBUTOR / DSR METRICS</th>
                <th colspan="5" class="th-group-bakery">BAKERY (BAK)</th>
                <th colspan="5" class="th-group-biscuits">BISCUITS (BIS)</th>
                <th colspan="5" class="th-group-conf">CONFECTIONERY (CONF)</th>
                <th colspan="5" class="th-group-divtotal">TOTAL (ALL DIVISIONS)</th>
              </tr>
              <tr>
                <th class="col-freeze-dsr" style="min-width:180px;">DSR Name</th>
                <th class="num" style="width:50px;">Target</th><th class="num" style="width:50px;">Achiv</th><th class="num" style="width:45px;">BTG</th><th class="num" style="width:50px;">Achiv %</th><th class="num" style="width:50px; border-right:2px solid #38bdf8 !important;">RPD</th>
                <th class="num" style="width:50px;">Target</th><th class="num" style="width:50px;">Achiv</th><th class="num" style="width:45px;">BTG</th><th class="num" style="width:50px;">Achiv %</th><th class="num" style="width:50px; border-right:2px solid #4ade80 !important;">RPD</th>
                <th class="num" style="width:50px;">Target</th><th class="num" style="width:50px;">Achiv</th><th class="num" style="width:45px;">BTG</th><th class="num" style="width:50px;">Achiv %</th><th class="num" style="width:50px; border-right:2px solid #f59e0b !important;">RPD</th>
                <th class="num" style="width:55px;">Target</th><th class="num" style="width:55px;">Achiv</th><th class="num" style="width:50px;">BTG</th><th class="num" style="width:55px;">Achiv %</th><th class="num" style="width:50px;">RPD</th>
              </tr>
            </thead>
            <tbody id="perfDivTbody"></tbody>
          </table>
        </div>

      </div>

      <!-- 4. DSR NAME MAPPING & EDITOR MODAL FORM -->
      <div id="dsrEditorModal" class="modal-overlay">
        <div class="modal-box">
          <div style="font-size:14.5px; font-weight:bold; color:#38bdf8; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            ⚙️ Edit & Map DSR Names (Sales Dump Matcher)
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">
            Agar Sales Dump mein DSR ka naam badal gaya ho toh yahan naya naam likh kar save karein taake sahi sales uthaye:
          </p>

          <div id="dsrEditorFormContainer" style="flex:1; overflow-y:auto; max-height:55vh; padding-right:4px;"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
            <button onclick="DsrPerformanceModule.resetToDefaultDsrNames()" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">
              ↺ Reset Defaults
            </button>
            <div style="display:flex; gap:8px;">
              <button onclick="DsrPerformanceModule.closeDsrEditorModal()" style="background:#475569; color:#fff; border:none; padding:6px 14px; border-radius:4px; cursor:pointer;">Cancel</button>
              <button onclick="DsrPerformanceModule.saveDsrEditorChanges()" style="background:#059669; color:#fff; border:none; padding:6px 18px; border-radius:4px; font-weight:bold; cursor:pointer;">💾 Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // OPEN DSR EDITOR MODAL
  openDsrEditorModal: function() {
    const container = document.getElementById('dsrEditorFormContainer');
    if (!container) return;

    const currentTeams = this.getTeams();
    
    // Dump me se available DSR names collect karein (for helper datalist)
    const availableDumpDsrs = new Set();
    if (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) {
      cmDump.deliveredRecords.forEach(r => {
        const d = (r.rawDsr || r.dsr || '').trim();
        if (d) availableDumpDsrs.add(d);
      });
    }

    let datalistHtml = `<datalist id="dumpDsrSuggestions">`;
    availableDumpDsrs.forEach(d => {
      datalistHtml += `<option value="${d}">`;
    });
    datalistHtml += `</datalist>`;

    let html = datalistHtml;

    currentTeams.forEach((team, tIdx) => {
      html += `
        <div class="dsr-edit-group">
          <div class="dsr-edit-group-title">👤 ${team.name}</div>
      `;

      team.dsrs.forEach((dsr, dIdx) => {
        html += `
          <div class="dsr-edit-row">
            <span class="dsr-edit-label">DSR ${dIdx + 1}:</span>
            <input type="text" class="dsr-edit-input" data-team="${tIdx}" data-dsr="${dIdx}" value="${dsr}" list="dumpDsrSuggestions" placeholder="Enter matching DSR name from sales dump..." />
          </div>
        `;
      });

      html += `</div>`;
    });

    container.innerHTML = html;
    document.getElementById('dsrEditorModal').style.display = 'flex';
  },

  closeDsrEditorModal: function() {
    const modal = document.getElementById('dsrEditorModal');
    if (modal) modal.style.display = 'none';
  },

  saveDsrEditorChanges: function() {
    const inputs = document.querySelectorAll('#dsrEditorFormContainer .dsr-edit-input');
    const currentTeams = this.getTeams();

    inputs.forEach(inp => {
      const tIdx = parseInt(inp.getAttribute('data-team'), 10);
      const dIdx = parseInt(inp.getAttribute('data-dsr'), 10);
      const val = inp.value.trim();
      if (currentTeams[tIdx] && currentTeams[tIdx].dsrs[dIdx] !== undefined && val) {
        currentTeams[tIdx].dsrs[dIdx] = val;
      }
    });

    this.saveTeams(currentTeams);
    this.closeDsrEditorModal();
    showBannerAlert("✅ DSR Names Updated & Mapped Successfully!", "#059669");
    this.renderTable(true);
  },

  resetToDefaultDsrNames: function() {
    if (confirm("Kya aap waqai default DSR names wapis restore karna chahte hain?")) {
      localStorage.removeItem('savedDsrTeamsConfig');
      this.closeDsrEditorModal();
      showBannerAlert("↺ Default DSR Names Restored!", "#dc2626");
      this.renderTable(true);
    }
  },

  forceUpdateAllData: async function() {
    showBannerAlert("⏳ Reloading fresh Sales Dumps and recalculating...", "#0284c7");
    try {
      if (typeof loadBothDumps === 'function') await loadBothDumps();
      if (typeof loadSavedData === 'function') await loadSavedData();
      
      const cmDates = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords.map(r => r.date).filter(Boolean).sort() : [];
      if (cmDates.length > 0) {
        const dStart = document.getElementById('perfStartDate');
        const dEnd = document.getElementById('perfEndDate');
        if (dStart) dStart.value = cmDates[0];
        if (dEnd) dEnd.value = cmDates[cmDates.length - 1];
      }

      await this.renderTable(false);
      showBannerAlert("🎉 Report successfully updated with latest dump!", "#10b981");
    } catch(err) {
      alert("Update error: " + err.message);
    }
  },

  downloadTargetTemplate: async function() {
    showBannerAlert("📥 Generating DSR Target Excel Template...", "#0284c7");
    const res = await ipcRenderer.invoke('download-dsr-target-template');
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  uploadTargetTemplate: async function() {
    showBannerAlert("📤 Uploading DSR Targets...", "#d97706");
    const res = await ipcRenderer.invoke('upload-dsr-target-template');
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
      await this.renderTable(true);
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  onManualTimeGoneChange: function() {
    const tInput = document.getElementById('perfTotalDaysInput');
    const pInput = document.getElementById('perfDaysPassedInput');

    if (tInput && pInput) {
      const tVal = parseInt(tInput.value, 10) || 26;
      const pVal = parseInt(pInput.value, 10) || 1;
      
      localStorage.setItem('savedPerfTotalDays', tVal);
      localStorage.setItem('savedPerfDaysPassed', pVal);
    }
    this.renderTable(true);
  },

  onDateChange: function() {
    this.renderTable(false);
  },

  renderTable: async function(isManualTg = false) {
    const activeTeams = this.getTeams();
    const cmDates = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords.map(r => r.date).filter(Boolean).sort() : [];
    const dateStartInput = document.getElementById('perfStartDate');
    const dateEndInput = document.getElementById('perfEndDate');

    if (cmDates.length > 0) {
      if (dateStartInput && !dateStartInput.value) dateStartInput.value = cmDates[0];
      if (dateEndInput && !dateEndInput.value) dateEndInput.value = cmDates[cmDates.length - 1];
    }

    const sDate = dateStartInput ? dateStartInput.value : '';
    const eDate = dateEndInput ? dateEndInput.value : '';

    let totalMonthDays = parseInt(localStorage.getItem('savedPerfTotalDays') || '26', 10);
    let daysPassed = parseInt(localStorage.getItem('savedPerfDaysPassed') || '4', 10);

    const tInput = document.getElementById('perfTotalDaysInput');
    const pInput = document.getElementById('perfDaysPassedInput');

    if (isManualTg && tInput && pInput) {
      totalMonthDays = parseInt(tInput.value, 10) || totalMonthDays;
      daysPassed = parseInt(pInput.value, 10) || daysPassed;
      localStorage.setItem('savedPerfTotalDays', totalMonthDays);
      localStorage.setItem('savedPerfDaysPassed', daysPassed);
    } else {
      if (tInput) tInput.value = totalMonthDays;
      if (pInput) pInput.value = daysPassed;
    }

    const daysLeft = Math.max(0, totalMonthDays - daysPassed);
    const timeGonePct = totalMonthDays > 0 ? (daysPassed / totalMonthDays) : 0;

    if (document.getElementById('perfDaysLeft')) document.getElementById('perfDaysLeft').innerText = daysLeft;
    if (document.getElementById('perfTimeGonePct')) document.getElementById('perfTimeGonePct').innerText = (timeGonePct * 100).toFixed(1) + '%';

    let uploadedTargetsMap = {};
    try {
      const tgtRes = await ipcRenderer.invoke('get-saved-dsr-targets');
      if (tgtRes && tgtRes.success && tgtRes.targets) {
        uploadedTargetsMap = tgtRes.targets;
      }
    } catch(e) {}

    let bookingExeMap = {};
    try {
      const bRes = await ipcRenderer.invoke('get-booking-vs-execution-data');
      if (bRes && bRes.success && bRes.data) {
        bookingExeMap = bRes.data;
      }
    } catch (e) {}

    const cmRecords = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];
    const lmRecords = (lmDump && lmDump.deliveredRecords) ? lmDump.deliveredRecords : [];

    const filteredCM = cmRecords.filter(r => {
      if (sDate && r.date && r.date < sDate) return false;
      if (eDate && r.date && r.date > eDate) return false;
      return true;
    });

    const dsrMetrics = {};
    const initDsr = (name) => {
      if (!dsrMetrics[name]) {
        let customTarget = uploadedTargetsMap[name];
        if (!customTarget) {
          const matchKey = Object.keys(uploadedTargetsMap).find(k => k.includes(name.substring(0, 10)) || name.includes(k.substring(0, 10)));
          if (matchKey) customTarget = uploadedTargetsMap[matchKey];
        }
        customTarget = customTarget || {};

        dsrMetrics[name] = {
          uniquePops: new Set(),
          bakAch: 0, bisAch: 0, confAch: 0, totalAch: 0,
          amtVal: 0, lmSales: 0,
          todayBooking: 0, yesterdayExe: 0, yesterdayRtg: 0,
          bakTgt: customTarget.bakTgt || 0,
          bisTgt: customTarget.bisTgt || 0,
          confTgt: customTarget.confTgt || 0,
          totalTgt: customTarget.totalTgt || 0,
          universe: customTarget.totalShops || PRESET_UNIVERSE[name] || manualUniverseMap[name] || 250
        };
      }
    };

    activeTeams.forEach(t => t.dsrs.forEach(d => initDsr(d)));

    filteredCM.forEach(r => {
      const dName = (r.rawDsr || r.dsr || '').trim();
      if (!dName) return;

      // Exact match or partial match for renamed DSR
      let matchedKey = dName;
      if (!dsrMetrics[matchedKey]) {
        const found = Object.keys(dsrMetrics).find(k => k.includes(dName.substring(0, 8)) || dName.includes(k.substring(0, 8)));
        if (found) matchedKey = found;
      }

      if (dsrMetrics[matchedKey]) {
        const m = dsrMetrics[matchedKey];
        if (r.pop) m.uniquePops.add(r.pop);

        const qty = parseFloat(r.qty) || 0;
        const net = parseFloat(r.net) || 0;
        const divStr = (r.division || r.brand || '').toUpperCase();

        if (divStr.includes('BAK') || divStr.includes('CAKE') || divStr.includes('RUSK')) {
          m.bakAch += qty;
        } else if (divStr.includes('BIS') || divStr.includes('COOKIE') || divStr.includes('CRACKER')) {
          m.bisAch += qty;
        } else {
          m.confAch += qty;
        }

        m.totalAch += qty;
        m.amtVal += net;
      }
    });

    lmRecords.forEach(r => {
      const dName = (r.rawDsr || r.dsr || '').trim();
      let matchedKey = dName;
      if (!dsrMetrics[matchedKey]) {
        const found = Object.keys(dsrMetrics).find(k => k.includes(dName.substring(0, 8)) || dName.includes(k.substring(0, 8)));
        if (found) matchedKey = found;
      }
      if (dsrMetrics[matchedKey]) {
        dsrMetrics[matchedKey].lmSales += (parseFloat(r.qty) || 0);
      }
    });

    if (Object.keys(uploadedTargetsMap).length === 0 && allRecords && allRecords.length > 0) {
      allRecords.forEach(r => {
        const dName = (r.dsrName || '').trim();
        let matchedKey = dName;
        if (!dsrMetrics[matchedKey]) {
          const found = Object.keys(dsrMetrics).find(k => k.includes(dName.substring(0, 8)) || dName.includes(k.substring(0, 8)));
          if (found) matchedKey = found;
        }
        if (dsrMetrics[matchedKey]) {
          const tgt = parseFloat(r.target) || 0;
          const divStr = (r.division || r.brand || '').toUpperCase();
          if (divStr.includes('BAK')) dsrMetrics[matchedKey].bakTgt += tgt;
          else if (divStr.includes('BIS')) dsrMetrics[matchedKey].bisTgt += tgt;
          else dsrMetrics[matchedKey].confTgt += tgt;
          dsrMetrics[matchedKey].totalTgt += tgt;
        }
      });
    }

    Object.keys(dsrMetrics).forEach(k => {
      const m = dsrMetrics[k];
      const sumDivTgt = m.bakTgt + m.bisTgt + m.confTgt;
      if (sumDivTgt > 0) {
        m.totalTgt = sumDivTgt;
      }
    });

    Object.keys(dsrMetrics).forEach(k => {
      const m = dsrMetrics[k];
      const matchKey = Object.keys(bookingExeMap).find(bk => bk.includes(k.substring(0, 8)) || k.includes(bk.substring(0, 8)));
      if (matchKey) {
        m.todayBooking = bookingExeMap[matchKey].todayBooking || 0;
        m.yesterdayExe = bookingExeMap[matchKey].yesterdayExe || 0;
        m.yesterdayRtg = bookingExeMap[matchKey].yesterdayRtg || 0;
      }
    });

    let t1Html = '';
    let t2Html = '';

    const grand = {
      shops: 0, uShops: 0, tgt: 0, ach: 0, amt: 0,
      bkg: 0, exe: 0, rtg: 0, cmMtd: 0, lmSales: 0,
      bakTgt: 0, bakAch: 0, bisTgt: 0, bisAch: 0, confTgt: 0, confAch: 0
    };

    activeTeams.forEach(team => {
      const sub = {
        shops: 0, uShops: 0, tgt: 0, ach: 0, amt: 0,
        bkg: 0, exe: 0, rtg: 0, cmMtd: 0, lmSales: 0,
        bakTgt: 0, bakAch: 0, bisTgt: 0, bisAch: 0, confTgt: 0, confAch: 0
      };

      team.dsrs.forEach(dName => {
        const d = dsrMetrics[dName] || {
          uniquePops: new Set(), bakAch: 0, bisAch: 0, confAch: 0, totalAch: 0,
          amtVal: 0, lmSales: 0, todayBooking: 0, yesterdayExe: 0, yesterdayRtg: 0,
          bakTgt: 0, bisTgt: 0, confTgt: 0, totalTgt: 0, universe: 250
        };

        const uShops = d.uniquePops.size;
        const shops = d.universe;
        const uPct = shops > 0 ? (uShops / shops) * 100 : 0;

        const totalTgt = (d.bakTgt + d.bisTgt + d.confTgt) > 0 ? (d.bakTgt + d.bisTgt + d.confTgt) : d.totalTgt;
        const totalAch = d.totalAch;
        const achPct = totalTgt > 0 ? (totalAch / totalTgt) * 100 : 0;
        const mtdPct = timeGonePct > 0 ? (achPct / (timeGonePct * 100)) * 100 : 0;
        const btg = totalTgt - totalAch;
        const rpd = daysLeft > 0 ? (btg / daysLeft) : 0;

        const cmMtd = daysPassed > 0 ? (totalAch / daysPassed) * totalMonthDays : 0;
        const cmAvg = daysPassed > 0 ? (totalAch / daysPassed) : 0;
        const lmAvg = totalMonthDays > 0 ? (d.lmSales / totalMonthDays) : 0;
        const gCtn = cmMtd - d.lmSales;
        const gPct = d.lmSales > 0 ? (gCtn / d.lmSales) * 100 : 0;

        sub.shops += shops; sub.uShops += uShops; sub.tgt += totalTgt; sub.ach += totalAch;
        sub.amt += d.amtVal; sub.bkg += d.todayBooking; sub.exe += d.yesterdayExe; sub.rtg += d.yesterdayRtg;
        sub.cmMtd += cmMtd; sub.lmSales += d.lmSales;

        sub.bakTgt += d.bakTgt; sub.bakAch += d.bakAch;
        sub.bisTgt += d.bisTgt; sub.bisAch += d.bisAch;
        sub.confTgt += d.confTgt; sub.confAch += d.confAch;

        const isAchHigh = achPct >= (timeGonePct * 100);
        const isGrowHigh = gCtn >= 0;

        t1Html += `
          <tr>
            <td class="col-freeze-dsr" title="${dName}">${dName}</td>
            <td class="num col-block-dsr">${shops}</td>
            <td class="num col-block-dsr">${uShops}</td>
            <td class="num col-block-dsr-end">${uPct.toFixed(0)}%</td>

            <td class="num col-block-target" style="background:#fffbeb; font-weight:700;">${Math.round(totalTgt).toLocaleString()}</td>
            <td class="num col-block-target" style="font-weight:700;">${totalAch.toFixed(2)}</td>
            <td class="num col-block-target">${Math.round(d.amtVal).toLocaleString()}</td>
            <td class="num"><span class="${isAchHigh ? 'badge-pct-green' : 'badge-pct-red'}">${achPct.toFixed(1)}%</span></td>
            <td class="num col-block-target">${mtdPct.toFixed(1)}%</td>
            <td class="num col-block-target">${btg.toFixed(2)}</td>
            <td class="num col-block-target-end">${rpd.toFixed(2)}</td>

            <td class="num col-block-booking">${d.todayBooking.toFixed(2)}</td>
            <td class="num col-block-booking">${d.yesterdayExe.toFixed(2)}</td>
            <td class="num col-block-booking-end">${d.yesterdayRtg.toFixed(2)}</td>

            <td class="num col-block-growth">${cmMtd.toFixed(2)}</td>
            <td class="num col-block-growth" style="color:#15803d; font-weight:bold;">${cmAvg.toFixed(2)}</td>
            <td class="num col-block-growth">${d.lmSales.toFixed(2)}</td>
            <td class="num col-block-growth">${lmAvg.toFixed(2)}</td>
            <td class="num col-block-growth ${isGrowHigh ? 'badge-growth-green' : 'badge-growth-red'}">${gCtn.toFixed(2)}</td>
            <td class="num col-block-growth ${isGrowHigh ? 'badge-growth-green' : 'badge-growth-red'}">${gPct.toFixed(1)}%</td>
          </tr>
        `;

        const bakBtg = d.bakTgt - d.bakAch;
        const bakPct = d.bakTgt > 0 ? (d.bakAch / d.bakTgt) * 100 : 0;
        const bakRpd = daysLeft > 0 ? bakBtg / daysLeft : 0;

        const bisBtg = d.bisTgt - d.bisAch;
        const bisPct = d.bisTgt > 0 ? (d.bisAch / d.bisTgt) * 100 : 0;
        const bisRpd = daysLeft > 0 ? bisBtg / daysLeft : 0;

        const confBtg = d.confTgt - d.confAch;
        const confPct = d.confTgt > 0 ? (d.confAch / d.confTgt) * 100 : 0;
        const confRpd = daysLeft > 0 ? confBtg / daysLeft : 0;

        t2Html += `
          <tr>
            <td class="col-freeze-dsr" title="${dName}">${dName}</td>
            <td class="num" style="background:#fffbeb;">${Math.round(d.bakTgt).toLocaleString()}</td>
            <td class="num">${d.bakAch.toFixed(2)}</td>
            <td class="num">${bakBtg.toFixed(2)}</td>
            <td class="num"><span class="${bakPct >= (timeGonePct * 100) ? 'badge-pct-green' : 'badge-pct-red'}">${bakPct.toFixed(0)}%</span></td>
            <td class="num col-div-bakery-end">${bakRpd.toFixed(2)}</td>

            <td class="num" style="background:#fffbeb;">${Math.round(d.bisTgt).toLocaleString()}</td>
            <td class="num">${d.bisAch.toFixed(2)}</td>
            <td class="num">${bisBtg.toFixed(2)}</td>
            <td class="num"><span class="${bisPct >= (timeGonePct * 100) ? 'badge-pct-green' : 'badge-pct-red'}">${bisPct.toFixed(0)}%</span></td>
            <td class="num col-div-bis-end">${bisRpd.toFixed(2)}</td>

            <td class="num" style="background:#fffbeb;">${Math.round(d.confTgt).toLocaleString()}</td>
            <td class="num">${d.confAch.toFixed(2)}</td>
            <td class="num">${confBtg.toFixed(2)}</td>
            <td class="num"><span class="${confPct >= (timeGonePct * 100) ? 'badge-pct-green' : 'badge-pct-red'}">${confPct.toFixed(0)}%</span></td>
            <td class="num col-div-conf-end">${confRpd.toFixed(2)}</td>

            <td class="num" style="background:#fffbeb; font-weight:700;">${Math.round(totalTgt).toLocaleString()}</td>
            <td class="num" style="font-weight:700;">${totalAch.toFixed(2)}</td>
            <td class="num">${btg.toFixed(2)}</td>
            <td class="num"><span class="${isAchHigh ? 'badge-pct-green' : 'badge-pct-red'}">${achPct.toFixed(0)}%</span></td>
            <td class="num">${rpd.toFixed(2)}</td>
          </tr>
        `;
      });

      grand.shops += sub.shops; grand.uShops += sub.uShops; grand.tgt += sub.tgt; grand.ach += sub.ach;
      grand.amt += sub.amt; grand.bkg += sub.bkg; grand.exe += sub.exe; grand.rtg += sub.rtg;
      grand.cmMtd += sub.cmMtd; grand.lmSales += sub.lmSales;

      grand.bakTgt += sub.bakTgt; grand.bakAch += sub.bakAch;
      grand.bisTgt += sub.bisTgt; grand.bisAch += sub.bisAch;
      grand.confTgt += sub.confTgt; grand.confAch += sub.confAch;

      const subUPct = sub.shops > 0 ? (sub.uShops / sub.shops) * 100 : 0;
      const subAchPct = sub.tgt > 0 ? (sub.ach / sub.tgt) * 100 : 0;
      const subMtdPct = timeGonePct > 0 ? (subAchPct / (timeGonePct * 100)) * 100 : 0;
      const subBtg = sub.tgt - sub.ach;
      const subRpd = daysLeft > 0 ? subBtg / daysLeft : 0;
      const subCmAvg = daysPassed > 0 ? sub.ach / daysPassed : 0;
      const subLmAvg = totalMonthDays > 0 ? sub.lmSales / totalMonthDays : 0;
      const subGCtn = sub.cmMtd - sub.lmSales;
      const subGPct = sub.lmSales > 0 ? (subGCtn / sub.lmSales) * 100 : 0;

      // Subtotals Row (Frozen)
      t1Html += `
        <tr class="subtotal-row">
          <td class="col-freeze-dsr">TOTAL ${team.name}</td>
          <td class="num">${sub.shops}</td>
          <td class="num">${sub.uShops}</td>
          <td class="num col-block-dsr-end">${subUPct.toFixed(0)}%</td>
          <td class="num">${Math.round(sub.tgt).toLocaleString()}</td>
          <td class="num">${sub.ach.toFixed(2)}</td>
          <td class="num">${Math.round(sub.amt).toLocaleString()}</td>
          <td class="num">${subAchPct.toFixed(1)}%</td>
          <td class="num">${subMtdPct.toFixed(1)}%</td>
          <td class="num">${subBtg.toFixed(2)}</td>
          <td class="num col-block-target-end">${subRpd.toFixed(2)}</td>
          <td class="num">${sub.bkg.toFixed(2)}</td>
          <td class="num">${sub.exe.toFixed(2)}</td>
          <td class="num col-block-booking-end">${sub.rtg.toFixed(2)}</td>
          <td class="num">${sub.cmMtd.toFixed(2)}</td>
          <td class="num">${subCmAvg.toFixed(2)}</td>
          <td class="num">${sub.lmSales.toFixed(2)}</td>
          <td class="num">${subLmAvg.toFixed(2)}</td>
          <td class="num">${subGCtn.toFixed(2)}</td>
          <td class="num">${subGPct.toFixed(1)}%</td>
        </tr>
      `;

      const subBakBtg = sub.bakTgt - sub.bakAch;
      const subBakPct = sub.bakTgt > 0 ? (sub.bakAch / sub.bakTgt) * 100 : 0;
      const subBakRpd = daysLeft > 0 ? subBakBtg / daysLeft : 0;

      const subBisBtg = sub.bisTgt - sub.bisAch;
      const subBisPct = sub.bisTgt > 0 ? (sub.bisAch / sub.bisTgt) * 100 : 0;
      const subBisRpd = daysLeft > 0 ? subBisBtg / daysLeft : 0;

      const subConfBtg = sub.confTgt - sub.confAch;
      const subConfPct = sub.confTgt > 0 ? (sub.confAch / sub.confTgt) * 100 : 0;
      const subConfRpd = daysLeft > 0 ? subConfBtg / daysLeft : 0;

      t2Html += `
        <tr class="subtotal-row">
          <td class="col-freeze-dsr">TOTAL ${team.name}</td>
          <td class="num">${Math.round(sub.bakTgt).toLocaleString()}</td>
          <td class="num">${sub.bakAch.toFixed(2)}</td>
          <td class="num">${subBakBtg.toFixed(2)}</td>
          <td class="num">${subBakPct.toFixed(0)}%</td>
          <td class="num col-div-bakery-end">${subBakRpd.toFixed(2)}</td>

          <td class="num">${Math.round(sub.bisTgt).toLocaleString()}</td>
          <td class="num">${sub.bisAch.toFixed(2)}</td>
          <td class="num">${subBisBtg.toFixed(2)}</td>
          <td class="num">${subBisPct.toFixed(0)}%</td>
          <td class="num col-div-bis-end">${subBisRpd.toFixed(2)}</td>

          <td class="num">${Math.round(sub.confTgt).toLocaleString()}</td>
          <td class="num">${sub.confAch.toFixed(2)}</td>
          <td class="num">${subConfBtg.toFixed(2)}</td>
          <td class="num">${subConfPct.toFixed(0)}%</td>
          <td class="num col-div-conf-end">${subConfRpd.toFixed(2)}</td>

          <td class="num">${Math.round(sub.tgt).toLocaleString()}</td>
          <td class="num">${sub.ach.toFixed(2)}</td>
          <td class="num">${subBtg.toFixed(2)}</td>
          <td class="num">${subAchPct.toFixed(0)}%</td>
          <td class="num">${subRpd.toFixed(2)}</td>
        </tr>
      `;
    });

    const grandUPct = grand.shops > 0 ? (grand.uShops / grand.shops) * 100 : 0;
    const grandAchPct = grand.tgt > 0 ? (grand.ach / grand.tgt) * 100 : 0;
    const grandMtdPct = timeGonePct > 0 ? (grandAchPct / (timeGonePct * 100)) * 100 : 0;
    const grandBtg = grand.tgt - grand.ach;
    const grandRpd = daysLeft > 0 ? grandBtg / daysLeft : 0;
    const grandCmAvg = daysPassed > 0 ? grand.ach / daysPassed : 0;
    const grandLmAvg = totalMonthDays > 0 ? grand.lmSales / totalMonthDays : 0;
    const grandGCtn = grand.cmMtd - grand.lmSales;
    const grandGPct = grand.lmSales > 0 ? (grandGCtn / grand.lmSales) * 100 : 0;

    // GRAND TOTAL ROW (Frozen)
    t1Html += `
      <tr class="grandtotal-row">
        <td class="col-freeze-dsr">GRAND TOTAL</td>
        <td class="num">${grand.shops}</td>
        <td class="num">${grand.uShops}</td>
        <td class="num col-block-dsr-end">${grandUPct.toFixed(0)}%</td>
        <td class="num">${Math.round(grand.tgt).toLocaleString()}</td>
        <td class="num">${grand.ach.toFixed(2)}</td>
        <td class="num">${Math.round(grand.amt).toLocaleString()}</td>
        <td class="num">${grandAchPct.toFixed(1)}%</td>
        <td class="num">${grandMtdPct.toFixed(1)}%</td>
        <td class="num">${grandBtg.toFixed(2)}</td>
        <td class="num col-block-target-end">${grandRpd.toFixed(2)}</td>
        <td class="num">${grand.bkg.toFixed(2)}</td>
        <td class="num">${grand.exe.toFixed(2)}</td>
        <td class="num col-block-booking-end">${grand.rtg.toFixed(2)}</td>
        <td class="num">${grand.cmMtd.toFixed(2)}</td>
        <td class="num">${grandCmAvg.toFixed(2)}</td>
        <td class="num">${grand.lmSales.toFixed(2)}</td>
        <td class="num">${grandLmAvg.toFixed(2)}</td>
        <td class="num">${grandGCtn.toFixed(2)}</td>
        <td class="num">${grandGPct.toFixed(1)}%</td>
      </tr>
    `;

    const grandBakBtg = grand.bakTgt - grand.bakAch;
    const grandBakPct = grand.bakTgt > 0 ? (grand.bakAch / grand.bakTgt) * 100 : 0;
    const grandBakRpd = daysLeft > 0 ? grandBakBtg / daysLeft : 0;

    const grandBisBtg = grand.bisTgt - grand.bisAch;
    const grandBisPct = grand.bisTgt > 0 ? (grand.bisAch / grand.bisTgt) * 100 : 0;
    const grandBisRpd = daysLeft > 0 ? grandBisBtg / daysLeft : 0;

    const grandConfBtg = grand.confTgt - grand.confAch;
    const grandConfPct = grand.confTgt > 0 ? (grand.confAch / grand.confTgt) * 100 : 0;
    const grandConfRpd = daysLeft > 0 ? grandConfBtg / daysLeft : 0;

    t2Html += `
      <tr class="grandtotal-row">
        <td class="col-freeze-dsr">GRAND TOTAL</td>
        <td class="num">${Math.round(grand.bakTgt).toLocaleString()}</td>
        <td class="num">${(grand.bakAch).toFixed(2)}</td>
        <td class="num">${grandBakBtg.toFixed(2)}</td>
        <td class="num">${grandBakPct.toFixed(0)}%</td>
        <td class="num col-div-bakery-end">${grandBakRpd.toFixed(2)}</td>

        <td class="num">${Math.round(grand.bisTgt).toLocaleString()}</td>
        <td class="num">${(grand.bisAch).toFixed(2)}</td>
        <td class="num">${grandBisBtg.toFixed(2)}</td>
        <td class="num">${grandBisPct.toFixed(0)}%</td>
        <td class="num col-div-bis-end">${grandBisRpd.toFixed(2)}</td>

        <td class="num">${Math.round(grand.confTgt).toLocaleString()}</td>
        <td class="num">${(grand.confAch).toFixed(2)}</td>
        <td class="num">${grandConfBtg.toFixed(2)}</td>
        <td class="num">${grandConfPct.toFixed(0)}%</td>
        <td class="num col-div-conf-end">${grandConfRpd.toFixed(2)}</td>

        <td class="num">${Math.round(grand.tgt).toLocaleString()}</td>
        <td class="num">${grand.ach.toFixed(2)}</td>
        <td class="num">${grandBtg.toFixed(2)}</td>
        <td class="num">${grandAchPct.toFixed(0)}%</td>
        <td class="num">${grandRpd.toFixed(2)}</td>
      </tr>
    `;

    const mBody = document.getElementById('perfMainTbody');
    if (mBody) mBody.innerHTML = t1Html;

    const dBody = document.getElementById('perfDivTbody');
    if (dBody) dBody.innerHTML = t2Html;

    if (typeof attachExcelSelectionListeners === 'function') {
      attachExcelSelectionListeners();
    }
  }
};