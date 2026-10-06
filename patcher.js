const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("\n==========================================");
console.log(" 🚀 DANISH QUICK CODE APPLIER & SYNC ");
console.log("==========================================");

const updateFile = path.join(__dirname, 'update.txt');

if (!fs.existsSync(updateFile)) {
  console.log("❌ 'update.txt' nahi mili! File folder me rakhein.");
  process.exit(1);
}

try {
  const content = fs.readFileSync(updateFile, 'utf8');
  
  // main.js ka target path
  const targetPath = path.join(__dirname, 'main.js');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("✅ main.js successfully update ho gayi!");

  console.log("📤 Pushing to GitHub...");
  execSync('git add main.js && git commit -m "Fix shop master parser columns" && git push origin main', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log("🎉 GitHub par sync mukammal ho gaya!");
} catch (err) {
  console.log("❌ Error:", err.message);
}