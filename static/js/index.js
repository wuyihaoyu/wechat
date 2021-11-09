(function () {
  //判断设备类型
  function getDeviceType() {
    const sUserAgent = navigator.userAgent.toLowerCase();
    const bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
    const bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
    const bIsMidp = sUserAgent.match(/midp/i) == "midp";
    const bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    const bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
    const bIsAndroid = sUserAgent.match(/android/i) == "android";
    const bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
    const bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
    if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      return "phone"
    } else {
      return "pc"
    }
  }
  const deviceType = getDeviceType();
  let mainTpl = deviceType === 'pc' ? '#webChat' : '#iChat';
  let loginTpl = deviceType === 'pc' ? '#login' : '#login-phone';
  //主要业务逻辑
  const mixin = {
    data() {
      return {
        loginUser: {},
        messageData: {},
        curSession: {},
        onlineUsers: [],
        text: "",
        keyword: "",
        curMenu: "chat",
        setting: {
          isTime: true,
          isName: true,
          isVoice: true
        },
        about: {
          version: "",
          license: "",
          author: "",
          email: "",
        },
        baseUrl: "/static/images/qq",
        socketURL: "",
        audioUrl: "/static/images/8400.mp3",
      }
    },
    // 过滤器，来将其转化为所需要格式的值,日期。
    filters: {
      friendlyTime(value) {
        let time = new Date().getTime();
        time = parseInt((time - value) / 1000);
        //存储转换值
        let s;
        if (time < 60 * 3) {//三分钟内
          return '刚刚';
        } else if ((time < 60 * 60) && (time >= 60 * 3)) {
          //超过十分钟少于1小时
          s = Math.floor(time / 60);
          return s + "分钟前";
        } else if ((time < 60 * 60 * 24) && (time >= 60 * 60)) {
          //超过1小时少于24小时
          s = Math.floor(time / 60 / 60);
          return s + "小时前";
        } else if ((time < 60 * 60 * 24 * 3) && (time >= 60 * 60 * 24)) {
          //超过1天少于3天内
          s = Math.floor(time / 60 / 60 / 24);
          return s + "天前";
        } else {
          //超过3天
          let date = new Date(value);
          return date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
        }
      },
      formatTime(value) {
        let date = new Date(value);
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours() > 9 ? date.getHours() : ("0" + date.getHours());
        let minutes = date.getMinutes() > 9 ? date.getMinutes() : ("0" + date.getMinutes());
        let seconds = date.getSeconds() > 9 ? date.getSeconds() : ("0" + date.getSeconds());
        return year + "." + month + "." + day + " " + hour + ":" + minutes + ":" + seconds;
      }
    },
    // 监控自己定义的变量，该变量不在data里面声明，直接在computed里面定义，然后就可以在页面上进行双向数据绑定展示出结果或者用作其他处理
    computed: {
      messages() {
        if (this.curSession.id && this.messageData[this.curSession.id]) {
          return this.messageData[this.curSession.id]
        }
        return [];
      }
    },
    //方法
    methods: {
      addMessage(message, sessionId) {
        if (!this.messageData[sessionId]) {
          this.$set(this.messageData, sessionId, [])
        }
        this.messageData[sessionId].push(message)
        if (this.curSession.id === sessionId) {
          this.scrollFooter('message-list');
        }
        if (message.from.id !== this.loginUser.id && this.curSession.id !== sessionId) {
          if (this.$refs['audio'] && this.setting.isVoice) {
            this.$refs['audio'].play();
          }
        }
      },
      getMessages(sessionId) {
        if (this.messageData[sessionId]) {
          return this.messageData[sessionId]
        }
        return []
      },
      getLatestMessage(sessionId) {
        const messages = this.messageData[sessionId];
        if (messages && messages.length > 0) {
          return messages[messages.length - 1]
        }
        return {}
      },
      getUnReadNum(sessionId) {
        let num = 0;
        const messages = this.messageData[sessionId];
        if (messages && messages.length > 0) {
          messages.forEach((item) => {
            if (!item.isRead) {
              num++;
            }
          })
        }
        return num;
      },
      setSessionRead(sessionId) {
        let messages = this.messageData[sessionId];
        if (messages && messages.length > 0) {
          messages.forEach((item) => {
            item.isRead = true;
          })
        }
      },
      changeSession(session) {
        if (session.id === this.curSession.id) {
          return
        }
        this.curSession = session;
        this.setSessionRead(session.id);
        this.$nextTick(() => {
          this.scrollFooter('message-list');
        })
      },
      searchUser(keyword) {
        let users = [];
        this.onlineUsers.forEach((item) => {
          if ((item.name.indexOf(keyword) !== -1) || (item.id.indexOf(keyword) !== -1)) {
            users.push(item)
          }
        })
        return users;
      },
      sendText(text) {
        text = text.replace(/^\s+|\s+$/g, '');
        if (text) {
          this.sendMessage(this.text, 'text');
          this.text = '';
        } else {
          this.text = '';
        }
      },
      addUser(user) {
        this.onlineUsers.push(user);
      },
      removeUser(user) {
        this.onlineUsers.forEach((item, i) => {
          if (item.id === user.id) {
            this.onlineUsers.splice(i, 1)
          }
        })
      },
      sendMessage(html, type) {
        let message = {
          from: this.loginUser,
          to: this.curSession,
          content: html,
          time: new Date().getTime(),
          type: type,
          isRead: true
        }
        this.addMessage(message, message.to.id);
        if (this.socket) {
          this.socket.emit("message", message.from, message.to, message.content, message.type)
        }
      },
      scrollFooter(name) {
        let $el = this.$refs[name];
        if ($el) {
          this.$nextTick(() => {
            $el.scrollTop = $el.scrollHeight
          })
        }
      },
    }
  };
  //liebiao
  const expressions = [

  ];
  let mapData = [];
  expressions.forEach((item) => {
    mapData[item.title] = item.url;
  });
  //渲染解析
  const MessageText = Vue.extend({
    props: {
      text: {
        type: String,
        default: ""
      }
    },
    render(h) {
      const reg = /\[.*?\]/g;
      let result = this.text.replace(reg, (word) => {
        return "|" + word + "|";
      });
      let arr = result.split('|');
      return h('span',
        arr.map((item) => {
          if (reg.test(item) && mapData[item]) {
            return h('img', {
              class: "expression-img",
              attrs: {
                src: mixin.data().baseUrl + mapData[item]
              }
            })
          } else {
            return item;
          }
        })
      )
    }
  });
  //消息组件，Vue 的全局 API
  const MessageItem = Vue.extend({
    template: "#message-item",
    name: "MessageItem",
    filters: mixin.filters,

    // 子组件需要某个数据，就在内部定义一个prop属性，然后父组件就像给html元素指定特性值一样，把自己的data属性传递给子组件的这个属性。
    // 而当子组件内部发生了什么事情的时候，就通过自定义事件来把这个事情涉及到的数据暴露出来，供父组件处理
    props: {
      message: {
        type: Object,
        default() {
          return {
            from: {
              name: "似水流年"
            },
            to: {},
            content: "666",
            time: new Date().getTime(),
          }
        }
      },
      isSend: {
        type: Boolean,
        default() {
          return false;
        }
      },
      setting: {
        type: Object,
        default() {
          return {
            isName: true,
            isTime: true
          }
        }
      }
    },
  });
  // 用户组件, Vue 的全局 API，
  const UserItem = Vue.extend({
    template: "#user-item",
    name: "UserItem",
    props: {
      user: {
        type: Object,
        default() {
          return {
            name: "似水",
            avatarUrl: "4.jpg"
          }
        }
      },
      num: {
        type: Number,
        default() {
          return 0;
        }
      },
    }
  });
  // 提示消息组件, Vue 的全局 API，
  const MessageComponent = Vue.extend({
    template: "#alter-message",
    props: ["msg", "type"],
    data() {
      return {
        show: false,
      }
    },
    //挂载
    mounted: function () {
      let _this = this;
      this.show = true;
      setTimeout(function () {
        _this.show = false;
      }, 3000)
    },
    methods: {
      delELe: function () {
        this.$el.remove()
      }
    }
  });
  //提示消息插件
  const AlterMessage = function (text, type) {
    let Instance = Vue.extend({
      components: { MessageComponent },
      render(h) {
        return h("MessageComponent", {
          props: {
            msg: text,
            type: type
          }
        })
      }
    });
    document.body.appendChild(new Instance().$mount().$el)
    return Instance;
  };

  //登录组件, Vue 的全局 API，
  const Login = Vue.extend({
    template: loginTpl,
    name: "login",
    data() {
      return {
        user: {
          name: "",
          avatarUrl: "./static/img/10.jpeg"
        },
        avatarList: [
          './static/img/1.jpeg',
          './static/img/2.jpeg',
          './static/img/3.jpeg',
          './static/img/4.jpeg',
          './static/img/5.jpeg',
          './static/img/6.jpeg',
          './static/img/7.png',
          './static/img/8.jpeg',
          './static/img/9.jpeg',
          './static/img/10.jpeg'


        ],
        isShow: false,
        qq: ""
      }
    },
    methods: {
      toggleAvatarSelect() {
        if (this.isShow) {
          this.isShow = false;
          document.removeEventListener('click', this.hideAvatarSelect)
        } else {
          this.isShow = true;
          document.addEventListener('click', this.hideAvatarSelect)
        }
      },
      hideAvatarSelect() {
        this.isShow = false;
        document.removeEventListener('click', this.hideAvatarSelect)
      },
      login() {
        if (this.user.name === '') {
          AlterMessage("请输入用户名称！", "error");
          return
        }
        this.$emit("login", this.user)
      },
    }
  });
  new Vue({
    template: mainTpl,
    el: "#app",
    //创造模板方法，局部方法创造模板
    components: { MessageItem, UserItem, Login, MessageText },
    //当组件使用混入对象时，所有混入对象的选项将被混入该组件本身的选项
    mixins: [mixin],
    data() {
      return {
        expressions,
        isShowExpression: false,
        isConnect: false,
        isShowTool: false,
        isFocus: false
      }
    },
    mounted() {
      document.addEventListener("click", () => {
        this.isShowExpression = false;
        this.isShowTool = false;
      })
      this.initSocket();
    },
    methods: {
      hideExpression() {
        this.isShowExpression = false;
      },
      toggleExpression() {
        this.isShowExpression = !this.isShowExpression;
        this.isShowTool = false;
      },
      pickerExpression(item) {
        this.text += item.title;
      },
      fileChange(e) {
        let file = e.target.files[0];
        let maxSize = 1 * 1024 * 1024;

        let reader = new FileReader();
        reader.readAsDataURL(file); // 读出 base64
        reader.onloadend = () => {
          this.sendMessage("<img src='" + reader.result + "'>", 'image')
          e.target = null;
        };
      },
      login(user) {
        if (this.socket) {
          this.socket.emit("login", user);
        }
      },
      initSocket() {
        let _this = this;
        _this.socket = window.io(this.socketURL);
        _this.socket.on("message", (from, to, message, type) => {
          let isRead = false;
          if (to.type === 'group') {
            if (_this.curSession.id === to.id) {
              isRead = true;
            }
          } else {
            if (_this.curSession.id === from.id) {
              isRead = true;
            }
          }
          let MESSAGE = {
            from: from,
            to: to,
            content: message,
            time: new Date().getTime(),
            type: type,
            isRead
          };
          this.addMessage(MESSAGE, to.type === 'group' ? to.id : from.id)
        });
        _this.socket.on("system", (user, type) => {
          switch (type) {
            case "join":
              _this.addUser(user);
              break;
            case "logout":
              _this.removeUser(user);
              break;
            default:
              return;
          }
        })
        _this.socket.on("error", () => {
          console.log("出错了！！")
        })
        _this.socket.on("connect", (data) => {
          _this.isConnect = true;
          console.log("链接成功！", data)
        })
        _this.socket.on("disconnect", (data) => {
          _this.isConnect = false;
          console.log(JSON.stringify(data) + ' - disconnect');
        })
        _this.socket.on("reconnect_attempt", () => {
          console.info("重新尝试链接！！")
          _this.socket.io.opts.query = {
            User: _this.loginUser ? JSON.stringify(_this.loginUser) : ''
          }
        });
        _this.socket.on("reconnect_failed", () => {
          console.warn('重新链接失败！')
        });
        _this.socket.on("loginSuccess", (user, users) => {
          _this.loginUser = user;
          _this.onlineUsers = users;
          document.title = user.name + " ｜ 聊天室";
        });
        _this.socket.on("loginFail", (message) => {
          AlterMessage(message, 'error')
        });
        _this.socket.on("history-message", (channelId, messages) => {
          _this.$set(_this.messageData, channelId, messages)
        })
      },
      toggleTool() {
        this.isShowTool = !this.isShowTool;
        this.isShowExpression = false;
      }
    }
  });
})();
