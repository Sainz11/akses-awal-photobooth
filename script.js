// DOM Elements
const video = document.getElementById('video');
const startBtn = document.getElementById('start-btn');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const canvas = document.getElementById('strip-canvas');
const dots = document.querySelectorAll('.dot');
const resultSection = document.getElementById('result-section');
const downloadBtn = document.getElementById('download-btn');
const retakeBtn = document.getElementById('retake-btn');

let stream;
let captures = [];
const TOTAL_PHOTOS = 4;

// Initialize Camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 960 },
                facingMode: "user"
            }, 
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permissions are granted.");
    }
}

// Capture Logic
async function startSession() {
    startBtn.disabled = true;
    captures = [];
    dots.forEach(dot => dot.classList.remove('captured'));
    resultSection.classList.add('hidden');

    for (let i = 0; i < TOTAL_PHOTOS; i++) {
        await runCountdown(3);
        capturePhoto(i);
        await new Promise(resolve => setTimeout(resolve, 800)); // Short break between shots
    }

    generateStrip();
    startBtn.disabled = false;
}

function runCountdown(seconds) {
    return new Promise(resolve => {
        countdownEl.classList.remove('hidden');
        let count = seconds;
        countdownEl.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.innerText = count;
            } else {
                clearInterval(interval);
                countdownEl.classList.add('hidden');
                resolve();
            }
        }, 1000);
    });
}

function capturePhoto(index) {
    // Flash effect
    flashEl.classList.remove('hidden');
    flashEl.classList.add('flash-animation');
    setTimeout(() => {
        flashEl.classList.add('hidden');
        flashEl.classList.remove('flash-animation');
    }, 400);

    const tempCanvas = document.createElement('canvas');
    // Using 4:3 aspect ratio for each photo
    tempCanvas.width = 800;
    tempCanvas.height = 600;
    const ctx = tempCanvas.getContext('2d');
    
    // Mirror image
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
    
    // Draw and apply specific LANY filter
    ctx.filter = 'contrast(1.1) brightness(1.05) saturate(0.85) sepia(0.05)';
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    captures.push(tempCanvas.toDataURL('image/jpeg', 0.9));
    dots[index].classList.add('captured');
}

function generateStrip() {
    // Strip constants
    const photoW = 800;
    const photoH = 600;
    const margin = 40;
    const brandingH = 250;
    
    canvas.width = photoW + (margin * 2); 
    canvas.height = (photoH * TOTAL_PHOTOS) + (margin * (TOTAL_PHOTOS + 1)) + brandingH;
    
    const ctx = canvas.getContext('2d');
    
    // Background (Vibrant LANY Blue)
    ctx.fillStyle = '#0047FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;
    captures.forEach((src, i) => {
        const img = new Image();
        img.onload = () => {
            const y = margin + (i * (photoH + margin));
            ctx.drawImage(img, margin, y, photoW, photoH);
            
            loadedCount++;
            if (loadedCount === TOTAL_PHOTOS) {
                // Ensure fonts are loaded before drawing branding
                document.fonts.ready.then(() => {
                    drawBranding(ctx, canvas.width, canvas.height, brandingH);
                    resultSection.classList.remove('hidden');
                    resultSection.scrollIntoView({ behavior: 'smooth' });
                });
            }
        };
        img.src = src;
    });
}

function drawBranding(ctx, w, h, brandingH) {
    const centerY = h - (brandingH / 2);
    
    // Draw "XXL" (Custom Font: Daydream)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '400 40px "Daydream DEMO"'; // Matches internal font name
    ctx.letterSpacing = '5px';
    ctx.fillText('XXL', w / 2, centerY - 80);

    // Draw "a beautiful blur"
    ctx.font = '300 18px "Inter", sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('A BEAUTIFUL BLUR', w / 2, centerY - 30);
    
    // Draw "LANY"
    ctx.font = '900 90px "Orbitron", sans-serif';
    ctx.letterSpacing = '-3px';
    ctx.fillText('LANY', w / 2, centerY + 65);
}

// Actions
startBtn.addEventListener('click', startSession);

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `LANY-XXL-COLLAGE-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
});

retakeBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    dots.forEach(dot => dot.classList.remove('captured'));
});

// Start camera on load
initCamera();
