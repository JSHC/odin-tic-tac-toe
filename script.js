const game = (() => {
    const pubSub = (() => {
        events = {};

        function subscribe(event, func) {
            if (!events[event]) {
                events[event] = [func];
            } else {
                events[event].push(func);
            }
        }

        function unsubscribe(event, func) {
            events[event].filter(event => event !== func);
        }

        function emit(event, data) {
            console.log(`emitting ${event}`)
            if (!events[event]) {
                return;
            }
            events[event].forEach(func => {
                func(data);
            })
        }

        return { 
            subscribe,
            unsubscribe,
            emit
        }
    })();

    const gameBoardModule = (() => {
        let _gameBoard = [];

        function _reset() {
            _gameBoard = [
                '', '', '',
                '', '', '',
                '', '', '',
            ]
        }

        function init() {
            _reset();
        }

        function getGameBoard() {
            return _gameBoard;
        }

        function setGameBoardItemAtIndex(index, symbol) {
            _gameBoard[index] = symbol;
            pubSub.emit('gameBoardChanged', _gameBoard);
        }

        return {
            getGameBoard,
            setGameBoardItemAtIndex,
            init
        }
    })();

    const displayModule = (() => {
        pubSub.subscribe('gameBoardChanged', render);

        const _gameBoardContainer = document.querySelector("#game-board-container");

        function getGameBoardIndexFromTarget(target) {
            return Array.from(_gameBoardContainer.childNodes).findIndex(item => item === target);
        }

        function render(gameBoard) {
            console.log(gameBoard);

            _gameBoardContainer.replaceChildren();
            for (let index in gameBoard) {
                const item = gameBoard[index];
    
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('game-board-item')
                itemDiv.textContent = item;
                itemDiv.addEventListener('click', (e) => takeTurn(getGameBoardIndexFromTarget(e.target)))
    
                _gameBoardContainer.appendChild(itemDiv);
            }
        }

        function init(gameBoard) {
            render(gameBoard);
        }

        return { init }

    })();

    const playerFactory = (id, symbol) => {
        const playerInput = document.querySelector(`#player${id}`);
        let _name = playerInput.value;
        playerInput.addEventListener('focusout', e => {
            _name = e.target.value
        });

        function getName() {
            return _name;
        }

        return { id, symbol, getName }
    }

    const _player1 = playerFactory(1, 'X');
    const _player2 = playerFactory(2, 'O');
    const _gameStates = {
        gameStart: 'gameStart',
        gameRunning: 'gameRunning',
        gameOver: 'gameOver',
    }
    let _currentPlayer = _player1;
    let _currGameState = _gameStates.gameStart;
    
    const gameOverDisplay = document.querySelector('.game-over-display');
    pubSub.subscribe('gameOver', (winner) => {
        const title = gameOverDisplay.querySelector('h2');
        if (winner) {
            title.textContent = `${winner.getName() || 'Player ' + _currentPlayer.id} wins!`
        } else {
            title.textContent = "It's a draw!";
        }
        gameOverDisplay.style.display = 'grid';
    })
    const gameOverRestartButton = gameOverDisplay.querySelector('button');
    gameOverRestartButton.addEventListener('click', () => {
        gameOverDisplay.style.display = '';
        onStartButtonClick();
    })


    const playerControls = document.querySelector('.player-controls');
    const startButton = playerControls.querySelector('button');
    startButton.addEventListener('click', onStartButtonClick);
    pubSub.subscribe('gameStateChanged', (gameState) => {
        _currGameState === _gameStates.gameStart ? startButton.textContent = 'Start' : startButton.textContent = 'Restart';
    })

    function onStartButtonClick(e) {
        gameBoardModule.init();
        displayModule.init(gameBoardModule.getGameBoard());
        _currGameState = _gameStates.gameRunning;

        pubSub.emit('gameStateChanged', _currGameState);
    }

    function takeTurn(gameBoardIndex) {
        if (_currGameState !== _gameStates.gameRunning) {
            return;
        }
        console.log(_currentPlayer);
        if (gameBoardModule.getGameBoard()[gameBoardIndex] !== '') {
            console.log(`index ${gameBoardIndex} already occupied`);
            return;
        }
        gameBoardModule.setGameBoardItemAtIndex(gameBoardIndex, _currentPlayer.symbol);

        if (checkWinState()) {
            console.log(`Player ${_currentPlayer.getName()} wins!`)
            _currGameState = _gameStates.gameOver;
            pubSub.emit('gameOver', _currentPlayer);
        } else if (checkBoardIsFull(gameBoardModule.getGameBoard())) {
            console.log("It's a draw!");
            _currGameState = _gameStates.gameOver;
            pubSub.emit('gameOver');
        }
        _currentPlayer === _player1 ? _currentPlayer = _player2 : _currentPlayer = _player1;
    }


    function checkWinState() {
        const _gameBoard = gameBoardModule.getGameBoard();
        if (checkRows(_gameBoard) || checkCols(_gameBoard) || checkDiagonals(_gameBoard)) {
            return true;
        } else {
            return false;
        }
        
    }
    function checkCols(_gameBoard) {
        for (let i = 0; i < 3; i++) {
            let colMatches = 1;
            let colSymbol = _gameBoard[i];
            if (!colSymbol) {
                continue;
            }
            for (let j = 1; j < 3; j++) {
                let colCurrIndex = i + j * 3;
                if (_gameBoard[colCurrIndex] === colSymbol) {
                    colMatches++;
                }
            }
            if (colMatches === 3) {
                return true;
            }
        }
        return false;
    }
    
    function checkRows(_gameBoard) {
        for (let i = 0; i < 3; i++) {
            let rowMatches = 1;
            let rowSymbol = _gameBoard[i * 3];
            if (!rowSymbol) {
                continue;
            }
            for (let j = 1; j < 3; j++) {
                let rowCurrIndex = i * 3 + j;
                if (_gameBoard[rowCurrIndex] === rowSymbol) {
                    rowMatches++;
                }
            }
            if (rowMatches === 3) {
                return true;
            }
        }
        return false;
    }

    function checkDiagonals(_gameBoard) {
        let diag1Matches = 0;
        let diag1Symbol = _gameBoard[0];
        if (diag1Symbol !== '') {
            for (let i = 0; i < 3; i++) {
                let item = _gameBoard[i * 3 + i]
                if (item === diag1Symbol) {
                    diag1Matches++;
                }
            }
        }
        let diag2Matches = 0;
        let diag2Symbol = _gameBoard[2];
        if (diag2Symbol !== '') {
            for (let i = 0; i < 3; i++) {
                let item = _gameBoard[2 * i + 2];
                if (item === diag2Symbol) {
                    diag2Matches++;
                }
            }
        }

        if (diag1Matches === 3 || diag2Matches === 3) {
            return true;
        }

        return false;

    }

    function checkBoardIsFull(_gameBoard) {
        for (let item of _gameBoard) {
            if (item === '') {
                return false;
            }
        }
        return true;
    }
    
    gameBoardModule.init();
    displayModule.init(gameBoardModule.getGameBoard());
    
    return { checkWinState };
})();

