let n = 5;
let gridStatus = [];
let startSet = false, endSet = false;
let obstacleCount = 0;
let maxObstacle = 3;

// 初始化格子
function initGrid(size) {
    if (size < 3) size = 3;
    if (size > 7) size = 7;
    n = size;
    maxObstacle = n - 2;
    obstacleCount = 0;
    startSet = false;
    endSet = false;
    gridStatus = Array.from({ length: n }, () => Array(n).fill(0));

    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => handleClick(cell);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
    updateObstacleCounter();
}

// 更新障礙物剩餘數量顯示
function updateObstacleCounter() {
    document.getElementById('obstacle-counter').innerText = `Remaining Obstacles: ${obstacleCount} / ${maxObstacle}`;
}

// 處理點擊事件
function handleClick(cell) {
    const i = parseInt(cell.dataset.row);
    const j = parseInt(cell.dataset.col);

    if (gridStatus[i][j] === 0) {  // 空白格子
        if (!startSet) {
            gridStatus[i][j] = 1;  // 設為起點
            cell.className = 'start';
            startSet = true;
        } else if (!endSet) {
            gridStatus[i][j] = 2;  // 設為終點
            cell.className = 'end';
            endSet = true;
        } else if (obstacleCount < maxObstacle) {
            gridStatus[i][j] = 3;  // 設為障礙物
            cell.className = 'obstacle';
            obstacleCount++;
            updateObstacleCounter();
        } else {
            alert(`⚠️ Maximum number of obstacles reached: ${maxObstacle}`);
        }
    } else {
        // 允許取消起點、終點、障礙物
        if (gridStatus[i][j] === 1) startSet = false;
        if (gridStatus[i][j] === 2) endSet = false;
        if (gridStatus[i][j] === 3) {
            obstacleCount--;
            updateObstacleCounter();
        }
        gridStatus[i][j] = 0;
        cell.className = '';
    }
}

// 重置格子
function resetGrid() {
    startSet = false;
    endSet = false;
    obstacleCount = 0;
    initGrid(n);
}

// 產生策略與價值
function generatePolicyValue() {
    let hasStart = false, hasEnd = false;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (gridStatus[i][j] === 1) hasStart = true;
            if (gridStatus[i][j] === 2) hasEnd = true;
        }
    }
    if (!hasStart || !hasEnd) {
        alert("⚠️ Please set both a start point and an end point!");
        return;
    }

    fetch('/generate_policy_value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, grid_status: gridStatus })
    })
    .then(response => response.json())
    .then(data => {
        displayPolicyMatrix(data.policy);
        displayValueMatrix(data.value);
    });
}

// 顯示最佳策略矩陣，並標記最佳路徑
function displayPolicyMatrix(policy) {
    const table = document.getElementById('policy-matrix');
    table.innerHTML = '';

    let pathCells = findOptimalPath(policy); // 找出最佳路徑上的格子

    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            
            if (gridStatus[i][j] === 3) cell.className = 'obstacle';  // 障礙物
            if (gridStatus[i][j] === 2) cell.className = 'end';  // 終點
            if (gridStatus[i][j] === 0 || gridStatus[i][j] === 1) {
                cell.innerText = policy[i][j];
            }

            // 如果這個格子是最佳路徑的一部分，標記背景色
            if (pathCells.has(`${i}-${j}`)) {
                cell.classList.add('optimal-path');
            }

            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

// 找到最佳路徑上的格子
function findOptimalPath(policy) {
    let pathCells = new Set();
    let startPos = null;

    // 找到起點的位置
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (gridStatus[i][j] === 1) {
                startPos = [i, j];
                break;
            }
        }
    }

    if (!startPos) return pathCells; // 沒有起點就不標記

    let [x, y] = startPos;
    while (policy[x][y] && gridStatus[x][y] !== 2) {
        pathCells.add(`${x}-${y}`); // 記錄這個格子

        let action = policy[x][y];
        let move = { '↑': [-1, 0], '↓': [1, 0], '←': [0, -1], '→': [0, 1] }[action];
        if (!move) break;  // 如果沒有有效動作就停止

        let [dx, dy] = move;
        x += dx;
        y += dy;

        // 避免無限循環
        if (pathCells.has(`${x}-${y}`)) break;
    }

    return pathCells;
}

// 顯示價值矩陣
function displayPolicyMatrix(policy) {
    const table = document.getElementById('policy-matrix');
    table.innerHTML = '';

    let pathCells = findOptimalPath(policy); // 找出最佳路徑上的格子

    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');

            if (gridStatus[i][j] === 3) {
                cell.className = 'obstacle';  // 障礙物
            } else if (gridStatus[i][j] === 2) {
                cell.innerText = 'End'; // 終點顯示 "End"
                cell.className = 'end optimal-path'; // 讓終點也是最佳路徑的一部分
            } else if (gridStatus[i][j] === 0 || gridStatus[i][j] === 1) {
                cell.innerText = policy[i][j]; // 顯示最佳行動
            }

            // 讓終點和所有最佳路徑格子都變成黃色
            if (pathCells.has(`${i}-${j}`)) {
                cell.classList.add('optimal-path');
            }

            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}


// 顯示價值矩陣
function displayValueMatrix(valueMatrix) {
    const table = document.getElementById('value-matrix');
    table.innerHTML = '';

    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            const value = valueMatrix[i][j];

            if (gridStatus[i][j] === 3) {
                cell.className = 'obstacle';  // 障礙物
            } else if (gridStatus[i][j] === 2) {
                cell.className = 'end';       // 終點
                cell.innerText = 'End';
            } else if (value !== null) {
                cell.innerText = value.toFixed(2);  // 顯示數值保留 2 位小數
            }

            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}


// 載入時初始化網格
window.onload = () => initGrid(n);