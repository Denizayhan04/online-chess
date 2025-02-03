const socket = io();
let game = new Chess();
let board = null;
let roomId = null;
let playerColor = 'white';
let playerTimer = null;
let opponentTimer = null;
let timeControl = 0;
let playerInterval = null;
let opponentInterval = null;
let isGameActive = false;

// Satranç taşları için görsel yapılandırması
const pieceTheme = (piece) => {
    const pieceType = {
        'K': 'king',
        'Q': 'queen',
        'R': 'rook',
        'B': 'bishop',
        'N': 'knight',
        'P': 'pawn'
    };
    
    const color = piece.charAt(0).toLowerCase() === 'w' ? 'white' : 'black';
    const type = pieceType[piece.charAt(1)].toLowerCase();
    return `/pieces-basic-png/${color}-${type}.png`;
};

// Timer fonksiyonları
function startTimer() {
    stopTimers(); // Önceki zamanlayıcıları durdur
    
    if (!isGameActive) return;

    const isPlayerTurn = (game.turn() === 'w' && playerColor === 'white') || 
                        (game.turn() === 'b' && playerColor === 'black');

    if (isPlayerTurn) {
        playerInterval = setInterval(() => {
            if (playerTimer > 0) {
                playerTimer--;
                updateTimerDisplay();
                if (playerTimer === 0) {
                    clearInterval(playerInterval);
                    endGame('timeout', 'player');
                }
            }
        }, 1000);
    } else {
        opponentInterval = setInterval(() => {
            if (opponentTimer > 0) {
                opponentTimer--;
                updateTimerDisplay();
                if (opponentTimer === 0) {
                    clearInterval(opponentInterval);
                    endGame('timeout', 'opponent');
                }
            }
        }, 1000);
    }
}

function stopTimers() {
    if (playerInterval) clearInterval(playerInterval);
    if (opponentInterval) clearInterval(opponentInterval);
    playerInterval = null;
    opponentInterval = null;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const playerTimerElement = document.getElementById('player-timer');
    const opponentTimerElement = document.getElementById('opponent-timer');
    
    playerTimerElement.textContent = formatTime(playerTimer);
    opponentTimerElement.textContent = formatTime(opponentTimer);
}

// Oyun başlangıcında URL kontrolü
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('room');
    const tokenFromUrl = urlParams.get('token');
    
    // Eğer URL'de oda ve token varsa
    if (roomIdFromUrl && tokenFromUrl) {
        roomId = roomIdFromUrl;
        socket.emit('getGameState', {
            roomId: roomIdFromUrl,
            token: tokenFromUrl
        });
    }
};

socket.on('gameState', (data) => {
    if (data) {
        roomId = data.roomId;
        playerColor = data.playerColor;  // Sunucudan gelen renk
        
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        document.getElementById('roomDisplay').textContent = roomId;
        
        playerTimer = data.whiteTime;
        opponentTimer = data.blackTime;
        isGameActive = true;
        
        initializeBoard();
        
        if (data.moves.length > 0) {
            game.load_pgn(data.moves.join(" "));
            board.position(game.fen());
            updateStatus();
            
            // Sıra bizdeyse timer'ı başlat
            const isWhiteTurn = game.turn() === 'w';
            if ((isWhiteTurn && playerColor === 'white') || (!isWhiteTurn && playerColor === 'black')) {
                startTimer();
            }
        }
    }
});

function onDragStart(source, piece) {
    // Önce mevcut vurgulamaları temizle
    $('.square-55d63').removeClass('highlight-move');
    $('.square-55d63').removeClass('highlight-check');

    if (!isGameActive || game.game_over()) return false;

    // Sadece kendi rengindeki taşları hareket ettirebilir
    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Sadece sırası gelen oyuncu hamle yapabilir
    if ((game.turn() === 'w' && playerColor !== 'white') ||
        (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
    }

    // Taşın gidebileceği yerleri göster
    const moves = game.moves({ square: source, verbose: true });
    moves.forEach(move => {
        $('.square-' + move.to).addClass('highlight-move');
    });
    
    return true;
}

function onDrop(source, target) {
    // Tüm yeşil kareleri temizle
    removeHighlights();

    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    socket.emit('makeMove', {
        roomId: roomId,
        move: game.pgn(),
        remainingTime: playerTimer,
        playerColor: playerColor
    });

    updateStatus();
    startTimer();

    // Mat durumunu kontrol et
    if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Siyah' : 'Beyaz';
        alert(`Mat! ${winner} kazandı!`);
        endGame('checkmate', game.turn());
    }
}

function updateStatus() {
    const moveHistory = document.getElementById('moves');
    moveHistory.innerHTML = '';
    
    const moves = game.history({ verbose: true });
    let moveText = '';
    moves.forEach((move, index) => {
        if (index % 2 === 0) {
            moveText += `${Math.floor(index/2 + 1)}. ${move.san} `;
        } else {
            moveText += `${move.san}<br>`;
        }
    });
    moveHistory.innerHTML = moveText;

    // Şah durumunu kontrol et ve göster
    if (game.in_check()) {
        const kingSquare = findKingSquare(game.turn());
        if (kingSquare) {
            $('.square-' + kingSquare).addClass('highlight-check');
        }
    } else {
        removeCheckHighlight();
    }
}

function findKingSquare(color) {
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && piece.type === 'k' && piece.color === color.charAt(0)) {
                return String.fromCharCode(97 + j) + (8 - i);
            }
        }
    }
    return null;
}

function removeHighlights() {
    $('.square-55d63').removeClass('highlight-move');
}

function removeCheckHighlight() {
    $('.square-55d63').removeClass('highlight-check');
}

function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        orientation: playerColor,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: () => {
            board.position(game.fen());
            updateStatus();
        },
        pieceTheme: pieceTheme,
        showNotation: true
    };
    
    board = Chessboard('board', config);
    console.log('Tahta oluşturuldu, yön:', playerColor);
    updateStatus();
    updateTimerDisplay();
}

// Socket.io olayları
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createGame').addEventListener('click', () => {
        console.log('Oyun oluşturuluyor...');
        timeControl = parseInt(document.getElementById('timeControl').value) * 60;
        playerColor = document.getElementById('colorChoice').value;
        if (playerColor === 'random') {
            playerColor = Math.random() < 0.5 ? 'white' : 'black';
        }

        socket.emit('createGame', {
            timeControl: timeControl,
            startingColor: playerColor
        });
    });

    document.getElementById('joinGame').addEventListener('click', () => {
        const roomInput = document.getElementById('roomId').value;
        if (roomInput) {
            socket.emit('joinGame', roomInput);
        }
    });
});

socket.on('connect', () => {
    console.log('Socket.io bağlantısı kuruldu');
});

socket.on('gameCreated', (data) => {
    console.log('Oyun oluşturuldu:', data);
    roomId = data.roomId;
    playerColor = data.playerColor;
    
    // URL'yi güncelle
    window.history.pushState({}, '', `?room=${roomId}&token=${data.token}`);
    
    document.getElementById('roomDisplay').textContent = roomId;
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    
    playerTimer = data.timeControl;
    opponentTimer = data.timeControl;
    isGameActive = true;
    
    initializeBoard();
});

socket.on('gameJoined', (data) => {
    console.log('Oyuna katılındı:', data);
    roomId = data.roomId;
    
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('roomDisplay').textContent = roomId;
    
    playerTimer = data.timeControl;
    opponentTimer = data.timeControl;
    isGameActive = true;
    
    initializeBoard();
    
    if (data.moves.length > 0) {
        game.load_pgn(data.moves[data.moves.length - 1]);
        board.position(game.fen());
        updateStatus();
        
        // Sıra bizdeyse timer'ı başlat
        const isWhiteTurn = game.turn() === 'w';
        if ((isWhiteTurn && playerColor === 'white') || (!isWhiteTurn && playerColor === 'black')) {
            startTimer();
        }
    }
});

socket.on('playerAssigned', (data) => {
    console.log('Oyuncu bilgileri atandı:', data);
    playerColor = data.playerColor;
    
    // URL'yi güncelle
    window.history.pushState({}, '', `?room=${roomId}&token=${data.token}`);
    
    // Tahtayı yeniden başlat
    initializeBoard();
});

socket.on('moveMade', (data) => {
    console.log('Hamle yapıldı:', data);
    game.load_pgn(data.move);
    board.position(game.fen());
    updateStatus();
    
    // Timer'ları güncelle
    if (playerColor === 'white') {
        playerTimer = data.whiteTime;
        opponentTimer = data.blackTime;
    } else {
        playerTimer = data.blackTime;
        opponentTimer = data.whiteTime;
    }
    updateTimerDisplay();
    
    // Sadece sıra bizdeyse timer'ı başlat
    if (data.currentTurn === playerColor) {
        startTimer();
    }
});

function endGame(reason, loser) {
    isGameActive = false;
    stopTimers();
    
    if (reason === 'timeout') {
        if (loser === 'player') {
            alert('Süreniz bitti! Oyunu kaybettiniz.');
            socket.emit('gameEnded', {
                roomId: roomId,
                winner: playerColor === 'white' ? 'black' : 'white',
                reason: 'timeout'
            });
        } else {
            alert('Rakibin süresi bitti! Oyunu kazandınız.');
            socket.emit('gameEnded', {
                roomId: roomId,
                winner: playerColor,
                reason: 'timeout'
            });
        }
    }
    
    // Tahtayı kilitleyerek daha fazla hamle yapılmasını engelle
    board.position(game.fen(), false);
    
    // Oyun alanını güncelle
    document.getElementById('gameArea').style.opacity = '0.7';
    
    // 3 saniye sonra ana menüye dön
    setTimeout(() => {
        document.getElementById('gameArea').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
        document.getElementById('gameArea').style.opacity = '1';
        
        // Oyun durumunu sıfırla
        game = new Chess();
        board = null;
        roomId = null;
        playerTimer = null;
        opponentTimer = null;
        timeControl = 0;
        isGameActive = false;
    }, 3000);
} 