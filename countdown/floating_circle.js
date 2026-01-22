// ===== フローティングサークルアニメーション =====
// 別ファイルで管理される浮遊する円のアニメーション

let circleX, circleY;
let targetX, targetY;
let circleSize;
let targetSize;
let circleTime = 0;
let baseCircleSize;
const themeColors = [
  [255, 0, 0],     // #FF0000 
  [106, 208, 116], // #6AD074 
  [0, 28, 176]     // #001CB0 
];
let colorChoiceA;
let colorChoiceB;
let colorChoiceC;

function initFloatingCircle() {
  frameRate(30);
  baseCircleSize = Math.min(width, height) * 0.3;
  circleX = width / 2;
  circleY = height / 2;
  targetX = width / 2;
  targetY = height / 2;
  circleSize = baseCircleSize;
  targetSize = baseCircleSize;
  colorChoiceA = themeColors[0];
  colorChoiceB = themeColors[1];
  colorChoiceC = themeColors[2];
}

function updateFloatingCircle() {
  circleTime += 0.01;

  // Pick new target occasionally
  if (frameCount % 120 === 0) {
    targetX = random(width * 0.2, width * 0.8);
    targetY = random(height * 0.2, height * 0.8);
    targetSize = random(baseCircleSize * 0.75, baseCircleSize * 1.75);

    colorChoiceA = random(themeColors);
    colorChoiceB = random(themeColors);
    colorChoiceC = random(themeColors);
  }

  // Smooth movement toward target
  circleX += (targetX - circleX) * 0.05;
  circleY += (targetY - circleY) * 0.05;
  circleSize += (targetSize - circleSize) * 0.04;
}

function drawFloatingCircle() {
  // Add gentle sway
  let swayX = sin(circleTime * 0.5) * 30;
  let swayY = cos(circleTime * 0.4) * 20;

  // Draw optimized glow with fewer circles
  noStroke();
  fill(colorChoiceC, 12);
  ellipse(circleX + swayX * 0.5, circleY + swayY * 0.5, circleSize * 1.25);

  fill(colorChoiceB, 18);
  ellipse(circleX + swayX * 0.8, circleY + swayY * 0.8, circleSize * 1.1);

  // Draw main circle
  fill(colorChoiceA, 25);
  ellipse(circleX + swayX, circleY + swayY, circleSize);
}
