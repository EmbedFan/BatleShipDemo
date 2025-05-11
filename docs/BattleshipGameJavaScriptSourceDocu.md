# Battleship Game JavaScript Source Documentation

## Overview

This file implements the core logic for a browser-based Battleship game. It manages the game state, board generation, ship placement, user interaction, and win/loss detection. The code is modular, well-commented, and uses modern JavaScript best practices.

---

## Table of Contents

- [Constants and DOM Elements](#constants-and-dom-elements)
- [Game State Variables](#game-state-variables)
- [Ship and Board Definitions](#ship-and-board-definitions)
- [Core Functions](#core-functions)
- [Event Listeners](#event-listeners)
- [Game Flow Summary](#game-flow-summary)
- [License](#license)
- [Author](#author)

---

## Constants and DOM Elements

- **playerBoard, computerBoard**: DOM elements for the player and computer boards.
- **startButton, resetButton**: DOM elements for game control buttons.
- **statusDiv**: DOM element for displaying game status messages.

## Game State Variables

- **playerCells, computerCells**: Arrays holding references to each cell's DOM element.
- **randomPositions**: Array of shuffled indices for random ship placement.
- **computerShipsCount, playerShipsCount**: Track remaining ships for each side.
- **playerTurn**: Boolean, true if it's the player's turn.
- **gameStarted**: Boolean, true if a game is in progress.
- **computerShots**: Set of indices already targeted by the computer.
- **BOARD_WIDTH, BOARD_HEIGHT, BOARD_SIZE**: Board dimensions.
- **ROT_0, ROT_90, ROT_180, ROT_270**: Rotation constants.
- **nextRandIndex**: Tracks the next index in `randomPositions` for ship placement.

## Ship and Board Definitions

- **SHIP_TYPE**: Enum for ship types (single-cell, two-cell, large, four-cell).
- **ROTATION_VALUE**: Maps rotation degrees to indices.
- **CELL_STATE**: Enum for cell states (empty, ship, hit, miss).
- **SHIP_1, SHIP_2, SHIP_3, SHIP_4**: Ship definitions with size, count, and rotation variants.
- **SHIP_TYPES**: Array of all ship types.
- **shipBuildtableTemp**: Template for the number of each ship type to place.

---

## Core Functions

### `createBoard(boardElement, cellsArray)`
Creates the visual game board in the DOM and populates the given `cellsArray` with cell elements. Marks ship cells for the player and returns the number of ships placed.

### `shuffleRandomPositions()`
Fills and shuffles the `randomPositions` array to randomize ship placement on the board.

### `rotateShip(shipType, rotIndex)`
Returns a ship object of the specified type, rotated to the given rotation index.

### `getSurroundingCells(index)`
Returns an array of indices for all valid neighboring cells (including diagonals) around a given cell index.

### `checkShipPlacement(cellsArray, ship, objLeft, objTop)`
Checks if a ship can be placed at the specified position and rotation, ensuring no overlap or adjacent ships.

### `placeShipRandomly(cellsArray, shipType)`
Attempts to place a ship of the given type at a random valid position and rotation. Returns the placed ship object or `null` if placement fails.

### `recursiveBuild(cellsArray, shipBuildtable, shipType)`
Recursively places all ships on the board according to the build table, starting with the largest ship type.

### `generateRandomGameBoard()`
Generates a new random game board with ships placed according to the rules. Returns the board as an array of cell objects.

### `handlePlayerShot(e)`
Handles the player's shot on the computer's board. Updates the board and state, checks for hits/misses, and schedules the computer's turn if needed.

### `computerTurn()`
Handles the computer's turn to shoot at the player's board. Randomly selects a cell, updates the board and state, and checks for win conditions.

### `checkWin()`
Checks if either player has won the game and updates the game status.

### `gameOver()`
Returns `true` if either the computer or player has zero ships left.

### `resetGame()`
Resets the game state and board to start a new game. Generates new boards, resets counts and flags, and removes event listeners.

---

## Event Listeners

- **Start Game Button**: Calls `resetGame()`, enables shooting on the computer board, and starts the game.
- **Window Load**: Calls `resetGame()` to initialize the game when the page loads.

---

## Game Flow Summary

1. **Initialization**: On page load, the game is reset and boards are generated.
2. **Start Game**: User clicks "Start Game" to begin.
3. **Turns**: Player and computer alternate turns, shooting at each other's boards.
4. **Win/Loss Detection**: After each shot, the game checks for a win or loss.
5. **Reset**: User can reset the game at any time.

---

## License

This program is licensed under the GNU General Public License v3.0 or later.

---

## Author

Attila Gallai <attila@tux-net.hu>