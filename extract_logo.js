const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782379304413.jpg");
    
    // Bounding box of the circle
    const startX = 26;
    const startY = 215; // Adjusted slightly up just in case
    const width = 170;
    const height = 170;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 83; // slightly less to cut out dark edge
    
    // Create new image
    const out = new Jimp({ width, height, color: 0x00000000 });
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcX = startX + x;
            const srcY = startY + y;
            const color = img.getPixelColor(srcX, srcY);
            
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < radius - 1) {
                out.setPixelColor(color, x, y);
            } else if (dist < radius) {
                // Anti-aliasing edge
                const r = (color >> 24) & 255;
                const g = (color >> 16) & 255;
                const b = (color >> 8) & 255;
                const alpha = Math.floor(255 * (radius - dist));
                const newColor = (r << 24) | (g << 16) | (b << 8) | alpha;
                out.setPixelColor(newColor, x, y);
            }
        }
    }
    
    const fs = require('fs');
    if (!fs.existsSync('public/logo')) {
        fs.mkdirSync('public/logo', { recursive: true });
    }
    await out.write("public/logo/hamun-logo.png");
    console.log("Saved public/logo/hamun-logo.png");
}
process();
