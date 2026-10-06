window.DashboardModule = {
  rotationAngle: 0,
  animationId: null,

  renderHTML: function() {
    return `
      <style>
        .dashboard-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background: #f1f5f9;
          box-sizing: border-box;
          height: calc(100vh - 130px);
          overflow-y: auto;
        }

        /* Top Header (Light Clean) */
        .dash-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 14px 22px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .dash-title-group h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .dash-title-group p {
          margin: 3px 0 0 0;
          font-size: 11.5px;
          color: #64748b;
        }
        .dash-clock-box {
          text-align: right;
          background: #f8fafc;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .dash-clock-time {
          font-size: 14px;
          font-weight: 800;
          color: #0284c7;
          font-family: 'Consolas', 'Courier New', monospace;
          display: block;
        }
        .dash-clock-date {
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* 4 Top KPI Cards Grid (Light White Cards) */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .dash-kpi-card {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }
        .dash-kpi-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }
        .dash-kpi-value {
          font-size: 24px;
          font-weight: 800;
          font-family: 'Consolas', monospace;
          line-height: 1.2;
        }
        .dash-kpi-sub {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Middle Section: DSR Bars + Donut */
        .dash-middle-grid {
          display: grid;
          grid-template-columns: 1.35fr 0.9fr;
          gap: 16px;
          flex: 1;
        }
        .dash-box {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }
        .dash-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 10px;
        }
        .dash-box-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        /* DSR Performance Bars */
        .dsr-bars-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 300px;
          padding-right: 6px;
        }
        .dsr-bar-item {
          display: grid;
          grid-template-columns: 160px 1fr 70px;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }
        .dsr-bar-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #334155;
          font-weight: 600;
        }
        .dsr-bar-track {
          width: 100%;
          height: 9px;
          background: #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
        }
        .dsr-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.4s ease;
        }
        .dsr-bar-pct {
          text-align: right;
          font-family: 'Consolas', monospace;
          font-weight: 700;
        }

        /* Division Donut Chart & Animated Rotating Ring */
        .donut-chart-container {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 15px 0;
          gap: 14px;
        }
        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #334155;
        }
        .legend-color-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          display: inline-block;
        }
      </style>

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

        <!-- 4 TOP KPI CARDS -->
        <div class="dash-kpi-grid">
          <div class="dash-kpi-card" style="border-left:5px solid #0284c7;">
            <span class="dash-kpi-label">Current Month Sales</span>
            <div class="dash-kpi-value" id="dashValDeliveredCtn" style="color:#0284c7;">0.00 CTN</div>
            <span class="dash-kpi-sub" style="color:#0369a1;">Delivered Orders</span>
          </div>
          <div class="dash-kpi-card" style="border-left:5px solid #10b981;">
            <span class="dash-kpi-label">Unique Outlets Active</span>
            <div class="dash-kpi-value" id="dashValUniqueActive" style="color:#10b981;">0</div>
            <span class="dash-kpi-sub" style="color:#047857;">Billed Customers</span>
          </div>
          <div class="dash-kpi-card" style="border-left:5px solid #f59e0b;">
            <span class="dash-kpi-label">Overall Achievement</span>
            <div class="dash-kpi-value" id="dashValOverallAch" style="color:#d97706;">0.0%</div>
            <span class="dash-kpi-sub" style="color:#b45309;">Target vs Actual</span>
          </div>
          <div class="dash-kpi-card" style="border-left:5px solid #8b5cf6;">
            <span class="dash-kpi-label">Active Sales Force</span>
            <div class="dash-kpi-value" id="dashValActiveDSRs" style="color:#7c3aed;">11 DSRs</div>
            <span class="dash-kpi-sub" style="color:#6d28d9;">Field Routes</span>
          </div>
        </div>

        <!-- MIDDLE SECTION -->
        <div class="dash-middle-grid">
          <!-- Top DSR Bars -->
          <div class="dash-box">
            <div class="dash-box-header">
              <span class="dash-box-title">🏆 Top DSR Target Achievement %</span>
              <span style="font-size:11px; color:#0284c7; font-weight:700;">Real-time</span>
            </div>
            <div class="dsr-bars-list" id="dashDsrBarsContainer">
              <div style="text-align:center; padding:30px; color:#94a3b8;">No sales data available.</div>
            </div>
          </div>

          <!-- Division Contribution Donut -->
          <div class="dash-box">
            <div class="dash-box-header">
              <span class="dash-box-title">🍩 Division Contribution</span>
              <span style="font-size:11px; color:#059669; font-weight:700;">Delivered Volume</span>
            </div>
            <div class="donut-chart-container">
              <div style="position:relative; width:160px; height:160px; display:flex; align-items:center; justify-content:center;">
                <canvas id="dashDonutCanvas" width="160" height="160"></canvas>
                <div style="position:absolute; text-align:center; pointer-events:none;">
                  <span style="font-size:10px; font-weight:800; color:#64748b; display:block;">TOTAL</span>
                  <strong id="dashDonutCenterTotal" style="font-size:16px; font-weight:900; color:#0f172a; font-family:'Consolas', monospace;">0</strong>
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
    const cmRecords = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords : [];

    // Live Clock Update
    const now = new Date();
    const elTime = document.getElementById('dashLiveTime');
    const elDate = document.getElementById('dashLiveDate');
    if (elTime) elTime.innerText = now.toLocaleTimeString();
    if (elDate) elDate.innerText = now.toLocaleDateString();

    // 1. Total CTN & Unique POPs
    let totalCtn = 0;
    const uniquePopSet = new Set();
    const divTotals = { BAK: 0, BIS: 0, CONF: 0 };
    const dsrSalesMap = {};

    cmRecords.forEach(r => {
      const q = r.qty || 0;
      totalCtn += q;
      if (r.pop) uniquePopSet.add(r.pop);

      const divStr = (r.division || r.brand || '').toUpperCase();
      if (divStr.includes('BAK') || divStr.includes('CROISSANT') || divStr.includes('HEARTS')) {
        divTotals.BAK += q;
      } else if (divStr.includes('BIS') || divStr.includes('CAFE') || divStr.includes('A1') || divStr.includes('BESTO') || divStr.includes('CREMO') || divStr.includes('SPECIAL')) {
        divTotals.BIS += q;
      } else {
        divTotals.CONF += q;
      }

      const dName = (typeof cleanDSRName === 'function') ? cleanDSRName(r.rawDsr || r.dsr || '') : (r.rawDsr || r.dsr || '');
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
    if (typeof allRecords !== 'undefined' && allRecords && allRecords.length > 0) {
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
        barsContainer.innerHTML = `<div style="text-align:center; padding:25px; color:#94a3b8;">No sales records for Current Month.</div>`;
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
              <span class="dsr-bar-pct" style="color:#0284c7;">${val.toFixed(1)}</span>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Render Rotating Division Donut Chart
    const totalDiv = divTotals.BAK + divTotals.BIS + divTotals.CONF;
    const canvas = document.getElementById('dashDonutCanvas');

    const centerText = document.getElementById('dashDonutCenterTotal');
    if (centerText) centerText.innerText = Math.round(totalDiv).toLocaleString();

    const legend = document.getElementById('dashDonutLegend');
    const segments = [
      { label: 'Bakery', val: divTotals.BAK, color: '#0284c7' },
      { label: 'Biscuits', val: divTotals.BIS, color: '#10b981' },
      { label: 'Confectionery', val: divTotals.CONF, color: '#f59e0b' }
    ];

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

    // Continuous smooth rotation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const self = this;
    function drawDonutFrame() {
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (totalDiv > 0) {
        let currentAngle = self.rotationAngle;
        segments.forEach(seg => {
          const sliceAngle = (seg.val / totalDiv) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(80, 80, 68, currentAngle, currentAngle + sliceAngle);
          ctx.arc(80, 80, 48, currentAngle + sliceAngle, currentAngle, true);
          ctx.closePath();
          ctx.fillStyle = seg.color;
          ctx.fill();
          currentAngle += sliceAngle;
        });
      } else {
        ctx.beginPath();
        ctx.arc(80, 80, 68, 0, 2 * Math.PI);
        ctx.arc(80, 80, 48, 2 * Math.PI, 0, true);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
      }

      // Har frame par thoda sa ghoomta rahega (0.015 rad per frame)
      self.rotationAngle += 0.015;
      if (self.rotationAngle >= 2 * Math.PI) {
        self.rotationAngle = 0;
      }

      // Check karein agar canvas abhi bhi screen par hai
      if (document.getElementById('dashDonutCanvas')) {
        self.animationId = requestAnimationFrame(drawDonutFrame);
      }
    }

    drawDonutFrame();
  }
};