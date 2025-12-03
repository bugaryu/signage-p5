// ===== フェードアニメーション用の変数 =====
let todayQuote = null;
let quoteAlpha = 0; // 名言の透明度
let fadingIn = true; // フェードイン中か
let lastQuoteTime = 0; // 最後に名言が表示された時刻
const quoteDisplayDuration = 10000; // 表示時間（ミリ秒）：10秒
const fadeDuration = quoteDisplayDuration; // フェードイン/アウト時間（ミリ秒）

const DEBUG = new URLSearchParams(window.parent.location.search).has('debug');
console.log('Debug mode:', DEBUG);

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
    const seed = int(random(0, now.getSeconds())); // テスト用に毎秒変わるシード

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
    textFont("sans-serif");
    textAlign(CENTER, CENTER);
    textWrap(CHAR); // テキスト折り返しを有効化

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
        const padding = 40;
        const quoteBoxY = height * 0.60;
        const boxWidth = width - padding * 2;
        const boxHeight = height * 0.15;

        if (DEBUG && frameCount === 1) {
            console.log('[Draw] Quote rendering info:', {
                quoteBoxY: quoteBoxY,
                boxWidth: boxWidth,
                boxHeight: boxHeight,
                textLength: todayQuote.text.length,
                authorLength: todayQuote.author.length
            });
        }

        // フェードアルファを適用
        fill(255, quoteAlpha);
        textSize(18);
        textLeading(30);
        text(todayQuote.text, padding, quoteBoxY - boxHeight * 0.1, boxWidth, boxHeight);

        // 著者
        textSize(12);
        text("— " + todayQuote.author, width / 2, quoteBoxY + boxHeight * 0.8);

        // デバッグ表示：背景のボックスを描画
        if (DEBUG) {
            stroke(100, 255, 100, quoteAlpha * 0.5);
            noFill();
            rect(padding, quoteBoxY, boxWidth, boxHeight);

            // テキスト情報を表示
            fill(100, 255, 100, quoteAlpha * 0.7);
            textAlign(LEFT);
            textSize(12);
            text(`Quote: "${todayQuote.text.substring(0, 20)}..."`, 20, 20);
            text(`Author: ${todayQuote.author}`, 20, 40);
            text(`Canvas: ${width}x${height}`, 20, 60);
            text(`Alpha: ${Math.round(quoteAlpha)}`, 20, 80);
            text(`Elapsed: ${Math.round((millis() - lastQuoteTime) / 100) / 10}s`, 20, 100);
            textAlign(CENTER);
        }
    } else {
        // デバッグ：名言が読み込まれていない場合
        if (DEBUG) {
            fill(255, 100, 100);
            textAlign(CENTER);
            textSize(20);
            text("Quote not loaded", width / 2, height / 2);
        }
    }
}
