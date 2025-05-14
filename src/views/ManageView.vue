<template>
    <div class="manage-view">
        <el-container>
            <el-header>
                <h2>账户管理</h2>
                <el-button type="primary" @click="openUserDialog">添加用户</el-button>
            </el-header>
            <el-main>
                <el-table :data="users" border style="width: 100%">
                    <el-table-column prop="username" label="用户名" width="180"></el-table-column>
                    <el-table-column prop="email" label="邮箱" width="250"></el-table-column>
                    <el-table-column prop="role" label="角色" width="150"></el-table-column>
                    <el-table-column label="操作" width="200">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" @click="editUser(scope.row)">编辑</el-button>
                            <el-button type="text" size="small" @click="deleteUser(scope.$index)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-main>
        </el-container>

        <!-- 添加/编辑用户对话框 -->
        <el-dialog v-model="userDialogVisible" title="用户管理">
            <el-form :model="currentUser" :rules="rules" ref="userForm">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="currentUser.username"></el-input>
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="currentUser.email"></el-input>
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="currentUser.role" placeholder="选择角色">
                        <el-option label="管理员" value="Admin"></el-option>
                        <el-option label="用户" value="User"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="userDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveUser">保存</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: "ManageView",
    data() {
        return {
            users: [
                { username: "admin", email: "admin@example.com", role: "Admin" },
                { username: "user1", email: "user1@example.com", role: "User" },
            ],
            userDialogVisible: false,
            currentUser: {
                username: "",
                email: "",
                role: "User",
            },
            editingIndex: null,
            rules: {
                username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
                email: [
                    { required: true, message: "请输入邮箱", trigger: "blur" },
                    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
                ],
                role: [{ required: true, message: "请选择角色", trigger: "change" }],
            },
        };
    },
    methods: {
        openUserDialog() {
            this.currentUser = { username: "", email: "", role: "User" };
            this.editingIndex = null;
            this.userDialogVisible = true;
        },
        saveUser() {
            this.$refs.userForm.validate((valid) => {
                if (valid) {
                    if (this.editingIndex !== null) {
                        this.users.splice(this.editingIndex, 1, { ...this.currentUser });
                    } else {
                        this.users.push({ ...this.currentUser });
                    }
                    this.userDialogVisible = false;
                }
            });
        },
        editUser(user) {
            this.currentUser = { ...user };
            this.editingIndex = this.users.indexOf(user);
            this.userDialogVisible = true;
        },
        deleteUser(index) {
            this.users.splice(index, 1);
        },
    },
};
</script>

<style scoped>
.manage-view {
    padding: 20px;
    background-color: #f5f5f5;
}

.el-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>
