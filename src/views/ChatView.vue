<template>
  <div class="chat-container">
    <!-- 左侧联系人列表 -->
    <el-aside width="300px" class="contact-list">
      <!-- 新增：查找用户区域 -->
      <div class="search-user-bar">
        <el-input v-model="userSearchQuery" placeholder="查找用户" size="small" style="width: 150px;" />
        <el-button type="primary" size="small" @click="searchUsers">查找</el-button>
      </div>
      <el-scrollbar style="height:calc(100vh - 60px);">
        <!-- 好友请求展示 -->
        <div v-if="friendRequests.length" class="friend-request-section">
          <div class="contact-list-title">好友请求</div>
          <div v-for="req in friendRequests" :key="req.friendshipId" class="friend-request-item">
            <el-avatar :src="require('@/assets/avatars/avatar_2.png')" :size="32" />
            <span style="flex:1;">来自用户{{ req.user1Id }}</span>
            <el-button type="primary" size="mini" @click="acceptFriendRequest(req.friendshipId)">同意</el-button>
            <el-button type="danger" size="mini" @click="rejectFriendRequest(req.friendshipId)">拒绝</el-button>
          </div>
        </div>
        <!-- 查找结果展示 -->
        <div v-if="userSearchResults.length" class="user-search-results">
          <div v-for="user in userSearchResults" :key="user.userId" class="user-search-item">
            <el-avatar :src="user.avatar" :size="32" />
            <span style="flex:1;">{{ user.name }}</span>
            <el-button type="success" size="mini" @click.stop="addContact(user)">加为联系人</el-button>
          </div>
        </div>
        <!-- 联系人列表 -->
        <div class="contact-list-section">
          <div class="contact-list-title">联系人</div>
          <div v-if="contacts.length === 0" class="no-contacts">暂无联系人，请添加</div>
          <div v-for="contact in filteredContacts" :key="contact.id" class="contact-list-item" :class="{active: contact.id === activeContact.id}" @click="selectContact(contact)">
            <el-avatar :src="contact.avatar" :size="40"></el-avatar>
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div class="last-message">{{ contact.lastMessage }}</div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-aside>

    <!-- 右侧聊天框 -->
    <el-container class="chat-box">
      <!-- 聊天头部 -->
      <el-header class="chat-header">
        <el-avatar :src="activeContact.avatar" :size="40" class="contact-avatar"></el-avatar>
        <div class="contact-details">
          <h2>{{ activeContact.name || '请选择联系人' }}</h2>
          <p class="contact-status">{{ activeContact.status || '离线' }}</p>
        </div>
      </el-header>

      <!-- 聊天内容 -->
      <el-main class="chat-content" ref="chatContent">
        <el-scrollbar>
          <div
            class="message"
            v-for="message in messages"
            :key="message.id"
            :class="{ 'my-message': message.user === '我', 'other-message': message.user !== '我' }"
          >
            <div class="message-user">{{ message.user }}</div>
            <div class="message-text">{{ message.content || message.text }}</div>
            <div class="message-meta">
              <span class="message-time">{{ message.time }}</span>
              <span v-if="message.status" class="message-status">{{ message.status }}</span>
            </div>
          </div>
        </el-scrollbar>
      </el-main>

      <!-- 聊天底部 -->
      <el-footer class="chat-footer">
        <el-input
          v-model="newMessage"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
          clearable
          class="message-input"
        ></el-input>
        <el-button type="primary" icon="el-icon-s-promotion" @click="sendMessage">
          发送
        </el-button>
        <el-dropdown trigger="click">
          <el-button type="text" icon="el-icon-smile">
            表情包
          </el-button>
          <el-dropdown-menu slot="dropdown" class="emoji-dropdown">
            <div class="emoji-grid">
              <span
                v-for="emoji in emojis"
                :key="emoji"
                class="emoji-item"
                @click="addEmoji(emoji)"
              >
                {{ emoji }}
              </span>
            </div>
          </el-dropdown-menu>
        </el-dropdown>
        <el-upload
          class="attachment-upload"
          action="/api/upload"
          :on-success="handleAttachmentUpload"
          :show-file-list="false"
        >
          <el-button type="text" icon="el-icon-paperclip">附件</el-button>
        </el-upload>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';

export default {
  data() {
    return {
      contacts: [], // 联系人列表从后端获取
      activeContact: {}, // 当前选中的联系人
      messages: [], // 当前聊天记录
      newMessage: '', // 输入框内容
      emojis: [
        '😊', '😂', '😍', '😎', '😢', '👍', '🙏', '🎉', '❤️', '🔥', '🤔', '😴',
        '😡', '🤩', '🥳', '😇', '🤗', '😜', '😱', '😅', '🙌', '💪', '🎁', '🌟'
      ],
      searchQuery: '', // 搜索框内容
      socket: null, // WebSocket对象
      reconnectTimer: null,
      userId: null, // 新增 userId 字段
      userSearchQuery: '',
      userSearchResults: [],
      friendRequests: [], // 新增：好友请求列表
    };
  },
  computed: {
    // 根据搜索框过滤联系人
    filteredContacts() {
      return this.contacts.filter(contact =>
        contact.name.includes(this.searchQuery)
      );
    }
  },
  methods: {
    // 获取联系人列表
    async fetchContacts() {
      try {
        // 直接用 /api/contacts，后端已返回完整联系人信息
        const response = await axiosInstance.get('/contacts');
        // 自动为联系人导入本地头像
        this.contacts = (response.data.contacts || []).map(contact => {
          let avatar = contact.avatar;
          // 兼容数字/字符串/空
          if (!avatar || avatar === 'null') avatar = '1';
          if (/^[1-4]$/.test(avatar)) {
            avatar = require(`@/assets/avatars/avatar_${avatar}.png`);
          } else if (/^avatar_\d+\.png$/.test(avatar)) {
            try {
              avatar = require(`@/assets/avatars/${avatar}`);
            } catch {
              avatar = require('@/assets/avatars/avatar_1.png');
            }
          }
          return { ...contact, avatar };
        });
      } catch (error) {
        this.$message.error('加载联系人列表失败，请稍后重试！');
      }
    },
    // 选择联系人
    async selectContact(contact) {
      this.activeContact = contact;
      try {
        // 修正接口路径，统一用 axiosInstance
        const response = await axiosInstance.get(`/chat/messages/${contact.id}`);
        // 处理历史消息，标记 user 字段
        const myId = this.userId;
        this.messages = (response.data.messages || []).map(msg => {
          // 兼容 from/userId/senderId 字段
          const fromId = msg.from || msg.userId || msg.senderId;
          return {
            ...msg,
            user: fromId == myId ? '我' : contact.name
          };
        });
        this.updateLastMessage(contact.id); // 更新联系人列表中的 lastMessage
        this.scrollToBottom();
      } catch (error) {
        this.$message.error('加载聊天记录失败，请稍后重试！');
      }
    },
    // 发送消息
    async sendMessage() {
      if (this.newMessage.trim() !== '') {
        const message = {
          user: '我',
          text: this.newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: '发送中'
        };
        this.messages.push(message);
        // 日志：输出 socket、readyState、userId、activeContact.id
        console.log('[sendMessage] socket:', this.socket, 'readyState:', this.socket && this.socket.readyState, 'userId:', this.userId, 'activeContact.id:', this.activeContact && this.activeContact.id);
        // 优先用WebSocket发送
        if (this.socket && this.socket.readyState === 1 && this.activeContact.id) {
          const msgObj = {
            from: this.userId,
            to: this.activeContact.id,
            text: this.newMessage,
            time: new Date().toISOString()
          };
          try {
            this.socket.send(JSON.stringify(msgObj));
            message.status = '已发送';
            this.updateLastMessage(this.activeContact.id, this.newMessage); // 更新联系人列表中的 lastMessage
            this.newMessage = '';
            this.scrollToBottom();
          } catch (e) {
            message.status = '发送失败';
            this.$message.error('WebSocket发送失败，尝试HTTP...');
            await this.sendMessageFallback();
          }
        } else {
          // WebSocket不可用时降级HTTP
          await this.sendMessageFallback();
        }
      }
    },
    // HTTP降级发送消息
    async sendMessageFallback() {
      try {
        await axiosInstance.post('/chat/send', {
          toUserId: this.activeContact.id,
          content: this.newMessage
        });
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg) lastMsg.status = '已发送';
        this.updateLastMessage(this.activeContact.id, this.newMessage); // 更新联系人列表中的 lastMessage
        this.newMessage = '';
        this.scrollToBottom();
      } catch (error) {
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg) lastMsg.status = '发送失败';
        this.$message.error('发送消息失败，请稍后重试！');
      }
    },
    // 更新联系人列表中的 lastMessage
    updateLastMessage(contactId, lastMessage = null) {
      const contact = this.contacts.find(c => c.id === contactId);
      if (contact) {
        contact.lastMessage = lastMessage || (this.messages.length > 0 ? this.messages[this.messages.length - 1].text : '');
      }
    },
    // 添加表情
    addEmoji(emoji) {
      this.newMessage += emoji;
    },
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContent = this.$refs.chatContent;
        if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
      });
    },
    // 处理联系人选择
    handleContactSelect(contactId) {
      const contact = this.contacts.find(c => c.id === contactId);
      if (contact) {
        this.selectContact(contact);
      }
    },
    // 处理附件上传
    handleAttachmentUpload(response) {
      const message = {
        user: '我',
        text: `[附件] ${response.fileName}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: '已发送'
      };
      this.messages.push(message);
      this.scrollToBottom();
      // 附件消息也可通过WebSocket通知对方
      if (this.socket && this.socket.readyState === 1 && this.activeContact.id) {
        const msgObj = {
          from: this.userId,
          to: this.activeContact.id,
          text: `[附件] ${response.fileUrl || response.fileName}`,
          time: new Date().toISOString()
        };
        this.socket.send(JSON.stringify(msgObj));
      }
    },
    // WebSocket连接
    connectWebSocket() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      // 日志：输出 userId 和 ws 连接地址
      console.log('[WebSocket] userId:', this.userId);
      const wsUrl = `ws://localhost:8081/ws/chat?userId=${this.userId}`;
      console.log('[WebSocket] connect url:', wsUrl);
      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = () => {
        console.log("WebSocket connected");
      };
      this.socket.onerror = (e) => {
        console.error('[WebSocket] 连接出错', e);
      };
      this.socket.onclose = () => {
        console.log("WebSocket disconnected");
      };
      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // 判断是否为当前聊天对象的消息
          if (this.activeContact && msg.from === this.activeContact.id) {
            this.messages.push({
              user: this.activeContact.name,
              text: msg.text,
              time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: '已读'
            });
            this.scrollToBottom();
            this.updateLastMessage(this.activeContact.id, msg.text);
          } else {
            // 其它联系人消息可做未读提醒
            const contact = this.contacts.find(c => c.id === msg.from);
            if (contact) {
              contact.lastMessage = msg.text;
            }
          }
        } catch (e) {
          console.log('收到非JSON消息:', event.data);
        }
      };
    },
    // 获取当前用户id
    async fetchUserId() {
      try {
        const res = await axios.get('/api/user/info');
        this.userId = res.data.id;
      } catch {
        this.userId = null;
      }
    },
    async searchUsers() {
      if (!this.userSearchQuery.trim()) return;
      try {
        // 新接口：/api/friendship/search
        const res = await axiosInstance.get('/friendship/search', { params: { keyword: this.userSearchQuery } });
        // 自动为查找结果导入本地头像
        this.userSearchResults = (res.data.users || []).map(user => {
          let avatar = user.avatar;
          if (!avatar || avatar === 'null') avatar = '1';
          if (/^[1-4]$/.test(avatar)) {
            avatar = require(`@/assets/avatars/avatar_${avatar}.png`);
          } else if (/^avatar_\d+\.png$/.test(avatar)) {
            try {
              avatar = require(`@/assets/avatars/${avatar}`);
            } catch {
              avatar = require('@/assets/avatars/avatar_1.png');
            }
          }
          return { ...user, avatar };
        });
      } catch {
        this.$message.error('查找用户失败');
      }
    },
    async addContact(user) {
      try {
        // 1. 获取当前用户ID（从全局userInfo或this.userId）
        const fromUserId = Number(this.userId || (this.$store.state.userInfo && this.$store.state.userInfo.id));
        // 2. 获取目标用户ID，兼容 user.userId、user.id、user.uid
        let toUserId = user.userId || user.id || user.uid;
        toUserId = Number(toUserId);
        // 日志：打印所有关键参数
        console.log('[加为联系人] fromUserId:', fromUserId, 'toUserId:', toUserId, 'user:', user, 'this.userId:', this.userId, 'store.userInfo:', this.$store.state.userInfo);
        if (!fromUserId || !toUserId || isNaN(fromUserId) || isNaN(toUserId)) {
          this.$message.error('用户ID无效，无法添加');
          console.error('[加为联系人] 用户ID无效', { fromUserId, toUserId, user, thisUserId: this.userId, storeUserInfo: this.$store.state.userInfo });
          return;
        }
        // 3. 发起加好友请求（新接口：/api/friendship/addfriend，带token）
        const token = localStorage.getItem('token') || (this.$store.state.userInfo && this.$store.state.userInfo.token);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axiosInstance.post('/friendship/addfriend', {
          userId: toUserId
        }, { headers });
        this.$message.success('好友请求已发送');
        // 4. 可选：刷新好友请求列表
        this.userSearchResults = [];
        await this.fetchFriendRequests();
      } catch (e) {
        this.$message.error((e.response && e.response.data && e.response.data.message) || '添加失败');
        console.error('[加为联系人] 异常', e);
      }
    },
    // 新增：获取好友请求列表
    async fetchFriendRequests() {
      try {
        const userId = this.userId || (this.$store.state.userInfo && this.$store.state.userInfo.id);
        if (!userId) return;
        // 复用 /api/friendship/list/{userId}，筛选 status === 'pending' 且 toUserId === 当前用户
        const response = await axiosInstance.get(`/friendship/list/${userId}`);
        const requests = (response.data.friends || []).filter(f => f.status === 'pending' && f.user2Id === userId);
        this.friendRequests = requests;
      } catch (error) {
        this.friendRequests = [];
      }
    },
    // 同意好友请求
    async acceptFriendRequest(friendshipId) {
      try {
        const userId = this.userId || (this.$store.state.userInfo && this.$store.state.userInfo.id);
        await axiosInstance.post('/friendship/accept', { friendshipId, actionUserId: userId });
        this.$message.success('已同意好友请求');
        this.fetchContacts();
        this.fetchFriendRequests();
      } catch (e) {
        this.$message.error('操作失败');
      }
    },
    // 拒绝好友请求
    async rejectFriendRequest(friendshipId) {
      try {
        const userId = this.userId || (this.$store.state.userInfo && this.$store.state.userInfo.id);
        await axiosInstance.post('/friendship/reject', { friendshipId, actionUserId: userId });
        this.$message.success('已拒绝好友请求');
        this.fetchFriendRequests();
      } catch (e) {
        this.$message.error('操作失败');
      }
    }
  },
  async created() {
    // 恢复 userId，优先 Vuex，其次 localStorage
    let userId = null;
    if (this.$store && this.$store.state && this.$store.state.userInfo && this.$store.state.userInfo.id) {
      userId = this.$store.state.userInfo.id;
    } else {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          userId = userInfo.id || userInfo.userId || userInfo.uid;
        }
      } catch (e) {
        // 忽略
      }
    }
    this.userId = userId ? Number(userId) : null;
    await this.fetchContacts(); // 初始化时加载联系人列表
    await this.fetchFriendRequests(); // 初始化时加载好友请求
    if (this.userId) {
      this.connectWebSocket();
    }
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5; /* 更柔和的背景色 */
}

.contact-list {
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0; /* 更细的边框 */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.search-input {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f9f9f9; /* 搜索框背景色 */
  border-radius: 8px; /* 圆角 */
  margin: 10px; /* 增加间距 */
}

.search-user-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 0 10px;
}

.user-search-results {
  padding: 8px 10px;
}

.user-search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.contact-list-section {
  padding: 10px;
}

.contact-list-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.no-contacts {
  text-align: center;
  color: #888;
  padding: 20px 0;
}

.contact-list-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-list-item:hover {
  background-color: #f5f5f5;
}

.contact-list-item.active {
  background-color: #e1f5fe; /* 更明显的选中效果 */
}

.contact-info {
  display: inline-block;
  margin-left: 10px;
  vertical-align: top;
}

.contact-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.last-message {
  font-size: 12px;
  color: #888;
}

.contact-avatar {
  margin-right: 10px;
  border: 2px solid #e0e0e0; /* 添加边框 */
  border-radius: 50%; /* 圆形头像 */
}

.contact-details {
  display: inline-block;
  vertical-align: middle;
}

.contact-status {
  font-size: 12px;
  color: #4caf50; /* 在线状态颜色 */
}

.chat-box {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9; /* 更柔和的背景色 */
  border-bottom: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0; /* 圆角 */
}

.chat-content {
  flex: 1;
  padding: 28px 32px 18px 32px;
  overflow-y: auto;
  background: linear-gradient(120deg, #f5f7fa 60%, #e3f2fd 100%);
  border-radius: 0 0 12px 12px;
}

.message {
  position: relative;
  margin-bottom: 18px;
  padding: 14px 18px;
  border-radius: 18px;
  max-width: 65%;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(33,150,243,0.08);
  transition: transform 0.18s;
  font-size: 15px;
  line-height: 1.7;
}

.my-message {
  align-self: flex-end;
  background: linear-gradient(90deg, #b2ffdb 0%, #80deea 100%);
  color: #222;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 18px;
  margin-left: 60px;
  margin-right: 8px;
  box-shadow: 0 2px 12px #b2ebf2;
}

.my-message::after {
  content: '';
  position: absolute;
  right: -12px;
  top: 18px;
  border-width: 8px 0 8px 12px;
  border-style: solid;
  border-color: transparent transparent transparent #80deea;
}

.other-message {
  align-self: flex-start;
  background: #fff;
  color: #333;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 18px;
  margin-right: 60px;
  margin-left: 8px;
  border: 1.5px solid #e0e0e0;
  box-shadow: 0 2px 8px #e3f2fd;
}

.other-message::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 18px;
  border-width: 8px 12px 8px 0;
  border-style: solid;
  border-color: transparent #e0e0e0 transparent transparent;
}

.message:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(33,150,243,0.13);
}

.message-user {
  font-weight: bold;
  margin-bottom: 4px;
  color: #1976d2;
  font-size: 15px;
}

.my-message .message-user {
  color: #009688;
}

.other-message .message-user {
  color: #1976d2;
}

.message-text {
  margin-bottom: 4px;
  color: #222;
  word-break: break-all;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: #aaa;
  gap: 10px;
}

.message-status {
  font-size: 11px;
  color: #bdbdbd;
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px; /* 圆角 */
}

.message-input {
  flex: 1;
  margin-right: 10px;
  border-radius: 8px; /* 圆角 */
  background-color: #ffffff;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1); /* 内部阴影 */
}

.emoji-dropdown {
  max-height: 200px;
  overflow-y: auto;
  background-color: #ffffff;
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
  gap: 5px;
  padding: 10px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.emoji-item:hover {
  transform: scale(1.3); /* 更大的缩放效果 */
}

.attachment-upload {
  margin-left: 10px;
  color: #007bff; /* 按钮颜色 */
  cursor: pointer;
  transition: color 0.2s;
}

.attachment-upload:hover {
  color: #0056b3; /* 悬停颜色 */
}

.friend-request-section {
  padding: 10px;
  background: #fffbe6;
  border-radius: 8px;
  margin-bottom: 10px;
}

.friend-request-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  background: #fffde7;
  border: 1px solid #ffe082;
  border-radius: 6px;
  padding: 6px 8px;
  transition: background-color 0.2s;
}

.friend-request-item:hover {
  background-color: #f1f1f1;
}
</style>