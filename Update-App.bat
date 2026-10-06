@echo off
title DANISH QUICK CODE APPLIER & SYNC
cls
echo ==============================================
echo   DANISH QUICK CODE APPLIER & GIT AUTO-SYNC
echo ==============================================

:: 1. Agar patcher.js mojood hai to pehle code apply karein
if exist patcher.js (
    echo [1/3] Applying latest code patches...
    node patcher.js
    if %errorlevel% neq 0 (
        echo [!] Warning: patcher.js me error aaya lekin sync jari hai...
    ) else (
        echo [OK] Code patched successfully!
    )
)

:: 2. Tamam modified files stage karein (Sirf main.js nahi balki sab)
echo [2/3] Staging all modified files...
git add .

:: 3. Changes commit karein
echo [3/3] Saving commit snapshot...
git commit -m "Auto sync: Shop master and zero reports updated"

:: 4. Current branch par push karein (bina kisi branch error ke)
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo [*] Pushing to branch: %CURRENT_BRANCH%...

git push origin %CURRENT_BRANCH%

echo.
echo ==============================================
echo   ALL DONE! Code synced successfully.
echo ==============================================
pause