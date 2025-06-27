# Create a simple PNG icon for the MSpec extension
# This script creates a 128x128 PNG icon

Add-Type -AssemblyName System.Drawing

# Create a 128x128 bitmap
$bitmap = New-Object System.Drawing.Bitmap(128, 128)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Enable anti-aliasing
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Create gradient brush
$rect = New-Object System.Drawing.Rectangle(0, 0, 128, 128)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(74, 144, 226), [System.Drawing.Color]::FromArgb(53, 122, 189), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)

# Fill background with rounded rectangle effect
$graphics.FillRectangle($brush, $rect)

# Create white pen for drawing
$whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 3)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Draw left bracket
$leftBracket = @(
    [System.Drawing.Point]::new(24, 32),
    [System.Drawing.Point]::new(24, 96),
    [System.Drawing.Point]::new(32, 96),
    [System.Drawing.Point]::new(32, 40),
    [System.Drawing.Point]::new(40, 40),
    [System.Drawing.Point]::new(40, 32)
)
$graphics.FillPolygon($whiteBrush, $leftBracket)

# Draw right bracket
$rightBracket = @(
    [System.Drawing.Point]::new(104, 32),
    [System.Drawing.Point]::new(104, 96),
    [System.Drawing.Point]::new(96, 96),
    [System.Drawing.Point]::new(96, 40),
    [System.Drawing.Point]::new(88, 40),
    [System.Drawing.Point]::new(88, 32)
)
$graphics.FillPolygon($whiteBrush, $rightBracket)

# Draw content lines
$graphics.FillRectangle($whiteBrush, 48, 48, 32, 6)
$graphics.FillRectangle($whiteBrush, 48, 64, 24, 6)
$graphics.FillRectangle($whiteBrush, 48, 80, 32, 6)

# Draw small dots
$graphics.FillEllipse($whiteBrush, 50, 50, 4, 4)
$graphics.FillEllipse($whiteBrush, 50, 66, 4, 4)
$graphics.FillEllipse($whiteBrush, 50, 82, 4, 4)

# Save the image
$bitmap.Save("icons\mspec-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up
$graphics.Dispose()
$bitmap.Dispose()
$brush.Dispose()
$whitePen.Dispose()
$whiteBrush.Dispose()

Write-Host "Icon created: icons\mspec-icon.png"
