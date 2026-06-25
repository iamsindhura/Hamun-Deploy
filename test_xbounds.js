const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782382282760.jpg");
    
    // Find right-most edge for Logo 1
    // scan from x=180 to 204
    for (let x = 180; x < 204; x++) {
        let maxBrightness = 0;
        for (let y = 200; y < 400; y++) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            const bright = Math.max(r, g, b);
            if (bright > maxBrightness) maxBrightness = bright;
        }
        console.log(`x=${x}, maxBright=${maxBrightness}`);
    }
}
process();
