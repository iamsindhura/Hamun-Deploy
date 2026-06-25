const { Jimp } = require('jimp');
const { rgbaToInt } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782382282760.jpg");
    
    // Safest possible bounding box for Logo 1
    // Captures the entire column 1
    const cropX = 0;
    const cropY = 200;
    const cropW = 204;
    const cropH = 220;
    
    const out = img.clone().crop({ x: cropX, y: cropY, w: cropW, h: cropH });
    
    // Background color from top left
    const bgColor = out.getPixelColor(0, 0);
    const bgR = (bgColor >> 24) & 255;
    const bgG = (bgColor >> 16) & 255;
    const bgB = (bgColor >> 8) & 255;
    
    // Create padded image (50px padding all around)
    const finalLogo = new Jimp({ width: cropW + 100, height: cropH + 100, color: 0x00000000 });
    
    for (let y = 0; y < cropH; y++) {
        for (let x = 0; x < cropW; x++) {
            const color = out.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
            
            const outX = x + 50;
            const outY = y + 50;
            
            if (dist < 10) {
                // background
            } else if (dist < 35) {
                const alpha = Math.floor(((dist - 10) / 25) * 255);
                finalLogo.setPixelColor(rgbaToInt(r, g, b, alpha), outX, outY);
            } else {
                finalLogo.setPixelColor(rgbaToInt(r, g, b, 255), outX, outY);
            }
        }
    }
    
    // Replace ALL copies so everything is perfect
    await finalLogo.write("public/logo/hamun-logo.png");
    await finalLogo.write("public/logo/logo-1.png");
    console.log("Saved perfectly unclipped logos!");
}
process();
