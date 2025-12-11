// ===== フェードアニメーション用の変数 =====
let todayQuote = null;
let quoteAlpha = 0; // 名言の透明度
let fadingIn = true; // フェードイン中か
let lastQuoteTime = 0; // 最後に名言が表示された時刻
const quoteDisplayDuration = 30000; // 表示時間（ミリ秒）：30秒
const fadeDuration = quoteDisplayDuration; // フェードイン/アウト時間（ミリ秒）
let textBaseSize = 0; // 基本テキストサイズ

const DEBUG = false;
// const DEBUG = new URLSearchParams(window.location.search).has('debug');
console.log('[Quotes Sketch] Debug mode:', DEBUG);

function pickTodayQuote() {
    // quotesDataは外部ファイル(quotes.js)から読み込まれる
    if (typeof quotesData === 'undefined') {
        console.error('quotesData is not loaded. Make sure quotes.js is included before time_sketch.js');
        todayQuote = { text: "引用句が読み込まれていません", author: "システムメッセージ" };
        return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    // 日付ベースのシード値で、毎日同じ名言が表示される
    //   const seed = y * 10000 + m * 100 + d;
    const seed = int(random(0, now.getMinutes() * 60 + now.getSeconds())); // テスト用に毎秒変わるシード

    const index = seed % quotesData.length;
    todayQuote = quotesData[index];

    if (DEBUG) {
        console.log('[Quote Debug]', {
            date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            seed: seed,
            quoteIndex: index,
            totalQuotes: quotesData.length,
            selectedQuote: todayQuote
        });
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont("NotoSansJP");
    textAlign(CENTER, CENTER);
    textWrap(CHAR); // テキスト折り返しを有効化
    textBaseSize = width * 0.04; // 基本テキストサイズ

    if (DEBUG) {
        console.log('[Setup] Canvas size:', windowWidth, 'x', windowHeight);
    }

    // フローティングサークルの初期化
    initFloatingCircle();

    // 今日の言葉を決める
    pickTodayQuote();
    lastQuoteTime = millis();
    quoteAlpha = 0;
    fadingIn = true;
}

function updateQuoteAlpha() {
    const elapsedTime = millis() - lastQuoteTime;

    // フェードイン処理（最初のfadeDuration時間）
    if (elapsedTime < fadeDuration && fadingIn) {
        quoteAlpha = map(elapsedTime, 0, fadeDuration, 0, 255);
    }
    // 表示時間経過後、フェードアウト開始
    else if (elapsedTime > quoteDisplayDuration - fadeDuration) {
        const fadeOutProgress = map(
            elapsedTime,
            quoteDisplayDuration - fadeDuration,
            quoteDisplayDuration,
            255,
            0
        );
        quoteAlpha = fadeOutProgress;
    }
    // 完全表示期間
    else {
        quoteAlpha = 255;
    }

    // 表示時間を超えたら、新しい名言に切り替え
    if (elapsedTime > quoteDisplayDuration) {
        pickTodayQuote(); // 同じ日なら同じ名言が選ばれる
        lastQuoteTime = millis();
        quoteAlpha = 0;
        fadingIn = true;
    }
}

function draw() {
    background(0); // 背景描画

    // ===== フローティングサークルの更新と描画 =====
    updateFloatingCircle();
    drawFloatingCircle();

    // ===== フェードアニメーションの更新 =====
    updateQuoteAlpha();

    // ==== 名言表示 ====
    if (todayQuote) {
        // textBaseSizeに基づいた動的な配置
        const padding = textBaseSize * 2.0;
        const lineHeight = textBaseSize * 1.5; // 行間
        const authorSize = textBaseSize * 0.75;
        const authorSpacing = textBaseSize * 0.8; // 著者と名言の間隔

        // 最大ボックスの高さを計算（キャンバスの50%を上限）
        const maxBoxHeight = height * 0.45;
        const quoteBoxWidth = width - padding * 2;

        // テキストサイズ設定
        textSize(textBaseSize);
        textLeading(lineHeight);

        // 名言のテキスト高さを推定
        const estimatedQuoteHeight = textBaseSize * 3.5; // 見積もり高さ
        const estimatedAuthorHeight = authorSize * 1.5;
        const totalEstimatedHeight = estimatedQuoteHeight + authorSpacing + estimatedAuthorHeight;

        // ボックスの実際の高さを決定（最大値を超えない）
        const boxHeight = min(totalEstimatedHeight + textBaseSize, maxBoxHeight);

        // 垂直中央配置用のY位置計算
        const quoteBoxY = height * 0.25;
        const contentTopY = quoteBoxY - boxHeight * 0.35;

        if (DEBUG && frameCount === 1) {
            console.log('[Draw] Quote rendering info:', {
                textBaseSize: textBaseSize,
                padding: padding,
                lineHeight: lineHeight,
                boxHeight: boxHeight,
                maxBoxHeight: maxBoxHeight,
                contentTopY: contentTopY,
                textLength: todayQuote.text.length,
                authorLength: todayQuote.author.length
            });
        }

        // フェードアルファを適用
        fill(255, quoteAlpha);
        textSize(textBaseSize);
        textLeading(lineHeight);
        text(todayQuote.text, padding, contentTopY, quoteBoxWidth, boxHeight * 0.7);

        // 著者
        textSize(authorSize);
        text("— " + todayQuote.author, width / 2, contentTopY + boxHeight * 0.75);

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
            text(`Quote: "${todayQuote.text.substring(0, 20)}..."`, textBaseSize * 0.5, textBaseSize);
            text(`Author: ${todayQuote.author}`, textBaseSize * 0.5, textBaseSize * 1.8);
            text(`Alpha: ${Math.round(quoteAlpha)}`, textBaseSize * 0.5, textBaseSize * 2.6);
            text(`Elapsed: ${Math.round((millis() - lastQuoteTime) / 100) / 10}s`, textBaseSize * 0.5, textBaseSize * 3.4);
            textAlign(CENTER);
        }
    } else {
        // デバッグ：名言が読み込まれていない場合
        if (DEBUG) {
            fill(255, 100, 100);
            textAlign(CENTER);
            textSize(textBaseSize);
            text("Quote not loaded", width / 2, height / 2);
        }
    }
}

function windowResized() {
    console.log('Window resized:', windowWidth, windowHeight);
    resizeCanvas(windowWidth, windowHeight);
}
