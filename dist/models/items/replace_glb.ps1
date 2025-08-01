$sourceDir = "D:\ExportedGLB"
$targetDir = Get-Location

# Scan source files recursively into a hashtable for quick lookup
$sourceFilePaths = @{}
Get-ChildItem -Path $sourceDir -Recurse -Filter *.glb | ForEach-Object { $sourceFilePaths[$_.Name] = $_.FullName }

$targetFiles = Get-ChildItem -Path $targetDir -Recurse -Filter *.glb
foreach ($file in $targetFiles) {
    Write-Host "Processing target file: $($file.FullName)"
    if ($sourceFilePaths.ContainsKey($file.Name)) {
        $sourceFile = $sourceFilePaths[$file.Name]
        Write-Host "Source file found: $sourceFile"
        $originalSize = (Get-Item $file.FullName).Length
        Copy-Item -Path $sourceFile -Destination $file.FullName -Force
        $newSize = (Get-Item $file.FullName).Length
        Write-Host "Replaced $($file.FullName) - Original size: $originalSize bytes, New size: $newSize bytes"
    } else {
        Write-Host "Source file not found for target: $($file.FullName)"
    }
}
Write-Host "GLB file replacement complete."