<template>
  <div class="login-container">
    <!-- 背景图案 -->
    <div class="background"></div>
    <!-- 校园社交系统LOGO -->
    <div class="logo">
      <h1>校园社交系统</h1>
    </div>
    <!-- 登录表单 -->
    <el-form :model="loginForm" ref="loginForm" class="login-form" :rules="loginRules">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-button type="primary" @click="handleLogin">登录</el-button>
      <el-button type="text" @click="showRegisterDialog = true">注册</el-button>
    </el-form>
    <!-- 注册弹出窗口 -->
    <el-dialog title="注册" :visible.sync="showRegisterDialog">
      <el-form :model="registerForm" ref="registerForm" class="register-form" :rules="registerRules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="schoolEmail">
          <el-input v-model="registerForm.schoolEmail" placeholder="请输入学校邮箱"></el-input>
        </el-form-item>
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="registerForm.studentId" placeholder="请输入学号"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色">
            <el-option label="学生" value="student"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="管理员" value="admin"></el-option>
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleRegister">注册</el-button>
        <el-button @click="showRegisterDialog = false">取消</el-button>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { login, register } from "@/api/api"; // 假设后端 API 在 api.js 中定义
import { ElMessage } from "element-ui";

export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      registerForm: {
        username: "",
        schoolEmail: "",
        studentId: "",
        password: "",
        role: "",
      },
      loginRules: {
        username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }],
      },
      registerRules: {
        username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
        schoolEmail: [{ required: true, message: "请输入学校邮箱", trigger: "blur" }],
        studentId: [{ required: true, message: "请输入学号", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }],
        role: [{ required: true, message: "请选择角色", trigger: "change" }],
      },
      showRegisterDialog: false,
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await login(this.loginForm.username, this.loginForm.password);
        const { success, token, userInfo } = response.data;

        if (success) {
          localStorage.setItem("authToken", token); // 存储JWT令牌
          this.$store.commit("setUserInfo", userInfo); // 存储用户信息到Vuex
          this.$router.push("/HomeView"); // 跳转到HomeView
        } else {
          ElMessage.error("登录失败");
        }
      } catch (error) {
        console.error("登录失败:", error);
        this.$message.error("登录失败，请稍后重试");
      }
    },

    async handleRegister() {
      this.$refs.registerForm.validate(async (valid) => {
        if (valid) {
          if (this.registerForm.role === "admin") {
            this.$message.error("您暂时无权限选择管理员身份！");
            return;
          }
          try {
            const response = await register(this.registerForm);
            ElMessage.success("注册成功，请登录");
            this.showRegisterDialog = false;
            this.$router.push("/login");
          } catch (error) {
            console.error("注册失败详情:", error);
          }
        }
      });
    },
  },
};
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('E:\MyProject\campusdemo-frontend\src\assets\background.jpg') no-repeat center center;
  background-size: cover;
  z-index: -1;
}
.logo {
  margin-bottom: 20px;
  text-align: center;
}
.logo h1 {
  font-size: 36px;
  color: #fff;
}
.login-form {
  width: 300px;
}
.register-form {
  width: 400px;
}
</style>
