// logic.js（游戏核心逻辑模块）
const GameLogic = (() => {
    let time = 60;
    let score = 0;
    let houseLoanActive = false;
    let houseLoanTimer = 0;
    let debtLockTimer = 0;
    let lastLoanTick = false;
  
    const LOAN_INTERVAL = 30;
    const LOAN_AMOUNT = 400;
    const DEBT_LOCK_LIMIT = 15;
    let endGameCallback = null;
  
    const foodPool = {
      score: {
        weight: 50,
        items: [
          { name: "奖金", score: 10000, weight: 5 },
          { name: "工作", score: 200, weight: 65 },
          { name: "服从", score: 5000, weight: 55 },
          { name: "买房", score: -50000, weight: 35 },
          { name: "结婚", score: -20000, weight: 15 },
        ],
      },
      time: {
        weight: 48,
        items: [
          { name: "宠物", time: 10, score: -2000, weight: 35 },
          { name: "睡觉", time: 5, score: -1000, weight: 50 },
          { name: "被爱", time: 20, score: -5000, weight: 15 },
          { name: "游戏", time: 3, score: -3000, weight: 25 },
          { name: "旅游", time: 10, score: -8000, weight: 15 },
        ],
      },
      death: {
        weight: 1,
        items: [
          { name: "病毒", category: "death" },
        ],
      },
    };
  
    function setEndGameCallback(cb) {
      endGameCallback = cb;
    }
  
    function getTimeLeft() {
      return Math.max(0, Math.floor(time));
    }
  
    function getScore() {
      return score;
    }
  
    function generateRandomFood() {
      const totalWeight = Object.values(foodPool).reduce((sum, group) => sum + group.weight, 0);
      let r = Math.random() * totalWeight;
      let chosenGroup;
      for (const [category, group] of Object.entries(foodPool)) {
        if (r < group.weight) {
          chosenGroup = { category, ...group };
          break;
        }
        r -= group.weight;
      }
  
      const totalSubWeight = chosenGroup.items.reduce((sum, item) => sum + item.weight, 0);
      let sr = Math.random() * totalSubWeight;
      for (const item of chosenGroup.items) {
        if (sr < item.weight) {
          return { category: chosenGroup.category, ...item };
        }
        sr -= item.weight;
      }
    }
  
    function isInDebtLock() {
      if (score >= 0) return false;
      const estimatedScorePerSecond = 1000;
      return (time * estimatedScorePerSecond) < Math.abs(score);
    }
  
    function handleEatFood(food) {
      if (food.category === "death") {
        endGameCallback?.("遭遇不可抗力：" + food.name);
        return;
      }
  
      if (food.category === "score") {
        score += food.score;
        if (food.name === "买房" && !houseLoanActive) {
          houseLoanActive = true;
          houseLoanTimer = 0;
        }
      }
  
      if (food.category === "time") {
        if (isInDebtLock()) return;
        time += food.time;
        score += (food.score || 0);
      }
    }
  
    function tickTime() {
      if (time <= 0) {
        time = 0;
        endGameCallback?.("时间到了！你的生命走到尽头。");
        return;
      }
  
      time--;
      lastLoanTick = false;
  
      if (score >= 10000) {
        const exchangable = Math.floor(score / 10000);
        score -= exchangable * 10000;
        time += exchangable * 10;
      }
  
      if (houseLoanActive) {
        houseLoanTimer++;
        if (houseLoanTimer >= LOAN_INTERVAL) {
          houseLoanTimer = 0;
          score -= LOAN_AMOUNT;
          lastLoanTick = true;
        }
      }
  
      if (isInDebtLock()) {
        debtLockTimer++;
        if (debtLockTimer >= DEBT_LOCK_LIMIT) {
          endGameCallback?.("你已被债务锁死太久，人生彻底崩塌 💣");
        }
      } else {
        debtLockTimer = 0;
      }
    }
  
    function getLastLoanTick() {
      return lastLoanTick;
    }
  
    function resetLastLoanTick() {
      lastLoanTick = false;
    }
  
    return {
      setEndGameCallback,
      getTimeLeft,
      getScore,
      generateRandomFood,
      handleEatFood,
      tickTime,
      isInDebtLock,
      getLastLoanTick,
      resetLastLoanTick,
    };
  })();
  
  window.startGame = startGame;
