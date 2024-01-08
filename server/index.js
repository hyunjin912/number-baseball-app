const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userController = require('./controllers/user.controller');
const roomController = require('./controllers/room.controller');

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.DB)
  .then(() => console.log('MongoDB Connect SUCCESS'))
  .catch((err) => console.log('MongoDB Connect ERROR\n', err));

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

io.on('connection', async (socket) => {
  const token = socket.id;

  socket.on('login', async (user, cb) => {
    try {
      const updatedUser = await userController.updateUser(
        { nickname: user.nickname },
        { token },
      );

      const rooms = await roomController.getRooms();
      const users = await userController.getUsers();

      cb({ ok: true, currentUser: updatedUser });

      io.emit('noticeRoom', rooms);
      io.emit('noticeUser', users);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('registerRoom', async (room, cb) => {
    socket.join(`room-${room.roomNumber}`);

    try {
      const newRoom = await roomController.saveRoom(room);

      cb({ ok: true, newRoom });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('deleteRoom', async (room, cb) => {
    clearInterval(clear);

    try {
      const deletedRoom = await roomController.deleteRoom(room.roomNumber);
      const rooms = await roomController.getRooms();

      cb({ ok: true });

      if (room.usersInTheRoom.length === 2) {
        socket.to(`room-${room.roomNumber}`).emit('leaveRoom');
        socket.to(`room-${room.roomNumber}`).emit('callTimer', 'clear');
      }
      // io.to(`room-${room.roomNumber}`).emit('getMessage', []);
      io.emit('noticeRoom', rooms);
    } catch (e) {
      cb({ ok: false, error: e.message });
    } finally {
      socket.leave(`room-${room.roomNumber}`);
    }
  });

  socket.on('enterRoom', async (room, user, cb) => {
    socket.join(`room-${room.roomNumber}`);

    const findedRoom = await roomController.getRoom(room.roomNumber);
    findedRoom.usersInTheRoom.push({
      nickname: user.nickname,
      settingNumber: '',
      team: '',
    });
    await findedRoom.save();
    const rooms = await roomController.getRooms();

    cb({ ok: true, newRoom: findedRoom });
    io.emit('noticeRoom', rooms);
    socket.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom);
  });

  socket.on('selectTeam', async (team, room, cb) => {
    try {
      const findedRoom = await roomController.getRoom(room.roomNumber);
      const findedUser = await userController.getUser(token);
      const { usersInTheRoom } = findedRoom;
      const [currentUserInTheRoom] = usersInTheRoom.filter(
        (user) => user.nickname === findedUser.nickname,
      );
      currentUserInTheRoom.team = team;
      const newMessage = {
        type: 'system',
        msg: `${findedUser.nickname}님이 입장하였습니다.`,
      };
      const ruleMessage = {
        type: 'rule',
        msg: '숫자 야구 게임에 오신 것을 환영합니다. 양 팀이 하단에 생성된 입력 창 중에서 상대 팀이 맞춰야 하는 숫자 4자리를 설정 후 READY 버튼 클릭 시 시작되며, 나머지 입력 창에 4자리를 입력하여 상대 팀의 번호를 맞추면 됩니다. 순서는 방장부터 시작하며 각 팀당 90초입니다. 90초가 지나면 기회를 잃게 되는 점 주의해주세요.',
      };
      const isHost = findedRoom.author.nickname === findedUser.nickname;
      isHost
        ? findedRoom.messages.push(newMessage)
        : findedRoom.messages.push(newMessage, ruleMessage);

      await findedRoom.save();

      cb({ ok: true, newRoom: findedRoom });

      io.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom);

      isHost
        ? socket.emit('getMessage', [newMessage])
        : io
            .to(`room-${room.roomNumber}`)
            .emit('getMessage', [newMessage, ruleMessage]);

      if (isHost) {
        const rooms = await roomController.getRooms();
        io.emit('noticeRoom', rooms);
      }
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('leaveRoom', async (room, cb) => {
    clearInterval(clear);

    try {
      const findedRoom = await roomController.getRoom(room.roomNumber);
      const deletedUserInTheRoom = findedRoom.usersInTheRoom.pop();

      if (deletedUserInTheRoom.team === '') {
        await findedRoom.save();
      } else {
        const newMessage = {
          type: 'system',
          msg: `${deletedUserInTheRoom.nickname}님이 퇴장하였습니다.`,
        };
        const [host] = findedRoom.usersInTheRoom;
        host.ready = false;
        host.settingNumber = '';
        findedRoom.messages.push(newMessage);
        await findedRoom.save();

        socket.to(`room-${room.roomNumber}`).emit('getMessage', [newMessage]);
      }

      cb({ ok: true });

      const rooms = await roomController.getRooms();
      socket.emit('getMessage', []);
      socket.to(`room-${room.roomNumber}`).emit('callTimer', 'clear');
      socket.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom, {
        isReady: false,
        sec: null,
        isMyTurn: false,
      });
      io.to(`room-${room.roomNumber}`).emit('getRecord', []);
      io.emit('noticeRoom', rooms);
    } catch (e) {
      cb({ ok: false, error: e.message });
    } finally {
      socket.leave(`room-${room.roomNumber}`);
    }
  });

  socket.on('callReady', async (settingNumber, room, cb) => {
    try {
      const findedRoom = await roomController.getRoom(room.roomNumber);
      const findedUser = await userController.getUser(token);
      const { usersInTheRoom } = findedRoom;
      const [currentUserInTheRoom] = usersInTheRoom.filter(
        (user) => user.nickname === findedUser.nickname,
      );
      currentUserInTheRoom.ready = true;
      currentUserInTheRoom.settingNumber = settingNumber;
      const newMessage = {
        type: 'user',
        nickname: findedUser.nickname,
        team: currentUserInTheRoom.team,
        msg: '준비완료!!',
      };
      findedRoom.messages.push(newMessage);
      await findedRoom.save();

      cb({ ok: true, messages: findedRoom.messages });

      io.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom);
      io.to(`room-${room.roomNumber}`).emit('getMessage', [newMessage]);

      if (usersInTheRoom.length === 2) {
        const allReady = usersInTheRoom.every((user) => user.ready === true);
        if (allReady) {
          const newMessage = {
            type: 'system',
            msg: `${findedRoom.author.nickname}님부터 바로 시작합니다.`,
          };
          findedRoom.messages.push(newMessage);
          await findedRoom.save();

          io.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom);
          io.to(`room-${room.roomNumber}`).emit('getMessage', [newMessage]);
          io.to(`room-${room.roomNumber}`).emit('getRecord', []);

          io.to(room.roomNumber).emit('callTimer', 'start');
          io.to(room.roomNumber).emit('changeTurn');
        }
      }
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  let clear = null;
  const timer = (sec, cb) => {
    let number = sec;

    return function () {
      if (number <= 0) {
        number = sec;
        clearInterval(clear);
        cb();
        return;
      }
      number--;
      cb(number);
    };
  };

  socket.on('clearTimer', () => {
    clearInterval(clear);
  });

  socket.on('startTimer', async () => {
    clearInterval(clear);

    const findedUser = await userController.getUser(token);
    const findedRoom = await roomController.getRoomByUser(findedUser.nickname);
    const { usersInTheRoom } = findedRoom;
    const totalSec = 10;

    io.to(`room-${findedRoom.roomNumber}`).emit('timer', totalSec);
    clear = setInterval(
      timer(totalSec, async (currentSec) => {
        if (typeof currentSec !== 'number') {
          const [otherUser] = usersInTheRoom.filter(
            (user) => user.nickname !== findedUser.nickname,
          );
          const newMessage = {
            type: 'system',
            msg: `${findedUser.nickname}님의 시간 초과로 ${otherUser.nickname}님께 기회가 넘어갑니다.`,
          };

          findedRoom.messages.push(newMessage);
          await findedRoom.save();

          io.to(`room-${findedRoom.roomNumber}`).emit('updateRoom', findedRoom);
          io.to(`room-${findedRoom.roomNumber}`).emit('getMessage', [
            newMessage,
          ]);
          io.to(`room-${findedRoom.roomNumber}`).emit('changeTurn');
          socket.to(`room-${findedRoom.roomNumber}`).emit('callTimer', 'start');
          return;
        }
        io.to(`room-${findedRoom.roomNumber}`).emit('timer', currentSec);
      }),
      1000,
    );
  });

  socket.on('sendMessage', async (attackNumber, room, cb) => {
    clearInterval(clear);

    try {
      const findedRoom = await roomController.getRoom(room.roomNumber);
      const findedUser = await userController.getUser(token);
      const { usersInTheRoom } = findedRoom;
      const [currentUserInTheRoom] = usersInTheRoom.filter(
        (user) => user.nickname === findedUser.nickname,
      );
      const [otherUserInTheRoom] = usersInTheRoom.filter(
        (user) => user.nickname !== findedUser.nickname,
      );
      const newMessage = {
        type: 'user',
        nickname: findedUser.nickname,
        team: currentUserInTheRoom.team,
        msg: attackNumber,
      };
      findedRoom.messages.push(newMessage);
      await findedRoom.save();

      const numberToMatch = otherUserInTheRoom.settingNumber;
      let strikeCount = 0;
      let ballCount = 0;
      let score = '';

      for (let i = 0; i < attackNumber.length; i++) {
        for (let j = 0; j < numberToMatch.length; j++) {
          if (Number(attackNumber[i]) === Number(numberToMatch[j])) {
            if (i === j) {
              strikeCount++;
            } else {
              ballCount++;
            }
          }
        }
      }

      if (strikeCount === 0 && ballCount === 0) {
        score = 'OUT';
      } else if (strikeCount === 4 && ballCount === 0) {
        score = 'HOMERUN';
      } else {
        score = `${strikeCount}S ${ballCount}B`;
      }

      cb({ ok: true, messages: findedRoom.messages });

      io.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom);
      io.to(`room-${room.roomNumber}`).emit('getMessage', [newMessage]);
      socket.emit('getRecord', [{ attackNumber, score }]);

      if (score === 'HOMERUN') {
        const homeRunMessage = {
          type: 'system',
          msg: `축하드립니다. ${findedUser.nickname}님이 홈런을 쳤습니다!!`,
        };
        findedRoom.messages.push(newMessage);
        usersInTheRoom.forEach((user) => {
          user.ready = false;
          user.settingNumber = '';
        });
        await findedRoom.save();

        socket.emit('win');
        socket.emit('callTimer', 'clear');
        io.to(`room-${room.roomNumber}`).emit('updateRoom', findedRoom, {
          isReady: false,
          sec: null,
          isMyTurn: false,
        });
        io.to(`room-${room.roomNumber}`).emit('getMessage', [homeRunMessage]);
        return;
      }

      io.to(`room-${room.roomNumber}`).emit('changeTurn');
      socket.to(`room-${room.roomNumber}`).emit('callTimer', 'start');
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('disconnect', async () => {
    clearInterval(clear);

    const findedUser = await userController.getUser(token);
    if (findedUser) {
      const findedRoom = await roomController.getRoomByUser(
        findedUser.nickname,
      );

      if (findedRoom) {
        const isGuest = findedUser.nickname !== findedRoom.author.nickname;

        if (isGuest) {
          const deletedUserInTheRoom = findedRoom.usersInTheRoom.pop();

          if (deletedUserInTheRoom.team === '') {
            await findedRoom.save();
          } else {
            const newMessage = {
              type: 'system',
              msg: `${deletedUserInTheRoom.nickname}님이 퇴장하였습니다.`,
            };
            const [host] = findedRoom.usersInTheRoom;
            host.ready = false;
            host.settingNumber = '';
            findedRoom.messages.push(newMessage);
            await findedRoom.save();

            socket
              .to(`room-${findedRoom.roomNumber}`)
              .emit('getMessage', [newMessage]);
          }

          socket.to(`room-${findedRoom.roomNumber}`).emit('getRecord', []);
          socket.to(`room-${findedRoom.roomNumber}`).emit('callTimer', 'clear');
          socket
            .to(`room-${findedRoom.roomNumber}`)
            .emit('updateRoom', findedRoom, {
              isReady: false,
              sec: null,
              isMyTurn: false,
            });
        }
      }
    }

    const deletedRoom = await roomController.deleteRoom(token);
    const rooms = await roomController.getRooms();
    const deletedUser = await userController.deleteUser(token);
    const users = await userController.getUsers();

    io.emit('noticeRoom', rooms);
    io.emit('noticeUser', users);

    // only host
    socket.to(`room-${token}`).emit('leaveRoom');
    socket.to(`room-${token}`).emit('callTimer', 'clear');
  });
});

app.post('/api/users', async (req, res) => {
  try {
    const savedUser = await userController.saveUser(req.body);
    res.json({ ok: true, currentUser: savedUser, error: null });
  } catch (e) {
    res.json({ ok: false, currentUser: null, error: e.message });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

httpServer.listen(process.env.PORT || 4000);
