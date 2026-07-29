(() => {
  const grid = document.querySelector('#sudoku-grid');
  const checkButton = document.querySelector('#sudoku-check');
  const resetButton = document.querySelector('#sudoku-reset');
  const status = document.querySelector('#sudoku-status');
  if (!grid || !checkButton || !resetButton || !status) return;

  let puzzle = [];
  let solution = [];

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function createPuzzle() {
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const base = (row, column) => (row * 3 + Math.floor(row / 3) + column) % 9;
    const solved = Array.from({ length: 9 }, (_, row) => (
      Array.from({ length: 9 }, (_, column) => digits[base(row, column)])
    ));
    const rowOrder = shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((row) => band * 3 + row));
    const columnOrder = shuffle([0, 1, 2]).flatMap((stack) => shuffle([0, 1, 2]).map((column) => stack * 3 + column));
    solution = rowOrder.flatMap((row) => columnOrder.map((column) => solved[row][column]));
    puzzle = Array(81).fill(0);
    shuffle([...Array(81).keys()]).slice(0, 36).forEach((index) => {
      puzzle[index] = solution[index];
    });
  }

  function createGrid() {
    grid.replaceChildren();
    puzzle.forEach((value, index) => {
      const cell = document.createElement('input');
      const row = Math.floor(index / 9) + 1;
      const column = (index % 9) + 1;
      cell.className = 'sudoku-cell';
      cell.type = 'text';
      cell.inputMode = 'numeric';
      cell.maxLength = 1;
      cell.dataset.index = String(index);
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${row}행 ${column}열`);
      if (value) {
        cell.value = String(value);
        cell.disabled = true;
      }
      cell.addEventListener('input', () => {
        cell.value = cell.value.replace(/[^1-9]/g, '').slice(0, 1);
        cell.classList.remove('is-invalid');
        status.textContent = '빈칸을 1부터 9까지 입력해 보세요.';
      });
      grid.append(cell);
    });
  }

  function values() {
    return [...grid.querySelectorAll('.sudoku-cell')].map((cell) => Number(cell.value) || 0);
  }

  function checkPuzzle() {
    const current = values();
    let complete = true;
    let correct = true;
    grid.querySelectorAll('.sudoku-cell').forEach((cell, index) => {
      const value = current[index];
      const invalid = value !== 0 && value !== solution[index];
      cell.classList.toggle('is-invalid', invalid);
      if (value === 0) complete = false;
      if (invalid) correct = false;
    });
    if (!correct) status.textContent = '빨간 칸을 다시 확인해 보세요.';
    else if (!complete) status.textContent = '좋아요. 남은 빈칸을 채워 보세요.';
    else status.textContent = '축하합니다! 수도쿠를 완성했습니다.';
  }

  function resetPuzzle() {
    createPuzzle();
    createGrid();
    status.textContent = '새 퍼즐을 만들었습니다. 다시 도전해 보세요.';
  }

  checkButton.addEventListener('click', checkPuzzle);
  resetButton.addEventListener('click', resetPuzzle);
  createPuzzle();
  createGrid();
})();
