<template>
  <el-container>
    <el-header>
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" type="border-card">
        <el-tab-pane label="个人信息" name="personal-info"></el-tab-pane>
        <el-tab-pane label="安全设置" name="security-settings"></el-tab-pane>
        <el-tab-pane label="隐私设置" name="privacy-settings"></el-tab-pane>
        <el-tab-pane label="通知设置" name="notification-settings"></el-tab-pane>
        <el-tab-pane label="账户绑定" name="account-binding"></el-tab-pane>
        <el-tab-pane label="账户活动" name="account-activity"></el-tab-pane>
        <el-tab-pane label="账户注销" name="account-deletion"></el-tab-pane>
        <el-tab-pane label="帮助和支持" name="help-support"></el-tab-pane>
      </el-tabs>
    </el-header>
    <el-main>
      <div class="profile-manage">
        <el-tabs v-model="activeTab" type="card">
          <!-- 个人信息 -->
          <el-tab-pane label="个人信息" name="personal-info">
            <el-form :model="personalInfo" :rules="personalInfoRules" ref="personalInfoForm" label-width="120px">
              <el-form-item label="头像">
                <el-upload
                  class="avatar-uploader"
                  action="/upload/avatar"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                >
                  <img v-if="personalInfo.avatar" :src="personalInfo.avatar" class="avatar" />
                  <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                </el-upload>
              </el-form-item>
              <el-form-item label="用户名" prop="username">
                <el-input v-model="personalInfo.username" placeholder="请输入用户名"></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="personalInfo.email" placeholder="请输入邮箱"></el-input>
              </el-form-item>
              <el-form-item label="角色">
                <el-tag>{{ personalInfo.role }}</el-tag>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitPersonalInfo">保存</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 安全设置 -->
          <el-tab-pane label="安全设置" name="security-settings">
            <el-form label-width="120px">
              <el-form-item label="修改密码">
                <el-input type="password" v-model="security.password" placeholder="输入新密码"></el-input>
              </el-form-item>
              <el-form-item label="双因素认证">
                <el-switch v-model="security.twoFactor"></el-switch>
              </el-form-item>
              <el-form-item label="安全问题">
                <el-input v-model="security.securityQuestion" placeholder="设置安全问题"></el-input>
                <el-input v-model="security.securityAnswer" placeholder="设置答案"></el-input>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 隐私设置 -->
          <el-tab-pane label="隐私设置" name="privacy-settings">
            <el-form label-width="120px">
              <el-form-item label="个人资料隐私">
                <el-select v-model="privacy.profileVisibility" placeholder="选择可见性">
                  <el-option label="公开" value="public"></el-option>
                  <el-option label="好友可见" value="friends"></el-option>
                  <el-option label="私密" value="private"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="动态隐私">
                <el-select v-model="privacy.activityVisibility" placeholder="选择可见性">
                  <el-option label="公开" value="public"></el-option>
                  <el-option label="好友可见" value="friends"></el-option>
                  <el-option label="私密" value="private"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="搜索隐私">
                <el-switch v-model="privacy.allowSearch"></el-switch>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notification-settings">
            <el-form label-width="120px">
              <el-form-item label="通知偏好">
                <el-checkbox-group v-model="notifications.preferences">
                  <el-checkbox label="邮件通知"></el-checkbox>
                  <el-checkbox label="短信通知"></el-checkbox>
                  <el-checkbox label="应用内通知"></el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="通知类型">
                <el-checkbox-group v-model="notifications.types">
                  <el-checkbox label="课程公告"></el-checkbox>
                  <el-checkbox label="活动提醒"></el-checkbox>
                  <el-checkbox label="私信"></el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 账户绑定 -->
          <el-tab-pane label="账户绑定" name="account-binding">
            <el-form label-width="120px">
              <el-form-item label="社交账户绑定">
                <el-button type="success" @click="bindSocialAccount('wechat')">绑定微信</el-button>
                <el-button type="primary" @click="bindSocialAccount('qq')">绑定QQ</el-button>
                <el-button type="danger" @click="bindSocialAccount('weibo')">绑定微博</el-button>
              </el-form-item>
              <el-form-item label="设备管理">
                <el-table :data="devices" style="width: 100%">
                  <el-table-column prop="device" label="设备" width="200"></el-table-column>
                  <el-table-column prop="location" label="位置" width="200"></el-table-column>
                  <el-table-column prop="lastLogin" label="最近登录时间"></el-table-column>
                  <el-table-column label="操作" width="120">
                    <template slot-scope="scope">
                      <el-button type="danger" size="mini" @click="logoutDevice(scope.row)">注销</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 账户活动 -->
          <el-tab-pane label="账户活动" name="account-activity">
            <el-table :data="accountActivity" style="width: 100%">
              <el-table-column prop="time" label="时间" width="200"></el-table-column>
              <el-table-column prop="location" label="地点" width="200"></el-table-column>
              <el-table-column prop="activity" label="活动"></el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 账户注销 -->
          <el-tab-pane label="账户注销" name="account-deletion">
            <el-alert
              title="账户注销后，您的所有数据将被永久删除，无法恢复。"
              type="warning"
              show-icon
            ></el-alert>
            <el-button type="danger" @click="showDeleteDialog">永久注销账户</el-button>
          </el-tab-pane>

          <!-- 帮助和支持 -->
          <el-tab-pane label="帮助和支持" name="help-support">
            <el-button type="primary" @click="openHelpCenter">帮助中心</el-button>
            <el-button type="success" @click="contactSupport">联系客服</el-button>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-main>
  </el-container>
</template>

<script>
export default {
  data() {
    return {
      activeTab: "personal-info",
      deleteDialogVisible: false,
      personalInfo: {
        avatar: "",
        username: "",
        email: "",
        role: "学生",
      },
      personalInfoRules: {
        username: [{ required: true, message: "用户名不能为空", trigger: "blur" }],
        email: [
          { required: true, message: "邮箱不能为空", trigger: "blur" },
          { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
        ],
      },
      security: {
        password: "",
        twoFactor: false,
        securityQuestion: "",
        securityAnswer: "",
      },
      privacy: {
        profileVisibility: "public",
        activityVisibility: "public",
        allowSearch: true,
      },
      notifications: {
        preferences: [],
        types: [],
      },
      devices: [],
      accountActivity: [],
    };
  },
  methods: {
    bindSocialAccount(platform) {
      console.log(`绑定${platform}账户`);
    },
    logoutDevice(device) {
      console.log(`注销设备: ${device.device}`);
    },
    showDeleteDialog() {
      this.deleteDialogVisible = true;
    },
    handleTabClick(tab) {
      this.activeTab = tab.name;
    },
    openHelpCenter() {
      console.log("打开帮助中心");
    },
    contactSupport() {
      console.log("联系客服");
    },
    confirmDeleteAccount() {
      this.deleteDialogVisible = false;
      Notification.success({
        title: "成功",
        message: "账户已成功注销。",
      });
      console.log("账户已注销");
    },
  },
};
</script>

<style scoped>
.profile-manage {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
.avatar-uploader {
  display: inline-block;
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  margin-bottom: 20px;
}
.avatar {
  width: 100%;
  height: 100%;
  display: block;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  line-height: 100px;
  text-align: center;
}
.el-form-item {
  margin-bottom: 20px;
}
@media (max-width: 768px) {
  .profile-manage {
    padding: 10px;
  }
  .avatar-uploader {
    width: 80px;
    height: 80px;
  }
}
.el-button {
  margin-right: 10px;
}
</style>
