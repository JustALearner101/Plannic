$ErrorActionPreference = 'Stop'
$repo = if ($env:PLANNIC_REPO) { $env:PLANNIC_REPO } else { 'JustALearner101/Plannic' }
$installDir = if ($env:PLANNIC_INSTALL_DIR) { $env:PLANNIC_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'Plannic\bin' }
$asset = 'plannic-windows-x64.zip'
$api = "https://api.github.com/repos/$repo/releases/latest"
$release = Invoke-RestMethod -Uri $api
$download = $release.assets | Where-Object { $_.name -eq $asset } | Select-Object -First 1
$checksum = $release.assets | Where-Object { $_.name -eq "$asset.sha256" } | Select-Object -First 1
if (-not $download -or -not $checksum) { throw "Latest release does not contain $asset and its checksum." }
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("plannic-" + [guid]::NewGuid())
New-Item -ItemType Directory -Force -Path $temp | Out-Null
try {
  $archive = Join-Path $temp $asset; $checksumFile = "$archive.sha256"
  Invoke-WebRequest $download.browser_download_url -OutFile $archive; Invoke-WebRequest $checksum.browser_download_url -OutFile $checksumFile
  $expected = ((Get-Content $checksumFile -Raw) -split '\s+')[0].ToLowerInvariant(); $actual = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($expected -ne $actual) { throw "SHA-256 verification failed for $asset." }
  New-Item -ItemType Directory -Force -Path $installDir | Out-Null; Expand-Archive -LiteralPath $archive -DestinationPath $temp -Force
  $targetExe = Join-Path $installDir 'plannic.exe'
  $newExe = Join-Path $temp 'plannic.exe'
  if (Test-Path $targetExe) {
    Get-ChildItem -Path $installDir -Filter "plannic.exe.old*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    $suffix = Get-Date -Format "yyyyMMddHHmmss"
    $oldExe = Join-Path $installDir "plannic.exe.old.$suffix"
    Move-Item $targetExe $oldExe -Force -ErrorAction SilentlyContinue
  }
  Copy-Item $newExe $targetExe -Force
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); $entries = @($userPath -split ';' | Where-Object { $_ })
  if ($entries -notcontains $installDir) { [Environment]::SetEnvironmentVariable('Path', (($entries + $installDir) -join ';'), 'User') }
  Write-Output "✔ Installed plannic to $installDir.`nOpen a new terminal, then run:`n  1. plannic doctor`n  2. plannic init"
} finally { Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue }
