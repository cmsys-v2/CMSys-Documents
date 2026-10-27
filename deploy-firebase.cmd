@echo off
echo ========================================================
echo   CMSys Documents - Firebase Multi-Site Deployment
echo   Target Site: cmsys-docs-v2 (https://cmsys-docs-v2.web.app)
echo   Custom Domain: https://documents.cmsys.site
echo ========================================================
echo.

npx firebase-tools deploy --only hosting:docs --project cmsys-v2
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] CMSys Documents deployed to https://cmsys-docs-v2.web.app and https://documents.cmsys.site
