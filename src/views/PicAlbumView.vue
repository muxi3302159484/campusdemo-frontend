<template>
    <div class="pic-album-view">
        <el-container>
            <el-header>
                <h2>相册</h2>
                <el-button type="text" @click="redirectToHome">返回主界面</el-button>
                <el-button type="primary" @click="openAlbumDialog">创建相册</el-button>
            </el-header>
            <el-main>
                <el-row :gutter="20">
                    <el-col :span="6" v-for="(album, index) in albums" :key="index">
                        <el-card class="album-card">
                            <h3>{{ album.name }}</h3>
                            <p>{{ album.description }}</p>
                            <el-button type="text" @click="viewAlbum(album)">查看</el-button>
                            <el-button type="text" @click="editAlbum(album)">编辑</el-button>
                            <el-button type="text" @click="deleteAlbum(index)">删除</el-button>
                        </el-card>
                    </el-col>
                </el-row>
            </el-main>
        </el-container>

        <!-- 创建/编辑相册对话框 -->
        <el-dialog :visible.sync="albumDialogVisible" title="相册管理">
            <el-form :model="currentAlbum">
                <el-form-item label="相册名称">
                    <el-input v-model="currentAlbum.name"></el-input>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="currentAlbum.description"></el-input>
                </el-form-item>
                <el-form-item label="隐私设置">
                    <el-select v-model="currentAlbum.privacy" placeholder="选择隐私级别">
                        <el-option label="公开" value="public"></el-option>
                        <el-option label="好友可见" value="friends"></el-option>
                        <el-option label="私密" value="private"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="albumDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveAlbum">保存</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: "PicAlbumView",
    data() {
        return {
            albums: [
                { name: "旅行", description: "记录旅行的点滴", privacy: "public" },
                { name: "家庭", description: "家庭生活的美好瞬间", privacy: "private" },
            ],
            albumDialogVisible: false,
            currentAlbum: {
                name: "",
                description: "",
                privacy: "public",
            },
            editingIndex: null,
        };
    },
    methods: {
        redirectToHome() {
            window.location.href = "http://localhost:8080/HomeView";
        },
        openAlbumDialog() {
            this.currentAlbum = { name: "", description: "", privacy: "public" };
            this.editingIndex = null;
            this.albumDialogVisible = true;
        },
        saveAlbum() {
            if (this.editingIndex !== null) {
                this.albums.splice(this.editingIndex, 1, { ...this.currentAlbum });
            } else {
                this.albums.push({ ...this.currentAlbum });
            }
            this.albumDialogVisible = false;
        },
        editAlbum(album) {
            this.currentAlbum = { ...album };
            this.editingIndex = this.albums.indexOf(album);
            this.albumDialogVisible = true;
        },
        deleteAlbum(index) {
            this.albums.splice(index, 1);
        },
        viewAlbum(album) {
            // 跳转到相册详情页（未实现）
            console.log("查看相册:", album);
        },
    },
};
</script>

<style scoped>
.pic-album-view {
    padding: 20px;
    background-color: #f5f5f5;
}

.album-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 10px;
    text-align: center;
}

.el-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>