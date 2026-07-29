(() => {
  const grid = document.querySelector('#sudoku-grid');
  const checkButton = document.querySelector('#sudoku-check');
  const resetButton = document.querySelector('#sudoku-reset');
  const status = document.querySelector('#sudoku-status');
  if (!grid || !checkButton || !resetButton || !status) return;

  const puzzle = [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,
    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,
    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9
  ];
  const solution = [
    5, 3, 4, 6, 7, 8, 9, 1, 2,
    6, 7, 2, 1, 9, 5, 3, 4, 8,
    1, 9, 8, 3, 4, 2, 5, 6, 7,
    8, 5, 9, 7, 6, 1, 4, 2, 3,
    4, 2, 6, 8, 5, 3, 7, 9, 1,
    7, 1, 3, 9, 2, 4, 8, 5, 6,
    9, 6, 1, 5, 3, 7, 2, 8, 4,
    2, 8, 7, 4, 1, 9, 6, 3, 5,
    3, 4, 5, 2, 8, 6, 1, 7, 9
  ];

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
    grid.querySelectorAll('.sudoku-cell').forEach((cell, index) => {
      cell.value = puzzle[index] ? String(puzzle[index]) : '';
      cell.classList.remove('is-invalid');
    });
    status.textContent = '초기화했습니다. 다시 도전해 보세요.';
  }

  checkButton.addEventListener('click', checkPuzzle);
  resetButton.addEventListener('click', resetPuzzle);
  createGrid();
})();
