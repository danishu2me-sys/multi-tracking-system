window.ZeroPurchaseModule = {
  renderHTML: function() {
    return `
      <div class="filter-bar-compact">
        <div class="filter-group">
          <span class="filter-label">DSR:</span>
          <select id="selectZeroDSR" class="custom-select" style="min-width:140px;" onchange="ZeroPurchaseModule.renderTable()">
            <option value="ALL">ALL DSRs</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Brand / Category:</span>
          <select id="selectZeroBrand" class="custom-select" style="min-width:140px;" onchange="ZeroPurchaseModule.renderTable()">
            <option value="ALL">ALL BRANDS</option>
          </select>
        </div>
        <div class="filter-group" style="margin-left:auto;">
          <button class="btn-act btn-copy-text" onclick="ZeroPurchaseModule.copyReport()">📋 Copy Text</button>
          <button class="btn-act btn-all" onclick="ZeroPurchaseModule.renderTable()">🔄 Refresh</button>
        </div>
      </div>

      <div class="table-chart-container">
        <div class="table-wrapper" id="zeroTableWrapper" tabindex="0">
          <table id="zeroTable">
            <thead id="zeroThead">
              <tr>
                <th style="color:#ffffff !important;">Shop Code / POP</th>
                <th style="color:#ffffff !important;">Shop / Customer Name</th>
                <th style="color:#ffffff !important;">DSR Name</th>
                <th style="color:#ffffff !important;">Channel</th>
                <th style="color:#ffffff !important;">Address / Town</th>
                <th style="color:#ffffff !important; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody id="zeroTbody">
              <tr>
                <td colspan="6" style="text-align:center; padding:35px; color:var(--text-muted); font-weight:bold;">
                  'Source Files' mein jaa kar Shop Data upload karein, phir yeh report generate hogi.
                </td>
              </tr>
            </tbody>
            <tfoot id="zeroTfoot"></tfoot>
          </table>
        </div>
      </div>
    `;
  },

  renderTable: function() {
    const tbody = document.getElementById('zeroTbody');
    const tfoot = document.getElementById('zeroTfoot');
    if (!tbody) return;

    // Yahan jab aap agle step par calculation aur logic bataenge, woh lag jayega.
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:35px; color:#f59e0b; font-weight:bold;">
          🏪 Shop Data upload framework ready hai. Ab batayein Zero Purchase ki calculation (e.g. Brand Zero, Shop Zero ya SKU Zero) kis tarah karni hai.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = '';
  },

  copyReport: function() {
    alert("Zero purchase logic configure hone ke baad copy report chalega.");
  }
};