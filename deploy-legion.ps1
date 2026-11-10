# LEGION Netlify existing-site deployment. No secret values stored in this file.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$Name = 'legion100'
$HostName = 'legion100.netlify.app'
Write-Host "LEGION: deploy existing Netlify project $Name (not create a new one)."
if (-not (Test-Path -LiteralPath 'netlify.toml') -or -not (Test-Path -LiteralPath 'public/index.html') -or -not (Test-Path -LiteralPath 'netlify/functions/status.mjs')) {
  throw 'Incomplete package: netlify.toml, public/index.html or status.mjs missing.'
}
$Node = Get-Command node.exe -ErrorAction SilentlyContinue
$Npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $Node -or -not $Npx) { throw 'Install Node.js LTS (nodejs.org) then open this script again.' }
& $Node.Source --version
if ($LASTEXITCODE -ne 0) { throw 'Node not working' }
Write-Host 'Netlify will open a browser to authorize access to your account.'
& $Npx.Source --yes netlify-cli@latest login
if ($LASTEXITCODE -ne 0) { throw 'Netlify login failed.' }
& $Npx.Source --yes netlify-cli@latest link --name $Name
if ($LASTEXITCODE -ne 0) { throw 'Link to existing legion100 failed.' }
$statePath = Join-Path $PSScriptRoot '.netlify/state.json'
if (-not (Test-Path $statePath)) { throw 'No local Netlify site link was established.' }
$state = Get-Content -Raw $statePath | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$state.siteId)) { throw 'Missing linked siteId. STOP.' }
Write-Host ("Linked existing project ID: {0}" -f $state.siteId)
Write-Host 'The next command replaces the current production deploy (same URL), including serverless functions.'
$decision = Read-Host 'Type DEPLOY to publish to https://legion100.netlify.app/'
if ($decision -cne 'DEPLOY') { Write-Host 'Cancelled. No deployment executed.'; exit 2 }
& $Npx.Source --yes netlify-cli@latest deploy --prod --dir public --functions netlify/functions
if ($LASTEXITCODE -ne 0) { throw 'Deploy failed; inspect Netlify CLI logs.' }
$url = 'https://legion100.netlify.app/.netlify/functions/status'
Write-Host "Checking $url"
try {
  $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
  if ($resp.StatusCode -ne 200) { throw "Unexpected HTTP $($resp.StatusCode)" }
  $data = $resp.Content | ConvertFrom-Json
  if ($data.service -ne 'legion-netlify') { throw 'Unexpected status response.' }
  Write-Host "PASS: status HTTP 200; state=$($data.state); nim_ready=$($data.nim_ready); paypal_backend_ready=$($data.paypal_backend_ready)"
  Write-Host 'This confirms server function only. NIM, payment and agent integration need separate authorizations and live test evidence.'
} catch {
  Write-Warning "Deployed but status endpoint not verified: $($_.Exception.Message). Check Netlify Functions tab."
  exit 3
}
