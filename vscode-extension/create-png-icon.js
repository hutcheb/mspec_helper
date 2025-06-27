const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 128x128 canvas for the extension icon
const canvas = createCanvas(128, 128);
const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createLinearGradient(0, 0, 128, 128);
gradient.addColorStop(0, '#4A90E2');
gradient.addColorStop(1, '#357ABD');

// Draw rounded rectangle background
ctx.fillStyle = gradient;
ctx.roundRect(0, 0, 128, 128, 16);
ctx.fill();

// Draw brackets and content in white
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
ctx.lineWidth = 4;

// Left bracket
ctx.beginPath();
ctx.moveTo(24, 32);
ctx.lineTo(24, 96);
ctx.lineTo(32, 96);
ctx.lineTo(32, 40);
ctx.lineTo(40, 40);
ctx.lineTo(40, 32);
ctx.closePath();
ctx.fill();

// Right bracket
ctx.beginPath();
ctx.moveTo(104, 32);
ctx.lineTo(104, 96);
ctx.lineTo(96, 96);
ctx.lineTo(96, 40);
ctx.lineTo(88, 40);
ctx.lineTo(88, 32);
ctx.closePath();
ctx.fill();

// Center content representing structured data
ctx.fillRect(48, 48, 32, 8);
ctx.fillRect(48, 64, 24, 8);
ctx.fillRect(48, 80, 32, 8);

// Small dots to represent data types
ctx.beginPath();
ctx.arc(52, 52, 2, 0, 2 * Math.PI);
ctx.arc(52, 68, 2, 0, 2 * Math.PI);
ctx.arc(52, 84, 2, 0, 2 * Math.PI);
ctx.fill();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('icons/mspec-icon.png', buffer);

console.log('Icon created: icons/mspec-icon.png');
