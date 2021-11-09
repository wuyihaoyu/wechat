const express = require('express');
const store = require("./store");
const app = express();
//创建http服务器
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const PORT = 3000;
//用于保存用户信息的数组
let users = [
  {
    id: "group_001",
    name: "相亲相爱一家人",
    avatarUrl: "/static/images/group-icon.png",
    type: "group"
  }
];
let util = {

  getDeviceType(userAgent) {
    let bIsIpad = userAgent.match(/ipad/i) == "ipad";
    let bIsIphoneOs = userAgent.match(/iphone os/i) == "iphone os";
    let bIsMidp = userAgent.match(/midp/i) == "midp";
    let bIsUc7 = userAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    let bIsUc = userAgent.match(/ucweb/i) == "ucweb";
    let bIsAndroid = userAgent.match(/android/i) == "android";
    let bIsCE = userAgent.match(/windows ce/i) == "windows ce";
    let bIsWM = userAgent.match(/windows mobile/i) == "windows mobile";
    if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      return "phone";
    } else {
      return "pc";
    }
  },
  //判读用户是否已经存在
  isHaveName(name) {
    return users.some(item => item.name === name)
  },
  //处理用户登录
  // socket.io 获得客户端IP 返回值是::ffff:  用于IPv4的IPv6套接字通信。应用和套接字方面：:ffff作为IPv6前缀，
  // IP 需要处理一下 用js replace('::ffff:', '')
  login(socket, user, isReconnect) {
    let ip = socket.handshake.address.replace(/::ffff:/, "");
    let deviceType = this.getDeviceType(socket.handshake.headers["user-agent"].toLowerCase());
    user.ip = ip;
    user.deviceType = deviceType;
    user.roomId = socket.id;
    user.type = 'user';
    if (isReconnect) {
      socket.emit('loginSuccess', user, users);
      this.loginSuccess(socket, user)
    } else {
      if (!this.isHaveName(user.name)) {
        user.id = socket.id;
        user.time = new Date().getTime();
        socket.emit('loginSuccess', user, users);
        util.loginSuccess(socket, user);
      } else {
        socket.emit('loginFail', '登录失败,昵称已存在!')
      }
    }
  },
  //用户登录成功
  loginSuccess(socket, user) {
    socket.broadcast.emit('system', user, 'join');
    socket.on('message', (from, to, message, type) => {
      if (to.type === 'user') {
        socket.broadcast.to(to.roomId).emit('message', socket.user, to, message, type);
      }
      if (to.type === 'group') {
        socket.broadcast.emit('message', socket.user, to, message, type);
      }
      store.saveMessage(from, to, message, type)
    });
    socket.user = user;
    users.push(user);
    store.saveUser(user, "登录聊天室");
  },
  //删除储存的用户
  //splice() 方法向/从数组中添加/删除项目，然后返回被删除的项目。
  removeUser(id) {
    users.forEach((item, i) => {
      if (item.id === id) {
        users.splice(i, 1)
      }
    })
  }
};

//中间函数 express.static 
// 传递一个包含静态资源的目录给 express.static 中间件用于立刻开始提供文件。
app.use("/static", express.static('static'));
// get 访问示例会匹配/和其子集路径，如:http:127.0.0.1:3000/app 以及http:127.0.0.1:3000/app[/aa/bb...等等]都会匹配
app.get("/", (req, res) => {
  const path = __dirname + '/static/index.html';
  // 通过给定的路径path读取文件
  res.sendFile(path)
});
io.sockets.on('connection', (socket) => {
  socket.on("disconnect", () => {
    //判断是否是已登录用户
    if (socket.user && socket.user.id) {
      //删除登录用户信息
      util.removeUser(socket.user.id);
      socket.broadcast.emit('system', socket.user, 'logout');
      store.saveUser(socket.user, "  ---退出聊天室");
    }
  });
  // 取出作为参数的主键：socket.handshake.query.userId，属性值是连接产生的socket对象。
  let userJson = socket.handshake.query.User;
  let user = userJson ? JSON.parse(userJson) : {};
  //判断链接用户是否已经登录
  if (user && user.id) {
    //已登录的用户重新登录
    util.login(socket, user, true)
  } else {
    //监听用户登录事件
    socket.on('login', (user) => {
      util.login(socket, user, false)
    });
  }
});
//启动服务器
server.listen(PORT, () => {
  console.log(`服务器已启动在：${PORT}端口`, `http://localhost:${PORT}`)
});


// 1.导入相关模块
// 2.执行过 var app = express() 后，
// 使用app.set 设置express内部的一些参数（options）
// 使用app.use 来注册函数，可以简单的认为是向那个tasks的数组进行push操作
// 3.通过http.createServer 用app来处理请求

