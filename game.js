(() => {
  const canvas = document.querySelector('#game-board');
  const startButton = document.querySelector('#start-game');
  const pauseButton = document.querySelector('#pause-game');
  const restartButton = document.querySelector('#restart-game');
  const scoreElement = document.querySelector('#score');
  const highScoreElement = document.querySelector('#high-score');
  const statusElement = document.querySelector('#game-status');

  if (!canvas || !startButton || !pauseButton || !restartButton) return;

  const context = canvas.getContext('2d');
  const cellSize = 24;
  const columns = canvas.width / cellSize;
  const rows = canvas.height / cellSize;
  const tickRate = 145;
  const enemyCount = 5;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  let snake;
  let direction;
  let nextDirection;
  let food;
  let enemies;
  let score = 0;
  let highScore = readHighScore();
  let state = 'idle';
  let tickTimer = null;
  let renderFrame = null;
  let touchStart = null;

  function readHighScore() {
    try {
      return Number.parseInt(localStorage.getItem('cmc-snake-high-score') || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore() {
    try {
      localStorage.setItem('cmc-snake-high-score', String(highScore));
    } catch {
      // The game still works when storage is unavailable.
    }
  }

  function sameCell(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function randomCell(blocked = []) {
    const blockedSet = new Set(blocked.map((cell) => `${cell.x}:${cell.y}`));
    const free = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        if (!blockedSet.has(`${x}:${y}`)) free.push({ x, y });
      }
    }
    return free[Math.floor(Math.random() * free.length)] || { x: 1, y: 1 };
  }

  function occupiedCells() {
    return [...snake, food, ...enemies.filter((enemy) => enemy.phase === 'active')];
  }

  function createEnemy() {
    const cell = randomCell([...snake, food]);
    const names = Object.keys(directions);
    const moveDirection = directions[names[Math.floor(Math.random() * names.length)]];
    return {
      x: cell.x,
      y: cell.y,
      dx: moveDirection.x,
      dy: moveDirection.y,
      bornAt: performance.now(),
      respawnAt: 0,
      phase: 'active'
    };
  }

  function resetGame() {
    clearInterval(tickTimer);
    tickTimer = null;
    snake = [{ x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }];
    direction = { ...directions.right };
    nextDirection = { ...direction };
    score = 0;
    food = randomCell(snake);
    enemies = Array.from({ length: enemyCount }, createEnemy);
    state = 'idle';
    updateStatus('시작 대기');
    updateScore();
  }

  function updateScore() {
    scoreElement.textContent = String(score);
    highScoreElement.textContent = String(highScore);
  }

  function updateStatus(message) {
    statusElement.textContent = message;
    pauseButton.textContent = state === 'paused' ? '계속하기' : '일시정지';
  }

  function startGame() {
    if (state === 'over') resetGame();
    if (state === 'running') return;
    state = 'running';
    updateStatus('플레이 중');
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, tickRate);
  }

  function togglePause() {
    if (state === 'idle' || state === 'over') return;
    if (state === 'paused') {
      startGame();
    } else {
      state = 'paused';
      clearInterval(tickTimer);
      tickTimer = null;
      updateStatus('일시정지');
    }
  }

  function restartGame() {
    resetGame();
    startGame();
  }

  function setDirection(next) {
    const candidate = directions[next];
    if (!candidate || candidate.x + nextDirection.x === 0 && candidate.y + nextDirection.y === 0) return;
    nextDirection = { ...candidate };
    if (state === 'idle') startGame();
  }

  function enemyAt(cell) {
    return enemies.some((enemy) => enemy.phase === 'active' && sameCell(enemy, cell));
  }

  function gameOver() {
    state = 'over';
    clearInterval(tickTimer);
    tickTimer = null;
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    updateScore();
    updateStatus('게임 오버');
  }

  function moveEnemies(now) {
    enemies.forEach((enemy) => {
      if (enemy.phase === 'exploding') {
        if (now >= enemy.respawnAt) Object.assign(enemy, createEnemy());
        return;
      }
      if (now - enemy.bornAt >= 5000) {
        enemy.phase = 'exploding';
        enemy.respawnAt = now + 2000;
        return;
      }
      if (Math.random() < 0.2) {
        const names = Object.keys(directions);
        const next = directions[names[Math.floor(Math.random() * names.length)]];
        if (next.x + enemy.dx !== 0 || next.y + enemy.dy !== 0) {
          enemy.dx = next.x;
          enemy.dy = next.y;
        }
      }
      const nextX = enemy.x + enemy.dx;
      const nextY = enemy.y + enemy.dy;
      if (nextX < 0 || nextX >= columns) enemy.dx *= -1;
      else enemy.x = nextX;
      if (nextY < 0 || nextY >= rows) enemy.dy *= -1;
      else enemy.y = nextY;
    });
  }

  function tick() {
    if (state !== 'running') return;
    const now = performance.now();
    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitsWall = head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows;
    const hitsSelf = snake.some((segment) => sameCell(segment, head));
    if (hitsWall || hitsSelf || enemyAt(head)) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (sameCell(head, food)) {
      score += 10;
      food = randomCell(occupiedCells());
      if (score > highScore) highScore = score;
      updateScore();
    } else {
      snake.pop();
    }
    moveEnemies(now);
    if (enemyAt(head)) gameOver();
  }

  function drawCell(cell, color, radius = 4) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(cell.x * cellSize + 3, cell.y * cellSize + 3, cellSize - 6, cellSize - 6, radius);
    context.fill();
  }

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f4f8ff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(23, 105, 224, 0.08)';
    for (let x = 0; x <= columns; x += 1) {
      context.beginPath(); context.moveTo(x * cellSize, 0); context.lineTo(x * cellSize, canvas.height); context.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      context.beginPath(); context.moveTo(0, y * cellSize); context.lineTo(canvas.width, y * cellSize); context.stroke();
    }
    drawCell(food, '#f2b84b', 8);
    snake.forEach((segment, index) => drawCell(segment, index === 0 ? '#1769e0' : '#4f91e8', 6));
    enemies.forEach((enemy) => {
      if (enemy.phase === 'active') drawCell(enemy, '#ef6c78', 8);
      if (enemy.phase === 'exploding') {
        const pulse = 8 + Math.round((enemy.respawnAt - performance.now()) / 150) % 8;
        context.strokeStyle = '#ef6c78';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(enemy.x * cellSize + cellSize / 2, enemy.y * cellSize + cellSize / 2, pulse, 0, Math.PI * 2);
        context.stroke();
      }
    });
    if (state === 'paused' || state === 'over') {
      context.fillStyle = 'rgba(16, 35, 63, 0.72)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fff';
      context.font = '700 22px Segoe UI, sans-serif';
      context.textAlign = 'center';
      context.fillText(state === 'paused' ? '일시정지' : '게임 오버', canvas.width / 2, canvas.height / 2);
    }
    renderFrame = requestAnimationFrame(render);
  }

  const keyDirections = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  document.addEventListener('keydown', (event) => {
    const mapped = keyDirections[event.key];
    if (!mapped) return;
    event.preventDefault();
    setDirection(mapped);
  });
  document.querySelectorAll('[data-direction]').forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
  canvas.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0]; }, { passive: true });
  canvas.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.clientX;
    const dy = touch.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });
  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', restartGame);

  resetGame();
  if (!renderFrame) render();
})();
