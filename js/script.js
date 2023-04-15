import { Grid } from './grid.js';
import { Tile } from './tile.js';

const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close");

// Close the modal when the X button is clicked
closeBtn.addEventListener("click", function () {
    window.location.reload();
});

// Apply a fade-in animation to the modal's appearance
modal.addEventListener("animationend", function () {
    modal.classList.remove("fade-in");
});

const gameBoard = document.getElementById('game-board');

const grid = new Grid(gameBoard);

grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));

setupInputOnce();

function setupInputOnce() {
    window.addEventListener('keydown', handleInput, { once: true });
}

async function handleInput(event) {
    console.log(0);
    switch (event.key) {
        case 'ArrowUp':
            if (!canMoveUp()) {
                setupInputOnce()
                return;
            }
            await moveUp();
            break;
        case 'ArrowDown':
            if (!canMoveDown()) {
                setupInputOnce();
                return;
            }
            await moveDown();
            break;
        case 'ArrowLeft':
            if (!canMoveLeft()) {
                setupInputOnce();
                return;
            }
            await moveLeft()
            break;
        case 'ArrowRight':
            if (!canMoveRight()) {
                setupInputOnce();
                return;
            }
            await moveRight()
            break;
        default:
            setupInputOnce();
            return;
    }

    const newTile = new Tile(gameBoard);
    grid.getRandomEmptyCell().linkTile(newTile);

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        console.log(1);
        await newTile.waitForAnimationEnd();
        modal.style.setProperty('display', 'block');
        modal.classList.add("fade-in");
    }

    setupInputOnce();
}

async function moveUp() {
    await slideTiles(grid.cellsGroupedByColumn)
}

async function moveDown() {
    await slideTiles(grid.cellsGroupedByReversedColumn)
}

async function moveLeft() {
    await slideTiles(grid.cellsGroupedByRow)
}

async function moveRight() {
    await slideTiles(grid.cellsGroupedByReversedRow)
}

async function slideTiles(groupedCell) {
    const promises = []

    groupedCell.forEach(group => {
        slideTilesInGroup(group, promises);
    });

    await Promise.all(promises);

    grid.cells.forEach(cell => {
        cell.hasTileForMerge() && cell.mergeTiles();
    })
}

function slideTilesInGroup(group, promises) {
    for (let i = 1; i < group.length; i++) {
        if (group[i].isEmpty()) {
            continue;
        }

        const cellWithTile = group[i];

        let targetCell;
        let j = i - 1;
        while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
            targetCell = group[j];
            j--;
        }

        if (!targetCell) {
            continue;
        }

        promises.push(cellWithTile.linkedTile.waitForTransitionEnd())

        if (targetCell.isEmpty()) {
            targetCell.linkTile(cellWithTile.linkedTile);
        } else {
            targetCell.linkTileForMerge(cellWithTile.linkedTile);
        }

        cellWithTile.unlinkTile();
    }
}

function canMoveUp() {
    return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown() {
    return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveLeft() {
    return canMove(grid.cellsGroupedByRow);
}

function canMoveRight() {
    return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCells) {
    return groupedCells.some(group => {
        return canMoveInGroup(group);
    });
}

function canMoveInGroup(group) {
    return group.some((cell, i) => {
        if (i === 0) {
            return false;
        }

        if (cell.isEmpty()) {
            return false;
        }

        const targetCell = group[i - 1];
        return targetCell.canAccept(cell.linkedTile);
    });
}