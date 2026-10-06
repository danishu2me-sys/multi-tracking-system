window.DashboardModule = {
  renderHTML: function() {
    return `
      <div class="dashboard-container">
        <!-- TOP HEADER -->
        <div class="dash-top-bar">
          <div class="dash-title-group">
            <h2>📈 Executive Sales Performance Dashboard</h2>
            <p>Real-time analytics, DSR KPIs, and Division contribution</p>
          </div>
          <div class="dash-clock-box">
            <span id="dashLiveTime" class="dash-clock-time">--:--:-- --</span>
            <span id="dashLiveDate" class="dash-clock-date">--/--/----</span>
          </div>
        </div>

        <!-- 4 TOP KPI CARDS (RESTORED GRID) -->
        <div class="dash-kpi-grid">
          <div class="dash-kpi-card" style="border-left:4px solid #0284c7;">
            <span class="dash-kpi-label">Current Month Sales</span>
            <div class="dash-kpi-value" id="dashValDeliveredCtn" style="color:#38bdf8;">0.00 CTN</div>
            <span class="dash-kpi-sub" style="color:#0284c7;">Delivered Orders</span>
          </div>
          <div class="dash-kpi-card" style="border-left:4px solid #10b981;">
            <span class="dash-kpi-label">Unique Outlets Active</span>
            <div class="dash-kpi-value" id="dashValUniqueActive" style="color:#10b981;">0</div>
            <span class="dash-kpi-sub" style="color:#059669;">Billed Customers</span>
          </div>
          <div class="dash-kpi-card" style="border-left:4px solid #f59e0b;">
            <span class="dash-kpi-label">Overall Achievement</span>
            <div class="dash-kpi-value" id="dashValOverallAch" style="color:#f59e0b;">0.0%</div>
            <span class="dash-kpi-sub" style="color:#d97706;">Target vs Actual</span>
          </div>
          <div class="dash-kpi-card" style="border-left:4px solid #a855f7;">
            <span class="dash-kpi-label">Active Sales Force</span>
            <div class="dash-kpi-value" id="dashValActiveDSRs" style="color:#c084fc;">11 DSRs</div>
            <span class="dash-kpi-sub" style="color:#9333ea;">Field Routes</span>
          </div>
        </div>

        <!-- MIDDLE SECTION (DSR PROGRESS BARS + DIVISION DONUT) -->
        <div class="dash-middle-grid">
          <!-- Top DSR Performance Bars -->
          <div class="dash-box">
            <div class="dash-box-header">
              <span class="dash-box-title">🏆 Top DSR Target Achievement %</span>
              <span style="font-size:10px; color:#38bdf8; font-weight:bold;">Real-time</span>
            </div>
            <div class="dsr-bars-list" id="dashDsrBarsContainer">
              <div style="text-align:center; padding:30px; color:var(--text-muted);">No sales data available.</div>
            </div>
          </div>

          <!-- Division Contribution Donut -->
          <div class="dash-box">
            <div class="dash-box-header">
              <span class="dash-box-title">🍩 Division Contribution</span>
              <span style="font-size:10px; color:#10b981; font-weight:bold;">Delivered Volume</span>
            </div>
            <div class="donut-chart-container">
              <div style="position:relative; width:160px; height:160px; display:flex; align-items:center; justify-content:center;">
                <canvas id="dashDonutCanvas" width="160" height="160"></canvas>
                <div style="position:absolute; text-align:center;">
                  <span style="font-size:9.5px; font-weight:800; color:var(--text-subtle); display:block;">TOTAL</span>
                  <strong id="dashDonutCenterTotal" style="font-size:15px; font-weight:900; color:#38bdf8; font-family:'Consolas', monospace;">0</strong>
                </div>
              </div>
              <div class="donut-legend" id="dashDonutLegend"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  update: function() {
    const cmRecords = (cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    // 1. Total CTN & Unique POPs
    let totalCtn = 0;
    const uniquePopSet = new Set();
    const divTotals = { BAK: 0, BIS: 0, CONF: 0 };
    const dsrSalesMap = {};

    cmRecords.forEach(r => {
      const q = r.qty || 0;
      totalCtn += q;
      if (r.pop) uniquePopSet.add(r.pop);

      // Division categorization
      const divStr = (r.division || r.brand || '').toUpperCase();
      if (divStr.includes('BAK') || divStr.includes('CROISSANT') || divStr.includes('HEARTS')) {
        divTotals.BAK += q;
      } else if (divStr.includes('BIS') || divStr.includes('CAFE') || divStr.includes('A1') || divStr.includes('BESTO') || divStr.includes('CREMO') || divStr.includes('SPECIAL')) {
        divTotals.BIS += q;
      } else {
        divTotals.CONF += q;
      }

      // DSR totals
      const dName = cleanDSRName(r.rawDsr || r.dsr || '');
      if (dName) {
        dsrSalesMap[dName] = (dsrSalesMap[dName] || 0) + q;
      }
    });

    const elCtn = document.getElementById('dashValDeliveredCtn');
    if (elCtn) elCtn.innerText = `${totalCtn.toFixed(1)} CTN`;

    const elPop = document.getElementById('dashValUniqueActive');
    if (elPop) elPop.innerText = uniquePopSet.size.toLocaleString();

    // 2. Overall Achievement % from Target file
    let overallAchPct = 0;
    if (allRecords && allRecords.length > 0) {
      const totTgt = allRecords.reduce((s, r) => s + (r.target || 0), 0);
      const totAch = allRecords.reduce((s, r) => s + (r.achiv || 0), 0);
      if (totTgt > 0) overallAchPct = (totAch / totTgt) * 100;
    }
    const elAch = document.getElementById('dashValOverallAch');
    if (elAch) elAch.innerText = `${overallAchPct.toFixed(1)}%`;

    // 3. Render DSR Performance Bars
    const dsrEntries = Object.entries(dsrSalesMap).sort((a,b) => b[1] - a[1]);
    const barsContainer = document.getElementById('dashDsrBarsContainer');
    if (barsContainer) {
      if (dsrEntries.length === 0) {
        barsContainer.innerHTML = `<div style="text-align:center; padding:25px; color:var(--text-muted);">No sales records for Current Month.</div>`;
      } else {
        const maxVal = Math.max(...dsrEntries.map(e => e[1]), 1);
        barsContainer.innerHTML = dsrEntries.slice(0, 7).map(([name, val]) => {
          const pct = ((val / maxVal) * 100).toFixed(0);
          return `
            <div class="dsr-bar-item">
              <span class="dsr-bar-name" title="${name}">${name}</span>
              <div class="dsr-bar-track">
                <div class="dsr-bar-fill" style="width:${pct}%; background:#0284c7;"></div>
              </div>
              <span class="dsr-bar-pct" style="color:#38bdf8;">${val.toFixed(1)}</span>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Render Division Donut Chart
    const totalDiv = divTotals.BAK + divTotals.BIS + divTotals.CONF;
    const canvas = document.getElementById('dashDonutCanvas');
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerText = document.getElementById('dashDonutCenterTotal');
      if (centerText) centerText.innerText = Math.round(totalDiv).toLocaleString();

      const legend = document.getElementById('dashDonutLegend');
      const segments = [
        { label: 'Bakery', val: divTotals.BAK, color: '#0284c7' },
        { label: 'Biscuits', val: divTotals.BIS, color: '#10b981' },
        { label: 'Confectionery', val: divTotals.CONF, color: '#f59e0b' }
      ];

      if (totalDiv > 0) {
        let startAngle = -Math.PI / 2;
        segments.forEach(seg => {
          const sliceAngle = (seg.val / totalDiv) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(80, 80, 68, startAngle, startAngle + sliceAngle);
          ctx.arc(80, 80, 48, startAngle + sliceAngle, startAngle, true);
          ctx.closePath();
          ctx.fillStyle = seg.color;
          ctx.fill();
          startAngle += sliceAngle;
        });
      } else {
        ctx.beginPath();
        ctx.arc(80, 80, 68, 0, 2 * Math.PI);
        ctx.arc(80, 80, 48, 2 * Math.PI, 0, true);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
      }

      if (legend) {
        legend.innerHTML = segments.map(s => {
          const p = totalDiv > 0 ? ((s.val / totalDiv) * 100).toFixed(1) : '0.0';
          return `
            <div class="legend-item">
              <span class="legend-color-dot" style="background:${s.color};"></span>
              <span>${s.label}: <b>${s.val.toFixed(1)} (${p}%)</b></span>
            </div>
          `;
        }).join('');
      }
    }
  }
};