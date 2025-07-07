# Convert main icon to all sizes
magick icon-512x512.svg -resize 72x72 icons/icon-72x72.png
magick icon-512x512.svg -resize 96x96 icons/icon-96x96.png
magick icon-512x512.svg -resize 128x128 icons/icon-128x128.png
magick icon-512x512.svg -resize 144x144 icons/icon-144x144.png
magick icon-512x512.svg -resize 152x152 icons/icon-152x152.png
magick icon-512x512.svg -resize 192x192 icons/icon-192x192.png
magick icon-512x512.svg -resize 384x384 icons/icon-384x384.png
magick icon-512x512.svg -resize 512x512 icons/icon-512x512.png

# Convert maskable icons
magick icon-maskable.svg -resize 192x192 icons/icon-192x192-maskable.png
magick icon-maskable.svg -resize 512x512 icons/icon-512x512-maskable.png

# Convert Apple Touch Icon
magick apple-touch-icon.svg -resize 180x180 icons/apple-touch-icon.png

# Convert favicon
magick favicon.svg -resize 32x32 icons/favicon-32x32.png
magick favicon.svg -resize 16x16 icons/favicon-16x16.png
magick icons/favicon-32x32.png favicon.ico