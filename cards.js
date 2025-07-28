cards =  {
    bigDeals: [
        {
            //bất động sản lớn
            //mô tả html
            description: 'Chung cư 8 căn hộ.',
            //giá
            cost: 220000,
            //thế chấp
            mostgage: 180000,
            //trả trước
            downpay: 40000,
            //dòng tiền
            cashflow: 2000,
            //thực hiện
            async effect(io, room, player) {
                //người chơi chọn có dùng hay không
                socket.emit('chooseOption', {
                    message: description,
                    option1: 'Mua',
                    option2: 'Không mua'
                });
                const buy = await new Promise((resolve) => {
                    socket.on('optionChosen', (choice) => {
                        resolve(choice === 'Mua');
                    });
                });
                if (!buy) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                if (player.money < this.downpay) {
                    socket.emit('message', 'Bạn không đủ tiền để mua bất động sản này.');
                    return;
                }
                //TODO: thêm vào tài sản, nợ, dòng tiền, trừ tiền
            }
        },
        {
            //kinh doanh lớn
            //mô tả html
            description: 'Công ty TNHH ABC.',
            //giá
            cost: 300000,
            //thế chấp
            mostgage: 240000,
            //trả trước
            downpay: 60000,
            //dòng tiền
            cashflow: 0,
            //thực hiện
            async effect(io, room, player) {
                //người chơi chọn có dùng hay không
                socket.emit('chooseOption', {
                    message: this.description,
                    option1: 'Mua',
                    option2: 'Không mua'
                });
                const buy = await new Promise((resolve) => {
                    socket.on('optionChosen', (choice) => {
                        resolve(choice === 'Mua');
                    });
                });
                if (!buy) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                if (player.savings < this.downpay) {
                    socket.emit('message', 'Bạn không đủ tiền để mua kinh doanh này.');
                    return;
                }
                //TODO: thêm vào tài sản, nợ, dòng tiền, trừ tiền
            }
        },

    ],
    smallDeals: [
        {
            //cổ phiếu MYT4U
            //mô tả html
            description: 'Cổ phiếu MYT4U.',
            //mã
            symbol: 'MYT4U',
            //giá
            price: 10,
            //tầm giá giao động
            range: [5, 40],
            //thực hiện
            async effect(io, room, player) {
               socket.emit('chooseAmount', {
                    message: this.description,
               });
                const amount = await new Promise((resolve) => {
                    socket.once('amountChosen', (amount) => {
                        resolve(amount);
                    });
                });
                if (amount <= 0) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                const totalCost = this.price * amount;
                if (player.savings < totalCost) {
                    socket.emit('message', 'Bạn không đủ tiền để mua cổ phiếu này.');
                    return;
                }
                //TODO: thêm vào tài sản, nợ, trừ tiền

            }
        },
        {
            //bất động sản
            //mô tả html
            description: 'Căn nhà 2/3.',
            //thực hiện
            async effect(io, room, player) {
                socket.emit('chooseOption', {
                    message: this.description,
                    option1: 'Mua',
                    option2: 'Không mua'
                });
                const buy = await new Promise((resolve) => {
                    socket.on('optionChosen', (choice) => {
                        resolve(choice === 'Mua');
                    });
                });
                if (!buy) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                if (player.savings < 50000) {
                    socket.emit('message', 'Bạn không đủ tiền để mua bất động sản này.');
                    return;
                }
                //TODO: thêm vào tài sản, nợ, dòng tiền, trừ tiền
            }

        },
        {
            //vàng
            //mô tả html
            description: 'Vàng.',
            //giá
            price: 1000,

            //thực hiện
            async effect(io, room, player) {
                socket.emit('chooseAmount', {
                    message: this.description,
                });
                const amount = await new Promise((resolve) => {
                    socket.once('amountChosen', (amount) => {
                        resolve(amount);
                    });
                });
                if (amount <= 0) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                const totalCost = 1000 * amount; // giả sử mỗi lượng vàng giá 1000
                if (player.savings < totalCost) {
                    socket.emit('message', 'Bạn không đủ tiền để mua vàng.');
                    return;
                }
            }
        },
        {
            //kinh doanh
            //mô tả html
            description: 'Đầu tư vào hộ kinh doanh nhỏ.',
            //giá
            price: 50000,
            //dòng tiền
            cashflow: 5000,
            //thực hiện
            async effect(io, room, player) {
                socket.emit('chooseOption', {
                    message: this.description,
                    option1: 'Đầu tư',
                    option2: 'Không đầu tư'
                });
                const invest = await new Promise((resolve) => {
                    socket.on('optionChosen', (choice) => {
                        resolve(choice === 'Đầu tư');
                    });
                });
                if (!invest) {
                    return;
                }
                //kiểm tra người chơi có đủ tiền không
                if (player.savings < this.price) {
                    socket.emit('message', 'Bạn không đủ tiền để đầu tư vào kinh doanh này.');
                    return;
                }
            }
        }
    ],
    market: [
        {
            //chia tách cổ phiếu MYT4U
            //mô tả html
            description: 'tăng gấp đôi lượng cổ phiểu cho mỗi người chơi.',
            //thực hiện
            async effect(io, room, player) {
                //nếu người chơi có cổ phiếu MYT4U
                if (player.assets.some(asset => asset.symbol === 'MYT4U')) {
                    //tăng gấp đôi số lượng cổ phiếu
                    player.assets = player.assets.map(asset => {
                        if (asset.symbol === 'MYT4U') {
                            asset.amount *= 2;
                        }
                        return;
                    });
                    socket.emit('message', 'Bạn đã nhận được cổ phiếu MYT4U gấp đôi.');
                } else {
                    socket.emit('message', 'Bạn không có cổ phiếu MYT4U để nhận.');
                }
            }
        },
        {
            //người mua
            //mô tả html
            description: 'có người mua vàng',
            //thực hiện
            async effect(io, room, player) {
                //kiểm tra người chơi có vàng không
                if (player.assets.some(asset => asset.type === 'gold')) {
                    //tính toán giá mua
                    const goldAsset = player.assets.find(asset => asset.type === 'gold');
                    const sellPrice = goldAsset.amount * 1200; // giả sử giá mua là 1200 mỗi lượng
                    //thông báo cho người chơi
                    socket.emit('message', `Bạn có thể bán vàng với giá ${sellPrice}.`);
                    //thực hiện bán
                    socket.emit('chooseOption', {
                        message: 'Bạn có muốn bán vàng không?',
                        option1: 'Bán',
                        option2: 'Không bán'
                    });
                    const choice = await new Promise((resolve) => {
                        socket.on('optionChosen', (choice) => {
                            resolve(choice);
                        });
                    });
                    if (choice === 'Bán') {
                        player.savings += sellPrice;
                        player.assets = player.assets.filter(asset => asset.type !== 'vàng');
                        socket.emit('message', `Bạn đã bán vàng và nhận được ${sellPrice}.`);
                    } else {
                        socket.emit('message', 'Bạn đã chọn không bán vàng.');
                    }
                } else {
                    socket.emit('message', 'Bạn không có vàng để bán.');
                }
            }
        },
        {
            //kinh doanh bắt đầu có lời
            //mô tả html
            description: 'hoạt động kinh doanh bắt đầu có lời.',
            //thực hiện
            async effect(io, room, player) {
                //kiểm tra người chơi có kinh doanh không
                if (player.assets.some(asset => asset.type === 'business')) {
                    //tăng dòng tiền của kinh doanh
                    player.assets = player.assets.map(asset => {
                        if (asset.type === 'business') {
                            asset.cashflow += 1000; // giả sử tăng thêm 1000 dòng tiền
                        }
                        return asset;
                    });
                    socket.emit('message', 'Kinh doanh của bạn đã bắt đầu có lời, dòng tiền đã tăng lên.');
                } else {
                    socket.emit('message', 'Bạn không có kinh doanh để nhận lợi nhuận.');
                }
            }
        },
        {
            //vỡ ống nước
            //mô tả html
            description: 'vỡ ống nước hàng loạt, ai có nhà sẽ phải trả tiền sửa chữa.',
            //thực hiện
            async effect(io, room, player,) {
                //tất cả người chơi có nhà sẽ phải trả tiền sửa chữa
                const playersWithHouse = room.players.filter(p => p.assets.some(asset => asset.type === 'house'));
                if (playersWithHouse.length === 0) {
                    socket.emit('message', 'Không có người chơi nào có nhà để sửa chữa.');
                    return;
                }
                //thông báo cho người chơi
                socket.emit('message', 'Vỡ ống nước hàng loạt, tất cả người chơi có nhà sẽ phải trả tiền sửa chữa.');
                //mỗi người chơi có nhà sẽ phải trả tiền sửa chữa
                for (const p of playersWithHouse) {
                    //kiểm tra người chơi có đủ tiền không
                    if (p.savings < 5000) {
                        socket.emit('message', `${p.name} không đủ tiền để sửa chữa nhà.`);
                        continue;
                    }
                    //trừ tiền sửa chữa
                    p.savings -= 5000;
                    socket.emit('message', `${p.name} đã trả 5000 để sửa chữa nhà.`);
                }
            }
        },
    ],
    doodads: [
        {
            //kì nghỉ
            //mô tả html
            description: 'Chi trả tiền cho kỳ nghỉ',
            //giá
            cost: 2000,
            //thực hiện
            async effect(io, room, player) {
                //kiểm tra người chơi có đủ tiền không
                if (player.savings < 2000) {
                    socket.emit('message', 'Bạn không đủ tiền để chi trả cho kỳ nghỉ.');
                    //TODO: cho người chơi 20s để chuẩn bị tiền
                    return;
                }
                //trừ tiền
                player.savings -= 2000;
                socket.emit('message', 'Bạn đã chi trả 2000 cho kỳ nghỉ.');
            }
        },
        {
            //sửa chữa
            //mô tả html
            description: 'Chi trả tiền sửa chữa nhà cửa.',
            //giá
            cost: 3000,
            //thực hiện
            async effect(io, room, player) {
                //kiểm tra người chơi có đủ tiền không
                if (player.savings < 3000) {
                    socket.emit('message', 'Bạn không đủ tiền để chi trả cho sửa chữa nhà cửa.');
                    //TODO: cho người chơi 20s để chuẩn bị tiền
                    return;
                }
                //trừ tiền
                player.savings -= 3000;

            }
        }
    ]
};
module.exports = {
    cards
}