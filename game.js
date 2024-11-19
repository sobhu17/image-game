document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('play-again-from-leaderboard').addEventListener('click', showMainPage);

let firstTile = null;
let secondTile = null;
let matches = 0;
let attempts = 0;
let score = 0;
let isBusy = false;
let solveTimeLeft; // Remaining time
let initialTimeLimit; // Initial time based on photos
let solveTimerInterval; // Timer interval reference

// Leaderboard key in localStorage
const LEADERBOARD_KEY = 'leaderboard';

// Initialize leaderboard in localStorage if it doesn't exist
if (!localStorage.getItem(LEADERBOARD_KEY)) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
}

function startGame() {
    const uniqueImages = parseInt(document.getElementById('pairs').value);
    const difficulty = parseInt(document.getElementById('difficulty').value);

    // Set the initial time limit based on the number of photos
    if (uniqueImages === 8) {
        initialTimeLimit = 120;
    } else if (uniqueImages === 10) {
        initialTimeLimit = 150;
    } else if (uniqueImages === 12) {
        initialTimeLimit = 180;
    }

    // Reset the score and attempts
    score = 0;
    attempts = 0;
    updateScore();

    // Reset timers
    clearInterval(solveTimerInterval);
    solveTimeLeft = initialTimeLimit;

    // Hide the setup form and show the game grid
    document.querySelector('.game-setup').classList.add('hidden');
    const gameGrid = document.getElementById('game-grid');
    gameGrid.classList.remove('hidden');

    // Initialize the game grid
    initializeGrid(uniqueImages, difficulty);

    // Hide the "Play Again" button
    document.getElementById('play-again').classList.add('hidden');
}

function initializeGrid(uniqueImages, difficulty) {
    const grid = document.querySelector('.grid');
    grid.innerHTML = ''; // Clear any existing grid
    matches = 0; // Reset matches
    firstTile = null;
    secondTile = null;
    isBusy = false;

    const totalTiles = uniqueImages * 2;
    const rows = Math.ceil(totalTiles / 4);
    grid.style.gridTemplateColumns = `repeat(4, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const images = [];
    for (let i = 1; i <= uniqueImages; i++) {
        images.push(`images/image${i}.jpg`, `images/image${i}.jpg`);
    }

    images.sort(() => Math.random() - 0.5);

    images.forEach((image, index) => {
        const tile = document.createElement('div');
        tile.dataset.image = image;

        const img = document.createElement('img');
        img.src = image;
        img.alt = `Image ${index}`;
        img.style.visibility = 'hidden';
        tile.appendChild(img);

        tile.addEventListener('click', handleTileClick);
        grid.appendChild(tile);
    });

    showImagesTemporarily(grid, difficulty);
}

function showImagesTemporarily(grid, difficulty) {
    const tiles = grid.querySelectorAll('div');

    tiles.forEach(tile => {
        const img = tile.querySelector('img');
        img.style.visibility = 'visible';
    });

    const countdown = document.getElementById('countdown');
    countdown.textContent = `Memorize: ${difficulty} seconds remaining`;
    let timer = difficulty;

    const interval = setInterval(() => {
        timer--;
        countdown.textContent = `Memorize: ${timer} seconds remaining`;

        if (timer <= 0) {
            clearInterval(interval);
            countdown.textContent = '';

            tiles.forEach(tile => {
                const img = tile.querySelector('img');
                img.style.visibility = 'hidden';
            });

            startSolveTimer();
        }
    }, 1000);
}

function startSolveTimer() {
    const solveTimerDisplay = document.getElementById('solve-timer');
    solveTimeLeft = initialTimeLimit;

    solveTimerDisplay.textContent = `Time Left: ${solveTimeLeft} seconds`;

    solveTimerInterval = setInterval(() => {
        solveTimeLeft--;
        solveTimerDisplay.textContent = `Time Left: ${solveTimeLeft} seconds`;

        if (solveTimeLeft <= 0) {
            clearInterval(solveTimerInterval);

            // Notify the user that time is up
            alert('Time is up! Game Over!');

            // Handle game end and update the leaderboard with the score
            handleGameEnd(true); // Pass true to indicate time is up
        }
    }, 1000);
}


function handleTileClick(e) {
    if (isBusy) return;

    const tile = e.target.closest('div');
    const img = tile.querySelector('img');

    if (tile.classList.contains('revealed') || img.style.visibility === 'visible') {
        return;
    }

    img.style.visibility = 'visible';

    if (!firstTile) {
        firstTile = tile;
    } else if (!secondTile) {
        secondTile = tile;
        isBusy = true;

        attempts++;

        if (firstTile.dataset.image === secondTile.dataset.image) {
            firstTile.classList.add('revealed');
            secondTile.classList.add('revealed');
            firstTile = null;
            secondTile = null;
            matches += 2;

            score += 10;
            updateScore();

            isBusy = false;

            if (matches === document.querySelectorAll('.grid div').length) {
                clearInterval(solveTimerInterval);

                if (solveTimeLeft < 0) {
                    score += solveTimeLeft; // Deduct points for exceeding the time
                }

                updateScore();
                setTimeout(() => {
                    handleGameEnd(); // Show score and ask for the name
                }, 500);
            }
        } else {
            score -= 5;
            updateScore();

            setTimeout(() => {
                firstTile.querySelector('img').style.visibility = 'hidden';
                secondTile.querySelector('img').style.visibility = 'hidden';
                firstTile = null;
                secondTile = null;
                isBusy = false;
            }, 1000);
        }
    }
}

function handleGameEnd(isTimeUp = false) {
    clearInterval(solveTimerInterval);

    // Deduct points for exceeding the time limit if time is up
    if (isTimeUp && solveTimeLeft < 0) {
        score += solveTimeLeft; // solveTimeLeft is negative, so it reduces the score
    }

    // Display the final score
    if (isTimeUp) {
        alert(`Time is up! Your final score is ${score}.`);
    } else {
        alert(`Game Over! Your final score is ${score}.`);
    }

    // Ask for the player's name and update the leaderboard
    askForNameAndUpdateLeaderboard();
}


function updateScore() {
    const scoreDisplay = document.getElementById('score');
    scoreDisplay.textContent = `Score: ${score}`;
}

function askForNameAndUpdateLeaderboard() {
    const playerName = prompt(`Your score is ${score}. Please enter your name:`);
    if (playerName) {
        let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

        // Add the most recent player to the leaderboard
        leaderboard.push({ name: playerName, score });

        // Sort leaderboard by score in descending order
        leaderboard.sort((a, b) => b.score - a.score);

        // Check for duplicates with the same score
        const sameScoreEntries = leaderboard.filter(entry => entry.score === score);

        // If there are more entries with the same score than allowed, remove an older one
        if (sameScoreEntries.length > 1) {
            // Remove the oldest duplicate entry (not the most recent one)
            const indexToRemove = leaderboard.findIndex(
                entry => entry.score === score && entry.name !== playerName
            );
            if (indexToRemove !== -1) {
                leaderboard.splice(indexToRemove, 1); // Remove the duplicate entry
            }
        }

        // Ensure the leaderboard is limited to 5 entries
        if (leaderboard.length > 5) {
            leaderboard.pop(); // Remove the lowest score if the leaderboard exceeds 5
        }

        // Save the updated leaderboard to localStorage
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

        // Show the updated leaderboard
        showLeaderboard();
    }
}


function showLeaderboard() {
    // Hide the game container completely
    document.querySelector('.game-container').classList.add('hidden-container');
    
    // Get leaderboard data from localStorage
    const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY));
    const leaderboardList = document.getElementById('leaderboard-list');

    // Clear existing leaderboard entries
    leaderboardList.innerHTML = '';

    // Populate the leaderboard
    leaderboard.forEach(entry => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = entry.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = entry.score;
        scoreSpan.classList.add('score');
        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        leaderboardList.appendChild(li);
    });

    // Show the leaderboard page
    document.getElementById('leaderboard-page').classList.remove('hidden');
}



function showMainPage() {
    // Reset the game state before showing the main setup form
    resetGame(); // Call resetGame to clear the previous game state
    
    // Show the setup form and hide leaderboard
    document.querySelector('.game-container').classList.remove('hidden-container');
    document.getElementById('leaderboard-page').classList.add('hidden');
}



function resetGame() {
    document.querySelector('.game-setup').classList.remove('hidden');
    const gameGrid = document.getElementById('game-grid');
    gameGrid.classList.add('hidden');
    clearInterval(solveTimerInterval);
    solveTimeLeft = 0; // Reset the remaining time
    document.getElementById('solve-timer').textContent = ''; // Clear the timer display
    matches = 0;
    attempts = 0;
    score = 0;
    firstTile = null;
    secondTile = null;
    isBusy = false;

    const grid = document.querySelector('.grid');
    grid.innerHTML = '';
}
