//  github.com/muxi3302159484 

<template>
  <div class="home">
    <!-- 顶部Banner区 -->
    <div class="home-banner">
      <img src="@/assets/logo.png" class="banner-logo" />
      <div class="banner-info">
        <div class="banner-title">欢迎来到校园社交系统</div>
        <div class="banner-desc">Hi，{{ userInfo.name || '同学' }}，发现同学、分享生活、交流学习</div>
      </div>
      <!-- <el-avatar :src="getAvatarSrc(userInfo.avatar)" :size="60" class="banner-avatar" /> -->
    </div>

    <!-- 背景图片 -->
    <div class="background-image"></div>

    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <el-avatar
          class="user-avatar"
          :src="getAvatarSrc(userInfo.avatar)"
        >
          <el-image slot="default" src="@/assets/default-avatar.png" fit="cover"></el-image>
        </el-avatar>
        <span class="app-title">校园社交系统</span>
      </div>
      <div class="header-right">
        <el-badge :value="unreadNotificationsCount" class="notification-icon" v-if="unreadNotificationsCount > 0">
          <el-icon name="bell"></el-icon>
        </el-badge>
        <el-icon name="bell" class="notification-icon" v-else></el-icon>
        <el-button type="primary" class="feed-button interactive-button" @click="navigateToFeedView">动态</el-button>
        <el-button type="danger" class="logout-button" @click="logout">退出登录</el-button>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 左侧菜单 -->
      <el-aside width="250px" class="sidebar">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect">
          <el-menu-item index="1"><i class="el-icon-user"></i> 用户信息</el-menu-item>
          <el-menu-item index="2"><i class="el-icon-chat-dot-round"></i> 动态</el-menu-item>
          <el-menu-item index="3"><i class="el-icon-date"></i> 课程</el-menu-item>
          <el-menu-item index="4"><i class="el-icon-trophy"></i> 活动</el-menu-item>
          <el-menu-item index="6"><i class="el-icon-message"></i> 消息</el-menu-item>
          <!-- <el-menu-item index="7"><i class="el-icon-search"></i> 搜索</el-menu-item> --> <!-- 搜索菜单已移除 -->
          <el-menu-item index="8"><i class="el-icon-setting"></i> 设置</el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容 -->
      <el-main>
        <div v-if="activeMenu === '1'">
          <!-- 个人资料卡片美化 -->
          <el-card shadow="hover" class="card profile-card">
            <div class="profile-header">
              <el-avatar :src="getAvatarSrc(userInfo.avatar)" :size="80" class="profile-avatar" />
              <div class="profile-info">
                <div class="profile-name">{{ userInfo.name || '未设置昵称' }}</div>
                <div class="profile-role"><i class="el-icon-user"></i> {{ userInfo.role || '学生' }}</div>
                <div class="profile-meta">
                  <span><i class="el-icon-school"></i> {{ userInfo.college || '未知学院' }}</span>
                  <span><i class="el-icon-notebook-2"></i> {{ userInfo.major || '未知专业' }}</span>
                </div>
                <div class="profile-signature" v-if="userInfo.signature">{{ userInfo.signature }}</div>
                <div class="profile-level" v-if="userInfo.level"><i class="el-icon-star-on"></i> 等级：{{ userInfo.level }}</div>
              </div>
            </div>
          </el-card>

          <!-- 通知卡片美化 -->
          <el-card shadow="hover" class="card notification-card">
            <h3 class="card-title"><i class="el-icon-bell"></i> 通知</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(notification, index) in notifications"
                :key="index"
                :timestamp="notification.time"
                :color="!notification.read ? '#409EFF' : '#bbb'"
                @click="markNotificationAsRead(index); navigateTo(notification.link)"
                class="notification-item"
              >
                <i class="el-icon-message-solid notification-icon-timeline"></i>
                <span :class="{ 'unread': !notification.read }">{{ notification.content }}</span>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <div v-if="activeMenu === '2'">
          <!-- 动态模块美化 -->
          <el-card shadow="hover" class="card feed-card">
            <h3 class="card-title"><i class="el-icon-chat-dot-round"></i> 好友动态</h3>
            <p>显示好友的最新动态...</p>
            <el-button type="primary" @click="navigateToFeedView">进入动态广场</el-button>
          </el-card>
        </div>

        <div v-if="activeMenu === '3'">
          <!-- 课程模块美化 -->
          <el-card shadow="hover" class="card course-card">
            <div class="course-header">
              <h3 class="card-title"><i class="el-icon-date"></i> 课程表</h3>
              <div class="course-stats">
                <span><i class="el-icon-collection"></i> 本周课程数：{{ totalCourseCount }}</span>
                <span class="next-course" v-if="nextCourse">下节课：{{ nextCourse.course }} @ {{ nextCourse.location }}</span>
              </div>
              <el-button type="primary" size="small" @click="toggleEditMode" class="edit-button">{{ isEditing ? '保存' : '编辑' }}</el-button>
            </div>
            <el-table :data="schedule" border class="course-table">
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
                      <el-input v-model="scope.row.courses[index].course" size="small" placeholder="课程" class="course-input"></el-input>
                      <el-input v-model="scope.row.courses[index].location" size="small" placeholder="地点" class="location-input"></el-input>
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
          <el-card shadow="hover" class="card course-announcement-card">
            <h3 class="card-title"><i class="el-icon-info"></i> 课程公告</h3>
            <p>显示课程相关的最新公告...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '4'">
          <!-- 活动模块美化 -->
          <el-card shadow="hover" class="card event-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h3 class="card-title"><i class="el-icon-trophy"></i> 活动列表</h3>
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
          <el-card shadow="hover" class="card event-signup-card">
            <h3 class="card-title"><i class="el-icon-edit"></i> 活动报名</h3>
            <p>用户可以报名参加活动...</p>
          </el-card>
        </div>

        <div v-if="activeMenu === '6'">
          <!-- 消息模块美化 -->
          <el-card shadow="hover" class="card message-card">
            <h3 class="card-title"><i class="el-icon-message"></i> 私信</h3>
            <p>用户可以与好友私信交流...</p>
            <el-button type="primary" @click="goToChatView">进入私信</el-button>
          </el-card>
        </div>

        <div v-if="activeMenu === '7'">
          <!-- 搜索模块已移除 -->
        </div>

        <div v-if="activeMenu === '8'">
          <!-- 设置模块美化 -->
          <el-card shadow="hover" class="card setting-card">
            <h3 class="card-title"><i class="el-icon-setting"></i> 账户设置</h3>
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
              <el-form-item label="头像">
                <div style="display: flex; gap: 16px;">
                  <div v-for="id in [1,2,3,4]" :key="id" style="display: flex; flex-direction: column; align-items: center;">
                    <el-avatar
                      :src="require(`@/assets/avatars/avatar_${id}.png`)"
                      :class="['avatar-select', { 'avatar-selected': Number(userDetailsForm.avatar) === Number(id) }]"
                      :size="64"
                      @click.native="selectAvatar(id)"
                    />
                    <span v-if="Number(userDetailsForm.avatar) === Number(id)" style="color:#409EFF;font-size:12px;">已选</span>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="姓名">
                <el-input v-model="userDetailsForm.name" placeholder="请输入姓名或昵称"></el-input>
              </el-form-item>
              <el-form-item label="学院">
                <el-input v-model="userDetailsForm.college" placeholder="请输入学院名称"></el-input>
              </el-form-item>
              <el-form-item label="专业">
                <el-input v-model="userDetailsForm.major" placeholder="请输入专业名称"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveUserDetails">保存修改</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="hover" class="card privacy-card">
            <h3 class="card-title"><i class="el-icon-lock"></i> 隐私设置</h3>
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
        school_id: '',
        department_id: '',
        avatar: 1 // 默认头像编号，保证字段存在
      },
      events: [],
    };
  },
  computed: {
    unreadNotificationsCount() {
      return this.notifications.filter(notification => !notification.read).length;
    },
    // 新增：课程总数和下节课
    totalCourseCount() {
      let count = 0;
      this.schedule.forEach(row => {
        row.courses.forEach(c => { if (c.course) count++; });
      });
      return count;
    },
    nextCourse() {
      // 简单找第一个有课的节次
      for (let i = 0; i < this.schedule.length; i++) {
        for (let j = 0; j < this.schedule[i].courses.length; j++) {
          const c = this.schedule[i].courses[j];
          if (c.course) {
            return c;
          }
        }
      }
      return null;
    }
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
      // 获取token
      const token = localStorage.getItem('authToken');
      axios.get('/api/user/info', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(response => {
          // 兼容扁平结构和嵌套结构
          let userInfoRaw = response.data || {};
          let user = userInfoRaw.user || {};
          let userDetails = userInfoRaw.userDetails || {};
          // 如果是扁平结构，userDetails和user都为空，直接用userInfoRaw
          if (Object.keys(user).length === 0 && Object.keys(userDetails).length === 0) {
            user = userInfoRaw;
            userDetails = userInfoRaw;
          }
          const userInfo = {
            userId: user.userId || user.id || userDetails.userId || userDetails.id,
            // 优先取 userDetails.name，其次 user.name，最后 user.username
            name: userDetails.name || user.name || '',
            role: userDetails.role || user.role || '',
            college: userDetails.college || user.college || '',
            major: userDetails.major || user.major || '',
            avatar: userDetails.avatar || user.avatar || '',
            email: user.email || userDetails.email || '',
            studentId: user.studentId || userDetails.studentId || '',
            registration_date: userDetails.registrationDate || user.registrationDate || '',
            last_login: userDetails.lastLogin || user.lastLogin || '',
            is_active: userDetails.isActive || user.isActive || false,
            is_email_verified: userDetails.isEmailVerified || user.isEmailVerified || false,
            school_id: userDetails.schoolId || user.schoolId || '',
            department_id: userDetails.departmentId || user.departmentId || '',
            signature: userDetails.signature || user.signature || '',
            level: userDetails.level || user.level || 1
          };
          this.$store.commit('setUserInfo', userInfo);
          this.userInfo = this.$store.state.userInfo;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          // 同步基础信息到 userDetailsForm，保证账户设置页展示
          this.userDetailsForm.user_id = userInfo.userId || '';
          this.userDetailsForm.registration_date = this.$options.filters.formatDateTime(userInfo.registration_date) || '';
          this.userDetailsForm.last_login = this.$options.filters.formatDateTime(userInfo.last_login) || '';
          // 只有 userId 变化时才重新拉 schedule，避免重复请求
          const oldUserId = this.$store.state.userInfo && this.$store.state.userInfo.userId;
          const newUserId = userInfo.userId;
          if (newUserId && newUserId !== oldUserId) {
            this.fetchSchedule();
          }
        })
        .catch(() => {}); // 暂时隐藏 info 报错通知
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
        .catch(() => {}); // 暂时隐藏 notice 报错通知
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
      // 获取token
      const token = localStorage.getItem('authToken');
      axios.get('/api/user/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
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
    saveUserDetails() {
      // 确保 user_id 字段有值
      if (!this.userDetailsForm.user_id) {
        // 优先用 userInfo.userId 或 userInfo.id
        this.userDetailsForm.user_id = this.userInfo.userId || this.userInfo.id || '';
      }
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
    selectAvatar(id) {
      this.userDetailsForm.avatar = Number(id);
      // 立即触发视图刷新
      this.$forceUpdate();
    },
    navigateToFeedView() {
      this.$router.push({ path: '/FeedView' });
    },
    getAvatarSrc(avatar) {
      // 兼容数字、字符串、完整URL、空值
      if (!avatar) return require('@/assets/avatars/avatar_1.png');
      if (typeof avatar === 'number' || (typeof avatar === 'string' && /^\d+$/.test(avatar))) {
        // 纯数字或数字字符串，拼头像路径
        try {
          return require(`@/assets/avatars/avatar_${avatar}.png`);
        } catch (e) {
          return require('@/assets/avatars/avatar_1.png');
        }
      }
      // 若为URL或base64
      return avatar;
    },
  },
  created() {
    // 1. 优先从 localStorage 恢复 userInfo
    const localUserInfo = localStorage.getItem('userInfo');
    let localUserId = null;
    if (localUserInfo) {
      const parsed = JSON.parse(localUserInfo);
      this.$store.commit('setUserInfo', parsed);
      this.userInfo = this.$store.state.userInfo;
      localUserId = parsed && parsed.userId;
    }
    // 2. 如果本地 userId 有效，立即拉 schedule，避免初次渲染空白
    if (localUserId) {
      this.fetchSchedule();
    }
    // 3. 始终发起后端请求，保证数据新鲜
    this.fetchUserInfo();
    this.fetchNotifications();
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

/* 顶部Banner区 */
.home-banner {
  width: 100%;
  min-height: 90px;
  background: linear-gradient(90deg, #e3f2fd 0%, #fff 100%);
  display: flex;
  align-items: center;
  padding: 24px 40px 12px 40px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 2px 12px rgba(33,150,243,0.08);
  margin-bottom: 18px;
  position: relative;
  z-index: 1;
}
.banner-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  margin-right: 24px;
  box-shadow: 0 2px 8px rgba(33,150,243,0.12);
}
.banner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.banner-title {
  font-size: 28px;
  font-weight: bold;
  color: #1976d2;
}
.banner-desc {
  font-size: 16px;
  color: #555;
}
.banner-avatar {
  margin-left: 32px;
  border: 3px solid #90caf9;
  box-shadow: 0 2px 8px #90caf9;
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
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 8px;
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
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 48px;
  padding: 4px 8px;
  position: relative;
  gap: 2px;
}

.course-cell.has-course {
  background: #e3f2fd;
  border-radius: 8px;
  transition: background 0.2s;
}
.course-cell.has-course:hover {
  background: #bbdefb;
}
.course-text {
  font-size: 15px;
  color: #1976d2;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 2px;
}
.location-text {
  font-size: 13px;
  color: #888;
  line-height: 1.2;
  margin-left: 0;
}
.course-input,
.location-input {
  margin-bottom: 2px;
  width: 90px;
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

.profile-card {
  background: linear-gradient(90deg, #e3f2fd 0%, #fff 100%);
  margin-bottom: 18px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 32px;
}
.profile-avatar {
  border: 3px solid #90caf9;
  box-shadow: 0 2px 8px #90caf9;
}
.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.profile-name {
  font-size: 22px;
  font-weight: bold;
  color: #1976d2;
}
.profile-role {
  font-size: 15px;
  color: #888;
}
.profile-meta {
  font-size: 14px;
  color: #666;
  display: flex;
  gap: 18px;
}
.profile-signature {
  font-size: 14px;
  color: #888;
  font-style: italic;
}
.profile-level {
  font-size: 14px;
  color: #ff9800;
}
.notification-card {
  margin-bottom: 18px;
}
.notification-icon-timeline {
  color: #409EFF;
  margin-right: 6px;
}
.notification-item.unread span {
  font-weight: bold;
  color: #1976d2;
}
.feed-card, .event-card, .club-card, .message-card, .search-card, .setting-card, .privacy-card {
  margin-bottom: 18px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(33,150,243,0.08);
}
.card-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 8px;
}
.course-card {
  margin-bottom: 18px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(33,150,243,0.08);
}
.course-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.course-stats {
  display: flex;
  gap: 18px;
  font-size: 14px;
  color: #1976d2;
}
.next-course {
  color: #43a047;
  font-weight: bold;
}
.course-table {
  border-radius: 12px;
  overflow: hidden;
}
.course-cell.has-course {
  background: #e3f2fd;
  border-radius: 8px;
  transition: background 0.2s;
}
.course-cell.has-course:hover {
  background: #bbdefb;
}
.club-card, .club-activity-card {
  background: linear-gradient(90deg, #fffde7 0%, #fff 100%);
}
.event-card, .event-signup-card {
  background: linear-gradient(90deg, #fce4ec 0%, #fff 100%);
}
.message-card {
  background: linear-gradient(90deg, #e1f5fe 0%, #fff 100%);
}
.search-card {
  background: linear-gradient(90deg, #f3e5f5 0%, #fff 100%);
}
.setting-card, .privacy-card {
  background: linear-gradient(90deg, #f5f7fa 0%, #fff 100%);
}
.sidebar .el-menu {
  border: none;
  background: transparent;
}
.sidebar .el-menu-item {
  border-radius: 8px;
  margin: 6px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, color 0.2s;
}
.sidebar .el-menu-item.is-active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: bold;
}
</style>