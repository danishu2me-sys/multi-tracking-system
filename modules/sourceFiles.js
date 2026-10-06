window.SourceFilesModule = {
  renderHTML: function() {
    return `
      <style>
        .source-hub-container {
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          height: 100%;
        }

        .source-banner {
          background: #0f1c33;
          border: 1.5px solid #1e3a5f;
          border-radius: 6px;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .source-banner-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-banner-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .source-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .source-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          transition: transform 0.2s, border-color 0.2s;
        }

        .source-card:hover {
          transform: translateY(-2px);
          border-color: #0284c7;
        }

        .source-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .source-card-icon {
          font-size: 24px;
          line-height: 1;
        }

        .source-card-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #0284c7;
        }

        .source-card-desc {
          font-size: 10.5px;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .source-status-badge {
          font-size: 11px;
          font-weight: 800;
          font-family: 'Consolas', monospace;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          width: fit-content;
        }

        .status-loaded {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .status-empty {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .btn-source-upload {
          background: #0284c7;
          color: #ffffff;
          border: 1px solid #38bdf8;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: auto;
        }

        .btn-source-upload:hover {
          background: #0369a1;
          box-shadow: 0 0 8px rgba(2, 132, 199, 0.4);
        }
      </style>

      <div class="source-hub-container">
        <div class="source-banner">
          <div>
            <div class="source-banner-title">📁 Master Data & Source Files Hub</div>
            <div class="source-banner-sub">Tamam primary aur secondary databases ka real-time sync status yahan manage karein.</div>
          </div>
          <button class="btn-source-upload" style="background:#0f766e; border-color:#14b8a6;" onclick="SourceFilesModule.updateStatus()">🔄 Refresh Status</button>
        </div>

        <div class="source-grid">
          <!-- CARD 1: MONTHLY TARGETS -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🎯</span>
              <div>
                <div class="source-card-title">Monthly Target Sheet</div>
                <div style="font-size:9.5px; color:var(--text-muted);">Target VS Achievement Brand Wise</div>
              </div>
            </div>
            <div class="source-card-desc">Monthly Target file jo DSR aur Brand level achievements track karti hai.</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusTargetSheet" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" onclick="SourceFilesModule.uploadTargetFile()">📤 Upload Target File</button>
          </div>

          <!-- CARD 2: CM SALES DUMP -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">⚡</span>
              <div>
                <div class="source-card-title">CM Sales Dump (Delivered)</div>
                <div style="font-size:9.5px; color:var(--text-muted);">Current Month Data (DSS / Manual)</div>
              </div>
            </div>
            <div class="source-card-desc">Chalu maheene ka live delivery dump jo productivity aur gaps nikalta hai.</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusCmDump" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" style="background:#059669; border-color:#34d399;" onclick="SourceFilesModule.uploadCmDump()">📤 Upload CM Dump</button>
          </div>

          <!-- CARD 3: LM SALES DUMP -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🗓️</span>
              <div>
                <div class="source-card-title">LM Sales Dump (Delivered)</div>
                <div style="font-size:9.5px; color:var(--text-muted);">Last Month Comparison Base</div>
              </div>
            </div>
            <div class="source-card-desc">Pichle maheene ka sales dump jo month-on-month comparison ke liye zaroori hai.</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusLmDump" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" style="background:#d97706; border-color:#f59e0b;" onclick="SourceFilesModule.uploadLmDump()">📤 Upload LM Dump</button>
          </div>

          <!-- CARD 4: SHOP MASTER / BEAT LIST -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🏪</span>
              <div>
                <div class="source-card-title">Shop Master / Beat List</div>
                <div style="font-size:9.5px; color:var(--text-muted);">MF Outlet List Detail</div>
              </div>
            </div>
            <div class="source-card-desc">DSR-wise sections aur dukanon ki master list (Zero Purchase Reports ke liye).</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusShopMaster" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" onclick="SourceFilesModule.uploadShopMaster()">📤 Upload Shop Master</button>
          </div>

          <!-- CARD 5: STOCK BALANCE REPORT -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">📦</span>
              <div>
                <div class="source-card-title">Current Stock Balance</div>
                <div style="font-size:9.5px; color:var(--text-muted);">MF SKU And Div Wise Stock</div>
              </div>
            </div>
            <div class="source-card-desc">Warehouse aur distributor ka live stock balance (CTN aur BOX units mein).</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusStockBalance" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" style="background:#2563eb; border-color:#60a5fa;" onclick="SourceFilesModule.uploadStockBalance()">📤 Upload Stock File</button>
          </div>

          <!-- CARD 6: TODAY DISPATCH REPORT -->
          <div class="source-card">
            <div class="source-card-header">
              <span class="source-card-icon">🚚</span>
              <div>
                <div class="source-card-title">Today's Dispatch</div>
                <div style="font-size:9.5px; color:var(--text-muted);">TODAY_DISPATCH Sheet</div>
              </div>
            </div>
            <div class="source-card-desc">Distributor 'KHI - REHMAN ENT-BR2' ka daily factory dispatch data.</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10.5px; color:var(--text-muted);">Status:</span>
              <span id="statusDispatch" class="source-status-badge status-empty">Not Loaded</span>
            </div>
            <button class="btn-source-upload" style="background:#7c3aed; border-color:#a78bfa;" onclick="SourceFilesModule.uploadDispatch()">📤 Upload Dispatch File</button>
          </div>
        </div>
      </div>
    `;
  },

  updateStatus: async function() {
    // 1. Target Status
    const elTarget = document.getElementById('statusTargetSheet');
    if (elTarget) {
      const cnt = (typeof allRecords !== 'undefined' && allRecords) ? allRecords.length : 0;
      if (cnt > 0) {
        elTarget.className = 'source-status-badge status-loaded';
        elTarget.innerText = `Active (${cnt} Targets)`;
      } else {
        elTarget.className = 'source-status-badge status-empty';
        elTarget.innerText = 'Not Loaded';
      }
    }

    // 2. CM Dump Status
    const elCm = document.getElementById('statusCmDump');
    if (elCm) {
      const cnt = (typeof cmDump !== 'undefined' && cmDump && cmDump.deliveredRecords) ? cmDump.deliveredRecords.length : 0;
      if (cnt > 0) {
        elCm.className = 'source-status-badge status-loaded';
        elCm.innerText = `Loaded (${cnt} Rows)`;
      } else {
        elCm.className = 'source-status-badge status-empty';
        elCm.innerText = 'Not Loaded';
      }
    }

    // 3. LM Dump Status
    const elLm = document.getElementById('statusLmDump');
    if (elLm) {
      const cnt = (typeof lmDump !== 'undefined' && lmDump && lmDump.deliveredRecords) ? lmDump.deliveredRecords.length : 0;
      if (cnt > 0) {
        elLm.className = 'source-status-badge status-loaded';
        elLm.innerText = `Loaded (${cnt} Rows)`;
      } else {
        elLm.className = 'source-status-badge status-empty';
        elLm.innerText = 'Not Loaded';
      }
    }

    // 4. Shop Master Status (Direct live read from backend store)
    const elShop = document.getElementById('statusShopMaster');
    if (elShop) {
      let count = 0;
      try {
        const res = await ipcRenderer.invoke('get-saved-shop-count');
        if (res && res.success) count = res.count || 0;
      } catch(e) {}

      if (count === 0 && window.shopDataMaster) {
        count = window.shopDataMaster.length;
      }

      if (count > 0) {
        elShop.className = 'source-status-badge status-loaded';
        elShop.innerText = `Loaded (${count} Shops)`;
      } else {
        elShop.className = 'source-status-badge status-empty';
        elShop.innerText = 'Not Loaded';
      }
    }

    // 5. Stock & Dispatch Status
    try {
      const sRes = await ipcRenderer.invoke('get-stock-report-data');
      if (sRes && sRes.success) {
        const elStock = document.getElementById('statusStockBalance');
        if (elStock) {
          const sCount = sRes.stockData ? sRes.stockData.length : 0;
          if (sCount > 0) {
            elStock.className = 'source-status-badge status-loaded';
            elStock.innerText = `Loaded (${sCount} Items)`;
          } else {
            elStock.className = 'source-status-badge status-empty';
            elStock.innerText = 'Not Loaded';
          }
        }

        const elDisp = document.getElementById('statusDispatch');
        if (elDisp) {
          const dCount = sRes.dispatchData ? sRes.dispatchData.length : 0;
          if (dCount > 0) {
            elDisp.className = 'source-status-badge status-loaded';
            elDisp.innerText = `Loaded (${dCount} Entries)`;
          } else {
            elDisp.className = 'source-status-badge status-empty';
            elDisp.innerText = 'Not Loaded';
          }
        }
      }
    } catch(e) {}
  },

  // LIVE UPLOAD HANDLER FOR SHOP MASTER
  uploadShopMaster: async function() {
    try {
      showBannerAlert("⏳ Shop Master file upload aur parse ho rahi hai...", "#0284c7");
      const res = await ipcRenderer.invoke('upload-shop-master-file');

      if (res && res.success) {
        showBannerAlert(`🎉 ${res.count} Shops Successfully Uploaded!`, "#10b981");

        // 1. Force flush memory cache and fetch fresh shops
        await loadSavedShopData(true);

        // 2. Update Source Files status badge
        await this.updateStatus();

        // 3. Live refresh all Zero Purchase tables
        if (window.ZeroShopModule && typeof ZeroShopModule.renderTable === 'function') {
          ZeroShopModule.renderTable();
        }
        if (window.ZeroBrandModule && typeof ZeroBrandModule.renderTable === 'function') {
          ZeroBrandModule.renderTable();
        }
        if (window.ZeroSkuModule && typeof ZeroSkuModule.renderTable === 'function') {
          ZeroSkuModule.renderTable();
        }
      } else if (res && res.message) {
        alert("Upload Error: " + res.message);
      }
    } catch(err) {
      alert("Error: " + err.message);
    }
  },

  uploadTargetFile: async function() {
    try {
      const res = await ipcRenderer.invoke('upload-monthly-target-file');
      if (res && res.success) {
        showBannerAlert(`🎯 Target file loaded (${res.totalRecords} records)!`, "#10b981");
        await loadSavedData();
        this.updateStatus();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch(e) { alert(e.message); }
  },

  uploadCmDump: async function() {
    try {
      const res = await ipcRenderer.invoke('upload-sales-dump-tagged', 'CM');
      if (res && res.success) {
        showBannerAlert(`⚡ CM Dump Updated!`, "#10b981");
        await loadBothDumps();
        this.updateStatus();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch(e) { alert(e.message); }
  },

  uploadLmDump: async function() {
    try {
      const res = await ipcRenderer.invoke('upload-sales-dump-tagged', 'LM');
      if (res && res.success) {
        showBannerAlert(`🗓️ LM Dump Updated!`, "#10b981");
        await loadBothDumps();
        this.updateStatus();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch(e) { alert(e.message); }
  },

  uploadStockBalance: async function() {
    try {
      const res = await ipcRenderer.invoke('upload-stock-balance-file');
      if (res && res.success) {
        showBannerAlert(`📦 Stock Balance Updated!`, "#10b981");
        this.updateStatus();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch(e) { alert(e.message); }
  },

  uploadDispatch: async function() {
    try {
      const res = await ipcRenderer.invoke('upload-total-dispatch-file');
      if (res && res.success) {
        showBannerAlert(`🚚 Dispatch Data Updated!`, "#10b981");
        this.updateStatus();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch(e) { alert(e.message); }
  }
};