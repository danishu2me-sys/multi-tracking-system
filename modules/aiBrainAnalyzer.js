window.AiBrainModule = {
  benchmark: {
    targetPct: 80,
    targetDay: 15
  },

  selectedBrand: 'ALL',
  selectedSku: 'ALL',
  selectedDsr: 'OB10-ZIA-UL-HAQ-MERGE-T/W-(A)',
  activeRouteSection: '',
  dsrSectionOverrides: {},

  renderHTML: function() {
    return `
      <style>
        .brain-cockpit-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          min-height: 100%;
          padding-bottom: 50px;
        }

        /* 1. TOP HERO AI BANNER */
        .brain-hero-card {
          background: linear-gradient(135deg, #071224 0%, #0c2344 50%, #061120 100%);
          border: 1.5px solid #0284c7;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.25);
          position: relative;
          overflow: hidden;
        }

        .brain-info-left {
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 2;
        }

        .brain-avatar-box {
          width: 52px;
          height: 52px;
          background: #091426;
          border: 2px solid #38bdf8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
          animation: pulseBrain 2.5s infinite ease-in-out;
        }

        @keyframes pulseBrain {
          0% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.3); transform: scale(1); }
          50% { box-shadow: 0 0 24px rgba(56, 189, 248, 0.7); transform: scale(1.03); }
          100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.3); transform: scale(1); }
        }

        .brain-avatar-box svg {
          width: 28px;
          height: 28px;
          fill: none;
          stroke: #38bdf8;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .brain-title-texts h2 {
          font-size: 16px;
          font-weight: 900;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .brain-title-texts p {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .brain-benchmark-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(11, 22, 40, 0.9);
          border: 1px solid #1e3a5f;
          padding: 6px 12px;
          border-radius: 8px;
          z-index: 2;
        }

        .bm-input-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .bm-label {
          font-size: 8px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .bm-input {
          width: 48px;
          background: #050b14;
          border: 1px solid #0284c7;
          border-radius: 4px;
          padding: 2px 4px;
          font-family: 'Consolas', monospace;
          font-size: 11px;
          font-weight: bold;
          color: #ffffff;
          text-align: center;
          outline: none;
        }

        .btn-run-brain {
          background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: 1.5px solid #38bdf8;
          border-radius: 6px;
          padding: 7px 14px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
          transition: 0.2s;
        }
        .btn-run-brain:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(56, 189, 248, 0.55);
        }

        /* 2. TOP 4 CORE STAT CARDS */
        .brain-kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .brain-kpi-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .brain-kpi-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3.5px;
        }
        .kpi-border-cyan::before { background: #38bdf8; }
        .kpi-border-amber::before { background: #f59e0b; }
        .kpi-border-red::before { background: #ef4444; }
        .kpi-border-green::before { background: #10b981; }

        .bkpi-label { font-size: 9px; font-weight: 800; color: var(--text-subtle); text-transform: uppercase; }
        .bkpi-val { font-size: 21px; font-weight: 900; font-family: 'Consolas', monospace; color: var(--text-main); margin: 2px 0; }
        .bkpi-sub { font-size: 10px; font-weight: 700; }

        /* 3. ADVANCE 4-CARD EXECUTIVE GRID */
        .brain-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          flex: 1;
        }

        .adv-brain-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .adv-card-header {
          background: #0f1d36;
          border-bottom: 1.5px solid var(--border-color);
          padding: 8px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .adv-card-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .adv-card-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        /* CARD 1: Calling Route Focus */
        .route-controls-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .adv-select {
          flex: 1;
          background: var(--bg-panel);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          font-size: 11px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
          outline: none;
        }

        .route-stat-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px;
          text-align: center;
        }
        .rss-box span { font-size: 8px; color: var(--text-muted); font-weight: 800; display: block; text-transform: uppercase; }
        .rss-box strong { font-size: 14px; font-weight: 900; font-family: 'Consolas', monospace; }

        .route-zero-list {
          flex: 1;
          max-height: 140px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-right: 4px;
        }
        .rz-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-panel);
          border-left: 3px solid #ef4444;
          padding: 5px 8px;
          border-radius: 3px;
          font-size: 10px;
        }
        .rz-shop-name { font-weight: 700; color: var(--text-main); }
        .rz-badge { background: #fee2e2; color: #b91c1c; font-weight: 800; font-size: 8.5px; padding: 1px 5px; border-radius: 3px; }

        /* CARD 2: DSR Pacing Meters */
        .pacing-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          max-height: 220px;
          padding-right: 4px;
        }
        .pace-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .pace-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
        }
        .pace-track {
          height: 10px;
          background: #091322;
          border: 1px solid var(--border-color);
          border-radius: 5px;
          overflow: hidden;
          position: relative;
        }
        .pace-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .pace-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #f59e0b;
        }

        /* CARD 3: Brand Radar */
        .brand-radar-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .brand-bar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10.5px;
        }
        .brand-bar-name { width: 90px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .brand-bar-track { flex: 1; height: 12px; background: #091322; border-radius: 3px; overflow: hidden; border: 1px solid var(--border-color); }
        .brand-bar-fill { height: 100%; }
        .brand-bar-pct { width: 50px; text-align: right; font-weight: 800; font-family: 'Consolas', monospace; }

        /* CARD 4: Executive Directive */
        .directive-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 10.5px;
          line-height: 1.4;
        }
        .directive-bullet {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--bg-panel);
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .db-icon { font-size: 15px; }
        .db-text strong { color: #38bdf8; }
      </style>

      <div class="brain-cockpit-container">
        
        <!-- 1. TOP BANNER -->
        <div class="brain-hero-card">
          <div class="brain-info-left">
            <div class="brain-avatar-box">
              <svg viewBox="0 0 24 24">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
                <path d="M12 8h-3m3 4H8m4 4h-2m2-8h3m-3 4h4m-4 4h2" />
              </svg>
            </div>
            <div class="brain-title-texts">
              <h2>🧠 Executive AI Sales Brain & Field Cockpit</h2>
              <p>Dynamic Route Targeting, Benchmark Gap Analysis, and Multi-Brand Penetration Directives</p>
            </div>
          </div>

          <div class="brain-benchmark-panel">
            <div class="bm-input-group">
              <span class="bm-label">Target Day:</span>
              <input type="number" id="bmTargetDayInput" class="bm-input" value="15" min="1" max="31" />
            </div>
            <div class="bm-input-group">
              <span class="bm-label">Goal %:</span>
              <input type="number" id="bmTargetPctInput" class="bm-input" value="80" min="1" max="100" />
            </div>
            <button class="btn-run-brain" onclick="AiBrainModule.runDeepAnalysis()">
              ⚡ Analyze & Synchronize
            </button>
          </div>
        </div>

        <!-- 2. TOP 4 CORE STAT CARDS -->
        <div class="brain-kpi-row">
          <div class="brain-kpi-card kpi-border-cyan">
            <span class="bkpi-label">Current Month Unique Active</span>
            <div class="bkpi-val" id="brainTotalActiveShops" style="color:#38bdf8;">--</div>
            <span class="bkpi-sub" id="brainOverallUniquePct" style="color:#94a3b8;">Current: 0.0% of Universe</span>
          </div>
          <div class="brain-kpi-card kpi-border-amber">
            <span class="bkpi-label">Benchmark Gap (80% Goal)</span>
            <div class="bkpi-val" id="brainShopsNeededToGoal" style="color:#f59e0b;">--</div>
            <span class="bkpi-sub" id="brainDaysRemainingText" style="color:#fbbf24;">Days Left to Goal: --</span>
          </div>
          <div class="brain-kpi-card kpi-border-red">
            <span class="bkpi-label">Active Route Zero Outlets</span>
            <div class="bkpi-val" id="brainTodayZeroShops" style="color:#ef4444;">--</div>
            <span class="bkpi-sub" style="color:#f87171;">Pending Bills in Today's Section</span>
          </div>
          <div class="brain-kpi-card kpi-border-green">
            <span class="bkpi-label">Required Daily Run-Rate</span>
            <div class="bkpi-val" id="brainDailyRunRate" style="color:#10b981;">--</div>
            <span class="bkpi-sub" style="color:#34d399;">Unique Outlets / Day to Hit Target</span>
          </div>
        </div>

        <!-- 3. ADVANCE 4-CARD EXECUTIVE GRID (NO TABLES) -->
        <div class="brain-cards-grid">
          
          <!-- CARD 1: Route & Section Calling Focus -->
          <div class="adv-brain-card">
            <div class="adv-card-header">
              <span class="adv-card-title">📍 Today's Calling Route & Zero-Purchase Priority</span>
              <span style="font-size:9.5px; color:#38bdf8; font-weight:bold;">Field Execution</span>
            </div>
            <div class="adv-card-body">
              <div class="route-controls-row">
                <select id="advDsrSelector" class="adv-select" onchange="AiBrainModule.onDsrSelectChange(this.value)"></select>
                <select id="advSectionSelector" class="adv-select" onchange="AiBrainModule.onSectionSelectChange(this.value)"></select>
              </div>

              <div class="route-stat-strip">
                <div class="rss-box">
                  <span>Route Shops</span>
                  <strong id="advRouteTotalShops" style="color:#f8fafc;">0</strong>
                </div>
                <div class="rss-box">
                  <span>Billed in CM</span>
                  <strong id="advRouteBilledShops" style="color:#10b981;">0</strong>
                </div>
                <div class="rss-box">
                  <span>Zero-Purchase</span>
                  <strong id="advRouteZeroShops" style="color:#ef4444;">0</strong>
                </div>
              </div>

              <div style="font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Must-Call Zero Outlets (Today):</div>
              <div class="route-zero-list" id="advRouteZeroList">
                <div style="text-align:center; padding:15px; color:var(--text-muted);">No zero-purchase shops.</div>
              </div>
            </div>
          </div>

          <!-- CARD 2: DSR Productivity Pace Meters -->
          <div class="adv-brain-card">
            <div class="adv-card-header">
              <span class="adv-card-title">⚡ DSR Benchmark Pacing & Deficit Tracking</span>
              <span style="font-size:9.5px; color:#f59e0b; font-weight:bold;">Goal: 80% Unique</span>
            </div>
            <div class="adv-card-body">
              <div class="pacing-list" id="advPacingList"></div>
            </div>
          </div>

          <!-- CARD 3: Brand & Division Penetration Radar -->
          <div class="adv-brain-card">
            <div class="adv-card-header">
              <span class="adv-card-title">🏷️ Brand & Division Portfolio Penetration</span>
              <span style="font-size:9.5px; color:#10b981; font-weight:bold;">Portfolio Depth</span>
            </div>
            <div class="adv-card-body">
              <div class="brand-radar-list" id="advBrandRadarList"></div>
            </div>
          </div>

          <!-- CARD 4: Executive Directive & Strategy -->
          <div class="adv-brain-card">
            <div class="adv-card-header">
              <span class="adv-card-title">🧠 AI Executive Strategy & Daily Field Directive</span>
              <span style="font-size:9.5px; color:#a855f7; font-weight:bold;">Automated Plan</span>
            </div>
            <div class="adv-card-body">
              <div class="directive-box" id="advDirectiveBox"></div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  onDsrSelectChange: function(dsrName) {
    this.selectedDsr = dsrName;
    this.activeRouteSection = '';
    this.runDeepAnalysis();
  },

  onSectionSelectChange: function(secName) {
    this.activeRouteSection = secName;
    this.dsrSectionOverrides[this.selectedDsr] = secName;
    this.runDeepAnalysis();
  },

  runDeepAnalysis: function() {
    const goalDay = parseInt(document.getElementById('bmTargetDayInput')?.value, 10) || 15;
    const goalPct = parseFloat(document.getElementById('bmTargetPctInput')?.value) || 80;

    const cmRecords = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];
    const masterShops = window.shopDataMaster || [];

    const now = new Date();
    const currentDay = now.getDate();
    const daysLeftToGoal = Math.max(1, goalDay - currentDay);

    const dsrList = [
      "OB10-ZIA-UL-HAQ-MERGE-T/W-(A)", "OB11-NOMAN BARI KHAN-MERGE-T/W-(A)",
      "OB14-ARSHAD IQBAL-Merge-(A)", "OB25-SHAMS TABRREEZ-WS-(G)",
      "OB07-MOHSIN QURESHI-Merge-(A)", "OB08-FARHAN BAIG-MERGE-T/W-(A)",
      "OB08-MSR SAJJAD HUSSAIN-MERGE-(A)", "OB14-MSR WAQAR AHMED-Merge-(A)",
      "OB09-M QASIM CHISHTI-Merge-(A)", "OB09-M.DANISH-Merge-(A)",
      "OB25-MSR FAIZAN UL HASSAN-WS-(G)"
    ];

    if (!dsrList.includes(this.selectedDsr)) {
      this.selectedDsr = dsrList[0];
    }

    const dsrStats = {};
    dsrList.forEach(name => {
      const u = PRESET_UNIVERSE[name] || manualUniverseMap[name] || 250;
      dsrStats[name] = {
        name: name,
        universe: u,
        activePops: new Set(),
        availableSections: new Set(),
        todaySection: this.dsrSectionOverrides[name] || '',
        routeShops: []
      };
    });

    const overallActivePops = new Set();
    const brandPopMap = {};

    cmRecords.forEach(r => {
      const dName = (r.rawDsr || r.dsr || '').trim();
      const matchedDsr = dsrList.find(d => d.includes(dName.substring(0, 10)) || dName.includes(d.substring(0, 10)));
      if (matchedDsr && r.pop) {
        dsrStats[matchedDsr].activePops.add(r.pop);
        overallActivePops.add(r.pop);
      }

      const br = (r.brand || '').trim();
      if (br && r.pop) {
        if (!brandPopMap[br]) brandPopMap[br] = new Set();
        brandPopMap[br].add(r.pop);
      }
    });

    masterShops.forEach(shop => {
      const dName = (shop.dsr || '').trim();
      const matchedDsr = dsrList.find(d => d.includes(dName.substring(0, 10)) || dName.includes(d.substring(0, 10)));
      if (matchedDsr) {
        if (shop.section) {
          dsrStats[matchedDsr].availableSections.add(shop.section);
          if (!dsrStats[matchedDsr].todaySection) {
            dsrStats[matchedDsr].todaySection = shop.section;
          }
        }
      }
    });

    dsrList.forEach(name => {
      if (!dsrStats[name].todaySection) dsrStats[name].todaySection = 'MAIN MARKET';
      if (dsrStats[name].availableSections.size === 0) dsrStats[name].availableSections.add('MAIN MARKET');
    });

    const activeDsrObj = dsrStats[this.selectedDsr];
    if (this.activeRouteSection && activeDsrObj.availableSections.has(this.activeRouteSection)) {
      activeDsrObj.todaySection = this.activeRouteSection;
    } else {
      this.activeRouteSection = activeDsrObj.todaySection;
    }

    const currentRouteShops = masterShops.filter(s => {
      const dName = (s.dsr || '').trim();
      return (dName.includes(this.selectedDsr.substring(0, 10)) || this.selectedDsr.includes(dName.substring(0, 10))) &&
             (s.section === this.activeRouteSection);
    });

    // Totals
    let totalUniverse = 0;
    Object.values(dsrStats).forEach(s => totalUniverse += s.universe);
    const totalActive = overallActivePops.size;
    const overallPct = totalUniverse > 0 ? (totalActive / totalUniverse) * 100 : 0;
    const targetShopCount = Math.round(totalUniverse * (goalPct / 100));
    const shopsNeeded = Math.max(0, targetShopCount - totalActive);
    const dailyRunRate = Math.ceil(shopsNeeded / daysLeftToGoal);

    // Update Top 4 Cards
    document.getElementById('brainTotalActiveShops').innerText = totalActive.toLocaleString();
    document.getElementById('brainOverallUniquePct').innerText = `Current: ${overallPct.toFixed(1)}% of Universe (${totalUniverse})`;
    document.getElementById('brainShopsNeededToGoal').innerText = shopsNeeded.toLocaleString() + ' Shops';
    document.getElementById('brainDaysRemainingText').innerText = `Days Left to Target: ${daysLeftToGoal} Day(s)`;

    let routeBilledCount = 0;
    const routeZeroShops = [];
    currentRouteShops.forEach(sh => {
      if (activeDsrObj.activePops.has(sh.pop)) {
        routeBilledCount++;
      } else {
        routeZeroShops.push(sh);
      }
    });

    document.getElementById('brainTodayZeroShops').innerText = routeZeroShops.length.toLocaleString();
    document.getElementById('brainDailyRunRate').innerText = `${dailyRunRate} Shops/Day`;

    // 1. UPDATE CARD 1: Calling Route Focus
    const dsrSel = document.getElementById('advDsrSelector');
    if (dsrSel) {
      dsrSel.innerHTML = dsrList.map(d => `<option value="${d}" ${d === this.selectedDsr ? 'selected' : ''}>${d}</option>`).join('');
    }

    const secSel = document.getElementById('advSectionSelector');
    if (secSel) {
      secSel.innerHTML = Array.from(activeDsrObj.availableSections).map(sec => 
        `<option value="${sec}" ${sec === this.activeRouteSection ? 'selected' : ''}>${sec}</option>`
      ).join('');
    }

    document.getElementById('advRouteTotalShops').innerText = currentRouteShops.length;
    document.getElementById('advRouteBilledShops').innerText = routeBilledCount;
    document.getElementById('advRouteZeroShops').innerText = routeZeroShops.length;

    let zeroListHtml = '';
    routeZeroShops.slice(0, 15).forEach(z => {
      zeroListHtml += `
        <div class="rz-item">
          <div>
            <span class="rz-shop-name">${z.name || 'Shop ' + z.pop}</span>
            <span style="font-size:8.5px; color:#64748b; font-family:'Consolas'; margin-left:4px;">#${z.pop}</span>
          </div>
          <span class="rz-badge">ZERO BILLED</span>
        </div>
      `;
    });
    if (!routeZeroShops.length) {
      zeroListHtml = `<div style="text-align:center; padding:15px; color:#10b981; font-weight:bold;">🎉 All shops billed in this route!</div>`;
    }
    document.getElementById('advRouteZeroList').innerHTML = zeroListHtml;

    // 2. UPDATE CARD 2: DSR Pacing Meters
    let pacingHtml = '';
    Object.values(dsrStats).forEach(s => {
      const billed = s.activePops.size;
      const pct = s.universe > 0 ? (billed / s.universe) * 100 : 0;
      const dsrTargetShops = Math.round(s.universe * (goalPct / 100));
      const dsrGap = Math.max(0, dsrTargetShops - billed);
      const dsrDailyReq = Math.ceil(dsrGap / daysLeftToGoal);

      const color = pct >= goalPct ? '#10b981' : (pct >= goalPct * 0.6 ? '#f59e0b' : '#ef4444');

      pacingHtml += `
        <div class="pace-row">
          <div class="pace-header">
            <span style="color:#f8fafc; font-weight:700;">${s.name.split('-')[1] || s.name}</span>
            <span style="color:${color}; font-weight:900;">${pct.toFixed(1)}% <span style="font-size:8.5px; color:#94a3b8;">(Gap: ${dsrGap} | Req: ${dsrDailyReq}/d)</span></span>
          </div>
          <div class="pace-track">
            <div class="pace-fill" style="width: ${Math.min(100, pct)}%; background: ${color};"></div>
            <div class="pace-marker" style="left: ${goalPct}%;" title="Goal: 80%"></div>
          </div>
        </div>
      `;
    });
    document.getElementById('advPacingList').innerHTML = pacingHtml;

    // 3. UPDATE CARD 3: Brand Radar
    const brandsSorted = Object.keys(brandPopMap).sort((a,b) => brandPopMap[b].size - brandPopMap[a].size).slice(0, 6);
    let brandRadarHtml = '';
    brandsSorted.forEach(bName => {
      const bShops = brandPopMap[bName].size;
      const bPct = totalUniverse > 0 ? (bShops / totalUniverse) * 100 : 0;
      const bColor = bPct >= 40 ? '#10b981' : (bPct >= 20 ? '#0284c7' : '#f59e0b');

      brandRadarHtml += `
        <div class="brand-bar-item">
          <span class="brand-bar-name" title="${bName}">${bName}</span>
          <div class="brand-bar-track">
            <div class="brand-bar-fill" style="width:${Math.min(100, bPct * 2)}%; background:${bColor};"></div>
          </div>
          <span class="brand-bar-pct" style="color:${bColor};">${bShops} <small>(${bPct.toFixed(0)}%)</small></span>
        </div>
      `;
    });
    if (!brandsSorted.length) {
      brandRadarHtml = `<div style="text-align:center; padding:15px; color:var(--text-muted);">No sales data found.</div>`;
    }
    document.getElementById('advBrandRadarList').innerHTML = brandRadarHtml;

    // 4. UPDATE CARD 4: Executive Directive
    const criticalDsrs = Object.values(dsrStats).filter(s => (s.activePops.size / s.universe) * 100 < goalPct * 0.5);
    const directiveHtml = `
      <div class="directive-bullet">
        <span class="db-icon">🚨</span>
        <div class="db-text">
          <strong>Critical DSR Attention:</strong> 
          ${criticalDsrs.length ? criticalDsrs.map(d => (d.name.split('-')[1] || d.name)).join(', ') + ' are behind pace.' : 'All DSRs are currently maintaining healthy pace.'}
        </div>
      </div>
      <div class="directive-bullet">
        <span class="db-icon">🎯</span>
        <div class="db-text">
          <strong>Daily Calling Goal:</strong> Team needs minimum <strong>${dailyRunRate} unique billed outlets</strong> every day until Day ${goalDay} to achieve ${goalPct}% benchmark.
        </div>
      </div>
      <div class="directive-bullet">
        <span class="db-icon">📦</span>
        <div class="db-text">
          <strong>Portfolio Focus:</strong> Push secondary SKUs into <strong>${routeZeroShops.length} zero-purchase outlets</strong> in today's active route: <strong>${this.activeRouteSection}</strong>.
        </div>
      </div>
    `;
    document.getElementById('advDirectiveBox').innerHTML = directiveHtml;

    showBannerAlert("🧠 AI Field Cockpit Synchronized!", "#0284c7");
  }
};