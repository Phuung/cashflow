const socket = io();

let playerName = '';
let myId = '';
let currentRoomId = '';
let roomOwner = false;
let hasRolled = true;
let receivedResult = false;
let timeOut;

professionList = [];
playerList = [];
myInfo = {
    id: '',
    name: '',
    profession: '',
    charity: 0,
    downszized: 0
}

function notification(message) {
    const noti = document.createElement('div');
    noti.innerText = message;
    noti.style.position = 'fixed';
    noti.style.top = '20px';
    noti.style.left = '50%';
    noti.style.transform = 'translateX(-50%)';
    noti.style.background = '#333';
    noti.style.color = '#fff';
    noti.style.padding = '10px 20px';
    noti.style.borderRadius = '8px';
    noti.style.zIndex = '9999';
    document.body.appendChild(noti);

    setTimeout(() => {
        noti.remove();
    }, 1000);
}

function showAbout() {
    document.getElementById('about').style.display = 'block';
}
function hideAbout() {
    document.getElementById('about').style.display = 'none';
}

function setName() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return alert('Vui lòng nhập tên');
    myInfo.name = name;
    playerName = name;
    socket.emit('setName', name);

    document.getElementById('displayName').innerText = name;
    document.getElementById('nameInput').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
}

function getName(id, players) {
    const p = players.find(p => p.id === id);
    return p ? p.name : 'Unknown';
}

function backToLobby() {
    const btn = document.getElementsByClassName('slide');
    if (roomOwner) {
        //xoá nút đã tạo trước đó
        document.getElementById('start-button').remove();
    } else {
        document.getElementById('waiting-start').remove();
    }
    for (let slide of btn) {
        slide.style.display = 'none';
    }
    document.getElementById('lobby').style.display = 'block';
    socket.emit('outRoom', currentRoomId, myInfo.id);
    myInfo = {};
    myInfo.id = myId;
    myInfo.name = playerName;
    currentRoomId = '';
    hasRolled = true;
    receivedResult = false;
    roomOwner = false;

}

function updatePlayerList(players) {
    console.log("update player list");
    const html = players.map(p =>
        `<div>${p.name} - <strong>${p.score} điểm</strong></div>`
    ).join('');
    document.getElementById('playerList').innerHTML = html;
}

function showJoin() {
  document.getElementById('joinRoom').style.display = 'block';
}

function createRoom() {
  socket.emit('createRoom');
}

function joinRoom() {
  const roomId = document.getElementById('roomIdInput').value.trim();
  if (!roomId) return alert('Nhập ID phòng');
  socket.emit('joinRoom', roomId);
}

function startGame() {
  if (currentRoomId) {
    socket.emit('startGame', currentRoomId);
  }
}

function rollDice() {
    if (hasRolled) return alert('Ban da tung roi');
    hasRolled = true;
    socket.emit('rollDice', currentRoomId);
    clearTimeout(timeOut);
}

function showBank() {
    const bankBox = document.getElementById('bank-box');
    const amountInput = document.getElementById('amount-input');
    const maxDeposit = document.getElementById('max-deposit');
    const maxLoan = document.getElementById('max-loan');
    amountInput.value = '';
    maxDeposit.textContent = `Tối đa: ${myInfo.savings}`;
    maxLoan.textContent = `Tối đa: ${(myInfo.totalIncome - myInfo.totalExpenses)}`;
    bankBox.style.display = 'block';
    document.getElementById('close-bank-btn').onclick = () => {
      bankBox.style.display = 'none';
    };
    //quy ước dương là số tiền vay, âm là gửi
    //Lãi suất gửi ngân hàng
    const bankInterestRate = 0.05; // 5%
    document.getElementById('deposit-btn').onclick = () => {
        const value = parseInt(amountInput.value);
        if (!value || value <= 0 || value > myInfo.savings) {
            notification('Không thể gửi số tiền này!');
            return;
        }
        socket.emit('bankAction', myInfo.id, currentRoomId, -value);
        bankBox.style.display = 'none';
    };

    document.getElementById('loan-btn').onclick = () => {
        const value = parseInt(amountInput.value);
        if (!value || value <= 0 || value > (myInfo.totalIncome - myInfo.totalExpenses)) {
            alert('Không thể vay số tiền này!');
            return;
        }
        socket.emit('bankAction', myInfo.id, currentRoomId, value);
        bankBox.style.display = 'none';
    };
}

socket.on('connect', () => {
    myInfo.id = socket.id;
    myId = myInfo.id;
});

socket.on('roomCreated', roomId => {
    currentRoomId = roomId;
    roomOwner = true;
    document.getElementsByClassName('roomIdDisplay')[0].innerText = roomId;
    document.getElementById('lobby').style.display = 'none';
    waitingRoom = document.getElementById('waiting-room');
    waitingRoom.style.display = 'block';
    const button = document.createElement("button");
    button.id = 'start-button';
    button.innerText = "Bắt đầu";
    button.onclick = startGame;
    waitingRoom.appendChild(button);
});

socket.on('roomJoined', roomId => {
    currentRoomId = roomId;
    document.getElementsByClassName('roomIdDisplay')[0].innerText = roomId;
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    waitDiv = document.createElement("div");
    waitDiv.id = 'waiting-start';
    waitDiv.innerText = "Đang chờ chủ phòng bắt đầu...";
    document.getElementById('waiting-room').appendChild(waitDiv);
});

socket.on('professionList', (list) => {
    console.log("cap nhat profession list");
    professionList = list;
});

socket.on('playerList', (players) => {
    let html = 'Danh sách người chơi: </br>';
    document.getElementById('playerList').innerHTML = html;
    players.forEach(player => {
        container = document.createElement("div");
        document.getElementById('playerList').appendChild(container);
        container.id = player.id;
        container.innerHTML = `<strong>${player.name}</strong> - `;
        if (player.id === myInfo.id) {
            container.innerHTML = `<strong>${player.name}</strong> - `;
            const selectProfession = document.createElement("select");
            container.appendChild(selectProfession);
            professionList.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof;
                option.textContent = prof;
                selectProfession.appendChild(option);
            });
            if (myInfo.profession) {
                selectProfession.value = myInfo.profession;
                //console.log('set option');
            }
            selectProfession.addEventListener("change", () => {
                myInfo.profession = selectProfession.value;
                socket.emit('changeProf', currentRoomId, myInfo.id, selectProfession.value);
            });
        } else {
            html = `<strong>${player.name}</strong> - `;
            html += player.profession ? player.profession : 'Unknown';
            container.innerHTML = html;
        }
    });
    console.log(html);
    
});

socket.on('gameStarted', (players) => {
    notification('Game đã bắt đầu!');
    document.getElementsByClassName('roomIdDisplay')[1].innerText = currentRoomId;
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('room').style.display = 'block';
    if (myInfo.profession == 'Profession' || !myInfo.profession) {
        const randomProf = professionList[Math.floor(Math.random() * professionList.length)];
        socket.emit('changeProf', currentRoomId, myInfo.id, randomProf);
        notification(`Bạn đã được chọn dùm nghề ${randomProf}`);
    }
    //TODO: nếu người chơi chưa chọn nghề sẽ không được cập nhật?
});

socket.on('updatePlayerList', (players) => {
    console.log('mang:', Array.isArray(players)); // true nếu đúng là mảng
    const html = 'Danh sách người chơi: </br>' + players.map(p =>
        `<div>${p.name} - <strong>Vị trí: ${p.pos}</strong></div>`
    ).join('');
    console.log(html);
    document.getElementById('score-list').innerHTML = html;
});

socket.on('nextTurn', ({playerId, name }) => {
    document.getElementById('currentTurn').innerText = name;
    hasRolled = false;
    receivedResult = false;
    document.getElementById('rollBtn').disabled = (playerId !== myInfo.id);
    if (playerId === myInfo.id) {
        if (myInfo.downsized) {
            myInfo.downsized = Math.max(myInfo.downsized - 1, 0);
            return;
        }
        timeOut = setTimeout(() => {
            if (!hasRolled) {
                notification(`${name} mất lượt!`);
                //socket.emit('nextTurn', currentRoomId);
                hasRolled = true;
            }
        }, 5000);

    }
});

socket.on('diceResult', ({ playerId, name, dice }) => {
    receivedResult = true;
    console.log('recived roll result', receivedResult);
    if (dice !== null) {
        if (myInfo.charity) {
            myInfo.charity = Math.max(myInfo.charity - 1, 0);
            const dice1 = Math.floor(Math.random()*(dice-1)) + 1;
            notification(`Người chơi ${name} tung được ${dice1} và ${dice - dice1}`);
        } else {
            notification(`Người chơi ${name} tung được ${dice}`);
        }
        
    } else {
        notification('Không có kết quả tung');
    }
});

socket.on('cardChoice', ({ option }) => {
    const choice = confirm(`${options[0]}?\n\nOK = chọn\nCancel = ${options[1]}`);
    socket.emit('cardChoiceResult', {
        roomId: currentRoomId,
        choice: choice ? 0 : 1
    });
})
socket.on('notification', (message) => {
    notification("Máy chủ: " + message);
});

socket.on('errorMsg', msg => {
    alert(msg);
});
