# Fix extra </div> in qr-scan-history.js at line 870 (0-index 869)
$filePath = "C:\Users\SCREENS\OneDrive\Desktop\Admin dashboard\frontend\pages\qr-scan-history.js"
$lines = [System.IO.File]::ReadAllLines($filePath)

Write-Host "Total lines: $($lines.Length)"
Write-Host "Context around line 870:"
for ($i = 864; $i -le 874; $i++) {
    Write-Host "  L$($i+1): [$($lines[$i])]"
}

# Remove line 870 (0-index 869)
$newLines = [System.Collections.Generic.List[string]]::new()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -ne 869) { $newLines.Add($lines[$i]) }
}
[System.IO.File]::WriteAllLines($filePath, $newLines)
Write-Host ""
Write-Host "Fixed! Removed line 870. Lines: $($lines.Length) -> $($newLines.Count)"
