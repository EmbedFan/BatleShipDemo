/**
 */
const playerBoard   = document.getElementById('player-board');
const computerBoard = document.getElementById('computer-board');
const startButton   = document.getElementById('start-button');
const resetButton   = document.getElementById('reset-button');
const statusDiv     = document.getElementById('game-status');

const playerCells       = [];
const computerCells     = [];
const randomPositions   = [];
let computerShipsCount  = 0;
let playerShipsCount    = 0;
let playerTurn    = true;
let gameStarted   = false;
let computerShots = new Set();

const BOARD_WIDTH  = 10;
const BOARD_HEIGHT = 10;
const BOARD_SIZE  = BOARD_WIDTH * BOARD_HEIGHT;
const ROT_0   = 0;
const ROT_90  = 1;
const ROT_180 = 2;
const ROT_270 = 3;

let nextRandIndex = 0;


// Create BOARD_WIDTX x BOARD_HEIGHT board and return the cell list
function createBoard(boardElement, cellsArray) {
  let shipsCount = 0;
  boardElement.innerHTML = "";
  cellsArray.length = 0;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    if (boardElement.cellsArray[i].state === CELL_STATE.SHIP) {
      if (cellsArray === playerCells) {
        cell.classList.add('ship');
      }
      shipsCount++;
    }

    cell.dataset.index = i;
    boardElement.appendChild(cell);
    cellsArray.push(cell);
  }
  return shipsCount;
}


function shuffleRandomPositions() {
  // fill up the randomPositions array with numbers from 0 to BOARD_SIZE - 1
  nextRandIndex = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    randomPositions[i] = i;
  }

  // take two random index and swap them, 1000 times
  for (let i = 0; i < 1000; i++) {
    let index1 = Math.floor(Math.random() * BOARD_SIZE);
    let index2 = index1;
    while (index1 === index2) {
      index2 = Math.floor(Math.random() * BOARD_SIZE);
    }
    const temp = randomPositions[index1];
    randomPositions[index1] = randomPositions[index2];
    randomPositions[index2] = temp;
  }
}


// define enums for shioptypes
const SHIP_TYPE = {
  SHIP_1: 0,
  SHIP_2: 1,
  SHIP_3: 2,
  SHIP_4: 3
};


const ROTATION_VALUE = {
    0: 0,
   90: 1,
  180: 2,
  270: 3
};


// State of the cells
const CELL_STATE = {
  EMPTY:  0,
  SHIP:   1,
  HIT:    2,
  MISS:   3
};


// Define a ship type with 1x1 size
const SHIP_1 = {
   stype:  SHIP_TYPE.SHIP_1,
    size:  1,
   count:  3,
    posx: -1,
    posy: -1,
  ship_rots: [
    {width: 1, height: 1, shape: [ 1 ]}, // degree 0
    {width: 1, height: 1, shape: [ 1 ]}, // degree 90
    {width: 1, height: 1, shape: [ 1 ]}, // degree 180
    {width: 1, height: 1, shape: [ 1 ]}  // degree 270
    ]
  };


// Define a ship type with 2x1 size
const SHIP_2 = {
   stype:  SHIP_TYPE.SHIP_2,
    size:  2,
   count:  2,
    posx: -1,
    posy: -1,
  ship_rots: [
    {width: 2, height: 1, shape: [ 1, 1 ]}, // degree 0
    {width: 1, height: 2, shape: [ 1, 1 ]}, // degree 90
    {width: 2, height: 1, shape: [ 1, 1 ]}, // degree 180
    {width: 1, height: 2, shape: [ 1, 1 ]}  // degree 270
  ]
};


// Define a ship type with 4x3 size
const SHIP_3 = {
   stype:  SHIP_TYPE.SHIP_3,
    size:  12,
   count:  2,
    posx: -1,
    posy: -1,
  ship_rots: [
    {width: 4, height: 3, shape: [  0,1,0,1,1,1,1,1,0,1,0,0 ]},  // degree 0
    {width: 3, height: 4, shape: [  0,1,0,1,1,1,0,1,0,0,1,1 ]},  // degree 90
    {width: 4, height: 3, shape: [  0,0,1,0,1,1,1,1,1,0,1,0 ]},  // degree 180
    {width: 3, height: 4, shape: [  1,1,0,0,1,0,1,1,1,0,1,0 ]}   // degree 270
   ]
};


// Define a ship type with 4x1 size
const SHIP_4 = {
   stype:  SHIP_TYPE.SHIP_4,
    size:  4,
   count:  1,
    posx: -1,
    posy: -1,
  ship_rots: [
    {width: 4, height: 1, shape: [ 1, 1, 1, 1 ]}, // degree 0
    {width: 1, height: 4, shape: [ 1, 1, 1, 1 ]}, // degree 90
    {width: 4, height: 1, shape: [ 1, 1, 1, 1 ]}, // degree 180
    {width: 1, height: 4, shape: [ 1, 1, 1, 1 ]}  // degree 270
  ]
};


const SHIP_TYPES = [ SHIP_1, SHIP_2, SHIP_3, SHIP_4 ];


// This is an object that describe how many ships of each type are to be placed on the board 
// It is used to keep track of the number of ships left to place
const shipBuildtableTemp = {
  SHIP_4: { count: SHIP_4.count},
  SHIP_3: { count: SHIP_3.count},
  SHIP_2: { count: SHIP_2.count},
  SHIP_1: { count: SHIP_1.count}
}


function rotateShip(shipType, rotIndex) {
  let ship = null;

  switch (shipType) {
    case SHIP_1.stype:
      ship = SHIP_1;
      ship.count = shipBuildtableTemp.SHIP_1.count;
      break;
    case SHIP_2.stype:
      ship = SHIP_2;
      ship.count = shipBuildtableTemp.SHIP_2.count;
      break;
    case SHIP_3.stype:
      ship = SHIP_3;
      ship.count = shipBuildtableTemp.SHIP_3.count;
      break;
    case SHIP_4.stype:
    default:
      ship = SHIP_4;
      ship.count = shipBuildtableTemp.SHIP_4.count;
      break;
  }

  ship.rotated = ship.ship_rots[rotIndex];

  return ship;
}


function getSurroundingCells(index) {
  const row = Math.floor(index / BOARD_WIDTH);
  const col = index % BOARD_WIDTH;
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue; // Skip the cell itself

      if (row + dr >= 0 && row + dr < BOARD_HEIGHT && col + dc >= 0 && col + dc < BOARD_WIDTH) {
        const neighborIndex = (row + dr) * BOARD_WIDTH + (col + dc);
        if (neighborIndex >= 0 && neighborIndex < BOARD_SIZE) {
          neighbors.push(neighborIndex);
        }
      }
    }
  }

  return neighbors;
}


function checkShipPlacement(cellsArray, ship, objLeft, objTop) {
  // Check if the ship can be placed at the given position
  for (let i = 0; i < ship.rotated.height; i++) {
    for (let j = 0; j < ship.rotated.width; j++) {
      const cellIndex = (objTop + i) * BOARD_WIDTH + (objLeft + j);

      if (objLeft + j >= BOARD_WIDTH || objTop + i >= BOARD_HEIGHT) {
        return false; // Out of bounds
      }

      // Check if the cell int the mask is not 0
      // When the indexed mask is 0, it means that the cell is empty and can be skipped
      if (ship.rotated.shape[i * ship.rotated.width + j] === 0) 
        continue; // Skip empty cells in the ship shape

      if (cellIndex < 0 || cellIndex >= BOARD_SIZE) {
        return false; // Out of bounds
      }

      if (cellsArray[cellIndex].state !== CELL_STATE.EMPTY) {
        return false; // Cell is already occupied
      }

      // Check for touching (adjacent) cells
      const surroundingCells = getSurroundingCells(cellIndex);
      if (surroundingCells.length > 0) {
        for (const neighborIndex of surroundingCells) {
          if (cellsArray[neighborIndex].state === CELL_STATE.SHIP) {
            return false; // Adjacent cell is occupied
          }
        }
      } else {
        return false; // No surrounding cells found, invalid placement
      } 
    } 
  }

  return true; // Ship can be placed here
}
      

function placeShipRandomly(cellsArray, shipType) {
  dir = Math.random();
  let rotIndex = dir < 0.25 ? ROT_0 : ( dir < 0.5 ? ROT_90 : (dir < 0.75 ? ROT_180 : ROT_270));

  ship = rotateShip(shipType.stype, rotIndex);

  while (nextRandIndex < BOARD_SIZE) {
    if (randomPositions[nextRandIndex] != -1) 
      break; // Found a valid random position
    nextRandIndex = (nextRandIndex + 1) % BOARD_SIZE; // Move to the next index
  }

  const randomIndex = randomPositions[nextRandIndex];
  let objLeft = randomIndex % BOARD_WIDTH;
  let objTop  = Math.floor(randomIndex / BOARD_WIDTH);

  if (!checkShipPlacement(cellsArray, ship, objLeft, objTop)) {
    nextRandIndex = (nextRandIndex + 1) % BOARD_SIZE; // Move to the next index
    return null; // Ship cannot be placed here, try again
  }

  // Clear the used random position
  randomPositions[nextRandIndex] = -1;

  // Place the ship on the board using the ship shape mask
  for (let i = 0; i < ship.rotated.height; i++) {
    for (let j = 0; j < ship.rotated.width; j++) {
      if (ship.rotated.shape[i * ship.rotated.width + j] != 0){
        const cellIndex = (objTop + i) * BOARD_WIDTH + (objLeft + j);
        cellsArray[cellIndex].state = CELL_STATE.SHIP;
      }
    }
  }

  return ship;
}


function recursiveBuild(cellsArray, shipBuildtable, shipType){
  let result = false;
  let nextShipType = shipType;

  switch (shipType) {
    case SHIP_4:
      while (shipBuildtable.SHIP_4.count){
        shipBuildtable.SHIP_4.count--;
        while (!placeShipRandomly(cellsArray, nextShipType))        
          if (nextRandIndex >= BOARD_SIZE)
            return false; // No more random positions available

        if (shipBuildtable.SHIP_4.count === 0) {
          nextShipType = SHIP_3;
          recursiveBuild(cellsArray, shipBuildtable, nextShipType);
          return;
        }
      }
    break;

    case SHIP_3:
      while (shipBuildtable.SHIP_3.count){
        shipBuildtable.SHIP_3.count--;
        while (!placeShipRandomly(cellsArray, nextShipType))
          if (nextRandIndex >= BOARD_SIZE)
            return false; // No more random positions available

        if (shipBuildtable.SHIP_3.count === 0) {
          nextShipType = SHIP_2;
          recursiveBuild(cellsArray, shipBuildtable, nextShipType);
          return;
        }
      }
    break;

    case SHIP_2:
      while (shipBuildtable.SHIP_2.count){
        shipBuildtable.SHIP_2.count--;
        while (!placeShipRandomly(cellsArray, nextShipType))
          if (nextRandIndex >= BOARD_SIZE)
            return false; // No more random positions available

        if (shipBuildtable.SHIP_2.count === 0) {
          nextShipType = SHIP_1;
          recursiveBuild(cellsArray, shipBuildtable, nextShipType);
          return;
        }
      }
    break;

    // case SHIP_1:
    default:
      while (shipBuildtable.SHIP_1.count){
        shipBuildtable.SHIP_1.count--;
        while (!placeShipRandomly(cellsArray, nextShipType))
          if (nextRandIndex >= BOARD_SIZE)
            return false; // No more random positions available

        if (shipBuildtable.SHIP_1.count === 0) {
          nextShipType = null;
          return;
        }
      }
    break;
  }


  // Check if the ship type is null, meaning all ships have been placed
  if (nextShipType === null) {
    result = true;
  }

  return result;
}


function generateRandomGameBoard() {
  cellsArray = [];

  // The cells array is an BOARD_WIDTH x BOARD_HEIGHT array of cells.
  // Init shipBuildtable with the number of ships to be placed.
  // create a shipBuildtable object with the number of ships to be placed, not references for the shipBuildtableTemp object
  shipBuildtable = {
    SHIP_4: { count: shipBuildtableTemp.SHIP_4.count },
    SHIP_3: { count: shipBuildtableTemp.SHIP_3.count },
    SHIP_2: { count: shipBuildtableTemp.SHIP_2.count },
    SHIP_1: { count: shipBuildtableTemp.SHIP_1.count }
  };

  shuffleRandomPositions();
  
  // Fill the cells array with empty cells
  for (let i = 0; i < BOARD_SIZE; i++) {
    cellsArray.push(Object.assign({}, {state: CELL_STATE.EMPTY}));
  }

  recursiveBuild(cellsArray, shipBuildtable, SHIP_4);
  return cellsArray;
}
  

function handlePlayerShot(e) {
  if (!gameStarted || !playerTurn) return;

//   const index = +e.target.dataset.index;
  if (e.target.classList.contains('hit') || e.target.classList.contains('miss')) return;

  if (computerBoard.cellsArray[e.target.dataset.index].state === CELL_STATE.SHIP) {
    e.target.classList.add('hit');
    statusDiv.textContent = "Hit!";
    computerBoard.cellsArray[e.target.dataset.index].state = CELL_STATE.HIT;
    computerShipsCount--;
  } else {
    e.target.classList.add('miss');
    statusDiv.textContent = "Miss!";
    computerBoard.cellsArray[e.target.dataset.index].state = CELL_STATE.MISS;
  }

  playerTurn = false;
  checkWin();
  if (!gameOver()) setTimeout(computerTurn, 700);
}


// Random shot strategy
function computerTurn() {
  let index;
  do {
    index = Math.floor(Math.random() * 100);
  } while (computerShots.has(index));
  computerShots.add(index);

  if (playerBoard.cellsArray[index].state === CELL_STATE.SHIP) {
    playerBoard.cellsArray[index].state = CELL_STATE.HIT;
    playerCells[index].classList.add('hitonme');
    statusDiv.textContent = "Computer hit your ship! - Your turn!";
    playerShipsCount--;
  } else {
    playerBoard.cellsArray[index].state = CELL_STATE.MISS;
    playerCells[index].classList.add('miss');
    statusDiv.textContent = "Computer missed! - Your turn!";
  }
  playerTurn = true;

  checkWin();
}


function checkWin() {
  // if (computerShips.size === 0) {
  if (computerShipsCount === 0) {
    statusDiv.textContent = "🎉 You win!";
    gameStarted = false;
  // } else if (playerShips.size === 0) {
  } else if (playerShipsCount === 0) {
    statusDiv.textContent = "💥 You lose!";
    gameStarted = false;
  }
}


function gameOver() {
  return computerShipsCount === 0 || playerShipsCount === 0;
}


function resetGame() {
  playerBoard.cellsArray   = generateRandomGameBoard();
  computerBoard.cellsArray = generateRandomGameBoard();
  playerShipsCount   = createBoard(playerBoard, playerCells);
  computerShipsCount = createBoard(computerBoard, computerCells);
  
  computerShots.clear();
  playerTurn  = true;
  gameStarted = false;
  statusDiv.textContent = "Click 'Start Game' to begin";

  computerCells.forEach(cell => {
    cell.removeEventListener('click', handlePlayerShot);
  });
}


startButton.addEventListener('click', () => {
  resetGame();

  // Enable click-to-shoot on computer board
  computerCells.forEach(cell => {
    cell.addEventListener('click', handlePlayerShot);
  });

  statusDiv.textContent = "Game started! Your turn!";
  gameStarted = true;
});


// add a function that run when page loaded and call resetGame()
window.addEventListener('load', () => {
  resetGame();
});

