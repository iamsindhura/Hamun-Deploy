const { Jimp } = require('jimp');
const { rgbaToInt } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782384083628.jpg");
    
    // Background color from top left (should be white or near-white)
    const bgColor = img.getPixelColor(0, 0);
    const bgR = (bgColor >> 24) & 255;
    const bgG = (bgColor >> 16) & 255;
    const bgB = (bgColor >> 8) & 255;
    
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    
    const finalLogo = new Jimp({ width, height, color: 0x00000000 });
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            
            const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
            
            if (dist < 15) {
                // background -> transparent
            } else if (dist < 40) {
                const alpha = Math.floor(((dist - 15) / 25) * 255);
                finalLogo.setPixelColor(rgbaToInt(r, g, b, alpha), x, y);
            } else {
                finalLogo.setPixelColor(rgbaToInt(r, g, b, 255), x, y);
            }
        }
    }
    
    await finalLogo.write("public/logo/login-logo.png");
    console.log("Saved login-logo.png!");
}
process();
