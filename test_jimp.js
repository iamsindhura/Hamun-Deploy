const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782379304413.jpg");
    
    let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
    
    // Scan top-left 1/5th width, top 1/2 height
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 204; x++) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            // if not dark background
            if (r > 30 || g > 30 || b > 40) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    console.log("Bounding box:", minX, minY, maxX, maxY);
}
process();
