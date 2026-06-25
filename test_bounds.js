const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782382282760.jpg");
    
    // Scan the entire top-left quadrant (x: 0-200, y: 0-512)
    // Find where the white/cyan pixels are.
    let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
    
    // background color
    const bgR = 1, bgG = 12, bgB = 28;
    
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 204; x++) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
            
            // Only very bright pixels to find the core of the logo
            if (r > 150 || g > 150 || b > 150) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    console.log("Bright pixels bounding box:", minX, minY, maxX, maxY);
}
process();
