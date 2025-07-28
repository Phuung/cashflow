const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { Player } = require('./classes');
const { cards } = require('./cards.js');
const { count } = require('console');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

//build
const rooms = {};

const professions_raw = fs.readFileSync('Profession.txt', 'utf8');
const lines = professions_raw.trim().split('\n').map(line => line.split(','));
const profession_col = lines[0];

professions = profession_col.map((name, i) => {
    const profession_obj = {profession: name};
    for (let j = 1; j < lines.length; j++) {
        const key = lines[j][0];
        const value = lines[j][i];
        profession_obj[key] = isNaN(value) ? value : Number(value);
    }
    return profession_obj;
});
//console.log(professions);//debug;
//lãi suất vay ngân hàng
//nhà 0.93
const homeInterestRate = 0.93 / 100; // 0.93%
//học 0.5
const schoolInterestRate = 0.5 / 100; // 0.5%
//xe 2
const carInterestRate = 2 / 100; // 2%
//thẻ tín dụng 3
const creditCardInterestRate = 3 / 100; // 3%
//bán lẻ 5
const retailInterestRate = 5 / 100; // 5%
//vay ngân hàng 10
const bankInterestRate = 10 / 100; // 10%


const spaceType = {
    1 : (io, room, player) =>{
        //paycheck
        //kiểm tra xem người chơi có đang mất việc
        //nếu không, cộng tiền cho người chơi hiện tại
        //hiện thực hàm phía dưới
        io.to(player.id).emit('notification', 'Payday!');
    },
    2 : async (io, room, player) =>{
        //opportunity
        io.to(player.id).emit('notification', 'Opportunity');
        //người dùng được chọn big deal hoặc small deal
        //chọn ngẫu nhiên 1 lá bài thuộc big deal hoặc small deal
        const deal = await chooseOption(io, player, "Big deal or small deal?", "Big deal", "Small deal");
        if (deal === "Big deal") {
            //chọn ngẫu nhiên 1 lá bài big deal
            //thực hiện các hành động của lá bài

        } else {
            //chọn ngẫu nhiên 1 lá bài small deal
            //thực hiện các hành động của lá bài
            
        }
        

        
    },
    3 : (io, room, player) =>{
        //market
        io.to(player.id).emit('notification', 'Market');
        //chọn ngẫu nhiên 1 lá bài market
        
    },
    4 : (io, room, player) =>{
        //doodad
        io.to(player.id).emit('notification', 'Doodad');
        //chọn ngẫu nhiên 1 lá doodad
        
        //nếu đủ chi phí chi trả thì trừ trực tiếp
        //nếu không, thông báo và cho người chơi 15s để vay, bán tài sản
        //nếu không đủ khả năng, phá sản, thua
    },
    5 : async (io, room, player) =>{
        //charity
        io.to(player.id).emit('notification', 'Charity');
        //người dùng có chọn từ thiện hay không
        //nếu chọn thì tăng thuộc tính từ thiện của người chơi lên 3 (không cộng dồn) và từ tiền
        const choice = await chooseOption(io, player, "Do you want to donate?", "Yes", "No");
        if (choice === "Yes") {
            player.charity = 3;
            //check xem đủ từ thiện 10% thu nhập không
            if (player.totalIncome * 0.1 > player.savings) {
                //nếu không đủ thì thông báo
                io.to(player.id).emit('notification', 'Not enough savings for charity!');
            } else {
                //trừ tiền tiết kiệm
                player.savings -= player.totalIncome * 0.1;
                reCalcCashFlow(player);
                io.to(player.id).emit('notification', 'You donated 10% of your income!');
            }
        } else {
            //nếu không chọn thì không làm gì cả
            io.to(player.id).emit('notification', 'You chose not to donate.');
        }
    },
    6 : (io, room, player) =>{
        //baby
        io.to(player.id).emit('notification', 'Baby');
        //tăng số con của người chơi lên 1 (tối đa 3) và cập nhật chi phí nuôi con
        player.children += 1;
        if (player.children > 3) player.children = 3;
        console.log('baby');
        reCalcExpenses(player);
    },
    7 : (io, room, player) =>{
        //downsized
        io.to(player.id).emit('notification', 'You have been downsized!');
        //thay đổi thuộc tính mất việc của người chơi thành 2
        //payday sẽ không cộng tiền lương
        player.downsized = 2;
    }
};
const ratRace = [2,3,4,2,5,1,6,2,3,2,4,1,2,3,6,5,2,1];
const fastTrack = [];
//test
const raceLength = ratRace.length;

//functions
//TODO: cần kiểm tra lại xem 3 hàm dưới tính đúng chưa
function reCalcIncome(player) {
    player.totalIncome = Object.values(player.income).reduce((acc, val) => acc + val, player.salary);
}

function reCalcExpenses(player) {
    //chi phí nuôi 1 đứa trẻ cố định là 200
    player.expenses.childExpense = player.children * 200;
    //trả lãi các khoản nợ
    player.expenses.homeMortgagePayment = player.liabilities.homeMortgage * homeInterestRate;
    player.expenses.schoolLoanPayment = player.liabilities.schoolsLoans * schoolInterestRate;
    player.expenses.carLoanPayment = player.liabilities.carLoans * carInterestRate;
    player.expenses.creditCardPayment = player.liabilities.creditCards * creditCardInterestRate;
    player.expenses.retailPayment = player.liabilities.retailDebt * retailInterestRate;
    //tính tổng chi phí
    player.totalExpenses = Object.values(player.expenses).reduce((acc, val) => acc + val, 0);
}

function reCalcCashFlow(player) {
    reCalcIncome(player);
    reCalcExpenses(player);
}

//hàm cho người chơi chọn 2 phương án
function chooseOption(io, player, message, option1, option2) {
    //hiện thông báo cho người chơi chọn 1 trong 2 phương án
    //nếu chọn phương án 1 thì thực hiện phương án 1
    //nếu chọn phương án 2 thì thực hiện phương án 2
    //cập nhật lại tiền của người chơi
    //log
    console.log(`Player ${player.name} is choosing between: ${option1} or ${option2}`);
    io.to(player.id).emit('chooseOption', {
        message: message,
        option1: option1,
        option2: option2
    });
    return new Promise((resolve, reject) => {
        io.once('optionChosen', (choice) => {
            if (choice) {
                resolve(option1);
            } else {
                resolve(option2);
            }
        });
    });

}


//run
io.on('connection', socket => {
    console.log(`Socket ket noi: ${socket.id}`);

    socket.on('setName', name => {
        socket.data.name = name;
    });

    socket.on('createRoom', () => {
        const roomId = uuidv4().slice(0, 3);
        const player = new Player(socket.id, socket.data.name);
        rooms[roomId] = {
            players: [player],
            started: false,
            turn: 0,
            currentCard: null,
            roomId: roomId,
            rollTimeout: null
        };
        socket.join(roomId);
        socket.emit('professionList', profession_col);
        socket.emit('roomCreated', roomId);
        socket.emit('playerList', rooms[roomId].players);
        console.log('created room');
    });

    socket.on('joinRoom', roomId => {
        if (rooms[roomId] && !rooms[roomId].started) {
            const player = new Player(socket.id, socket.data.name);
            rooms[roomId].players.push(player);
            socket.join(roomId);
            // const clients = io.sockets.adapter.rooms.get(roomId);
            // if (clients) {
            //     const clientIds = Array.from(clients); // Chuyển Set thành mảng
            //     console.log("Socket IDs trong phòng:", clientIds);
            // }
            socket.emit('roomJoined', roomId);
            socket.emit('professionList', profession_col);
            //updatePlayerList(roomId);
            console.log('joined room');
            io.to(roomId).emit('playerList', rooms[roomId].players);
        } else {
            socket.emit('errorMsg', 'Room khong ton tai hoac da bat dau');
        }
    });

    socket.on('outRoom', (roomId, playerId) => {
        room = rooms[roomId];
        players = room.players;
        let index = room.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            room.players.splice(index, 1);
        }
        io.to(roomId).emit('playerList', rooms[roomId].players);
        // //remove room
        // if (!players.length) {
        //     rooms[roomId] = {};
        // }
    });

    socket.on('changeProf', (roomId, playerId, value) => {
        room = rooms[roomId];
        if (!room) return;
        currentPlayer = null;
        room.players.forEach(player => {
            if (player.id == playerId) {
                currentPlayer = player;
            }
        });
        if (!currentPlayer) return;
        currentPlayer.profession = value;
        professions.forEach(prof => {
            if (currentPlayer.profession === prof.profession) {
                currentPlayer.salary = prof.Salary;
                currentPlayer.savings = prof.Savings;
                currentPlayer.expenses.taxes = prof.Taxes;
                currentPlayer.expenses.homeMortgagePayment = prof.HomeMortgagePayment;
                currentPlayer.expenses.schoolLoanPayment = prof.SchoolLoanPayment;
                currentPlayer.expenses.carLoanPayment = prof.CarLoanPayment;
                currentPlayer.expenses.creditCardPayment = prof.CreditCardPayment;
                currentPlayer.expenses.retailPayment = prof.RetailPayment;
                currentPlayer.expenses.otherExpenses = prof.OtherExpenses;
                currentPlayer.liabilities.homeMortgage = prof.HomeMortgage;
                currentPlayer.liabilities.schoolsLoans = prof.SchoolsLoans;
                currentPlayer.liabilities.carLoans = prof.CarLoans;
                currentPlayer.liabilities.creditCards = prof.CreditCards;
                currentPlayer.liabilities.retailDebt = prof.RetailDebt;
            }
        });
        //console.log(currentPlayer);
        reCalcCashFlow(currentPlayer);
        io.to(roomId).emit('playerList', rooms[roomId].players);
        if (room.started) {
            //nếu đã bắt đầu game thì cập nhật lại danh sách người chơi
            io.to(roomId).emit('updatePlayerList', room.players);
        }
    });

    socket.on('startGame', roomId => {
        if (rooms[roomId]) {
            console.log('game started');
            rooms[roomId].started = true;
            io.to(roomId).emit('gameStarted', rooms[roomId].players);
            emitNextTurn(rooms[roomId]);
            updatePlayerList(roomId);
        }
    });

    socket.on('rollDice', roomId => {
        const room = rooms[roomId];
        if (!room) {
            console.log('Khong tim thay phong');
            return;
        }
        const currentPlayer = room.players[room.turn];
        if (!currentPlayer) {
            console.log('khong tim thay nguoi choi');
            return;
        }
        if (socket.id !== currentPlayer.id) {
            console.log('khong phai luot cua ban');
            return;
        }
        clearTimeout(room.rollTimeout);
        let dice = 1;
        if (currentPlayer.charity) {
            //Nếu đang làm từ thiện thì giảm chỉ số từ thiện và xúc xắc từ 2 đến 12
            dice = Math.floor(Math.random()*11) + 2;
            currentPlayer.charity = Math.max(currentPlayer.charity - 1, 0);
        } else {
            dice = Math.floor(Math.random()*6) + 1;        
        }

        currentPlayer.pos = (dice + currentPlayer.pos) % raceLength;
        //payday
        let checking = currentPlayer.pos;
        for (let i = 0; i < dice; i++) {
            if (ratRace[checking] === 1) {
                payday(currentPlayer);
            }
            checking -= 1;
            if (checking < 0) {
                checking = ratRace.length + checking;
            }
        }

        spaceType[ratRace[currentPlayer.pos]](io, room, currentPlayer);
        io.to(roomId).emit('diceResult', {
            playerId: currentPlayer.id,
            name: currentPlayer.name,
            dice,
        });
        updatePlayerList(roomId);
        nextTurn(room);
    });

    socket.on('nextTurn', roomId => {
        //log
        
        const room = rooms[roomId];
        if (!room) {
            console.log('Khong tim thay phong');
            return;
        }
        console.log('pass');
        nextTurn(room);
    });
    //vay ngân hàng, nếu vay âm là gửi
    socket.on('bankAction', (playerId, roomId, value) => {
        //kiểm tra khả năng vay
        const room = rooms[roomId];
        if (!room) {
            console.log('Khong tim thay phong');
            return;
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player) {
            console.log('Khong tim thay nguoi choi');
            return;
        }
        if (value < 0 && player.savings < value) {
            socket.emit('errorMsg', 'Không thể gửi quá số tiền hiện có!');
            return;
        } else if (value > 0 && (player.totalIncome - player.totalExpenses) < Math.abs(value)) {
            socket.emit('errorMsg', 'Không đủ khả năng vay ngân hàng!');
            return;
        }
        //trừ/cộng trực tiếp vào nợ ngân hàng
        player.liabilities.retailDebt += value;
        //cập nhật tiền tiết kiệm
        player.savings += value;
        reCalcCashFlow(player);
        updatePlayerList(roomId);
        //trả vể thông báo
        socket.emit('notification', `Đã ${value > 0 ? 'vay' : 'gửi'} ngân hàng số tiền ${value}!`);
    }) 


    socket.on('disconnect', () => {
        console.log(`Ngat ket noi: ${socket.id}`);
    });

    function getPlayerNames(roomId) {
        console.log(rooms[roomId].players.map(p => p.name));
        return rooms[roomId].players.map(p => p.name);
    }

    function getRandomCard() {
        const cards = [new CardChoice(), new CardAdd5()];
        return cards[Math.floor(1)];
    }

    function nextTurn(room) {
        console.log('nextTurn called');
        room.turn = (room.turn + 1) % room.players.length;
        emitNextTurn(room);
    }

    function emitNextTurn(room) {
        const player = room.players[room.turn];
        
        if (!player) {
            console.error("Player không tồn tại!");
            return;
        }
        io.to(room.roomId).emit('nextTurn', {
            playerId: player.id,
            name: player.name
        });
        //Nếu đang mất việc thì giảm chỉ số mất việc 1 bậc và bỏ qua
        if (player.downsized) {
            player.downsized = Math.max(player.downsized - 1, 0);
            nextTurn(room);
            return;
        }
        room.rollTimeout = setTimeout(() => {
            if (!room.started) {
                console.log('Game chưa bắt đầu, không thể tiếp tục.');
                return;
            }
            nextTurn(room);
        }, 5000);
    }

    function updatePlayerList(roomId) {
        const room = rooms[roomId];
        io.to(roomId).emit('updatePlayerList', room.players);
    }

    function getPlayerData(room) {
        return room.players.map(p => ({
            id: p.id,
            name: p.name,
            pos: p.pos
        }));
    }

    function payday(player) {
        socket.emit('notification', 'payday!');
        let paymoney = player.totalIncome - player.totalExpenses;
        if (player.downsized) {
            paymoney -= player.salary;
            //mà không đi thì sao trúng pay day được nhỉ
        }
        if (paymoney < 0) {
            //nếu nhận âm thì xem có đủ tiền tiết kiệm không
            if (player.savings < Math.abs(paymoney)) {
                //cho người chơi 15s để vay, bán tài sản
                prepareMoney(player, Math.abs(paymoney) - player.savings);
            }
        }
        player.savings += paymoney;
        reCalcCashFlow(player);
    }

    //hàm cho người chơi thời gian chuẩn bị tiền
    function prepareMoney(player, mount) {
        socket.emit('notification', `Bạn có 20 giây để chuẩn bị ${mount} tiền!`);
        player.prepareMoneyTime = setTimeout(() => {
            if (player.savings < mount) {
                //phá sản
                socket.emit('notification', 'Bạn đã phá sản vì không đủ tiền!');
            }
        }, 20000);
    }
    //hàm phá sản
});

server.listen(3000, () => {
    console.log('Server opened...');
});
