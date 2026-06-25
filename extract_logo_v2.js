const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782379304413.jpg");
    
    // The logo 1 is in the top-left corner. Let's crop x: 5, y: 190, width: 195, height: 210
    const out = img.clone().crop({ x: 5, y: 190, w: 195, h: 210 });
    
    const width = out.bitmap.width;
    const height = out.bitmap.height;
    
    // Sample background color from top-left corner
    const bgColor = out.getPixelColor(0, 0);
    const bgR = (bgColor >> 24) & 255;
    const bgG = (bgColor >> 16) & 255;
    const bgB = (bgColor >> 8) & 255;
    
    console.log("Background color:", bgR, bgG, bgB);
    
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = out.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
            if (dist > 25) { 
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    console.log("Bounding Box:", minX, minY, maxX, maxY);
    
    // Crop exactly to bounding box
    const finalLogo = out.crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    
    const finalW = finalLogo.bitmap.width;
    const finalH = finalLogo.bitmap.height;
    for (let y = 0; y < finalH; y++) {
        for (let x = 0; x < finalW; x++) {
            const color = finalLogo.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
            
            if (dist < 15) {
                finalLogo.setPixelColor((r << 24) | (g << 16) | (b << 8) | 0, x, y);
            } else if (dist < 40) {
                const alpha = Math.floor(((dist - 15) / 25) * 255);
                finalLogo.setPixelColor((r << 24) | (g << 16) | (b << 8) | alpha, x, y);
            }
        }
    }
    
    await finalLogo.write("public/logo/hamun-logo.png");
    console.log("Saved full logo without cropping!");
}
process();
