// Supabase Cloud Sync Module
const SUPABASE_URL = "https://hkjyudfujhrqduyiaqss.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhranl1ZGZ1amhycWR1eWlhcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDk4MTgsImV4cCI6MjEwNjg4NTgxOH0.7jLLKRhWljpUuzSgO_feWXh-nwVyYC-fGIS1mJNYRD4";

window.CloudStorage = {
  // 1. Save or Update to Supabase
  save: async function(key, dataPayload) {
    try {
      console.log(`[CloudSync] Saving ${key} to Supabase...`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_store`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: key,
          data: dataPayload,
          updated_at: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      console.log(`[CloudSync] ${key} saved successfully!`);
      return { success: true };
    } catch (err) {
      console.error(`[CloudSync] Error saving ${key}:`, err);
      return { success: false, error: err.message };
    }
  },

  // 2. Fetch from Supabase
  load: async function(key) {
    try {
      console.log(`[CloudSync] Fetching ${key} from Supabase...`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_store?key=eq.${key}&select=data`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      if (json && json.length > 0) {
        return json[0].data;
      }
      return null;
    } catch (err) {
      console.error(`[CloudSync] Error loading ${key}:`, err);
      return null;
    }
  },

  // 3. Poora system (Shops, Targets, Dumps) pull karke Cloud par push karna
  syncAllToCloud: async function() {
    let successCount = 0;
    const isElectronEnv = (typeof require !== 'undefined');
    let ipc = null;
    if (isElectronEnv) {
      try { ipc = require('electron').ipcRenderer; } catch(e) {}
    }

    // A. Shop Master
    let shops = window.shopDataMaster;
    if ((!shops || shops.length === 0) && ipc) {
      const res = await ipc.invoke('get-saved-shop-data');
      if (res && res.success) shops = res.shops;
    }
    if (shops && shops.length > 0) {
      const sRes = await this.save('SHOP_MASTER', shops);
      if (sRes.success) successCount++;
    }

    // B. Target Sheet
    let targets = (typeof allRecords !== 'undefined' && allRecords.length > 0) ? allRecords : window.targetReportData;
    if ((!targets || targets.length === 0) && ipc) {
      const res = await ipc.invoke('get-target-report-data');
      if (res && res.success) targets = res.data;
    }
    if (targets && targets.length > 0) {
      const tRes = await this.save('MONTHLY_TARGET', targets);
      if (tRes.success) successCount++;
    }

    // C. Sales Dump CM
    let cm = (typeof cmDump !== 'undefined' && cmDump) ? cmDump : null;
    if ((!cm || !cm.deliveredRecords) && ipc) {
      const res = await ipc.invoke('get-both-sales-dumps');
      if (res && res.success) cm = res.cmData;
    }
    if (cm && cm.deliveredRecords && cm.deliveredRecords.length > 0) {
      const cRes = await this.save('SALES_DUMP_CM', cm);
      if (cRes.success) success