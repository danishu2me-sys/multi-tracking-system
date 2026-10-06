// stockEngine.js - Ported directly from Danish Rais VBA Engine
const fs = require('fs');
const path = require('path');

// SKU <-> Material Code Hardcoded Mappings
const MAT_TO_SKU = {
    "16492": "267", "16466": "183", "16198": "342", "16701": "363", "16468": "364",
    "16524": "132", "14944": "133", "16518": "335", "16523": "308", "15985": "325",
    "16640": "395", "16520": "382", "16519": "334", "16641": "328", "16798": "164",
    "16487": "134", "16486": "338", "16724": "287", "16691": "165", "16799": "397",
    "16126": "331", "16125": "336", "16124": "330", "16258": "360", "15973": "326",
    "15839": "311", "16463": "271", "16038": "337", "15837": "313", "15836": "312",
    "15829": "321", "16664": "160", "16800": "171", "16517": "333", "16238": "370",
    "16666": "286", "15365": "193", "16638": "167", "15429": "396", "16444": "354",
    "16455": "371", "16482": "391", "16484": "392", "16483": "393", "16209": "358",
    "16234": "369", "16233": "379", "15722": "356", "16201": "357", "16422": "380",
    "16477": "320", "16478": "300", "16475": "169", "16474": "240", "16476": "232",
    "15716": "314", "15720": "318", "15719": "317", "15717": "315", "15718": "316",
    "15721": "319", "15188": "228", "15211": "179", "15186": "226", "15189": "229",
    "15184": "224", "15185": "225", "15183": "223", "15140": "206", "15143": "209",
    "15138": "204", "15139": "205", "15142": "208", "15137": "203", "15304": "248",
    "15300": "244", "15298": "242", "15299": "243", "15305": "249", "15303": "247",
    "15297": "241", "16424": "343", "16132": "347", "16431": "346", "16135": "350",
    "16426": "344", "16427": "348", "16429": "345", "16134": "349", "16421": "366",
    "16420": "365", "16473": "351", "16472": "352", "16423": "386", "16489": "263",
    "16498": "250", "16491": "265", "16496": "252", "16494": "266", "16499": "253",
    "16500": "255", "16493": "268", "16495": "269", "16502": "256", "16501": "254",
    "16497": "251", "16490": "264", "16232": "341", "16231": "162", "16259": "324",
    "16432": "294", "16433": "293", "16434": "257", "16435": "238", "16081": "296",
    "16436": "295", "15943": "262", "16086": "237", "16202": "359", "16479": "394",
    "16450": "389", "16451": "387", "16452": "388", "16453": "390", "16581": "220",
    "16580": "222", "16122": "340", "16569": "399", "16716": "361", "16512": "275",
    "16513": "276", "16511": "277"
};

const SKU_TO_MAT = Object.fromEntries(Object.entries(MAT_TO_SKU).map(([m, s]) => [s, m]));

function getCategoryFromBrand(brandName) {
    const uBrand = (brandName || "").trim().toUpperCase();
    if (["BAKED CROISSANT", "MAYFAIR DELIGHT", "HEARTS"].includes(uBrand)) return "BAK";
    if (["A1", "BESTO", "CAFE", "CREMO", "SPECIAL", "WOW"].includes(uBrand)) return "BIS";
    if ([
        "CHASKA CANDY RS. 5", "CHASKA", "CREAMERS", "FROOTO CANDY - RE. 1",
        "FROOTO CANDY - RS. 2", "FROOTO CANDY RS. 5", "FRUIT GALA",
        "MAYFAIR BUBBLE", "MAYFAIR ECLAIRS", "MILKO", "RS:2 CANDY",
        "TIGER", "WOBBLY"
    ].includes(uBrand)) return "CONF";

    if (uBrand.includes("CROISSANT") || uBrand.includes("HEARTS")) return "BAK";
    if (/CREMO|SPECIAL|CAFE|BESTO|WOW|A1/.test(uBrand)) return "BIS";
    if (/CANDY|FROOTO|MAYFAIR|TIGER|WOBBLY|CREAMERS|MILKO|GALA|CHASKA/.test(uBrand)) return "CONF";
    return "OTHER";
}

function getLastNumberFromBracket(txt) {
    const start = txt.lastIndexOf('(');
    const end = txt.lastIndexOf(')');
    if (start !== -1 && end > start) {
        const parts = txt.substring(start + 1, end).split(/X/i);
        const last = parseFloat(parts[parts.length - 1].trim());
        if (!isNaN(last) && last > 0) return last;
    }
    return 12; // Default carton pack
}

function compileStockReport(stockRows, dispatchRows, customMapping = {}) {
    // 1. Process Dispatch Sheet for Rehman Ent (Col D = "KHI – REHMAN ENT-BR2")
    const dispDict = {};
    const missingItems = [];
    const checkedMissing = new Set();

    (dispatchRows || []).forEach(row => {
        const distName = (row.distributor || row[3] || "").toString().trim();
        if (distName.toUpperCase().includes("REHMAN ENT-BR2")) {
            const matCode = (row.matCode || row[9] || "").toString().trim();
            const prodName = (row.prodName || row[10] || "").toString().trim();
            const qty = parseFloat(row.dispatchQty || row[8]) || 0;

            if (matCode) {
                dispDict[matCode] = (dispDict[matCode] || 0) + qty;
                
                // Track Missing Mappings
                const mappedSku = customMapping[matCode] || MAT_TO_SKU[matCode];
                if (!mappedSku && !checkedMissing.has(matCode)) {
                    checkedMissing.add(matCode);
                    missingItems.push({ matCode, prodName, qty });
                }
            }
        }
    });

    // 2. Process Stock Data Rows
    const brandDict = {};
    let currentBrand = "OTHER BRANDS";

    (stockRows || []).forEach(row => {
        const sku = (row.skuCode || row[8] || "").toString().trim();
        const brandCell = (row.brandName || row[7] || "").toString().trim();
        if (brandCell && !brandCell.toUpperCase().includes("TOTAL")) {
            currentBrand = brandCell;
        }

        const prodName = (row.prodName || row[9] || "").toString().trim();
        const ctn = parseFloat(row.closingCtn || row[10]) || 0;
        const box = parseFloat(row.closingBox || row[11]) || 0;

        if (sku && !sku.toUpperCase().includes("TOTAL")) {
            if (!brandDict[currentBrand]) brandDict[currentBrand] = {};
            if (!brandDict[currentBrand][sku]) {
                brandDict[currentBrand][sku] = { prodName, ctn: 0, box: 0 };
            }
            brandDict[currentBrand][sku].ctn += ctn;
            brandDict[currentBrand][sku].box += box;
        }
    });

    // 3. Compile Division Wise Structured Output
    const divisions = { BAK: [], BIS: [], CONF: [], OTHER: [] };

    Object.keys(brandDict).forEach(brand => {
        const cat = getCategoryFromBrand(brand);
        const skus = brandDict[brand];
        const brandItems = [];

        let bCtn = 0, bBox = 0, bDisp = 0, bTotal = 0;

        Object.keys(skus).forEach(sku => {
            const item = skus[sku];
            const matCode = customMapping[sku] || SKU_TO_MAT[sku] || "";
            const dispatchQty = matCode ? (dispDict[matCode] || 0) : 0;
            const packSize = getLastNumberFromBracket(item.prodName);
            const totalQty = item.ctn + (item.box / packSize) + dispatchQty;

            bCtn += item.ctn;
            bBox += item.box;
            bDisp += dispatchQty;
            bTotal += totalQty;

            brandItems.push({
                brand,
                sku,
                prodName: item.prodName,
                ctn: item.ctn,
                box: item.box,
                dispatchQty,
                totalQty: parseFloat(totalQty.toFixed(2))
            });
        });

        divisions[cat].push({
            brand,
            items: brandItems,
            totals: {
                ctn: parseFloat(bCtn.toFixed(2)),
                box: parseFloat(bBox.toFixed(2)),
                dispatchQty: parseFloat(bDisp.toFixed(2)),
                totalQty: parseFloat(bTotal.toFixed(2))
            }
        });
    });

    return { divisions, missingItems };
}

module.exports = { compileStockReport, MAT_TO_SKU, SKU_TO_MAT };