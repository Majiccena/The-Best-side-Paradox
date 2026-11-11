let video;//摄像头画面
let photos = [];   // 按顺序存三张照片：左、正、右
let shotIndex = 0; // 现在拍到第几张，从 0 开始数
let sideLabels = ["LEFT", "FRONT", "RIGHT"]; // 提示文字，顺序和照片一致
let frameImg; // 相框图片

let state = "start"; // 定义状态变量，初始状态为 "start"记录故事板走到哪一步

let startBtn; //按钮全局申明，后面hide/show要用
let shutterBtn; // 快门按钮

let chosenSide = 0;                  // 选了哪一面：0=左 1=正 2=右
let leftBtn, frontBtn, rightBtn;     // 三个选面按钮
let restartBtn;   // Restart 按钮

// ===== 2. setup()：页面打开时只运行一次 =====
// 前面加 async，是因为下面要用 await 等图片加载完（p5 2.x 的写法）
async function setup() {
    // 创建 640×480 的画布，存进 cnv，再放进 HTML 里 id 为 app 的容器
    let cnv = createCanvas(640, 480);
    cnv.parent('app'); // 将画布附加到HTML中的id为'app'的元素上，画布放入容器
    frameImg = await loadImage("assets/frame.png");// 加载相框图片；await 表示等它加载完再继续往下执行

    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide(); // 隐藏P5js视频元素，只显示画布上的视频，改为自己画到画布上
    // ===== 3. 创建按钮 =====Dom
    startBtn = createButton('Start'); // 创建按钮
    startBtn.class('pill-btn'); // 添加按钮样式类挂上CSS的类名
    startBtn.parent('app'); // 将按钮附加到HTML中的id为'app'的元素上放进容器，这样位置就相对画布来计算
    startBtn.position(width / 2, height - 48);// 设置按钮位置
    startBtn.style("transform", "translateX(-50%)");// 将按钮水平居中

    startBtn.addClass('small');   // pill-btn 之外再叠加 small，两个类同时生效
    startBtn.mousePressed(goChoose); // 按钮点击事件，调用goChoose函数,点击时才执行
    // ===== 4. 创建快门按钮 =====
    shutterBtn = createButton("Take Photo"); // 创建快门按钮
    shutterBtn.class("pill-btn"); // 添加按钮样式类
    shutterBtn.parent("app"); // 将按钮附加到HTML中的id为'app'的元素上
    shutterBtn.position(width / 2, height - 80); // 设置按钮位置
    shutterBtn.style("transform", "translateX(-50%)"); // 将按钮水平居中
    shutterBtn.mousePressed(takePhoto); // 按钮点击事件，调用takePhoto函数
    shutterBtn.hide(); // 初始隐藏快门按钮
    restartBtn = createButton("Restart"); // 创建 Restart 按钮
    restartBtn.class("pill-btn");         // 挂样式类
    restartBtn.addClass("small");         // 再叠加 small
    restartBtn.parent("app");             // 放进容器
    restartBtn.position(width / 2, height + 10); // 画布底部再往下 10 像素，看起来就在照片条正下方
    restartBtn.style("transform", "translateX(-50%)");
    restartBtn.mousePressed(restart);     // 只写函数名
    restartBtn.hide();                    // 初始隐藏
    leftBtn = createButton("Left");
    frontBtn = createButton("Front");
    rightBtn = createButton("Right");

    let pickBtns = [leftBtn, frontBtn, rightBtn];
    for (let i = 0; i < 3; i++) {// 循环创建三个按钮，i是0，1，2
        pickBtns[i].class("pill-btn");// 添加按钮样式类
        pickBtns[i].addClass("small");// 叠加 small，两个类同时生效
        pickBtns[i].parent("app");// 将按钮附加到HTML中的id为'app'的元素上
        pickBtns[i].position(width / 2 + (i - 1) * 220, height / 2 + 100); // 左、中、右
        pickBtns[i].style("transform", "translateX(-50%)");
        pickBtns[i].hide();            // 先全部藏起
    }
    leftBtn.mousePressed(chooseLeft);
    frontBtn.mousePressed(chooseFront);
    rightBtn.mousePressed(chooseRight);
}
// ===== 5. goChoose()：点击 Start 按钮时调用进入选择画面 =====
function goChoose() {
    state = "choose";        // 先去选面
    startBtn.hide();
    leftBtn.show();          // 显示三个选择按钮
    frontBtn.show();
    rightBtn.show();
    // 注意：这里不显示快门
}
function chooseLeft() { pickSide(0); }
function chooseFront() { pickSide(1); }
function chooseRight() { pickSide(2); }

function pickSide(n) {
    chosenSide = n;
    photos = []; // 清空照片数组，避免上次拍的照片还在
    shotIndex = 0;// 重置拍摄索引，准备拍新照片
    leftBtn.hide();
    frontBtn.hide();
    rightBtn.hide();
    state = "shoot";
    shutterBtn.show();
}
function restart() {
    state = "start";
    restartBtn.hide();
    startBtn.show();
    photos = [];        // 清空照片
    shotIndex = 0;      // 计数归零

}
// ===== 6. takePhoto()：点击 Take Photo 按钮时调用拍照 =====
function takePhoto() {
    if (video.elt.readyState < 2) {
        return;
    }
    photos[shotIndex] = video.get(); // 存进当前这一格
    shotIndex += 1;                  // 下一张

    if (shotIndex === 3) {           // 三张拍完了
        shutterBtn.hide();
        state = "reveal";
        restartBtn.show();
    }
    // 没拍完就不用写 else：快门还在，等用户拍下一张
}

// ===== 7. draw()：每帧循环执行 =====
function draw() {
    clear(); // 清除画布，每一帧先清空成透明；没画东西的地方会露出网页的黑色背景

    if (state === "start") {
        // 显示视频
        drawStartScreen();
    } else if (state === "choose") {
        // 铺满画布的实时视频
        drawMirroredvideo(video, 0, 0, width, height);

        drawTopBar("Which is your best side?");
    }
    else if (state === "shoot") {
        // 显示拍摄画面
        drawMirroredvideo(video, 0, 0, width, height);
        drawTopBar("Shot " + (shotIndex + 1) + "/3 · " + sideLabels[shotIndex]);
    } else if (state === "reveal") {
        // 显示拍下来的照片，波浪扭曲
        drawReveal();//显示照片条
    }
}
function drawReveal() {
    // 1. 每张照片的大小
    let cellH = 130;
    let cellW = cellH * 4 / 3; // 保持 4:3 比例

    // 2. 照片的位置和间距
    let gap = 10;
    let topY = 35;
    let x = (width - cellW) / 2;

    // 3. 照片条的边距和总高度
    let padding = 20;
    let stripH = cellH * 3 + gap * 2;

    push();
    noStroke();

    // 4. 先画粉色的“纸”
    fill("#FFB3E1");
    rect(
        x - padding,
        topY - padding,
        cellW + padding * 2,
        stripH + padding * 2
    );

    // 5. 依次画左、正、右三张照片
    for (let i = 0; i < 3; i++) {
        let y = topY + i * (cellH + gap);

        if (i === chosenSide) {
            // 用户选中的那张：画波浪效果
            drawWave(photos[i], x, y, cellW, cellH);
        } else {
            // 其他两张：正常显示
            drawMirroredvideo(photos[i], x, y, cellW, cellH);
        }
    }

    // 6. 最后盖住照片左右溢出的部分
    fill("#FFB3E1");

    // 左侧遮挡条
    rect(x - padding, topY, padding, stripH);

    // 右侧遮挡条
    rect(x + cellW, topY, padding, stripH);

    pop();
}
// ===== 8. drawStartScreen()：绘制开始界面 =====
function drawStartScreen() {
    // 中央摄像头窗口。
    if (video.elt.readyState >= 2) {
        drawMirroredvideo(video, 125, 125, 390, 240);
    }

    // 相框最后绘制，覆盖在摄像头上面。
    image(frameImg, 0, 0, width, height);
    // 提示文字，包起来不影响其他地方的绘制
    push();
    noStroke();
    fill("rgb(123, 255, 255)"); // 设置文本颜色
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Click the button to start", width / 2, height - 68);//画在按钮上方
    pop();
}
function drawTopBar(msg) {
    push();
    noStroke();
    fill(0, 0, 0, 150);
    rect(0, 30, width, 50);
    fill("rgb(123, 255, 255)");
    textAlign(CENTER, CENTER);
    textSize(24);
    text(msg, width / 2, 55);
    pop();
}

// ===== 9. drawMirroredvideo()：绘制镜像视频 =====
function drawMirroredvideo(img, x, y, w, h) {
    push();

    translate(x + w, y);
    scale(-1, 1);

    // 按目标窗口的比例，计算要截取的原图高度。
    // 按目标矩形的宽高比，算出要从原图截取多高，避免把人拉扁
    // 例：窗口 390×240 → 640 × 240 ÷ 390 ≈ 394；铺满画布 640×480 → 480（相当于不裁切）
    let cropH = img.width * h / w;

    // 上下平均裁掉，让截取区域居中。
    let cropY = (img.height - cropH) / 2;
    image(img, 0, 0, w, h, 0, cropY, img.width, cropH);
    pop();
}

// ===== 10. drawWave()：绘制波浪扭曲照片 =====

function drawWave(img, x, y, w, h) {
    push();//保存
    translate(x + w, y);//平移到右上角
    scale(-1, 1);//水平翻转

    // 按目标窗口的比例，计算要截取的原图高度。
    let cropH = img.width * h / w;

    // 上下平均裁掉，让截取区域居中。
    let cropY = (img.height - cropH) / 2;

    let sliceH = 2; // 每条波纹的高度
    let ratio = cropH / h; // 原图高度与目标高度的比例
    let amp = w * 0.036;//幅度
    let freq = 28.8 / h;//频率

    let wideW = w + amp * 2; // 画得更宽，给左右偏留空间
    let cropW = img.width;     //截取整张照片的宽度
    let cropX = 0;      //从照片最左边开始截

    // 从第 0 行开始，每次往下移动一条，直到画布底部
    for (let row = 0; row < h; row += sliceH) {
        // sin() 在 -1 到 1 之间来回变化，乘以 amp 就变成 -23 到 23 像素的左右偏移
        let offset = sin(row * freq) * amp;
        image(img,
            offset - amp, row,                //  x 左移一个 amp，给右偏留空间
            wideW, sliceH,                    // 画得更宽
            cropX, cropY + row * ratio,       //  上下居中截取，左右从 0 开始
            cropW, sliceH * ratio);// 截多宽多高：整张照片的宽度；按比例换算出条高
        // 偏移在 -amp 到 amp 之间
        // 所以无论怎么偏移，都能盖住 0 到 640 的整个画布
    }

    pop();
}