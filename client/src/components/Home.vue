<template>
  <div :class='touchPrevent'>
    <h1>你画我猜</h1>
    <input v-show='islogin' v-model='name' class='nick-name' type='text' />
    <li class='nick-name' v-for='(item, index) in items'>{{item.content}}</li>
    <button v-show='islogin' @click="login">登陆</button>
    <button v-show='!islogin' @click="loginOut">登出</button>
    <button v-if='startBtn' @click="startGame">开始</button>
    <button @click="clearStage">清除画布</button>
    <div>
      <p>{{`剩余时间：`+time}}</p>
      <p v-if='showTime'>你要画的是{{question}}</p>
     <canvas v-show='showTime' id='stage' ref='stage'  height='200'  ></canvas>
     <img v-show='!showTime' class="result-img" :src="imgSrc" />
     <div v-show='sendBox'>
     <input v-model="answer" />
     <button @click='sendAnswer'>发送答案</button></div>
    </div>
    
    <p>总人数:{{personNum}}</p>
  </div>
</template>
<script>
import config from '../config.js';

const io = require('socket.io-client');
export default {
  data () {
    return {
      name: '',
      items: [],
      socket: {},
      personNum: 0,
      ctx: null,
      lineColor: '#222',
      path: [],
      imgSrc: '',
      options: {},
      touchPrevent: 'outtouch',
      time: 0,
      startBtn: false,
      question: '',
      showTime: false,
      answer: '',
      islogin: true,
      sendBox: true
    }
  },
  mounted () {
    this.socket = io('ws://192.168.1.67:3000/?id=2');
    this.socket.on('login', (data) => {
      this.items.push({ content: `${data.name}上线了` })
    })
    this.socket.on('message', (data) => {
      this.items.push(data)
    })
    this.socket.on('logout', (data) => {
      this.items.push({ content: `${data.name}下线了` });
      this.personNum = data.personNum;
    })
    this.socket.on('reconnect', (data) => {
      if (data.show) {
        this.question = data.title;
        this.showTime = data.show;
        this.sendBox = !data.show;
      } else {
        this.showTime = data.show;
        this.sendBox = !data.show;
      }
      this.personNum = data.num;
      console.log(data)
    });
    this.socket.on('drawend', (data) => {
      this.imgSrc = data.img;
    });
    this.socket.on('gameStart', (data) => {
      this.time = data.time
    })
    this.socket.on('canStart', (data) => {
      this.startBtn = data.status;
    })
    this.socket.on('gameOver', () => {
      this.imgSrc = '';
      alert('游戏结束');
    })
    this.socket.on('gameTitle', (data) => {
      this.question = data.title;
      this.showTime = true;
      this.sendBox = false;
    })
    this.socket.on('loginNum', (data) => {
      this.personNum = data.personNum;
    })
    this.socket.on('turnUser', () => {
      this.showTime = false;
      this.showTime = false;
    })
    this.socket.on('sendMsg', (data) => {
      this.items.push({ content: data.name + ':' + data.msg })
    })
    this.init()
  },
  methods: {
    login () {
      if (this.name !== '') {
        this.socket.emit('login', { name: this.name })
        this.islogin = false;
      } else {
        alert('请填入名字')
      }
    },
    loginOut () {
      this.socket.emit('logout', { name: this.name })
      this.islogin = true;
    },
    startGame () {
      this.socket.emit('start')
    },
    sendAnswer () {
      this.socket.emit('sendAnswer', { answer: this.answer, name: this.name }, function (res) {
        if (!res) {
          alert('你答错了,再想想')
        } else {
          alert('恭喜你答对了')
          this.sendBox = false;
        }
      })
    },
    init () {
      const canvas = this.$refs.stage;
      this.ctx = canvas.getContext('2d');
      canvas.addEventListener('touchstart', ((e) => {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.lineColor;
        let point = {
          x: e.touches[0].clientX - canvas.offsetLeft,
          y: e.touches[0].clientY - canvas.offsetTop + canvas.offsetParent.scrollTop
        }
        document.body.style.overflow = 'hidden';
      }))
      canvas.addEventListener('touchmove', ((e) => {
        let pointr = {
          x: e.touches[0].clientX - canvas.offsetLeft,
          y: e.touches[0].clientY - canvas.offsetTop + canvas.offsetParent.scrollTop
        };
        this.ctx.lineTo(pointr.x, pointr.y);
        this.ctx.stroke();
        this.path.push(pointr);
      }))
      canvas.addEventListener('touchend', ((e) => {
        document.body.style.overflow = 'auto';
        let img = config.convertCanvasToImage(canvas);
        this.socket.emit('drawend', { img: img.src })
      }))
    },
    clearStage () {
      const canvas = this.$refs.stage
      this.ctx.clearRect(0, 0, canvas.width, canvas.height)
      this.path = [];
    }
  }
}
</script>
<style scoped>
#stage{
  width: 100%;
  
  border:1px solid #999;
  box-sizing: border-box;
}
.result-img{
  width: 100%;
  height: 200px;
}
.nick-name{
  width: 90%;
  margin-bottom: 10px;
}
</style>
