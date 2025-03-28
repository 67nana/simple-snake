// 贪吃蛇游戏主逻辑
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 🖼 添加背景图
const bgImage = new Image();
bgImage.src = 'assets/game_bg.png';

const box = 20;
const margin = box; // ✅ 安全边界，防止贴边

let gameSpeed = 200;
let gameInterval;
let gameOver = false; // 🧨 防止游戏结束后还继续绘制
let snake = [{ x: 15 * box, y: 15 * box }];
let direction;
let timeLeft = 60;
let countdownStarted = false;
let applesEaten = 0;
let appleAnimationProgress = 1;
let food = generateFood();
let floatingTexts = [];


// 初始化文本显示
const statusText = document.getElementById('status');
const timeText = document.getElementById('time');
const scoreText = document.getElementById('score-value');
statusText.textContent = '⏳ bro生命的倒计时开始噜…';
timeText.textContent = timeLeft;

function startGameLoop() {
  if (!countdownStarted) {
    countdownStarted = true;
    countdown = setInterval(() => {
      timeLeft--;
      timeText.textContent = timeLeft;

      if (timeLeft === 30) statusText.textContent = '⚠️ 时间过半！继续坚持！';
      else if (timeLeft === 10) statusText.textContent = '🔥 最后冲刺了！';

      if (timeLeft <= 0) {
        timeLeft = 0;
        clearInterval(countdown);
        clearInterval(gameInterval);
        statusText.textContent = '💀 时间到了！你的生命走到尽头。';
        setTimeout(() => {
          alert('时间到，游戏结束！');
          window.location.reload();
        }, 1000);
      }
    }, 1000);
  }
  gameInterval = setInterval(draw, gameSpeed);
}

document.addEventListener('keydown', event => {
  const key = event.keyCode;
  if ([37, 38, 39, 40].includes(key)) event.preventDefault();
  if (key === 37 && direction !== "RIGHT") direction = "LEFT";
  else if (key === 38 && direction !== "DOWN") direction = "UP";
  else if (key === 39 && direction !== "LEFT") direction = "RIGHT";
  else if (key === 40 && direction !== "UP") direction = "DOWN";
});




function draw() {
  if (!countdownStarted || gameOver) return; // ⛔️ 游戏未开始或结束则不绘制

  // 🖼 绘制背景图（如果已加载）
  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  // 🧽 覆盖一层半透明黑色，增加可读性
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🐍 绘制蛇身体
  snake.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? 'green' : 'white';
    ctx.fillRect(segment.x, segment.y, box, box);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(segment.x, segment.y, box, box);
  });

  // 🍎 绘制食物（带缩放动画）
  if (food) {
    let scale = 1;
    if (appleAnimationProgress < 1) {
      const t = appleAnimationProgress;
      if (t < 0.3) scale = t / 0.3 * 1.3;
      else if (t < 0.6) scale = 1.3 - ((t - 0.3) / 0.3) * 0.5;
      else scale = 0.8 + ((t - 0.6) / 0.4) * 0.2;
      appleAnimationProgress += 1 / (400 / gameSpeed); // 根据速度推进动画
    }
    const appleSize = box * scale;
    const offset = (box - appleSize) / 2;
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x + offset, food.y + offset, appleSize, appleSize);
  }

  // 更新蛇头位置并判断碰撞
let snakeX = snake[0].x;
let snakeY = snake[0].y;
if (direction === "LEFT") snakeX -= box;
if (direction === "UP") snakeY -= box;
if (direction === "RIGHT") snakeX += box;
if (direction === "DOWN") snakeY += box;

// 吃食物逻辑
if (food && snakeX === food.x && snakeY === food.y) {
  timeLeft += 5;
  applesEaten++;
  scoreText.textContent = applesEaten;

  // 创建+5s浮动文字
  floatingTexts.push({
    content: '💗+5s',
    x: snakeX + box / 2,
    y: snakeY,
    age: 0,
    duration: 15 // 快速消失
  });

  food = null; // 食物消失
  setTimeout(() => {
    food = generateFood();
    animateApple();
  }, 1000); // 1s后重新生成食物
} else {
  snake.pop(); // 没吃到食物，缩短蛇的长度
}

// 🧱 撞墙或撞到自己判定
const newHead = { x: snakeX, y: snakeY };
const hitWall =
  snakeX < 0 || snakeX >= canvas.width ||
  snakeY < 0 || snakeY >= canvas.height;

if (hitWall || collision(newHead, snake)) {
  snake.unshift(newHead); // 最后一帧画出来
  clearInterval(gameInterval);
  gameOver = true;
  setTimeout(() => {
    alert("bro这辈子无了");
    window.location.reload();
  }, 100); // 给一点时间渲染死亡画面
  return;
}

snake.unshift(newHead); // 继续更新蛇头

// 渲染浮动文字并消失
floatingTexts.forEach((text, index) => {
  text.age++; // 增加年龄
  const opacity = Math.max(0, 1 - text.age / text.duration); // 确保透明度不会低于 0
  const yOffset = -text.age * 0.5; // 设置文字的上下浮动效果

  ctx.globalAlpha = opacity; // 控制透明度
  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 20px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(text.content, text.x, text.y + yOffset); // 渲染文字
  ctx.globalAlpha = 1; // 恢复默认的透明度

  // 当浮动文字的年龄大于持续时间时，将其从数组中移除
  if (text.age > text.duration) {
    floatingTexts.splice(index, 1);
  }
});

 
}


function collision(head, array) {
  return array.some(segment => head.x === segment.x && head.y === segment.y);
}

function animateApple() {
  appleAnimationProgress = 0;
}

function generateFood() {
  let newFood;
  let isValid = false;
  while (!isValid) {
    const cols = Math.floor((canvas.width - margin * 2) / box);
    const rows = Math.floor((canvas.height - margin * 2) / box);
    newFood = {
      x: Math.floor(Math.random() * cols) * box + margin,
      y: Math.floor(Math.random() * rows) * box + margin
    };
    isValid = !snake.some(segment => Math.abs(segment.x - newFood.x) <= box && Math.abs(segment.y - newFood.y) <= box);
  }
  return newFood;
}

function startGame() {
  const startScreen = document.getElementById('start-screen');
  const gameUI = document.getElementById('game-ui');
  startScreen.classList.add('hidden');
  gameUI.style.display = 'block';
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setTimeout(startGameLoop, 2000);
}
