let handPose, faceMesh, video;
let hands = [], faces = [];
let modelsLoaded = 0;
let bgStars = [];
// Image Resources
let apples = [];
let wingsA, starA, ringA, haloA;
let wingsB, starB, ringB, haloB;
let appleFlesh, appleCore;

let biteCount = 0;     // Calculate the number of bites of the apple.
let isMouthOpen = false; // Tracks the state of the mouth
let fadeAlpha = 255;
let transitionSpeed = 10;
let currentScale = 1.0;   // Controls the zoom level

const defWings = { x: 0, y: 180 };
const defRing = { x: 0, y: -1500 };
const defStar = { x: 0, y: -1500 };

// Initial position of the accessory
let curWings = { x: 0, y: 180 };
let curRing = { x: 0, y: -1500 };
let curStar = { x: 0, y: -1500 };

let draggingPart = null;

// I admit that I used the AI tool Gemini to help debug this part.
// Distance thresholds for hand scaling (pinch to zoom)
const HAND_CLOSE = 50, HAND_FAR = 450;
const SCALE_MIN = 0.3, SCALE_MAX = 1.5;

// Positions for each apple stage
const appleOffsets = [
    [0, 0],    // apple0 (Whole)
    [0, -20],  // apple1 (1st bite)
    [0, -20],  // apple2 (2nd bite)
    [0, 0]     // apple3 (Core)
];

// Fireworks
let splashParticles = [];

function preload() {
    // input all the pictures of apples.
    for (let i = 0; i < 4; i++) {
        apples[i] = loadImage(`apple${i}.png`);
    }

    // input the initial accessory
    wingsA = loadImage('wings.png');
    starA = loadImage('star.png');
    ringA = loadImage('ring.png');
    haloA = loadImage('halo.png');

    // input the final accessory
    wingsB = loadImage('wings_final.png');
    starB = loadImage('star_final.png');
    ringB = loadImage('ring_final.png');
    haloB = loadImage('halo_final.png');

    appleFlesh = loadImage('apple_flesh.png');
    appleCore = loadImage('apple_core.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    video = createCapture(VIDEO, () => {
        loadModels();
    });
    video.size(640, 480);
    video.hide();
    for(let i=0; i<50; i++) {
        bgStars.push({
            x: random(width),
            y: random(height),
            size: random(1, 5),
            offset: random(TWO_PI)
        });
    }
}

function loadModels() {
    handPose = ml5.handPose(video, { maxHands: 2, flipHorizontal: true }, () => {
        modelsLoaded++;
        handPose.detectStart(video, (results) => { hands = results; });

        faceMesh = ml5.faceMesh(video, { maxHands: 1, flipHorizontal: true }, () => {
            modelsLoaded++;
            faceMesh.detectStart(video, (results) => { faces = results; });
        });
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    splashParticles = [];
}

function draw() {
    background(0);
    drawGrainyBackground();
    drawDistantStars();
    drawMysticUI();
    // I admit that I used the AI tool Gemini to help debug this part.
    // Wait for both hand and face models to load before starting

    /* During the test, it was found that the face and gesture recognition could only be performed 
    // after running the program twice each time. The reason was that the camera was not fully ready. 
    // Therefore, the first step is to prepare the camera before running the face recognition and other operations.*/
    if (modelsLoaded < 2) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("Loading...", width / 2, height / 2);
        return;
    }

    handleInteractions();
    detectEating();

    if (fadeAlpha < 255) fadeAlpha += transitionSpeed;

    drawWhiteFace();

    // I admit that I used the AI tool Gemini to help debug this part.
    //  glowing particles
    blendMode(ADD);
    // Update and draw all active fireworks particles
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        let p = splashParticles[i];
        p.update();
        p.show();
        if (p.isDead()) {
            splashParticles.splice(i, 1);
        }
    }
    blendMode(BLEND);
    renderMagic();
    drawWhiteHandFeedback();
}

// Draw four-pointed stars
function drawProperStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}

// I admit that I used the AI tool Gemini to help debug this part.
// Particle System Class
class Particle {
    constructor(startX, startY, biteStage) {
        this.pos = createVector(startX, startY);
        this.history = [];
        this.life = 255;
        this.lifeDec = random(6, 12);

        this.type = random() > 0.4 ? 'star' : 'trail';
        this.size = random(20, 30);

        let speedMin = 1, speedMax = 10;
        let angleMin, angleMax;

        if (biteStage === 1) {
            angleMin = PI - PI / 4;
            angleMax = PI + PI / 4;
        } else if (biteStage === 2) {
            angleMin = -PI / 4;
            angleMax = PI / 4;
        } else {
            angleMin = -PI;
            angleMax = 0;
        }

        let angle = random(angleMin, angleMax);
        let speed = random(speedMin, speedMax);
        this.vel = createVector(cos(angle) * speed, sin(angle) * speed);
        this.acc = createVector(0, 0.15);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.life -= this.lifeDec;

        if (this.type === 'trail') {
            this.history.push(createVector(this.pos.x, this.pos.y));
            // Keep the trail extremely short (max 3 points)
            if (this.history.length > 3) {
                this.history.shift();
            }
        }
    }

    show() {
        push();
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = color(255, 255, 200, this.life);
        fill(255, 255, 245, this.life);
        noStroke();

        if (this.type === 'trail') {
            for (let i = 0; i < this.history.length; i++) {
                let p = this.history[i];
                let r = map(i, 0, this.history.length, 0, this.size * 0.5);
                let alpha = map(i, 0, this.history.length, 0, this.life);
                fill(255, 255, 245, alpha);
                ellipse(p.x, p.y, r, r);
            }
        } else if (this.type === 'star') {
            translate(this.pos.x, this.pos.y);
            rotate(this.vel.heading() + PI / 4);
            drawProperStar(0, 0, this.size * 0.15, this.size, 4);
        }
        pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

// I admit that I used the AI tool Gemini to help debug this part.
// Interaction Handling
function handleInteractions() {
    if (!hands || hands.length === 0) {
        currentScale = lerp(currentScale, 1.0, 0.1);
        draggingPart = null;
        return;
    }

    // Two-Handed Scaling
    if (hands.length === 2) {
        let d = dist(hands[0].keypoints[9].x, hands[0].keypoints[9].y,
            hands[1].keypoints[9].x, hands[1].keypoints[9].y);
        currentScale = lerp(currentScale, map(d, HAND_CLOSE, HAND_FAR, SCALE_MIN, SCALE_MAX, true), 0.2);
    } else {
        // Return to normal scale if only one hand is visible
        currentScale = lerp(currentScale, 1, 0.1);
    }

    let baseScale = (height * 0.35) / apples[0].height;
    let totalScale = baseScale * currentScale;

    // Process each detected hand
    for (let hand of hands) {
        // Reset anytime by making a fist
        if (isFist(hand)) {
            // I admit that I used the AI tool Gemin to complete this part.
            // Snap all floating parts back to their default origins
            curWings = { ...defWings }; curRing = { ...defRing }; curStar = { ...defStar };
            if (biteCount > 0) {
                biteCount = 0;
                fadeAlpha = 0;
                splashParticles = [];
                console.log("Respawn: Returned to the red apple state");
            }
            draggingPart = null;
            continue;
        }

        // I admit that I used the AI tool Gemin to complete this part.
        // One-Handed Pinch and Drag 
        let thumbTip = { x: map(hand.keypoints[4].x, 0, 640, 0, width), y: map(hand.keypoints[4].y, 0, 480, 0, height) };
        let indexTip = { x: map(hand.keypoints[8].x, 0, 640, 0, width), y: map(hand.keypoints[8].y, 0, 480, 0, height) };
        let pinchDist = dist(indexTip.x, indexTip.y, thumbTip.x, thumbTip.y);

        if (pinchDist < 60) {
            let getScreenPos = (objPos) => ({ x: width / 2 + objPos.x * totalScale, y: height / 2 + objPos.y * totalScale });

            if (!draggingPart) {
                if (dist(indexTip.x, indexTip.y, getScreenPos(curWings).x, getScreenPos(curWings).y) < 120) draggingPart = "wings";
                else if (dist(indexTip.x, indexTip.y, getScreenPos(curRing).x, getScreenPos(curRing).y) < 120) draggingPart = "ring";
                else if (dist(indexTip.x, indexTip.y, getScreenPos(curStar).x, getScreenPos(curStar).y) < 120) draggingPart = "star";
            }

            let targetX = (indexTip.x - width / 2) / totalScale;
            let targetY = (indexTip.y - height / 2) / totalScale;

            if (draggingPart === "wings") curWings = { x: targetX, y: targetY };
            if (draggingPart === "ring") curRing = { x: targetX, y: targetY };
            if (draggingPart === "star") curStar = { x: targetX, y: targetY };
        } else {
            draggingPart = null;
        }
    }
}

function isFist(hand) {
    let tips = [8, 12, 16, 20], joints = [5, 9, 13, 17];
    for (let i = 0; i < 4; i++) {
        if (dist(hand.keypoints[tips[i]].x, hand.keypoints[tips[i]].y, hand.keypoints[joints[i]].x, hand.keypoints[joints[i]].y) > 65) return false;
    }
    return true;
}

// I admit that I used the AI tool Gemini to help debug this part.
// Eating
function detectEating() {
    if (!apples[0] || apples[0].width <= 1) return;

    if (faces && faces.length > 0) {
        let f = faces[0].keypoints;
        let faceHeight = dist(f[10].x, f[10].y, f[152].x, f[152].y);
        let mouthDist = dist(f[13].x, f[13].y, f[14].x, f[14].y);

        if (mouthDist > faceHeight * 0.15 && !isMouthOpen && biteCount < 3) {
            biteCount++;
            isMouthOpen = true;
            fadeAlpha = 0;

            let baseScale = (height * 0.25) / apples[0].height;
            let totalScale = baseScale * currentScale;
            let currentOffset = appleOffsets[biteCount];

            let startX = width / 2 + currentOffset[0] * totalScale;
            let startY = height / 2 + currentOffset[1] * totalScale;

            if (biteCount === 1) startX -= (apples[0].width * 0.2) * totalScale;
            if (biteCount === 2) startX += (apples[0].width * 0.2) * totalScale;

            let particleCount = random(5, 10);
            for (let i = 0; i < particleCount; i++) {
                splashParticles.push(new Particle(startX, startY, biteCount));
            }
        }
        if (mouthDist < faceHeight * 0.05) isMouthOpen = false;
    }
}

// I admit that I used the AI tool Gemin to complete this part.
// Rendering the Magical Assets
function renderMagic() {
    if (!apples[0] || apples[0].width <= 1) return;

    push();
    translate(width / 2, height / 2);
    imageMode(CENTER);

    let baseScale = (height * 0.35) / apples[0].height;
    scale(baseScale * currentScale);

    let prevIdx = max(0, biteCount - 1);
    let currIdx = biteCount;
    let prevOffset = appleOffsets[prevIdx];
    let targetOffset = appleOffsets[currIdx];

    push();
    tint(255, 255 - fadeAlpha);
    image(apples[prevIdx], prevOffset[0], prevOffset[1]);

    tint(255, fadeAlpha);
    image(apples[currIdx], targetOffset[0], targetOffset[1]);
    pop();

    if (biteCount >= 3 && appleFlesh && appleCore) {
        push();
        tint(255, fadeAlpha);
        image(appleFlesh, targetOffset[0] + 30, targetOffset[1] + 150);
        image(appleCore, targetOffset[0] + 30, targetOffset[1] + 150);
        pop();
    }

    let isFinal = (biteCount >= 3);

    drawPartWithEffect(curWings, wingsA, wingsB, isFinal, draggingPart === "wings", true, false);
    drawPartWithEffect(curRing, ringA, ringB, isFinal, draggingPart === "ring", false, true);
    drawPartWithEffect(curStar, starA, starB, isFinal, draggingPart === "star", false, false);

    push();
    translate(curStar.x + 25, curStar.y);
    let glow = map(sin(frameCount * 0.05), -1, 1, 150, 255);
    drawDoubleLayer(haloA, haloB, isFinal, glow);
    pop();

    pop();
}

// I admit that I used the AI tool Gemini to help debug this part.
// Handles dragging interactions and floating animations for parts
function drawPartWithEffect(pos, imgA, imgB, isFinal, isSelected, floating, rotating) {
    push();
    translate(pos.x, pos.y + (floating ? sin(frameCount * 0.08) * 35 : 0));
    if (rotating) rotate(frameCount * 0.04);

    if (isSelected) {
        push();
        scale(1.1);
        tint(255, 100);
        image(isFinal ? imgB : imgA, random(-3, 3), random(-3, 3));
        pop();
    }

    drawDoubleLayer(imgA, imgB, isFinal);
    pop();
}

// I admit that I used the AI tool Gemini to help debug this part.
//  Draws the wireframe feedback for the mouse
function drawWhiteFace() {
    if (faces && faces.length > 0) {
        let f = faces[0].keypoints;

        push();
        let isFlashing = fadeAlpha < 15;

        stroke(255, isFlashing ? 255 : 150);
        strokeWeight(isFlashing ? 4 : 2);
        noFill();

        const outerLips = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40];
        const innerLips = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80];

        beginShape();
        for (let i of outerLips) {
            if (f[i]) vertex(map(f[i].x, 0, 640, 0, width), map(f[i].y, 0, 480, 0, height));
        }
        endShape(CLOSE);

        beginShape();
        for (let i of innerLips) {
            if (f[i]) vertex(map(f[i].x, 0, 640, 0, width), map(f[i].y, 0, 480, 0, height));
        }
        endShape(CLOSE);

        fill(255);
        noStroke();
        let dotPoints = [0, 17, 61, 291];
        for (let i of dotPoints) {
            if (f[i]) ellipse(map(f[i].x, 0, 640, 0, width), map(f[i].y, 0, 480, 0, height), 4, 4);
        }
        pop();
    }
}

// I admit that I used the AI tool Gemini to help debug this part.
// Draws the wireframe feedback for the hands
function drawWhiteHandFeedback() {
    for (let hand of hands) {
        stroke(255, 150); strokeWeight(2);

        const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [9, 10], [10, 11], [11, 12], [13, 14], [14, 15], [15, 16], [17, 18], [18, 19], [19, 20], [0, 5], [5, 9], [9, 13], [13, 17]];

        for (let b of bones) {
            let p1 = hand.keypoints[b[0]], p2 = hand.keypoints[b[1]];
            line(map(p1.x, 0, 640, 0, width), map(p1.y, 0, 480, 0, height), map(p2.x, 0, 640, 0, width), map(p2.y, 0, 480, 0, height));
        }

        fill(255);
        noStroke();
        let indexTip = { x: map(hand.keypoints[8].x, 0, 640, 0, width), y: map(hand.keypoints[8].y, 0, 480, 0, height) };
        ellipse(indexTip.x, indexTip.y, 10, 10);
        noFill(); stroke(255); ellipse(indexTip.x, indexTip.y, 25, 25);
    }
}

// When the Apple logo is changed, it fades in and out.
function drawDoubleLayer(imgA, imgB, showB, extraAlpha = 255) {
    if (!showB) {
        tint(255, extraAlpha);
        image(imgA, 0, 0);
    } else {
        tint(255, (255 - fadeAlpha) * (extraAlpha / 255));
        image(imgA, 0, 0);
        tint(255, fadeAlpha * (extraAlpha / 255));
        image(imgB, 0, 0);
    }
    noTint();
}

function drawGrainyBackground() {
    push();
    // Use a very dark grey instead of pure black to let grain show
    background(10);

    // Draw tiny random dots to simulate film grain
    noStroke();
    for (let i = 0; i < 500; i++) {
        fill(255, random(5, 15)); // Very subtle white dots
        let x = random(width);
        let y = random(height);
        ellipse(x, y, 1.5, 1.5);
    }
    pop();
}

function drawMysticUI() {
    push();
    stroke(255, 80); // Faded white
    strokeWeight(1);
    noFill();

    let margin = 40;
    // Four corner brackets
    // Top Left
    line(margin, margin, margin + 30, margin);
    line(margin, margin, margin, margin + 30);

    // Bottom Right
    line(width - margin, height - margin, width - margin - 30, height - margin);
    line(width - margin, height - margin, width - margin, height - margin - 30);

    // Add some "sensor" text like a ritual interface
    fill(255, 100);
    noStroke();
    textSize(12);
    textAlign(LEFT);
    text("SYSTEM: DIVINE_RECEPTACLE", margin, height - margin + 20);
    textAlign(RIGHT);
    text("STATUS: " + (biteCount < 3 ? "ACTIVE" : "ASCENDED"), width - margin, height - margin + 20);
    pop();
}


function drawDistantStars() {
    push();
    for (let s of bgStars) {
        // Slow breathing alpha
        let a = map(sin(frameCount * 0.02 + s.offset), -1, 1, 50, 150);
        fill(255, a);
        noStroke();
        // Draw small diamond-like dots
        rectMode(CENTER);
        push();
        translate(s.x, s.y);
        rotate(QUARTER_PI);
        rect(0, 0, s.size, s.size);
        pop();
    }
    pop();
}