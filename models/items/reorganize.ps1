$root = Get-Location
$outputRoot = Join-Path $root "Output"
New-Item -Path $outputRoot -ItemType Directory -Force

$glbFiles = Get-ChildItem -Path $root -Recurse -File -Filter *.glb | Where-Object { $_.Directory.FullName -notlike "*Output*" }

foreach ($file in $glbFiles) {
    $parentDir = $file.Directory
    if ($parentDir.FullName -eq $root.FullName) {
        $lvl1 = "Miscellaneous"
        $lvl0 = "Misc"
    } else {
        $lvl1 = $parentDir.Name
        switch ($lvl1) {
            {$_ -in @("Beds", "Nightstand")} { $lvl0 = "Bedroom Furniture" }
            {$_ -in @("Chair", "Couch", "Pouf", "Table", "TV stand")} { $lvl0 = "Lounge Furniture" }
            "Bathroom" { $lvl0 = "Sanitary Fixtures" }
            "Kitchen" { $lvl0 = "Culinary Equipment" }
            {$_ -in @("Books", "Carpet", "Fireplace", "Light", "Picture", "Plants", "Props")} { $lvl0 = "Decorative Items" }
            {$_ -in @("Doors", "Floor", "Wall Panels", "Walls", "Windows")} { $lvl0 = "Structural Elements" }
            default { $lvl0 = "Other" }
        }
    }

    $base = $file.BaseName
    if ($base -match '(.*)_(\d+)$') {
        $base = $matches[1]
    } elseif ($base -match '(.*)_(\w+)$') {
        $base = $matches[1]
    }
    $lvl2 = $base -replace '_', ' '

    $targetDir = Join-Path $outputRoot (Join-Path $lvl0 (Join-Path $lvl1 $lvl2))
    New-Item -Path $targetDir -ItemType Directory -Force

    $targetFile = Join-Path $targetDir $file.Name
    Copy-Item -Path $file.FullName -Destination $targetFile -Force
}

Write-Host "Reorganization complete."