const fs = require('fs');

async function checkImage() {
    const path = "C:\\Users\\sindh\\.gemini\\antigravity-ide\\brain\\f628d372-c59d-41b2-ae0e-af59f14d92bb\\media__1782379304413.jpg";
    console.log("Checking image:", path);
    if (!fs.existsSync(path)) {
        console.error("File not found!");
        return;
    }
    console.log("File exists!");
}
checkImage();
