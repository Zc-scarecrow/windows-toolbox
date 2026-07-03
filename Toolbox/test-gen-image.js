const fs = require('fs');
const { execFileSync } = require('child_process');

const psContent = `
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(400, 100)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Microsoft YaHei', 28)
$g.DrawString('Hello 中文测试', $font, [System.Drawing.Brushes]::Black, 10, 10)
$bmp.Save('d:\\\\Project\\\\test2\\\\Toolbox\\\\test_text.png')
Write-Host 'saved'
`.trim();

const psPath = 'd:\\\\Project\\\\test2\\\\Toolbox\\\\test-gen-image-utf8bom.ps1';
fs.writeFileSync(psPath, '\uFEFF' + psContent, 'utf8');

execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', psPath], { stdio: 'inherit' });
