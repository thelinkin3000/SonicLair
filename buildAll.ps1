param (
    [switch]$a = $false,
    [switch]$b = $false
)

function Write-Success {
    param(
        [string]$m = ""
    )

    Write-Host "[OK] $m" -ForegroundColor Green
}

function Write-ErrorMessage {
    Write-Host "[Error] There's been an error. Check the output for more information." -ForegroundColor Red
}
npm run build
npx cap sync
cd android
cd ..
if (($a -eq $true) -or ($b -eq $true)) {
    try {
        Write-Host "Cleaning gradle workspace"
        cd android
        .\gradlew.bat clean
    }
    catch {
        Write-Error "[Error] $_"
        return
    }
    if ($? -eq $true) {
        Write-Success "Gradle workspace cleaned"
    }
    else {
        Write-ErrorMessage
    }
}

if ($a -eq $true) {
    try{
        Write-Host "Assemblying APK"
        .\gradlew.bat assembleRelease
    }
    catch {
        Write-Error "[Error] $_"
        return
    }
    if ($? -eq $true) {
        Write-Success "APK Assembled"
    }
    else {
        Write-ErrorMessage
    }
}

if ($b -eq $true) {
    try {
        Write-Host "Bundling release"
        .\gradlew.bat bundleRelease
    }
    catch {
        Write-Error "[Error] $_"
        return
    }
    if ($? -eq $true) {
        Write-Success "Release bundled"
    }
    else {
        Write-ErrorMessage
    }
}

if (($a -eq $true) -or ($b -eq $true)) {
    cd ..
}
