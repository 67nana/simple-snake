// snake.js（UI 层 - 食物类型颜色区分 + 房贷日志）
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const box = 20;
const margin = box;
let gameSpeed = 200;
let gameInterval;
let countdown;
let refreshInterval;
let gameOver = false;
let snake = [{ x: 15 * box, y: 15 * box }];
let direction;
let countdownStarted = false;
let foodList = [];
let floatingTexts = [];
let appleAnimationProgress = 1;
let recentLogs = [];

const statusText = document.getElementById('status');
const timeText = document.getElementById('time');
const scoreText = document.getElementById('score-value');
const logContainer = document.getElementById('game-log');

const bgImage = new Image();
bgImage.src = 'assets/game_bg.png';

const FoodIcons = {
  "奖金": "💰", "工作": "🖥️", "服从": "🙇‍♂️", "买房": "🏠", "结婚": "💍",
  "宠物": "🐶", "睡觉": "🛏️", "被爱": "😍", "游戏": "🎮", "旅游": "✈️",
  "病毒": "🦠"
};

function getFoodIcon(food) {
  return FoodIcons[food.name] || "❓";
}

function addGameLog(text, color = 'white') {
  recentLogs.unshift(`<div style="color:${color}">${text}</div>`);
  if (recentLogs.length > 10) recentLogs.pop();
  if (logContainer) {
    logContainer.innerHTML = recentLogs.join("");
  }
}

statusText.textContent = '⏳ bro生命的倒计时开始噜…';
timeText.textContent = GameLogic.getTimeLeft();
scoreText.textContent = GameLogic.getScore();

GameLogic.setEndGameCallback((reason) => {
  clearInterval(countdown);
  clearInterval(gameInterval);
  clearInterval(refreshInterval);
  gameOver = true;
  statusText.textContent = `💀 ${reason}`;
  setTimeout(() => {
    alert(reason);
    window.location.reload();
  }, 1000);
});

function updateUI() {
  const time = GameLogic.getTimeLeft();
  const score = GameLogic.getScore();
  timeText.textContent = time;
  if (score < 0 && GameLogic.isInDebtLock()) {
    timeText.textContent += " ⛔债务锁死，时间无法获取";
  }
  scoreText.textContent = score + "💲";

  if (GameLogic.getLastLoanTick && GameLogic.getLastLoanTick()) {
    addGameLog("🏦 房贷扣除 -400💲", "white");
    GameLogic.resetLastLoanTick();
  }
}

function generateFoodGroup() {
  const count = Math.floor(Math.random() * 3) + 3;
  const foods = [];
  let attempts = 0;
  const cols = Math.floor((canvas.width - margin * 2) / box);
  const rows = Math.floor((canvas.height - margin * 2) / box);

  while (foods.length < count && attempts < 50) {
    const food = GameLogic.generateRandomFood();
    if (food.name === "买房" && Math.random() < 0.7) continue;

    food.x = Math.floor(Math.random() * cols) * box + margin;
    food.y = Math.floor(Math.random() * rows) * box + margin;

    const conflict = snake.some(seg => seg.x === food.x && seg.y === food.y) ||
                     foods.some(f => f.x === food.x && f.y === food.y);

    if (!conflict) foods.push(food);
    attempts++;
  }
  return foods;
}

function startGameLoop() {
  if (!countdownStarted) {
    countdownStarted = true;
    countdown = setInterval(() => {
      GameLogic.tickTime();
      updateUI();
      const left = GameLogic.getTimeLeft();
      if (left === 30) statusText.textContent = '⚠️ 时间过半！继续坚持！';
      else if (left === 10) statusText.textContent = '🔥 最后冲刺了！';
    }, 1000);

    refreshInterval = setInterval(() => {
      foodList = generateFoodGroup();
      animateApple();
    }, 6000);

    foodList = generateFoodGroup();
  }
  gameInterval = setInterval(draw, gameSpeed);
}

function draw() {
  if (!countdownStarted || gameOver) return;
  if (bgImage.complete) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  snake.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? 'green' : 'white';
    ctx.fillRect(segment.x, segment.y, box, box);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(segment.x, segment.y, box, box);
  });

  foodList.forEach(food => {
    const icon = getFoodIcon(food);
    ctx.font = `${box}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, food.x + box / 2, food.y + box / 2);
  });

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;
  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  const index = foodList.findIndex(f => f.x === snakeX && f.y === snakeY);
  if (index >= 0) {
    const food = foodList[index];
    const isLocked = food.category === "time" && GameLogic.isInDebtLock();
    GameLogic.handleEatFood(food);
    updateUI();

    let tip, logEntry, logColor;
    if (isLocked) {
      tip = "⚠️债务中";
      logEntry = `${getFoodIcon(food)}${food.name} ⚠️无法获取时间`;
      logColor = "white";
    } else {
      if (food.category === "score") {
        const delta = food.score;
        tip = delta > 0 ? `+${delta}` : `${delta}`;
        logEntry = `${getFoodIcon(food)}${food.name} ${delta > 0 ? '+' : ''}${delta}💲`;
        logColor = delta > 0 ? "lightgreen" : "white";
      } else if (food.category === "time") {
        tip = `+${food.time}s${food.score ? ` ${food.score}💲` : ""}`;
        logEntry = `${getFoodIcon(food)}${food.name} +${food.time}s ${food.score}💲`;
        logColor = "yellow";
      } else {
        tip = "🦠 Game Over";
        logEntry = `${getFoodIcon(food)}${food.name} ☠️`;
        logColor = "white";
      }
    }

    floatingTexts.push({
      content: tip,
      x: food.x + box / 2,
      y: food.y,
      age: 0,
      duration: 20
    });

    addGameLog(logEntry, logColor);
    foodList.splice(index, 1);
  } else {
    snake.pop();
  }

  const newHead = { x: snakeX, y: snakeY };
  const hitWall =
    snakeX < 0 || snakeX >= canvas.width ||
    snakeY < 0 || snakeY >= canvas.height;

  if (hitWall || collision(newHead, snake)) {
    snake.unshift(newHead);
    clearInterval(gameInterval);
    gameOver = true;
    setTimeout(() => {
      alert("bro这辈子无了");
      window.location.reload();
    }, 100);
    return;
  }

  snake.unshift(newHead);

  floatingTexts.forEach((text, index) => {
    text.age++;
    const opacity = Math.max(0, 1 - text.age / text.duration);
    const yOffset = -text.age * 0.5;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(text.content, text.x, text.y + yOffset);
    ctx.globalAlpha = 1;
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

function startGame() {
  const startScreen = document.getElementById('start-screen');
  const gameUI = document.getElementById('game-ui');
  startScreen.classList.add('hidden');
  gameUI.style.display = 'block';
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setTimeout(startGameLoop, 2000);
}

document.addEventListener('keydown', function (event) {
  const key = event.key;
  const isArrow = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key);
  if (isArrow) {
    event.preventDefault();
    if (key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  }
}, { passive: false });

class Snake {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.body = [
            { x: 300, y: 300 },
            { x: 290, y: 300 },
            { x: 280, y: 300 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }
    
    move() {
        const head = { ...this.body[0] };
        
        switch (this.direction) {
            case 'up':
                head.y -= 10;
                break;
            case 'down':
                head.y += 10;
                break;
            case 'left':
                head.x -= 10;
                break;
            case 'right':
                head.x += 10;
                break;
        }
        
        this.direction = this.nextDirection;
        this.body.unshift(head);
        this.body.pop();
    }
    
    changeDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }
    
    checkCollision() {
        const head = this.body[0];
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= 600 || head.y < 0 || head.y >= 600) {
            return true;
        }
        
        // 检查自身碰撞
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFoodCollision(food) {
        const head = this.body[0];
        const distance = Math.sqrt(
            Math.pow(head.x - food.x, 2) + Math.pow(head.y - food.y, 2)
        );
        return distance < 20; // 碰撞检测半径
    }
    
    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }
}

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.snake = new Snake();
        this.foodList = [];
        this.lastRender = 0;
        this.gameSpeed = 100; // 毫秒
    }
    
    init() {
        // 设置键盘控制
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    this.snake.changeDirection('up');
                    break;
                case 'ArrowDown':
                    this.snake.changeDirection('down');
                    break;
                case 'ArrowLeft':
                    this.snake.changeDirection('left');
                    break;
                case 'ArrowRight':
                    this.snake.changeDirection('right');
                    break;
            }
        });
        
        // 开始游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    gameLoop(timestamp) {
        if (timestamp - this.lastRender >= this.gameSpeed) {
            this.update();
            this.render();
            this.lastRender = timestamp;
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update() {
        this.snake.move();
        
        // 检查食物碰撞
        for (let i = 0; i < this.foodList.length; i++) {
            if (this.snake.checkFoodCollision(this.foodList[i])) {
                applyFoodEffect(this.foodList[i]);
                this.foodList.splice(i, 1);
                this.snake.grow();
                break;
            }
        }
        
        // 检查游戏结束条件
        if (this.snake.checkCollision()) {
            gameOver('撞墙或撞到自己！');
        }
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制蛇
        this.ctx.fillStyle = '#4CAF50';
        this.snake.body.forEach(segment => {
            this.ctx.fillRect(segment.x, segment.y, 10, 10);
        });
        
        // 绘制食物
        this.foodList.forEach(food => {
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(food.emoji, food.x, food.y);
        });
    }
}

// 创建游戏实例
const game = new Game();

// 导出游戏控制函数
window.startGame = () => {
    game.init();
};