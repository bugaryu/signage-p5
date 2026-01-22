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

// 基本移動速度と各層の係数
const baseCircleSpeed = 0.02;

// 円ごとの位置追跡用
let circlePositions = {
  outer: { x: 0, y: 0 },
  middle: { x: 0, y: 0 },
  inner: { x: 0, y: 0 }
};

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
  
  // 各円の初期位置を設定
  circlePositions.outer = { x: circleX, y: circleY };
  circlePositions.middle = { x: circleX, y: circleY };
  circlePositions.inner = { x: circleX, y: circleY };
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

  // 各円を異なる速度で移動（基本速度 × 係数）
  let outerSpeed = baseCircleSpeed * 1.0;
  let middleSpeed = baseCircleSpeed * 2.0;
  let innerSpeed = baseCircleSpeed * 3.0;

  circlePositions.outer.x += (targetX - circlePositions.outer.x) * outerSpeed;
  circlePositions.outer.y += (targetY - circlePositions.outer.y) * outerSpeed;

  circlePositions.middle.x += (targetX - circlePositions.middle.x) * middleSpeed;
  circlePositions.middle.y += (targetY - circlePositions.middle.y) * middleSpeed;

  circlePositions.inner.x += (targetX - circlePositions.inner.x) * innerSpeed;
  circlePositions.inner.y += (targetY - circlePositions.inner.y) * innerSpeed;

  circleSize += (targetSize - circleSize) * 0.04;
}

function drawFloatingCircle() {
  noStroke();

  // Draw outer circle (glow layer 1)
  fill(colorChoiceC[0], colorChoiceC[1], colorChoiceC[2], 100);
  ellipse(circlePositions.outer.x, circlePositions.outer.y, circleSize * 1.25);

  // Draw middle circle (glow layer 2)
  fill(colorChoiceB[0], colorChoiceB[1], colorChoiceB[2], 200);
  ellipse(circlePositions.middle.x, circlePositions.middle.y, circleSize * 1.1);

  // Draw inner circle (main)
  fill(colorChoiceA[0], colorChoiceA[1], colorChoiceA[2], 255);
  ellipse(circlePositions.inner.x, circlePositions.inner.y, circleSize);
}
