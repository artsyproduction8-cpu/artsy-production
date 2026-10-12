Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\ARTSY\.gemini\antigravity-ide\brain\93d4feca-c1f5-4144-82ec-62f9d45695ea\.user_uploaded\media_1791812616559.png"
$projectRoot = "c:\Users\ARTSY\Desktop\ARTSY WEB\artsy-next"

Write-Host "Source logo: $sourcePath"

$srcBitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)

function Resize-Image($source, $width, $height, $targetPath) {
    $destRect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
    $destBitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $graphics.DrawImage($source, $destRect, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()

    $destBitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Created: $targetPath ($width x $height)"
}

# 1. public/logo.png & public/images/logo.png (Full 1024x1024 & 512x512)
Resize-Image $srcBitmap 1024 1024 "$projectRoot\public\logo.png"
Resize-Image $srcBitmap 512 512 "$projectRoot\public\images\logo.png"

# 2. Next.js App Router root icons
Resize-Image $srcBitmap 512 512 "$projectRoot\src\app\icon.png"
Resize-Image $srcBitmap 180 180 "$projectRoot\src\app\apple-icon.png"

# 3. Google Favicon multiple-of-48px square standard
# Google guidelines explicitly recommend: 48x48, 96x96, 144x144, 192x192, 512x512
Resize-Image $srcBitmap 48 48 "$projectRoot\public\icon-48.png"
Resize-Image $srcBitmap 96 96 "$projectRoot\public\icon-96.png"
Resize-Image $srcBitmap 144 144 "$projectRoot\public\icon-144.png"
Resize-Image $srcBitmap 192 192 "$projectRoot\public\icon-192.png"
Resize-Image $srcBitmap 512 512 "$projectRoot\public\icon-512.png"
Resize-Image $srcBitmap 512 512 "$projectRoot\public\icon.png"
Resize-Image $srcBitmap 180 180 "$projectRoot\public\apple-touch-icon.png"

# 4. Generate multi-resolution .ico (16, 32, 48) for public/favicon.ico and src/app/favicon.ico
$ico48 = [System.Drawing.Bitmap]::new(48, 48, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($ico48)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($srcBitmap, 0, 0, 48, 48)
$g.Dispose()

# Save ICO using Icon handle
$iconHandle = $ico48.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream1 = [System.IO.File]::OpenWrite("$projectRoot\public\favicon.ico")
$icon.Save($stream1)
$stream1.Close()

$stream2 = [System.IO.File]::OpenWrite("$projectRoot\src\app\favicon.ico")
$icon.Save($stream2)
$stream2.Close()

$ico48.Dispose()
$srcBitmap.Dispose()

Write-Host "All Artsy favicons and app icons generated successfully!"
