#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Set up the packaged Windows embeddable Python runtime for Toolbox.
.DESCRIPTION
    Downloads Python 3.11 embeddable package, installs pip, and installs
    the packages listed in requirements.txt into python/runtime/.
    Run this script before building the Electron app for distribution.
#>
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PythonDir = $PSScriptRoot
$RuntimeDir = Join-Path $PythonDir "runtime"
$TempDir = Join-Path $PythonDir "tmp"

$PythonVersion = "3.11.9"
$PythonZip = "python-${PythonVersion}-embed-amd64.zip"
$PythonUrl = "https://www.python.org/ftp/python/${PythonVersion}/${PythonZip}"
$GetPipUrl = "https://bootstrap.pypa.io/get-pip.py"

function Ensure-Dir($dir) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Download-File($url, $dest) {
    Write-Host "Downloading $url -> $dest"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

Ensure-Dir $RuntimeDir
Ensure-Dir $TempDir

# 1. Download and extract embeddable Python
$zipPath = Join-Path $TempDir $PythonZip
if (-not (Test-Path $zipPath)) {
    Download-File $PythonUrl $zipPath
}

Write-Host "Extracting $PythonZip to $RuntimeDir"
Expand-Archive -Path $zipPath -DestinationPath $RuntimeDir -Force

# 2. Enable site-packages in embeddable Python
$pthFile = Get-ChildItem -Path $RuntimeDir -Filter "python*._pth" | Select-Object -First 1
if (-not $pthFile) {
    throw "Could not find python*._pth in $RuntimeDir"
}
Write-Host "Patching $($pthFile.FullName)"
$content = Get-Content $pthFile.FullName
$content = $content -replace "^#import site", "import site"
# Use .NET UTF8 without BOM to avoid corrupting the first path entry
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($pthFile.FullName, $content, $utf8NoBom)

# 3. Install pip
$getPipPath = Join-Path $TempDir "get-pip.py"
if (-not (Test-Path $getPipPath)) {
    Download-File $GetPipUrl $getPipPath
}

$pythonExe = Join-Path $RuntimeDir "python.exe"
$trustedHosts = @(
    "--trusted-host", "pypi.tuna.tsinghua.edu.cn",
    "--trusted-host", "files.pythonhosted.org",
    "--trusted-host", "pypi.org"
)

Write-Host "Installing pip..."
& $pythonExe $getPipPath --no-warn-script-location @trustedHosts
if ($LASTEXITCODE -ne 0) { throw "pip installation failed" }

# 4. Install project requirements
$requirements = Join-Path $PythonDir "requirements.txt"
Write-Host "Installing requirements from $requirements..."
& $pythonExe -m pip install -r $requirements --no-warn-script-location @trustedHosts
if ($LASTEXITCODE -ne 0) { throw "Requirements installation failed" }

# 5. Verify
Write-Host "Verifying health check..."
& $pythonExe (Join-Path $PythonDir "convert.py") health
if ($LASTEXITCODE -ne 0) { throw "Health check failed" }

# 6. Pre-download RapidOCR models (so they are bundled in the package)
Write-Host "Pre-downloading RapidOCR models (PP-OCRv6)..."
# Initialize RapidOCR engine to trigger model download; non-fatal if it fails
$preDownloadPy = @'
import sys
try:
    from rapidocr import RapidOCR
    RapidOCR()
    print("RapidOCR models ready")
except Exception as e:
    print(f"Warning: model pre-download failed: {e}", file=sys.stderr)
    sys.exit(0)
'@
$preDownloadPath = Join-Path $TempDir "predownload_models.py"
Ensure-Dir $TempDir
Set-Content -Path $preDownloadPath -Value $preDownloadPy -Encoding UTF8
& $pythonExe $preDownloadPath
Remove-Item -Path $preDownloadPath -Force -ErrorAction SilentlyContinue
# Model download failure is non-fatal (will download on first use at runtime)

# 7. Cleanup temp files
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Python runtime setup complete at $RuntimeDir"
