// Copyright (C) 2025 Attila Gallai <attila@tux-net.hu>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const playerBoard   = document.getElementById('player-board');
const computerBoard = document.getElementById('computer-board');
const startButton   = document.getElementById('start-button');
const resetButton   = document.getElementById('reset-button');
const statusDiv     = document.getElementById('game-status');

/**
 * playerCells and computerCells are arrays that store references to the DOM elements
 * representing the individual cells of the player's and computer's game boards, respectively.
 *
 * These arrays are populated when the game boards are created using the createBoard function.
 * Each cell in the array corresponds to a specific position on the board and can be used
 * to update the visual state of the board (e.g., marking hits, misses, or ships).
 */
const playerCells       = [];
const computerCells     = [];
/**
 * randomPositions is an array used to store a shuffled sequence of indices
 * representing all possible positions on the game board (from 0 to BOARD_SIZE - 1).
 *
 * This array is used to randomize the placement of ships on the board, ensuring
 * that the positions are selected in a non-sequential and unpredictable order.
 * The shuffleRandomPositions function is responsible for populating and shuffling
 * this array before it is used for ship placement.
 */
const randomPositions   = [];
/**
 * computerShipsCount and playerShipsCount are variables that track the number of ships
 * remaining for the computer and the player, respectively.
 *
 * These counts are initialized when the game boards are created using the createBoard function.
 * Each time a ship is hit and destroyed, the corresponding count is decremented.
 * The game ends when either computerShipsCount or playerShipsCount reaches zero.
 */
let computerShipsCount  = 0;
let playerShipsCount    = 0;
// The playerTurn variable indicates whose turn it is to play.
// If true, it's the player's turn; if false, it's the computer's turn.
let playerTurn    = true;
// The gameStarted variable indicates whether the game is currently in progress.
let gameStarted   = false;
/**
 * computerShots is a Set used to keep track of the indices of cells
 * that the computer has already shot at on the player's board.
 *
 * This ensures that the computer does not shoot at the same cell more than once
 * during its turn. Each time the computer takes a shot, the index of the targeted
 * cell is added to this Set.
 */
let computerShots = new Set();

/**
 * The game board dimensions are defined by the constants BOARD_WIDTH and BOARD_HEIGHT.
 * 
 * BOARD_WIDTH: 10
 * BOARD_HEIGHT: 10
 */
const BOARD_WIDTH  = 10;
const BOARD_HEIGHT = 10;
// The total number of cells on the game board is calculated as BOARD_SIZE.
const BOARD_SIZE  = BOARD_WIDTH * BOARD_HEIGHT;
/**
 * The ROT constants represent the four possible rotation states of a ship.
 * 
 * ROT_0:     0 degrees (original position)
 * ROT_90:   90 degrees (clockwise)
 * ROT_180: 180 degrees (upside down)
 * ROT_270: 270 degrees (counter-clockwise)
 */
const ROT_0   = 0;
const ROT_90  = 1;
const ROT_180 = 2;
const ROT_270 = 3;
/**
 * The nextRandIndex variable is used to keep track of the next index in the randomPositions array
 * that should be checked for placing a ship. It starts at 0 and increments as positions are used.
 * This ensures that the randomPositions array is traversed sequentially after being shuffled.
 */
let nextRandIndex = 0;


/**
 * Creates a visual game board in the DOM and populates the given cellsArray.
 *
 * This function clears the provided boardElement and fills it with BOARD_SIZE cell divs.
 * For each cell, it checks the corresponding state in boardElement.cellsArray:
 *   - If the cell contains a ship (CELL_STATE.SHIP), it adds the 'ship' class for playerCells,
 *     and increments the shipsCount.
 *   - Sets the cell's data-index attribute and appends it to the boardElement.
 *   - Adds the cell to the cellsArray.
 *
 * @param {HTMLElement} boardElement - The DOM element representing the board container.
 * @param {Array} cellsArray - The array to populate with created cell elements.
 * @returns {number} shipsCount - The number of ship cells on the board.
 */
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


/**
 * Randomizes the order of cell indices in the randomPositions array.
 *
 * This function fills the randomPositions array with sequential numbers from 0 to BOARD_SIZE - 1,
 * then shuffles the array by swapping random pairs of elements 1000 times.
 * The result is a randomized sequence of board cell indices, used for random ship placement.
 */
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


/**
 * Enum-like object representing the different ship types in the game.
 *
 * Each property corresponds to a unique ship type, mapped to a numeric value:
 *   - SHIP_1: Single-cell ship (value 0)
 *   - SHIP_2: Two-cell ship (value 1)
 *   - SHIP_3: Large ship (value 2)
 *   - SHIP_4: Four-cell ship (value 3)
 *
 * This object is used to identify and reference ship types throughout the codebase.
 */
const SHIP_TYPE = {
  SHIP_1: 0,
  SHIP_2: 1,
  SHIP_3: 2,
  SHIP_4: 3
};


/**
 * Enum-like object mapping rotation degrees to their corresponding index values.
 *
 * Used to convert rotation angles (0, 90, 180, 270 degrees) to indices for accessing
 * ship rotation variants in ship definitions.
 *
 * Example:
 *   ROTATION_VALUE[90] === 1
 */
const ROTATION_VALUE = {
    0: 0,
   90: 1,
  180: 2,
  270: 3
};


/**
 * Enum-like object representing the possible states of a board cell.
 *
 * Properties:
 *   - EMPTY: The cell is empty (value 0)
 *   - SHIP:  The cell contains part of a ship (value 1)
 *   - HIT:   The cell has been hit and contained a ship (value 2)
 *   - MISS:  The cell has been shot at and was empty (value 3)
 */const CELL_STATE = {
  EMPTY:  0,
  SHIP:   1,
  HIT:    2,
  MISS:   3
};


/**
 * Object representing the single-cell ship type (SHIP_1).
 *
 * Properties:
 *   - stype:   The ship type identifier (from SHIP_TYPE.SHIP_1).
 *   - size:    The number of cells this ship occupies (1).
 *   - count:   The number of ships of this type to place on the board (3).
 *   - posx:    The x-coordinate of the ship's position (default -1, used for placement).
 *   - posy:    The y-coordinate of the ship's position (default -1, used for placement).
 *   - ship_rots: An array of rotation variants for the ship. Each variant is an object with:
 *       - width:  Width of the ship in this rotation.
 *       - height: Height of the ship in this rotation.
 *       - shape:  Array representing the ship's shape mask (1 = occupied, 0 = empty).
 *     For SHIP_1, all rotations are identical (single cell).
 */
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


  /**
 * Object representing the two-cell ship type (SHIP_2).
 *
 * Properties:
 *   - stype:     The ship type identifier (from SHIP_TYPE.SHIP_2).
 *   - size:      The number of cells this ship occupies (2).
 *   - count:     The number of ships of this type to place on the board (2).
 *   - posx:      The x-coordinate of the ship's position (default -1, used for placement).
 *   - posy:      The y-coordinate of the ship's position (default -1, used for placement).
 *   - ship_rots: An array of rotation variants for the ship. Each variant is an object with:
 *       - width:  Width of the ship in this rotation.
 *       - height: Height of the ship in this rotation.
 *       - shape:  Array representing the ship's shape mask (1 = occupied, 0 = empty).
 *     For SHIP_2, the ship can be horizontal or vertical.
 */
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


/**
 * Object representing the large ship type (SHIP_3), with a complex 4x3 or 3x4 shape.
 *
 * Properties:
 *   - stype:     The ship type identifier (from SHIP_TYPE.SHIP_3).
 *   - size:      The number of cells this ship occupies (12).
 *   - count:     The number of ships of this type to place on the board (2).
 *   - posx:      The x-coordinate of the ship's position (default -1, used for placement).
 *   - posy:      The y-coordinate of the ship's position (default -1, used for placement).
 *   - ship_rots: An array of rotation variants for the ship. Each variant is an object with:
 *       - width:  Width of the ship in this rotation.
 *       - height: Height of the ship in this rotation.
 *       - shape:  Array representing the ship's shape mask (1 = occupied, 0 = empty).
 *     For SHIP_3, the shape is more complex and varies by rotation.
 */const SHIP_3 = {
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


/**
 * Object representing the four-cell ship type (SHIP_4).
 *
 * Properties:
 *   - stype:   The ship type identifier (from SHIP_TYPE.SHIP_4).
 *   - size:    The number of cells this ship occupies (4).
 *   - count:   The number of ships of this type to place on the board (1).
 *   - posx:    The x-coordinate of the ship's position (default -1, used for placement).
 *   - posy:    The y-coordinate of the ship's position (default -1, used for placement).
 *   - ship_rots: An array of rotation variants for the ship. Each variant is an object with:
 *       - width:  Width of the ship in this rotation.
 *       - height: Height of the ship in this rotation.
 *       - shape:  Array representing the ship's shape mask (1 = occupied, 0 = empty).
 *     For SHIP_4, the ship can be horizontal or vertical (rotations 0/180 and 90/270).
 */
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


/**
 * Temporary ship build table object.
 *
 * This object holds the initial count of each ship type (from SHIP_1 to SHIP_4)
 * as defined in their respective ship objects. It is used as a template to
 * initialize the ship build table for generating random game boards, ensuring
 * that the correct number of each ship type is placed.
 *
 * Properties:
 *   - SHIP_4: { count: SHIP_4.count }  // Number of four-cell ships to place
 *   - SHIP_3: { count: SHIP_3.count }  // Number of large ships to place
 *   - SHIP_2: { count: SHIP_2.count }  // Number of two-cell ships to place
 *   - SHIP_1: { count: SHIP_1.count }  // Number of single-cell ships to place
 */
const shipBuildtableTemp = {
  SHIP_4: { count: SHIP_4.count},
  SHIP_3: { count: SHIP_3.count},
  SHIP_2: { count: SHIP_2.count},
  SHIP_1: { count: SHIP_1.count}
}


/**
 * Returns a ship object of the specified type, rotated to the given rotation index.
 *
 * This function selects the ship definition based on the provided shipType (stype value),
 * resets its count property to the default from shipBuildtableTemp, and sets its
 * 'rotated' property to the rotation variant at rotIndex from the ship's ship_rots array.
 *
 * @param {number} shipType - The ship type identifier (from SHIP_TYPE).
 * @param {number} rotIndex - The rotation index (0-3) corresponding to 0, 90, 180, or 270 degrees.
 * @returns {Object} The ship object with the 'rotated' property set to the selected rotation.
 */
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


/**
 * Returns an array of indices representing all valid neighboring cells
 * (including diagonals) surrounding the specified cell index on the board.
 *
 * This function calculates the row and column of the given index, then iterates
 * through all adjacent positions (8 directions), skipping the cell itself.
 * Only neighbors within the board boundaries are included.
 *
 * @param {number} index - The linear index of the cell (0 to BOARD_SIZE - 1).
 * @returns {number[]} An array of indices for all valid surrounding cells.
 */
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


/**
 * Checks if a ship can be placed at the specified position on the board.
 *
 * This function verifies that the ship (with its current rotation) fits within the board boundaries,
 * does not overlap with any existing ships, and does not touch any adjacent ships (including diagonals).
 * It iterates over the ship's shape mask, skipping empty cells, and checks each occupied cell for validity.
 *
 * @param {Array} cellsArray - The board's cell array, where each cell has a 'state' property.
 * @param {Object} ship - The ship object, with a 'rotated' property describing its shape, width, and height.
 * @param {number} objLeft - The leftmost column index (x-coordinate) for the ship's placement.
 * @param {number} objTop - The topmost row index (y-coordinate) for the ship's placement.
 * @returns {boolean} True if the ship can be placed at the given position, false otherwise.
 */
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
      // if (surroundingCells.length > 0) {
        for (const neighborIndex of surroundingCells) {
          if (cellsArray[neighborIndex].state === CELL_STATE.SHIP) {
            return false; // Adjacent cell is occupied
          }
        }
      // } else {
      //   return false; // No surrounding cells found, invalid placement
      // } 
    } 
  }

  return true; // Ship can be placed here
}
      

/**
 * Attempts to place a ship of the given type at a random valid position and rotation on the board.
 *
 * This function selects a random rotation for the ship, then iterates through the shuffled randomPositions array
 * to find a valid starting cell for placement. It checks if the ship can be placed at the calculated position
 * using checkShipPlacement. If placement is valid, it marks the corresponding cells as occupied by the ship.
 * The used random position is cleared to prevent reuse.
 *
 * @param {Array} cellsArray - The board's cell array, where each cell has a 'state' property.
 * @param {Object} shipType - The ship type object (e.g., SHIP_1, SHIP_2, etc.).
 * @returns {Object|null} The placed ship object if successful, or null if placement failed.
 */
function placeShipRandomly(cellsArray, shipType) {
  let dir = Math.random();
  let rotIndex = dir < 0.25 ? ROT_0 : ( dir < 0.5 ? ROT_90 : (dir < 0.75 ? ROT_180 : ROT_270));

  let ship = rotateShip(shipType.stype, rotIndex);

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


/**
 * Recursively attempts to place all ships on the board according to the build table.
 *
 * This function tries to place ships of the specified type (starting with the largest)
 * by repeatedly calling placeShipRandomly until all ships of that type are placed or
 * no valid positions remain. When all ships of the current type are placed, it proceeds
 * to the next smaller ship type. If all ships are placed successfully, it returns true.
 * If placement fails (no more random positions available), it returns false.
 *
 * @param {Array} cellsArray - The board's cell array, where each cell has a 'state' property.
 * @param {Object} shipBuildtable - An object tracking the remaining count of each ship type to place.
 * @param {number} shipType - The current ship type to place (e.g., SHIP_4, SHIP_3, etc.).
 * @returns {boolean} True if all ships are placed successfully, false otherwise.
 */
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


/**
 * Generates a new random game board with ships placed according to the rules.
 *
 * This function initializes an empty board, creates a fresh ship build table,
 * shuffles the random positions array, and fills the board with empty cells.
 * It then attempts to recursively place all ships on the board using recursiveBuild.
 * Returns the resulting cells array representing the board state.
 *
 * @returns {Array} cellsArray - The generated board as an array of cell objects.
 */
function generateRandomGameBoard() {
  let cellsArray = [];

  // The cells array is an BOARD_WIDTH x BOARD_HEIGHT array of cells.
  // Init shipBuildtable with the number of ships to be placed.
  // create a shipBuildtable object with the number of ships to be placed, not references for the shipBuildtableTemp object
  let shipBuildtable = {
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
  

/**
 * Handles the player's shot on the computer's board.
 *
 * This function is triggered when the player clicks a cell on the computer's board.
 * It checks if the game is active and if it's the player's turn. If the clicked cell
 * has already been hit or missed, it ignores the click. If the cell contains a ship,
 * it marks the cell as a hit, updates the board state, and decrements the computer's ship count.
 * If the cell is empty, it marks it as a miss and updates the board state.
 * After processing the shot, it ends the player's turn, checks for a win, and if the game is not over,
 * schedules the computer's turn after a short delay.
 *
 * @param {MouseEvent} e - The click event object from the player's action.
 */
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


/**
 * Handles the computer's turn to shoot at the player's board.
 *
 * This function randomly selects a cell index that has not been shot at before.
 * If the selected cell contains a ship, it marks it as hit, updates the board visually,
 * decrements the player's ship count, and updates the status message.
 * If the cell is empty, it marks it as a miss and updates the status message.
 * After the shot, it sets playerTurn to true and checks for a win condition.
 */
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


/**
 * Checks if either player has won the game and updates the game status.
 *
 * This function checks the remaining ship counts for both the player and the computer.
 * If the computer's ship count reaches zero, it displays a "You win!" message and ends the game.
 * If the player's ship count reaches zero, it displays a "You lose!" message and ends the game.
 * The function updates the statusDiv and sets gameStarted to false when the game ends.
 */
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


/**
 * Checks if the game is over by verifying if either player has lost all ships.
 *
 * @returns {boolean} True if either the computer or player has zero ships left, false otherwise.
 */
function gameOver() {
  return computerShipsCount === 0 || playerShipsCount === 0;
}


/**
 * Resets the game state and board to start a new game.
 *
 * This function generates new random boards for both the player and the computer,
 * resets ship counts, clears previous computer shots, resets turn and game state flags,
 * updates the status message, and removes any click event listeners from the computer's cells.
 */
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


// Event listener for the "Start Game" button.
/**
 * Starts a new game when the "Start Game" button is clicked.
 *
 * This event handler resets the game state, enables click-to-shoot on the computer's board,
 * updates the status message, and sets the game as started.
 */
startButton.addEventListener('click', () => {
  resetGame();

  // Enable click-to-shoot on computer board
  computerCells.forEach(cell => {
    cell.addEventListener('click', handlePlayerShot);
  });

  statusDiv.textContent = "Game started! Your turn!";
  gameStarted = true;
});


// Event listener for the window load event.
/**
 * Initializes the game board when the page loads.
 *
 * This event handler calls resetGame() to set up the initial game state and boards
 * as soon as the page is loaded.
 */
window.addEventListener('load', () => {
  resetGame();
});

