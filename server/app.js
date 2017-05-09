const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);



app.get('/', (req, res) => {
  res.send('<h1>Welcome Realtime Server</h1>');
})
let personNum = 0;
let personArr = [];
let question = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗'];
let nowQes = 0;
let nowuser = 0;
let oldUser = 0;
io.on('connection', (socket) => {
  let roomId = socket.handshake.query.id;
  socket.join(roomId);
  for (let i in personArr) {
    console.log(personArr, oldUser, nowuser, socket.id)
    if (personArr[i] === oldUser) {
      personArr[i] = socket.id
      if (i === nowuser) {
        io.sockets.connected[personArr[i]].emit('chekuser', {
          title: question[nowQes],
          num: personNum,
          show: true
        })
      } else {
        io.sockets.connected[personArr[i]].emit('chekuser', {
          num: personNum,
          show: false
        })
      }
    }
  }
  socket.on('login', (data) => {
    socket.name = data.name;
    if (personArr.indexOf(data.name) === -1) {
      personNum++;
      if (personNum >= 2) {
        io.in(roomId).emit('canStart', { status: true })
      }
      personArr.push(socket.id);
    }
    socket.broadcast.to(roomId).emit('login', { name: data.name })
    io.in(roomId).emit('loginNum', { personNum })
  })
  socket.on('start', (data) => {
    let time = 50;
    let p = 0;
    let t = '';
    if (personArr.length > 0) {
      gameStep(p)
      function gameStep (index) {
        nowuser = index;
        nowQes = Math.round(Math.random() * 10);
        io.sockets.connected[personArr[index]].emit('gameTitle', { title: question[nowQes] })
        t = setInterval(() => {
          if (time >= 0){
            io.in(roomId).emit('gameStart', { time, nowUser: personArr[index] })
          } else {
            clearInterval(t);
            p++;
            io.in(roomId).emit('turnUser')
            if (p < personArr.length) {
              time = 50;
              setTimeout(() => {
                gameStep(p)
              }, 2000)
            } else {
              io.in(roomId).emit('gameOver')
            }
          }
          time--;
        }, 1000)
      }
    }
  })
  socket.on('sendAnswer', (data, fns) => {
    if (data.answer === question[nowQes]){
      fns(true)
      io.in(roomId).emit('sendMsg', { msg: '答对了', name: data.name })
    } else {
      fns(false)
      io.in(roomId).emit('sendMsg', { msg: data.answer, name: data.name })
    }
  })
  socket.on('logout', (data) => {
    personArr.pop(socket.name);
    personNum--;
    if (personNum < 2) {
      io.in(roomId).emit('canStart', { status: false })
    }
    socket.broadcast.to(roomId).emit('logout', { name: socket.name, personNum })
    console.log(socket.name, personArr)
  })
  socket.on('disconnect', () => {
    oldUser = socket.id;
  })
  socket.on('drawend', (data) => {
    socket.broadcast.to(roomId).emit('drawend', { img: data.img })
  })
  socket.on('error', (err) => {
    console.log(err)
  })
})

http.listen(3000, () => {
  console.log('listening on 3000 port')
})

