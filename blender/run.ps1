# Pipeline de la scène « chambre rétro » (Blender 5.3, sans interface).
#   ./blender/run.ps1 -Stage build|bake|export|all
# Chaque étape enchaîne son script puis le contrôle correspondant ; arrêt au
# premier échec (code de sortie 1).
param([ValidateSet('build', 'bake', 'export', 'all')][string]$Stage = 'all')

$ErrorActionPreference = 'Stop'
$Blender = 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe'
$Dir     = $PSScriptRoot
$Out     = Join-Path $Dir 'out'
New-Item -ItemType Directory -Force $Out | Out-Null

$steps = @{
    build  = @{ script = 'build_scene.py'; input = $null;                         check = 'scene.blend' }
    bake   = @{ script = 'bake.py';        input = (Join-Path $Out 'scene.blend'); check = 'baked.blend' }
    export = @{ script = 'export.py';      input = (Join-Path $Out 'baked.blend'); check = 'baked.blend' }
}
$order = if ($Stage -eq 'all') { 'build', 'bake', 'export' } else { @($Stage) }

foreach ($s in $order) {
    $st = $steps[$s]
    $script = Join-Path $Dir $st.script
    if (Test-Path $script) {
        Write-Host "== $s : $($st.script)"
        $a = @('-b')
        if ($st.input) { $a += $st.input }
        $a += @('--factory-startup', '--python-exit-code', '1', '--python', $script)
        & $Blender @a
        if ($LASTEXITCODE -ne 0) { Write-Host "ÉCHEC : $($st.script)"; exit 1 }
    } else {
        Write-Host "== $s : $($st.script) absent"
    }
    $blend = Join-Path $Out $st.check
    $ca = @('-b')
    if (Test-Path $blend) { $ca += $blend }
    $ca += @('--factory-startup', '--python-exit-code', '1', '--python', (Join-Path $Dir 'check_scene.py'), '--', '--stage', $s)
    & $Blender @ca 2>&1 | Select-String -Pattern '^CHECK' | ForEach-Object { $_.Line }
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
exit 0
