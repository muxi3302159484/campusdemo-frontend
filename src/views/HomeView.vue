<template>
  <div class="home">
    <!-- 背景图片 -->
    <div class="background-image"></div>

    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <el-avatar
          class="user-avatar"
          :src="userInfo.avatar"
          @mouseenter="showUserInfo"
          @mouseleave="hideUserInfo"
        >
          <el-image
            slot="default"
            src="@/assets/default-avatar.png"
            fit="cover"
          ></el-image>
        </el-avatar>
        <span class="app-title">校园社交系统</span>
      </div>
      <div class="header-right">
        <el-badge :value="unreadNotificationsCount" class="notification-icon" v-if="unreadNotificationsCount > 0">
          <el-icon name="bell" @mouseenter="onIconHover" @mouseleave="onIconLeave" @click="onIconClick"></el-icon>
        </el-badge>
        <el-icon name="bell" class="notification-icon" v-else @mouseenter="onIconHover" @mouseleave="onIconLeave" @click="onIconClick"></el-icon>
        <el-button
          type="primary"
          class="feed-button interactive-button"
          @click="navigateToFeedView"
        >
          动态
        </el-button>
        <el-button
          type="danger"
          class="logout-button"
          @click="logout"
        >
          退出登录
        </el-button>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 左侧菜单 -->
      <el-aside width="250px" class="sidebar">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect">
          <el-menu-item index="1">用户信息</el-menu-item>
          <el-menu-item index="2">动态</el-menu-item>
          <el-menu-item index="3">课程</el-menu-item>
          <el-menu-item index="4">活动</el-menu-item>
          <el-menu-item index="5">社团</el-menu-item>
          <el-menu-item index="6">消息</el-menu-item>
          <el-menu-item index="7">搜索</el-menu-item>
          <el-menu-item index="8">设置</el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容 -->
      <el-main>
        <div v-if="activeMenu === '1'">
          <!-- 用户信息模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">个人资料</h3>
            <p>姓名: {{ userInfo.name }}</p>
            <p>角色: {{ userInfo.role }}</p>
            <p>邮箱: {{ userInfo.email }}</p>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">通知</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(notification, index) in notifications"
                :key="index"
                :timestamp="notification.time"
                @click="markNotificationAsRead(index); navigateTo(notification.link)"
                class="notification-item"
              >
                {{ notification.content }}
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <div v-if="activeMenu === '2'">
          <!-- 动态模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">好友动态</h3>
            <p>显示好友的最新动态...</p>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">社团动态</h3>
            <p>显示社团的最新动态...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '3'">
          <!-- 课程模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">课程表</h3>
            <el-button
              type="primary"
              size="small"
              @click="toggleEditMode"
              class="edit-button"
            >
              {{ isEditing ? '保存' : '编辑' }}
            </el-button>
            <el-table :data="schedule" border>
              <el-table-column prop="period" label="节次">
                <template v-slot="scope">
                  <span>{{ scope.row.period }}</span>
                </template>
              </el-table-column>
              <el-table-column
                v-for="(day, index) in weekdays"
                :key="index"
                :label="day"
              >
                <template v-slot="scope">
                  <div class="course-cell" :class="{ 'has-course': scope.row.courses[index].course }">
                    <div v-if="isEditing">
                      <el-input
                        v-model="scope.row.courses[index].course"
                        size="small"
                        placeholder="课程"
                        class="course-input"
                      ></el-input>
                      <el-input
                        v-model="scope.row.courses[index].location"
                        size="small"
                        placeholder="地点"
                        class="location-input"
                      ></el-input>
                    </div>
                    <div v-else>
                      <span class="course-text">{{ scope.row.courses[index].course }}</span>
                      <span class="location-text">{{ scope.row.courses[index].location }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">课程公告</h3>
            <p>显示课程相关的最新公告...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '4'">
          <!-- 活动模块 -->
          <el-card shadow="hover" class="card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h3 class="card-title">活动列表</h3>
              <el-tooltip content="刷新活动列表" placement="top">
                <el-button icon="el-icon-refresh" size="mini" circle @click="fetchEvents" style="margin-right: 8px;" />
              </el-tooltip>
            </div>
            <el-table :data="events" border style="width: 100%">
              <el-table-column prop="eventId" label="ID" width="60" />
              <el-table-column prop="eventName" label="活动名称" min-width="140" />
              <el-table-column prop="organizerType" label="主办方" min-width="100" />
              <el-table-column prop="startTime" label="开始时间" min-width="140">
                <template slot-scope="scope">
                  {{ scope.row.startTime | formatDateTime }}
                </template>
              </el-table-column>
              <el-table-column prop="location" label="地点" min-width="100" />
              <el-table-column prop="maxParticipants" label="人数上限" width="90" />
              <el-table-column label="描述" min-width="180">
                <template slot-scope="scope">
                  <el-popover trigger="hover" placement="top" width="300">
                    <p>{{ scope.row.description }}</p>
                    <span slot="reference">
                      {{ scope.row.description && scope.row.description.length > 16 ? scope.row.description.slice(0, 16) + '...' : scope.row.description }}
                    </span>
                  </el-popover>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">活动报名</h3>
            <p>用户可以报名参加活动...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '5'">
          <!-- 社团模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">社团列表</h3>
            <p>显示校园内的所有社团...</p>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">社团活动</h3>
            <p>显示用户加入的社团活动...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '6'">
          <!-- 消息模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">私信</h3>
            <p>用户可以与好友私信交流...</p>
            <el-button type="primary" @click="goToChatView">进入私信</el-button>
          </el-card>
        </div>

        <div v-if="activeMenu === '7'">
          <!-- 搜索模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">搜索用户</h3>
            <p>用户可以搜索并添加好友...</p>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">搜索社团</h3>
            <p>用户可以搜索并加入社团...</p>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">搜索活动</h3>
            <p>用户可以搜索并报名活动...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '8'">
          <!-- 设置模块 -->
          <el-card shadow="hover" class="card">
            <h3 class="card-title">账户设置</h3>
            <el-form :model="userDetailsForm" ref="userDetailsForm" label-width="120px" style="max-width: 500px; margin: 0 auto;">
              <el-form-item label="用户ID">
                <el-input v-model="userDetailsForm.user_id" :disabled="true"></el-input>
              </el-form-item>
              <el-form-item label="注册时间">
                <el-input v-model="userDetailsForm.registration_date" :disabled="true"></el-input>
              </el-form-item>
              <el-form-item label="最近登录">
                <el-input v-model="userDetailsForm.last_login" :disabled="true"></el-input>
              </el-form-item>
              <el-form-item label="账号状态">
                <el-switch v-model="userDetailsForm.is_active" active-text="激活" inactive-text="禁用"></el-switch>
              </el-form-item>
              <el-form-item label="邮箱验证">
                <el-switch v-model="userDetailsForm.is_email_verified" active-text="已验证" inactive-text="未验证"></el-switch>
              </el-form-item>
              <el-form-item label="学号">
                <el-input v-model="userDetailsForm.student_id"></el-input>
              </el-form-item>
              <el-form-item label="学校ID">
                <el-input v-model="userDetailsForm.school_id"></el-input>
              </el-form-item>
              <el-form-item label="院系ID">
                <el-input v-model="userDetailsForm.department_id"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveUserDetails">保存修改</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="hover" class="card">
            <h3 class="card-title">隐私设置</h3>
            <p>用户可以设置隐私权限...</p>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';

export default {
  name: 'HomeView',
  data() {
    return {
      activeMenu: '1', // 默认显示用户信息模块
      userInfoVisible: false,
      userInfo: {},
      weekdays: ['周一', '周二', '周三', '周四', '周五'], // 星期
      schedule: [
        { period: '第1节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第2节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第3节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第4节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第5节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '午休', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第6节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第7节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第8节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第9节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第10节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '晚休', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第11节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
        { period: '第12节', courses: Array.from({ length: 5 }, () => ({ course: '', location: '' })) },
      ],
      notifications: [],
      isEditing: false, // 是否处于编辑模式
      userDetailsForm: {
        user_id: '',
        registration_date: '',
        last_login: '',
        is_active: false,
        is_email_verified: false,
        student_id: '',
        school_id: '',
        department_id: ''
      },
      events: [],
    };
  },
  computed: {
    unreadNotificationsCount() {
      return this.notifications.filter(notification => !notification.read).length;
    },
  },
  filters: {
    formatDateTime(val) {
      if (!val) return '';
      // 兼容字符串和Date对象
      const d = typeof val === 'string' ? new Date(val.replace(/-/g, '/')) : new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  },
  methods: {
    showUserInfo() {
      this.userInfoVisible = true;
    },
    hideUserInfo() {
      this.userInfoVisible = false;
    },
    handleMenuSelect(index) {
      this.activeMenu = index;
    },
    fetchUserInfo() {
      axios.get('/api/user/info')
        .then(response => {
          // 获取到用户信息后，更新 Vuex 全局 userInfo，保证 userId 始终有效
          this.$store.commit('setUserInfo', response.data);
          // 只从 Vuex 获取 userInfo，避免 this.userInfo 被覆盖为无效值
          this.userInfo = this.$store.state.userInfo;
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
          this.$message.error('获取用户信息失败');
        });
    },
    fetchSchedule() {
      axios.get('/api/schedule', { params: { userId: this.userInfo.userId } })
        .then(response => {
          // 假设后端返回 [{ day: '周一', period: '第1节', courseName: '高数', location: 'A101' }, ...]
          // 需要转换为前端 schedule 结构
          const emptyRow = () => this.weekdays.map(() => ({ course: '', location: '' }));
          const scheduleMap = {};
          // 初始化所有节次
          [
            '第1节','第2节','第3节','第4节','第5节','午休','第6节','第7节','第8节','第9节','第10节','晚休','第11节','第12节'
          ].forEach(period => {
            scheduleMap[period] = emptyRow();
          });
          (response.data || []).forEach(item => {
            const dayIdx = this.weekdays.indexOf(item.day);
            if (dayIdx !== -1 && scheduleMap[item.period]) {
              scheduleMap[item.period][dayIdx] = {
                course: item.courseName,
                location: item.location
              };
            }
          });
          this.schedule = Object.keys(scheduleMap).map(period => ({
            period,
            courses: scheduleMap[period]
          }));
        })
        .catch(error => {
          console.error('获取课程表失败:', error);
          this.$message.error('获取课程表失败');
        });
    },
    markNotificationAsRead(index) {
      this.notifications[index].read = true;
    },
    navigateTo(link) {
      if (link) {
        this.$router.push(link).catch(err => {
          console.error('导航失败:', err);
        });
      }
    },
    toggleEditMode() {
      if (this.isEditing) {
        // 保存编辑内容
        this.saveSchedule();
      }
      this.isEditing = !this.isEditing;
    },
    saveSchedule() {
      // 全局获取 userId，保证不为 null
      const userId = this.$store.state.userInfo && this.$store.state.userInfo.userId;
      const formattedSchedule = [];
      this.schedule.forEach(row => {
        row.courses.forEach((course, index) => {
          if (course.course) {
            formattedSchedule.push({
              day: this.weekdays[index],
              period: row.period,
              courseName: course.course,
              location: course.location,
              userId: Number(userId) // 每条数据都加 userId
            });
          }
        });
      });
      if (formattedSchedule.length === 0) {
        formattedSchedule.push({ day: '', period: '', courseName: '', location: '', userId: Number(userId) });
      }
      axios.put('/api/schedule', formattedSchedule, { params: { userId: Number(userId) } })
        .then(() => {
          this.$message.success('课程表更新成功');
          this.fetchSchedule();
        })
        .catch(error => {
          console.error('课程表更新失败:', error);
          this.$message.error('课程表更新失败');
        });
    },
    fetchNotifications() {
      axios.get('/api/user/notifications')
        .then(response => {
          this.notifications = (response.data || []).map(notification => ({
            ...notification,
            read: false,
          }));
        })
        .catch(error => {
          console.error('获取通知失败:', error);
          this.$message.error('获取通知失败');
        });
    },
    fetchUserDetails() {
      axios.get('/api/user/details', { params: { userId: this.userInfo.id } })
        .then(res => {
          // 假设后端返回字段与userDetailsForm一致
          this.userDetailsForm = {
            ...res.data,
            is_active: !!res.data.is_active,
            is_email_verified: !!res.data.is_email_verified
          };
        })
        .catch(() => {
          this.$message.error('获取用户详细信息失败');
        });
    },
    saveUserDetails() {
      axios.post('/api/user/details/update', this.userDetailsForm)
        .then(() => {
          this.$message.success('个人信息修改成功');
          this.fetchUserDetails();
        })
        .catch(() => {
          this.$message.error('保存失败，请稍后重试');
        });
    },
    fetchEvents() {
      axiosInstance.get('/events')
        .then(res => {
          this.events = res.data || [];
        })
        .catch(() => {
          this.$message.error('获取活动列表失败');
        });
    },
    logout() {
      localStorage.removeItem('authToken');
      this.$store.commit('setUserInfo', null);
      this.$router.push('/login');
    },
    goToChatView() {
      this.$router.push({ path: '/ChatView' });
    },
  },
  created() {
    // 优先从 Vuex 获取 userInfo，保证 userId 有效
    if (this.$store.state.userInfo && this.$store.state.userInfo.userId) {
      this.userInfo = this.$store.state.userInfo;
    }
    this.fetchUserInfo();
    this.fetchSchedule();
    this.fetchNotifications();
    this.fetchUserDetails();
    this.fetchEvents();
  },
};
</script>

<style scoped>
/* 全局布局 */
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

/* 背景图片 */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/homeviewbackground.jpg'); /* 示例图片路径 */
  background-size: contain; /* 改为 contain 以适配图片比例 */
  background-repeat: no-repeat; /* 防止图片重复 */
  background-position: center; /* 居中显示图片 */
  opacity: 0.6; /* 淡化效果 */
  z-index: -1;
}

/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.app-title {
  font-size: 20px;
  font-weight: 500;
  margin-left: 15px;
  color: #333333;
}

.user-avatar {
  cursor: pointer;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
}

.notification-icon {
  cursor: pointer;
  font-size: 24px;
  color: #606266;
}

.feed-button {
  font-weight: 500;
  border-radius: 20px;
}

/* 动态按钮效果 */
.interactive-button {
  transition: all 0.3s ease;
}

.interactive-button:hover {
  background-color: #409eff;
  color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logout-button {
  font-weight: 500;
  border-radius: 20px;
}

/* 主内容区域 */
.main-container {
  display: flex;
  height: calc(100vh - 64px);
}

.sidebar {
  background-color: #ffffff;
  height: 100%;
  border-right: 1px solid #e0e0e0;
}

.card {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333333;
}

.notification-item {
  cursor: pointer;
  color: #409eff;
}

.notification-item:hover {
  text-decoration: underline;
}

.edit-button {
  margin-bottom: 10px;
}

.course-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  position: relative;
}

.course-cell.has-course .course-text {
  animation: fade-in-out 2s infinite;
}

.course-text {
  font-size: 14px;
  color: #333;
}

.course-input,
.location-input {
  margin-bottom: 5px;
}

.location-text {
  font-size: 12px;
  color: #666;
  display: block;
}

/* 动画效果 */
@keyframes fade-in-out {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes click-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}
</style>