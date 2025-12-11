// ================================
// 設定
// ================================
let images = [];          // 実体画像
// imageUrls は別ファイルで定義されている前提

let currentIndex = 0;
let nextIndex = 0;

let slideDuration = 10000;   // 1枚の表示時間
let fadeDuration = 2000;    // フェード時間

let slideStart = 0;          // 現在スライド開始時刻
let transitionStart = 0;     // フェード開始時刻
let inTransition = false;

// 画像ロード管理
const MAX_PARALLEL_LOADS = 2;   // 同時Ïロード数上限
let imageState = [];            // "not_started" | "loading" | "loaded" | "failed"
let loadedIndices = [];         // 読み込み済みインデックス一覧

// ===== 名言用 =====
let thanksText = null;
let quoteAlpha = 0; // 名言の透明度
let fadingIn = true;
let lastQuoteTime = 0;
const quoteDisplayDuration = 20000; // 30秒
const quoteFadeDuration = 2000;
const quoteGapDuration = 5000;  // ★ テキスト非表示の時間（ms）

let textBaseSize = 0;

let font = null;

const DEBUG = new URLSearchParams(window.location.search).has("debug");
console.log("[Quotes Sketch] Debug mode:", DEBUG);

// ================================
// 画像ロードまわり
// ================================
function initImageState() {
    console.log("imageUrls.length:", imageUrls.length);
    imageState = new Array(imageUrls.length).fill("not_started");
    images = new Array(imageUrls.length).fill(null);
    loadedIndices = [];
}

// index番目のロード開始（既に済なら何もしない）
function startImageLoad(index) {
    if (!imageUrls[index]) return;
    if (imageState[index] === "loading" || imageState[index] === "loaded") return;

    imageState[index] = "loading";

    loadImage(
        imageUrls[index],
        (img) => {
            images[index] = img;
            imageState[index] = "loaded";
            loadedIndices.push(index);
            console.log("loaded", index, imageUrls[index]);
        },
        (err) => {
            imageState[index] = "failed";
            console.error("failed to load", imageUrls[index], err);
        }
    );
}

// MAX_PARALLEL_LOADS を超えないように、裏で順次プリロード
function preloadImagesInBackground() {
    const activeLoads = imageState.filter((s) => s === "loading").length;
    let slots = MAX_PARALLEL_LOADS - activeLoads;
    if (slots <= 0) return;

    for (let i = 0; i < imageUrls.length && slots > 0; i++) {
        if (imageState[i] === "not_started") {
            startImageLoad(i);
            slots--;
        }
    }
}

// 最初の1枚だけ確実に読み込んでからスタート（黒画面防止）
function preload() {
    // font = loadFont('../fonts/Noto_Sans_JP/NotoSansJP-VariableFont_wght.ttf');
    font = 'NotoSansJP';

    initImageState();
    if (imageUrls.length > 0) {
        startImageLoad(0);
    }
}

// 読み込み済みの中から、currentIndex とは違うランダムなインデックスを返す
function chooseRandomLoadedIndex(excludeIndex) {
    if (loadedIndices.length === 0) return excludeIndex;

    const candidates = loadedIndices.filter((i) => i !== excludeIndex);
    if (candidates.length === 0) return excludeIndex;

    const idx = floor(random(candidates.length));
    return candidates[idx];
}

// 最初に読み込み済みのインデックスを返す（なければ0）
function findFirstLoadedIndex() {
    if (loadedIndices.length === 0) return 0;
    return loadedIndices[0];
}

// ================================
// 名言まわり
// ================================
function pickText() {
    if (typeof appreciatesData === "undefined") {
        console.error(
            "appreciatesData is not loaded. Make sure appreciates.js is included before thanks.js"
        );
        thanksText = {
            text: "引用句が読み込まれていません",
            author: "システムメッセージ",
        };
        return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    // 完全ランダム選択（「毎回変わる」でOKそうだったのでこちら）
    const seed = random(appreciatesData.length);
    const index = int(seed);
    console.log("appreciate index:", index, seed);

    thanksText = appreciatesData[index];

    if (DEBUG) {
        console.log("[Quote Debug]", {
            date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            seed: seed,
            quoteIndex: index,
            totalQuotes: appreciatesData.length,
            selectedQuote: thanksText,
        });
    }
}

function updateQuoteAlpha() {
    const elapsedTime = millis() - lastQuoteTime;

    // ① フェードイン（0 → quoteFadeDuration）
    if (elapsedTime < quoteFadeDuration) {
        quoteAlpha = map(elapsedTime, 0, quoteFadeDuration, 0, 255);
    }
    // ② フル表示（quoteFadeDuration → quoteDisplayDuration - quoteFadeDuration）
    else if (elapsedTime < quoteDisplayDuration - quoteFadeDuration) {
        quoteAlpha = 255;
    }
    // ③ フェードアウト（quoteDisplayDuration - quoteFadeDuration → quoteDisplayDuration）
    else if (elapsedTime < quoteDisplayDuration) {
        const fadeOutProgress = map(
            elapsedTime,
            quoteDisplayDuration - quoteFadeDuration,
            quoteDisplayDuration,
            255,
            0
        );
        quoteAlpha = fadeOutProgress;
    }
    // ④ ギャップ期間（quoteDisplayDuration → quoteDisplayDuration + quoteGapDuration）
    else if (elapsedTime < quoteDisplayDuration + quoteGapDuration) {
        // ★ ここではテキスト完全非表示
        quoteAlpha = 0;
    }
    // ⑤ 次のテキストへ
    else {
        pickText();
        lastQuoteTime = millis();
        quoteAlpha = 0;
        fadingIn = true;
    }
}

// ================================
// p5 setup/draw
// ================================
function setup() {
    console.log(windowWidth, windowHeight);
    createCanvas(windowWidth, windowHeight);

    imageMode(CENTER);
    textAlign(CENTER, CENTER);
    textWrap(CHAR);
    // textFont("Noto Sans JP", "Noto Color Emoji");
    textFont(font);
    textBaseSize = width * 0.04;
    frameRate(30); // 描画は30fps, 負荷が高ければ下げてもOK

    slideStart = millis();

    if (DEBUG) {
        console.log("[Setup] Canvas size:", windowWidth, "x", windowHeight);
    }

    pickText();
    lastQuoteTime = millis();
    quoteAlpha = 0;
    fadingIn = true;

    // currentIndex 初期化（既に読み込み済みの画像から）
    currentIndex = findFirstLoadedIndex();
    nextIndex = currentIndex;
}

function draw() {
    background(0);

    // 裏で画像をどんどんロードする
    preloadImagesInBackground();

    if (loadedIndices.length === 0 || !images[currentIndex]) {
        // まだ何も読めてないとき
        fill(255);
        textSize(24);
        text("Loading photos...", width / 2, height / 2);
        return;
    }

    const now = millis();

    // currentIndex が未ロードになったら、最初のロード済み画像にフォールバック
    if (!images[currentIndex]) {
        currentIndex = findFirstLoadedIndex();
    }

    // スライド切替判定（次のインデックスは必ず loaded なものからランダム）
    if (!inTransition && now - slideStart > slideDuration) {
        const candidate = chooseRandomLoadedIndex(currentIndex);
        if (candidate !== currentIndex) {
            inTransition = true;
            transitionStart = now;
            nextIndex = candidate;
        } else {
            // まだ1枚しか読み込めていないなどの場合はそのまま維持
            slideStart = now;
        }
    }

    if (!inTransition) {
        // フェード前：現在の画像のみ
        const progress = constrain(
            (now - slideStart) / (slideDuration + fadeDuration),
            0,
            1
        );
        drawKenBurns(images[currentIndex], progress, 255);
    } else {
        // フェード中：2枚をクロスフェード
        const f = constrain((now - transitionStart) / fadeDuration, 0, 1);

        const currentProgress = constrain(
            (now - slideStart) / (slideDuration + fadeDuration),
            0,
            1
        );
        const nextProgress = constrain(
            (now - transitionStart) / (slideDuration + fadeDuration),
            0,
            1
        );

        drawKenBurns(images[currentIndex], currentProgress, 255 * (1 - f));
        drawKenBurns(images[nextIndex], nextProgress, 255 * f);

        if (f >= 1.0) {
            currentIndex = nextIndex;
            slideStart = now - fadeDuration; // ズーム進行度を連続させる
            inTransition = false;
        }
    }

    // ===== テキスト用背景オーバーレイ（視認性アップ）=====
    if (quoteAlpha > 0) {
        push();
        noStroke();
        fill(0, map(quoteAlpha, 0, 255, 0, 100));
        rect(0, 0, width, height);
        pop();
    }

    // テキスト描画
    drawTimeBasedMessage();
}

// ================================
// Ken Burns風：ゆっくりズーム（パンなし）
// ================================
function drawKenBurns(img, progress, alpha) {
    if (!img) return;

    const aspectCanvas = height / width;
    const aspectImg = img.height / img.width;
    if (frameCount === 1 && DEBUG) {
        console.log("[Ken Burns] Canvas Aspect:", aspectCanvas, "Image Aspect:", aspectImg);
    }

    let baseW, baseH;
    if (aspectImg < aspectCanvas) {
        // 横長 → 高さ基準
        baseH = height;
        baseW = img.width * (height / img.height);
    } else {
        // 縦長 → 幅基準
        baseW = width;
        baseH = img.height * (width / img.width);
    }

    const scale = 1.0 + 0.07 * progress;

    push();
    tint(255, alpha);
    image(img, width / 2, height / 2, baseW * scale, baseH * scale);
    pop();
}

// ================================
// 名言描画
// ================================
function drawTimeBasedMessage() {
    updateQuoteAlpha();

    if (!thanksText) {
        if (DEBUG) {
            fill(255, 100, 100);
            textAlign(CENTER, CENTER);
            textSize(textBaseSize);
            text("Quote not loaded", width / 2, height / 2);
        }
        return;
    }

    const padding = textBaseSize * 2.0;
    const lineHeight = textBaseSize * 1.5;
    const authorSize = textBaseSize * 0.75;
    const authorSpacing = textBaseSize * 0.8;

    const maxBoxHeight = height * 0.45;
    const quoteBoxWidth = width - padding * 2;

    textSize(textBaseSize);
    textLeading(lineHeight);

    const estimatedQuoteHeight = textBaseSize * 3.5;
    const estimatedAuthorHeight = authorSize * 1.5;
    const totalEstimatedHeight =
        estimatedQuoteHeight + authorSpacing + estimatedAuthorHeight;

    const boxHeight = min(totalEstimatedHeight + textBaseSize, maxBoxHeight);

    const quoteBoxY = height * 0.25;
    const contentTopY = quoteBoxY - boxHeight * 0.35;

    if (DEBUG && frameCount === 1) {
        console.log("[Draw] Quote rendering info:", {
            textBaseSize,
            padding,
            lineHeight,
            boxHeight,
            maxBoxHeight,
            contentTopY,
            textLength: thanksText.text.length,
            authorLength: thanksText.author.length,
        });
    }

    // 背景（上ですでに全画面オーバーレイしているのでここは文字だけ）
    noStroke();
    fill(255, quoteAlpha);
    textSize(textBaseSize);
    textLeading(lineHeight);
    text(thanksText.text, padding, contentTopY, quoteBoxWidth, boxHeight * 0.7);

    textSize(authorSize);
    text("— " + thanksText.author, width / 2, contentTopY + boxHeight * 0.75);


    // デバッグ表示：背景のボックスを描画（常に表示、フェードしない）
    if (DEBUG) {
        stroke(100, 255, 100, 200); // 常時表示
        noFill();
        rect(padding, contentTopY, quoteBoxWidth, boxHeight);

        // テキスト情報を表示（常に表示、フェードしない）
        fill(100, 255, 100, 255); // 常時表示
        // noFill();
        // fill(100, 255, 100, 255);
        // textFont('Courier New', 'monospace');
        textAlign(LEFT);
        textSize(textBaseSize * 0.5);
        textLeading(textBaseSize * 1.2);
        text(`Quote: "${thanksText.text.substring(0, 20)}..."`, textBaseSize * 0.5, textBaseSize);
        text(`Author: ${thanksText.author}`, textBaseSize * 0.5, textBaseSize * 1.8);
        text(`Alpha: ${Math.round(quoteAlpha)}`, textBaseSize * 0.5, textBaseSize * 2.6);
        text(`Elapsed: ${Math.round((millis() - lastQuoteTime) / 100) / 10}s`, textBaseSize * 0.5, textBaseSize * 3.4);
        textAlign(CENTER);
    }
}

function windowResized() {
    console.log("Window resized:", windowWidth, windowHeight);
    resizeCanvas(windowWidth, windowHeight);
}
