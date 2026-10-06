window.SourceFilesModule = {
  renderHTML: function() {
    return `
      <style>
        .source-files-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          min-height: 100%;
          padding-bottom: 50px;
        }

        .source-hero-card {
          background: linear-gradient(135deg, #09152a 0%, #0d2547 100%);
          border: 1.5px solid #0284c7;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }

        .source-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .source-card {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 16px;
          border: 1.5px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          position: relative;
        }

        .source-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }

        .source-card-icon {
          font-size: 24px;
          padding: 6px 10px;
          background: var(--bg-panel);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .source-card-title {
          font-size: 13px;
          font-weight: 800;
          color: #38bdf8;
        }

        .source-card-desc {
          font-size: 10.5px;
          color: var(--text-muted);
          min-height: 28px;
        }

        .source-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-panel);
          padding: 8px 10px;
          border-radius: 5px;
          border: 1px solid var(--border-color);
          font-size: 11px;
        }

        .badge-status {
          padding: 2px 7px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 800;
        }
        .badge-active { background: #dcfce7; color: #15803d; }
        .badge-empty { background: #fee2e2; color: #b91c1c; }

        .btn-source-upload {
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 9px 14px;
          border-radius: 5px;
          font-weight: 800;
          font-size: 11.5px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-source-upload:hover {
          background: #0369a1;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
        }
      </style>

      <div class="source-files-container">
        <!-- TOP BANNER -->
        <div class="source-hero-card">
          <div>
            <h2 style="font-size:16px; font-weight:900; color:#38bdf8;">📁 Master Data & Source Files Hub</h2>
            <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Tamam primary aur secondary databases ka real-time sync status yahan manage karein.</p>
          </div>
          <button class="btn-act btn-all" onclick="SourceFilesModule.refreshAllStatus()">🔄 Refresh Status</button>
        </div>

        <!-- 6 SOURCE CARDS -->
        <div class="source-grid">
          
          <!-- 1. Monthly Target File -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🎯</span>
              <div>
                <div class="source-card-title">Monthly Target Sheet</div>
                <div style="font-size:10px; color:var(--text-subtle);">Target VS Achievement Brand Wise</div>
              </div>
            </div>
            <div class="source-card-desc">Monthly Target file jo DSR aur Brand level achievements track karti hai.</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusTarget" class="badge-status badge-empty">Checking...</span>
            </div>
            <button class="btn-source-upload" onclick="SourceFilesModule.uploadTargetFile()">📤 Upload Target File</button>
          </div>

          <!-- 2. Current Month (CM) Sales Dump -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">⚡</span>
              <div>
                <div class="source-card-title">CM Sales Dump (Delivered)</div>
                <div style="font-size:10px; color:var(--text-subtle);">Current Month Data (DSS / Manual)</div>
              </div>
            </div>
            <div class="source-card-desc">Chalu maheene ka live delivery dump jo productivity aur gaps nikalta hai.</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusCM" class="badge-status badge-empty">Checking...</span>
            </div>
            <button class="btn-source-upload" style="background:#059669;" onclick="SourceFilesModule.uploadDumpFile('CM')">📤 Upload CM Dump</button>
          </div>

          <!-- 3. Last Month (LM) Sales Dump -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">📅</span>
              <div>
                <div class="source-card-title">LM Sales Dump (Delivered)</div>
                <div style="font-size:10px; color:var(--text-subtle);">Last Month Comparison Base</div>
              </div>
            </div>
            <div class="source-card-desc">Pichle maheene ka sales dump jo month-on-month comparison ke liye zaroori hai.</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusLM" class="badge-status badge-empty">Checking...</span>
            </div>
            <button class="btn-source-upload" style="background:#d97706;" onclick="SourceFilesModule.uploadDumpFile('LM')">📤 Upload LM Dump</button>
          </div>

          <!-- 4. Outlet List / Shop Master -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🏪</span>
              <div>
                <div class="source-card-title">Shop Master / Beat List</div>
                <div style="font-size:10px; color:var(--text-subtle);">MF Outlet List Detail</div>
              </div>
            </div>
            <div class="source-card-desc">DSR-wise sections aur dukanon ki master list (Zero Purchase Reports ke liye).</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusShopMaster" class="badge-status badge-empty">Checking...</span>
            </div>
            <button id="btnUploadShopMasterCard" class="btn-source-upload" onclick="SourceFilesModule.uploadShopMasterFile()">📤 Upload Shop Master</button>
          </div>

          <!-- 5. Current Stock Balance (SnD) -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">📦</span>
              <div>
                <div class="source-card-title">Current Stock Balance</div>
                <div style="font-size:10px; color:var(--text-subtle);">MF SKU And Div Wise Stock</div>
              </div>
            </div>
            <div class="source-card-desc">Warehouse aur distributor ka live stock balance (CTN aur BOX units mein).</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusStock" class="badge-status badge-empty">Checking...</span>
            </div>
            <button class="btn-source-upload" style="background:#2563eb;" onclick="SourceFilesModule.uploadStockBalanceFile()">📤 Upload Stock File</button>
          </div>

          <!-- 6. Total Dispatch (Today) -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🚚</span>
              <div>
                <div class="source-card-title">Today's Dispatch</div>
                <div style="font-size:10px; color:var(--text-subtle);">TODAY_DISPATCH Sheet</div>
              </div>
            </div>
            <div class="source-card-desc">Distributor 'KHI – REHMAN ENT-BR2' ka daily factory dispatch data.</div>
            <div class="source-status-row">
              <span>Status:</span>
              <span id="srcStatusDispatch" class="badge-status badge-empty">Checking...</span>
            </div>
            <button class="btn-source-upload" style="background:#4f46e5;" onclick="SourceFilesModule.uploadDispatchFile()">📤 Upload Dispatch File</button>
          </div>

        </div>
      </div>
    `;
  },

  uploadTargetFile: async function() {
    showBannerAlert("⏳ Opening Target File Selector...", "#0284c7");
    const { ipcRenderer } = require('electron');
    const res = await ipcRenderer.invoke('upload-monthly-target-file');
    if (res && res.success) {
      showBannerAlert(`🎉 Target File Loaded (${res.totalRecords} Records)!`, "#10b981");
      if (typeof loadSavedData === 'function') await loadSavedData();
      this.updateStatus();
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  uploadDumpFile: async function(type) {
    showBannerAlert(`⏳ Opening ${type} Dump Selector...`, "#0284c7");
    const { ipcRenderer } = require('electron');
    const res = await ipcRenderer.invoke('upload-sales-dump-tagged', type);
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
      if (typeof loadBothDumps === 'function') await loadBothDumps();
      this.updateStatus();
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  uploadShopMasterFile: async function() {
    const btn = document.getElementById('btnUploadShopMasterCard');
    const smEl = document.getElementById('srcStatusShopMaster');
    
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Processing (Please Wait)...";
        btn.style.opacity = "0.7";
      }
      showBannerAlert("⏳ Reading Shop Master File... Please wait", "#0284c7");

      const { ipcRenderer } = require('electron');
      const res = await ipcRenderer.invoke('upload-shop-master-file');

      if (res && res.success) {
        if (smEl) {
          smEl.className = 'badge-status badge-active';
          smEl.innerText = `Loaded (${res.count} Shops)`;
        }
        showBannerAlert(`🎉 ${res.message}`, "#10b981");
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "📤 Upload Shop Master";
        btn.style.opacity = "1";
      }
    }
  },

  uploadStockBalanceFile: async function() {
    showBannerAlert("⏳ Opening Stock File Selector...", "#0284c7");
    const { ipcRenderer } = require('electron');
    const res = await ipcRenderer.invoke('upload-stock-balance-file');
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
      this.updateStatus();
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  uploadDispatchFile: async function() {
    showBannerAlert("⏳ Opening Dispatch File Selector...", "#0284c7");
    const { ipcRenderer } = require('electron');
    const res = await ipcRenderer.invoke('upload-total-dispatch-file');
    if (res && res.success) {
      showBannerAlert(`🎉 ${res.message}`, "#10b981");
      this.updateStatus();
    } else if (res && res.message) {
      alert(res.message);
    }
  },

  refreshAllStatus: async function() {
    showBannerAlert("⏳ Refreshing status...", "#0284c7");
    if (typeof loadBothDumps === 'function') await loadBothDumps();
    if (typeof loadSavedData === 'function') await loadSavedData();
    await this.updateStatus();
    showBannerAlert("✅ Status Refreshed!", "#10b981");
  },

  updateStatus: async function() {
    const { ipcRenderer } = require('electron');

    // 1. Target
    const tEl = document.getElementById('srcStatusTarget');
    if (tEl) {
      try {
        const res = await ipcRenderer.invoke('get-target-report-data');
        const cnt = (res && res.success && res.data) ? res.data.length : (typeof allRecords !== 'undefined' ? allRecords.length : 0);
        tEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
        tEl.innerText = cnt > 0 ? `Active (${cnt} Targets)` : 'Not Loaded';
      } catch(e) {}
    }

    // 2. CM Dump
    const cmEl = document.getElementById('srcStatusCM');
    if (cmEl) {
      const cnt = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords && cmDump.deliveredRecords.length) || 0;
      cmEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
      cmEl.innerText = cnt > 0 ? `Loaded (${cnt} Rows)` : 'Not Loaded';
    }

    // 3. LM Dump
    const lmEl = document.getElementById('srcStatusLM');
    if (lmEl) {
      const cnt = (typeof lmDump !== 'undefined' && lmDump && lmDump.deliveredRecords && lmDump.deliveredRecords.length) || 0;
      lmEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
      lmEl.innerText = cnt > 0 ? `Loaded (${cnt} Rows)` : 'Not Loaded';
    }

    // 4. Shop Master (Lightweight check via count handler)
    const smEl = document.getElementById('srcStatusShopMaster');
    if (smEl) {
      try {
        const sRes = await ipcRenderer.invoke('get-saved-shop-count');
        const cnt = (sRes && sRes.success) ? sRes.count : 0;
        smEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
        smEl.innerText = cnt > 0 ? `Loaded (${cnt} Shops)` : 'Not Loaded';
      } catch(e) {
        smEl.className = 'badge-status badge-empty';
        smEl.innerText = 'Not Loaded';
      }
    }

    // 5. Stock & Dispatch
    try {
      const stkRes = await ipcRenderer.invoke('get-stock-report-data');
      if (stkRes && stkRes.success) {
        const stkEl = document.getElementById('srcStatusStock');
        if (stkEl) {
          const cnt = (stkRes.stockData && stkRes.stockData.length) || 0;
          stkEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
          stkEl.innerText = cnt > 0 ? `Loaded (${cnt} Items)` : 'Not Loaded';
        }

        const dispEl = document.getElementById('srcStatusDispatch');
        if (dispEl) {
          const cnt = (stkRes.dispatchData && stkRes.dispatchData.length) || 0;
          dispEl.className = cnt > 0 ? 'badge-status badge-active' : 'badge-status badge-empty';
          dispEl.innerText = cnt > 0 ? `Loaded (${cnt} Entries)` : 'Not Loaded';
        }
      }
    } catch(e) {}
  }
};