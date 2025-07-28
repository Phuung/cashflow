const socket = io();

let playerName = '';
let myId = '';
let currentRoomId = '';
let roomOwner = false;
let hasRolled = true;
let receivedResult = false;
let timeOut;
let interval;
let showingReport = false;
//TODO: đồng bộ dữ liệu
professionList = [];
playerList = [];
myInfo = {
    id: '',
    name: '',
    profession: '',
    pos: -1,
    salary: 0,
    income: {},
    totalIncome: 0,
    expenses: {
        taxes: 0,
        homeMortgagePayment: 0,
        schoolLoanPayment: 0,
        carLoanPayment: 0,
        creditCardPayment: 0,
        retailPayment: 0,
        otherExpenses: 0,
        childExpense: 0
    },
    totalExpenses: 0,
    savings: 0,
    assets: {},
    liabilities: {
        homeMortgage: 0,
        schoolsLoans: 0,
        carLoans: 0,
        creditCards: 0,
        retailDebt: 0
    },
    children: 0,
    charity: 0,
    downszized: 0
}

// chỉ tạo 1 container duy nhất
function ensureNotiContainer() {
    let container = document.getElementById("notification-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "notification-container";
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    return container;
}

function notification(message) {
    const container = ensureNotiContainer();

    const noti = document.createElement('div');
    noti.innerText = message;
    noti.style.background = '#333';
    noti.style.color = '#fff';
    noti.style.padding = '10px 20px';
    noti.style.borderRadius = '8px';
    noti.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    noti.style.opacity = '0.95';

    container.appendChild(noti);

    setTimeout(() => {
        noti.remove();
    }, 2000);
}
//giao dien
function startCountdown(duration) {
    const timerBox = document.getElementById('timer-box');
    let timeLeft = duration;
    timerBox.style.display = 'block';
    timerBox.innerText = timeLeft;
    interval = setInterval(() => {
        timeLeft--;
        timerBox.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            timerBox.style.display = 'none';
        }
    }, 1000);
}

function stopCountdown() {
    const timerBox = document.getElementById('timer-box');
    timerBox.style.display = 'none';
    clearInterval(interval);
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
    if (document.getElementById('joinRoom').style.display === 'block') {
        document.getElementById('joinRoom').style.display = 'none';
    } else {
    document.getElementById('joinRoom').style.display = 'block';
    }

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
    stopCountdown();
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

function showReport() {
    document.getElementById('report-box').style.display = 'block';
    document.getElementById('close-report-btn').onclick = () => {
        document.getElementById('report-box').style.display = 'none';
        showingReport = false;
    };
    document.getElementById('player-name').innerText = myInfo.name;
    content = [];
    content.push(`<strong>Vị trí:</strong> ${myInfo.pos}`);
    content.push(`<strong>Nghề nghiệp:</strong> ${myInfo.profession || 'Chưa chọn'}`);
    content.push(`<strong>Lương:</strong> ${myInfo.salary}`);
    content.push(`<strong>Tiết kiệm:</strong> ${myInfo.savings}`);
    content.push(`<strong>Tài sản:</strong> ${Object.keys(myInfo.assets).length > 0 ? Object.keys(myInfo.assets).join('<br>') : 'Không có'}`);
    content.push(`<strong>Nợ:</strong> ${Object.keys(myInfo.liabilities).length > 0 ? Object.keys(myInfo.liabilities).map(key => `${key}: ${myInfo.liabilities[key]}`).join('<br>') : 'Không có'}`);
    content.push(`<strong>Thu nhập:</strong> ${Object.keys(myInfo.income).length > 0 ? Object.keys(myInfo.income).map(key => `${key}: ${myInfo.income[key]}`).join('<br>') : 'Không có'}`);
    content.push(`<strong>Chi tiêu:</strong> ${Object.keys(myInfo.expenses).length > 0 ? Object.keys(myInfo.expenses).map(key => `${key}: ${myInfo.expenses[key]}`).join('<br>') : 'Không có'}`);
    content.push(`<strong>Tổng thu nhập:</strong> ${myInfo.totalIncome}`);
    content.push(`<strong>Tổng chi tiêu:</strong> ${myInfo.totalExpenses}`);
    content.push(`<strong>Trẻ em:</strong> ${myInfo.children}`);
    content.push(`<strong>Quyên góp:</strong> ${myInfo.charity}`);
    content.push(`<strong>Thất nghiệp:</strong> ${myInfo.downsized}`);
    document.getElementById('report-content').innerHTML = content.join('<br>');
    //cập nhật
    showingReport = true;
}
//hàm tạo confirm box: cho 2 lựa chọn trả về true hoặc false
function confirmChoice(message, a = 'OK', b = 'Cancel') {
    return new Promise((resolve) => {
        const box = document.createElement('div');
        box.style.position = 'fixed';
        box.style.top = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%, -50%)';
        box.style.background = '#fff';
        box.style.padding = '20px';
        box.style.border = '1px solid #ccc';
        box.style.zIndex = '10000';
        box.innerHTML = `<p>${message}</p>`;
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'space-between';
        const btnA = document.createElement('button');
        btnA.innerText = a;
        
        btnA.onclick = () => {
            box.remove();
            resolve(true);
        };
        const btnB = document.createElement('button');
        btnB.innerText = b;
        btnB.onclick = () => {
            box.remove();
            resolve(false);
        };
        btnContainer.appendChild(btnA);
        btnContainer.appendChild(btnB);
        box.appendChild(btnContainer);
        document.body.appendChild(box);
    });
}
//hàm cho người chơi nhập số tiền
function promptInput(message, confirmText = 'Nhập', cancelText = 'Bỏ') {
    return new Promise((resolve) => {
        const box = document.createElement('div');
        box.style.position = 'fixed';
        box.style.top = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%, -50%)';
        box.style.background = '#fff';
        box.style.padding = '20px';
        box.style.border = '1px solid #ccc';
        box.style.zIndex = '10000';
        box.innerHTML = `<p>${message}</p>`;

        const input = document.createElement('input');
        input.type = 'number';
        input.style.width = '100%';
        input.style.marginBottom = '10px';
        box.appendChild(input);

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'space-between';

        const btnConfirm = document.createElement('button');
        btnConfirm.innerText = confirmText;
        btnConfirm.onclick = () => {
            const value = parseFloat(input.value);
            box.remove();
            resolve(isNaN(value) ? 0 : value);
        };

        const btnCancel = document.createElement('button');
        btnCancel.innerText = cancelText;
        btnCancel.onclick = () => {
            box.remove();
            resolve(0);
        };

        btnContainer.appendChild(btnConfirm);
        btnContainer.appendChild(btnCancel);
        box.appendChild(btnContainer);
        document.body.appendChild(box);

        input.focus();
    });
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
    //console.log('player list', players);
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
});

socket.on('updatePlayerList', (players) => {
    const html = 'Danh sách người chơi: </br>' + players.map(p =>
        `<div>${p.name} - <strong>Vị trí: ${p.pos}</strong></div>`
    ).join('');
    console.log(html);
    document.getElementById('score-list').innerHTML = html;
    playerList = players;
    myInfo = players.find(p => p.id === myInfo.id) || myInfo;
    if (showingReport) {
        showReport();
    }
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
        startCountdown(5);
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

//máy chủ yêu cầu người chơi chọn 2 phương án
socket.on('chooseOption', ({message, option1, option2}) => {
    const choice = confirmChoice(message, option1, option2);
    //log
    console.log('User choice:', choice);
    choice.then(result => {
        socket.emit('optionChosen', {
            choice: result ? option1 : option2
        });
    });
});

//máy chủ yêu cầu nhập số tiền
socket.on('chooseAmount', ({ message }) => {
    const amount = promptInput(message, 'Nhập', 'Bỏ qua');
    amount.then(value => {
        socket.emit('amountChosen', {
            amount: value
        });
    });
});

socket.on('notification', (message) => {
    notification("Máy chủ: " + message);
});

socket.on('errorMsg', msg => {
    alert(msg);
});
