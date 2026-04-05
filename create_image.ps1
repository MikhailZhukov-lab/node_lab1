Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(100, 100)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Red)
$g.Dispose()
$bmp.Save("C:\Users\zukov\OneDrive\Desktop\Lab\lab_1\test_image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Image created"
