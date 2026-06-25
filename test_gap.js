const { Jimp } = require('jimp');

async function process() {
    const img = await Jimp.read("C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782382282760.jpg");
    
    // Scan middle column of Logo 1 (x: 100 to 110) from y=380 to 450
    // To find the gap between the circle and the text
    for (let y = 380; y < 450; y++) {
        let maxBrightness = 0;
        for (let x = 90; x < 120; x++) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 255;
            const g = (color >> 16) & 255;
            const b = (color >> 8) & 255;
            const bright = Math.max(r, g, b);
            if (bright > maxBrightness) maxBrightness = bright;
        }
        console.log(`y=${y}, maxBright=${maxBrightness}`);
    }
}
process();
