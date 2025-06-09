//  github.com/muxi3302159484 
<template>
  <div class="campus-feed">
    <!-- 顶部Banner和发帖按钮 -->
    <el-card class="feed-banner" shadow="hover">
      <div class="banner-content">
        <div class="banner-left">
          <!-- <img src="/logo.png" class="banner-logo" /> -->
          <i class="el-icon-s-platform banner-logo" style="font-size:60px;color:#1976d2;"></i>
          <div class="banner-title">校园广场</div>
          <div class="banner-desc">发现同学、分享生活、参与社团、交流学习</div>
        </div>
        <div class="banner-actions">
          <el-button type="primary" icon="el-icon-edit" round @click="postDialogVisible = true">
            发帖
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 话题标签栏 -->
    <el-card class="topic-bar" shadow="never">
      <el-tag
        v-for="tag in dynamicTags"
        :key="tag.value"
        :type="tag.type"
        size="medium"
        effect="dark"
        class="topic-tag"
        :hit="newPost.tag === tag.value"
        @click.native="filterByTag(tag.value)"
        :closable="false"
      >
        <i :class="getTagIcon(tag.value)" style="margin-right:4px;"></i>{{ tag.label }}
      </el-tag>
      <el-button v-if="tagFilter" size="mini" @click="clearTagFilter" style="margin-left:12px;">清除筛选</el-button>
    </el-card>

    <!-- 发帖弹窗 -->
    <el-dialog
      title="发布动态"
      :visible.sync="postDialogVisible"
      width="600px"
      top="8vh"
      :close-on-click-modal="false"
      custom-class="post-dialog"
    >
      <div class="editor-header">
        <el-avatar :size="50" :src="resolvedAvatar"></el-avatar>
        <div class="user-info">
          <h3>{{ currentUser.name }}</h3>
          <p class="sub-info">{{ currentUser.college }} · {{ currentUser.major }}</p>
        </div>
      </div>
      <el-input
        type="textarea"
        v-model="newPost.content"
        :rows="4"
        placeholder="分享你的校园新鲜事..."
        resize="none"
        class="post-input"
      ></el-input>
      <div class="editor-footer">
        <div class="action-buttons">
          <el-upload
            action="/api/upload"
            list-type="picture-card"
            :file-list="uploadFileList"
            :limit="9"
            :auto-upload="false"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            :before-upload="beforeImageUpload"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <el-select
            v-model="newPost.tag"
            placeholder="选择话题"
            class="topic-select"
            clearable
          >
            <el-option
              v-for="tag in dynamicTags"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            >
              <el-tag :type="tag.type">{{ tag.label }}</el-tag>
            </el-option>
          </el-select>
        </div>
        <el-button
          type="primary"
          icon="el-icon-s-promotion"
          @click="publishPost"
          :disabled="!newPost.content.trim() || !newPost.tag"
          round
        >
          发布动态
        </el-button>
      </div>
      <span slot="close" class="custom-close" @click="postDialogVisible = false">
        <i class="el-icon-close"></i>
      </span>
    </el-dialog>

    <!-- 动态列表 -->
    <el-card class="post-list-container" shadow="always">
      <div v-loading="loading">
        <el-empty v-if="!posts.length && !loading" description="暂无动态，快来发布你的第一条校园新鲜事吧！" />
        <transition-group name="post-list">
          <el-card
              v-for="post in filteredPosts"
              :key="post.id"
              class="post-card"
              shadow="hover"
          >
            <!-- 头部 -->
            <div class="post-header">
              <el-avatar :size="50" :src="getAvatarSrc(post.user.avatar)"></el-avatar>
              <div class="post-user-info">
                <h4 class="username">{{ post.user.name }}</h4>
                <div class="post-meta">
                  <el-tag
                      :type="post.tag.type"
                      size="mini"
                      effect="plain"
                  >
                    <i :class="getTagIcon(post.tag.value)" style="margin-right:2px;"></i>{{ post.tag.label }}
                  </el-tag>
                  <span class="time">{{ formatTime(post.time) }}</span>
                </div>
              </div>
              <el-tooltip content="关注此人" placement="top">
                <el-button type="text" icon="el-icon-user-solid" size="mini" @click="followUser(post.user)"></el-button>
              </el-tooltip>
            </div>

            <!-- 内容区域 -->
            <div class="post-content">
              <p class="post-text">{{ post.content }}</p>
              <div v-if="post.images.length" class="post-images">
                <el-image
                    v-for="(img, index) in post.images.slice(0,4)"
                    :key="index"
                    :src="img"
                    :preview-src-list="post.images"
                    fit="cover"
                    class="post-image"
                >
                  <div v-if="index === 3 && post.images.length > 4"
                       class="image-more-count">
                    +{{ post.images.length - 4 }}
                  </div>
                </el-image>
              </div>
              <div class="post-extra-info">
                <el-tag v-if="post.user.college" size="mini" type="info" effect="plain" class="post-user-college">
                  <i class="el-icon-school"></i> {{ post.user.college }}
                </el-tag>
                <el-tag v-if="post.user.major" size="mini" type="success" effect="plain" class="post-user-major">
                  <i class="el-icon-notebook-2"></i> {{ post.user.major }}
                </el-tag>
              </div>
            </div>

            <!-- 互动区域 -->
            <div class="post-actions">
              <el-tooltip content="点赞" placement="top">
                <div
                    class="action-item"
                    @click="handleLike(post)"
                    :class="{ 'liked': post.isLiked }"
                >
                  <i class="el-icon-star-off"></i>
                  <span>{{ post.likes }}</span>
                </div>
              </el-tooltip>

              <el-tooltip content="评论" placement="top">
                <div
                    class="action-item"
                    @click="showCommentDialog(post)"
                >
                  <i class="el-icon-chat-line-round"></i>
                  <span>{{ post.comments.length }}</span>
                </div>
              </el-tooltip>

              <el-tooltip content="分享" placement="top">
                <div class="action-item">
                  <i class="el-icon-share"></i>
                </div>
              </el-tooltip>

              <el-tooltip content="举报" placement="top">
                <div class="action-item" @click="reportPost(post)">
                  <i class="el-icon-warning-outline"></i>
                </div>
              </el-tooltip>
            </div>
          </el-card>
        </transition-group>

        <!-- 分页 -->
        <el-pagination
          background
          layout="prev, pager, next, total, sizes"
          :total="totalPosts"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
          class="pagination"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 评论弹窗 -->
    <el-dialog
      :title="`共 ${currentPost.comments?.length || 0} 条评论`"
      :visible.sync="commentDialogVisible"
      width="600px"
    >
      <div class="comment-list">
        <div v-for="comment in currentPost.comments || []" :key="comment.id" class="comment-item">
          <el-avatar :size="40" :src="getAvatarSrc(comment.user.avatar)"></el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="username">{{ comment.user.name }}</span>
              <span class="time">{{ formatTime(comment.time) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
          </div>
        </div>
      </div>
      <div class="comment-input">
        <el-input
            v-model="newComment"
            placeholder="写下你的评论..."
            type="textarea"
            :rows="3"
            resize="none"
        ></el-input>
        <el-button
            type="primary"
            @click="submitComment"
            class="submit-btn"
        >
          发表评论
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import axios from 'axios'

export default {
  data() {
    // 只从 localStorage 获取 userId，兼容字符串和数字
    let userId = localStorage.getItem('userId');
    if (userId === null || userId === undefined || userId === 'null' || userId === '') userId = '';
    return {
      currentUser: {
        id: userId,
        name: '',
        avatar: '',
        college: '',
        major: ''
      },
      newPost: {
        content: '',
        images: [],
        tag: ''
      },
      dynamicTags: [
        { value: 'campus', label: '校园生活', type: 'success' },
        { value: 'club', label: '社团活动', type: 'warning' },
        { value: 'study', label: '学习交流', type: 'info' },
        { value: 'market', label: '二手市场', type: 'danger' }
      ],
      posts: [], // 确保初始化为空数组
      currentPost: { comments: [] }, // 初始化 comments 为数组
      commentDialogVisible: false,
      newComment: '',
      loading: false,
      totalPosts: 0,
      pageSize: 10,
      currentPage: 1, // 当前页码
      postDialogVisible: false, // 控制发帖弹窗显示
      tagFilter: '', // 当前筛选的话题标签
      uploadFileList: [] // 上传文件列表
    }
  },
  watch: {
    // 只监听 localStorage 变化（如需支持多标签页同步，可用 storage 事件）
  },
  computed: {
    resolvedAvatar() {
      const avatar = this.currentUser.avatar;
      if (!avatar) return require('@/assets/avatars/avatar_1.png');
      // 如果是数字字符串 1-4，自动拼接本地图片
      if (/^[1-4]$/.test(avatar)) {
        return require(`@/assets/avatars/avatar_${avatar}.png`);
      }
      // 如果是本地头像名
      if (/^avatar_\d+\.png$/.test(avatar)) {
        try {
          return require(`@/assets/avatars/${avatar}`);
        } catch {
          return require('@/assets/avatars/avatar_1.png');
        }
      }
      // 网络头像
      return avatar;
    },
    filteredPosts() {
      if (!this.tagFilter) return this.posts;
      return this.posts.filter(post => post.tag && post.tag.value === this.tagFilter);
    }
  },
  methods: {
    formatTime(time) {
      return dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    async publishPost() {
      // 发帖
      if (!this.newPost.content.trim() || !this.newPost.tag) {
        this.$message.error('请填写完整的动态内容和选择话题！')
        return
      }
      try {
        const userId = this.currentUser.id;
        if (!userId || userId === 'null' || userId === undefined) {
          this.$message.error('用户信息缺失，请重新登录');
          return;
        }
        // 1. 先上传图片（如有缓存文件）
        let imageUrls = [];
        if (this.newPost.imageFiles && this.newPost.imageFiles.length) {
          imageUrls = await this.uploadImages();
        }
        // 2. 再发帖，确保 images 字段为图片 URL 数组
        const postData = {
          userId,
          content: this.newPost.content,
          images: imageUrls,
          tag: this.newPost.tag
        };
        const response = await axios.post('/api/posts', postData)
        this.$message.success('动态发布成功！')
        this.posts.unshift(response.data)
        this.newPost = { content: '', images: [], imageFiles: [], tag: '' }
        this.uploadFileList = [];
        this.postDialogVisible = false
      } catch (error) {
        this.$message.error('发布失败，请稍后重试！')
      }
    },
    handleImageChange(file, fileList) {
      // 图片选择变更
      // 只保留最后一张图片
      this.uploadFileList = fileList.slice(-1);
      this.newPost.imageFiles = fileList.slice(-1).map(f => f.raw).filter(Boolean);
      this.newPost.images = fileList.slice(-1).map(file => file.url || file.response?.url).filter(Boolean);
    },
    handleImageRemove(file, fileList) {
      // 移除图片
      this.uploadFileList = fileList;
      this.newPost.imageFiles = fileList.map(f => f.raw).filter(Boolean);
      this.newPost.images = fileList.map(file => file.url || file.response?.url).filter(Boolean);
    },
    beforeImageUpload(file) {
      // 图片上传前校验
      // 可根据需要校验图片类型/大小，返回 true 允许上传，false 拒绝
      // 这里只做简单类型校验示例
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        this.$message.error('只能上传图片文件！');
        return false;
      }
      // 可加大小限制等
      return true;
    },
    async uploadImages() {
      // 兼容后端单文件上传接口，依次上传所有图片，返回图片URL数组
      if (!this.newPost.imageFiles || !this.newPost.imageFiles.length) return [];
      const urls = [];
      for (const file of this.newPost.imageFiles) {
        const formData = new FormData();
        formData.append('file', file); // 注意字段名为file
        try {
          // 注意：后端接口为 /api/posts/upload
          const response = await axios.post('/api/posts/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          // 兼容后端返回 { code, message, data: { url } }
          if (response.data && response.data.code === 200 && response.data.data && response.data.data.url) {
            urls.push(response.data.data.url);
          } else {
            this.$message.error(response.data.message || '图片上传失败！');
          }
        } catch (e) {
          this.$message.error('图片上传失败，请稍后重试！');
        }
      }
      return urls;
    },
    showCommentDialog(post) {
      this.currentPost = { ...post, comments: post.comments || [] } // 确保 comments 存在
      this.commentDialogVisible = true
    },
    async submitComment() {
      // 发表评论
      if (!this.newComment.trim()) {
        this.$message.error('评论内容不能为空！')
        return
      }
      try {
        // 获取当前登录用户ID
        let userId = this.currentUser.id;
        if (!userId) {
          // 兼容 Vuex 和 localStorage
          const storeUser = this.$store && this.$store.state && this.$store.state.userInfo;
          if (storeUser && (storeUser.userId || storeUser.id)) {
            userId = storeUser.userId || storeUser.id;
          } else {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
              const userInfo = JSON.parse(userInfoStr);
              userId = userInfo.userId || userInfo.id;
            }
          }
        }
        if (!userId) {
          this.$message.error('用户信息缺失，请重新登录');
          return;
        }
        const response = await axios.post(`/api/posts/${this.currentPost.id}/comments`, {
          content: this.newComment,
          userId: userId // 新增 userId 字段
        })
        this.currentPost.comments.push(response.data) // 更新评论列表
        this.newComment = '' // 清空输入框
        this.$message.success('评论成功！')
      } catch (error) {
        this.$message.error('评论失败，请稍后重试！')
      }
    },
    async handlePageChange(page) {
      this.currentPage = page
      this.loading = true
      try {
        const response = await axios.get('/api/posts', {
          params: { page, pageSize: this.pageSize }
        })
        this.posts = response.data.posts || [] // 确保 posts 为数组
        this.totalPosts = response.data.total || 0
      } catch (error) {
        this.$message.error('加载失败，请检查网络或稍后重试！')
        this.posts = [] // 确保 posts 不为空
      } finally {
        this.loading = false
      }
    },
    filterByTag(tagValue) {
      this.tagFilter = tagValue;
    },
    clearTagFilter() {
      this.tagFilter = '';
    },
    getTagIcon(tagValue) {
      switch(tagValue) {
        case 'campus': return 'el-icon-office-building';
        case 'club': return 'el-icon-flag';
        case 'study': return 'el-icon-notebook-2';
        case 'market': return 'el-icon-shopping-cart-2';
        default: return 'el-icon-collection';
      }
    },
    followUser(user) {
      this.$message.success(`已关注 ${user.name}`);
    },
    reportPost(post) {
      this.$message.warning('举报功能暂未开放，敬请期待！');
    },
    async loadPosts() {
      // 加载动态
      this.loading = true;
      try {
        const response = await axios.get('/api/posts', {
          params: { page: this.currentPage, pageSize: this.pageSize, tag: this.tagFilter }
        });
        this.posts = response.data.posts || [];
        this.totalPosts = response.data.total || 0;
      } catch (error) {
        this.$message.error('加载失败，请检查网络或稍后重试！');
        this.posts = [];
      } finally {
        this.loading = false;
      }
    },
    getAvatarSrc(avatar) {
      // 兼容数字、字符串、完整URL、空值
      if (!avatar) return require('@/assets/avatars/avatar_1.png');
      if (typeof avatar === 'number' || (typeof avatar === 'string' && /^\d+$/.test(avatar))) {
        try {
          return require(`@/assets/avatars/avatar_${avatar}.png`);
        } catch (e) {
          return require('@/assets/avatars/avatar_1.png');
        }
      }
      // 若为URL或base64
      return avatar;
    },
    async handleLike(post) {
      // 点赞
      // 获取当前登录用户ID
      let userId = this.currentUser.id;
      if (!userId) {
        // 兼容 Vuex 和 localStorage
        const storeUser = this.$store && this.$store.state && this.$store.state.userInfo;
        if (storeUser && (storeUser.userId || storeUser.id)) {
          userId = storeUser.userId || storeUser.id;
        } else {
          const userInfoStr = localStorage.getItem('userInfo');
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            userId = userInfo.userId || userInfo.id;
          }
        }
      }
      if (!userId) {
        this.$message.error('用户信息缺失，请重新登录');
        return;
      }
      try {
        const response = await axios.post(`/api/posts/${post.id}/like`, {
          userId: userId
        });
        // 假设后端返回最新点赞数和状态
        post.likes = response.data.likes;
        post.isLiked = response.data.isLiked;
      } catch (e) {
        this.$message.error('点赞失败，请稍后重试！');
      }
    },
  },
  async created() {
    // 优先从 localStorage 获取 userInfo
    let userInfo = null;
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }
    } catch {}
    let userId = '';
    if (userInfo && (userInfo.userId || userInfo.id)) {
      userId = userInfo.userId || userInfo.id;
      this.currentUser.id = userId;
      this.currentUser.name = userInfo.name || userInfo.username || '';
      this.currentUser.avatar = userInfo.avatar || '';
      this.currentUser.college = userInfo.college || '';
      this.currentUser.major = userInfo.major || '';
    } else {
      // fallback: 兼容旧逻辑
      userId = localStorage.getItem('userId');
      if (userId === null || userId === undefined || userId === 'null' || userId === '') userId = '';
      this.currentUser.id = userId;
    }
    this.loading = true
    try {
      const response = await axios.get('/api/posts', {
        params: { page: this.currentPage, pageSize: this.pageSize }
      })
      this.posts = response.data.posts || [] // 确保 posts 为数组
      this.totalPosts = response.data.total || 0
    } catch (error) {
      this.$message.error('加载失败，请检查网络或稍后重试！')
      this.posts = [] // 确保 posts 不为空
    } finally {
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.campus-feed {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;

  .feed-header-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }

  .post-editor {
    margin-bottom: 40px;
    border-radius: 16px;

    .editor-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .user-info {
        margin-left: 20px;

        h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .sub-info {
          margin: 5px 0 0;
          font-size: 14px;
          color: #888;
        }
      }
    }

    .post-input {
      ::v-deep .el-textarea__inner {
      }

      .topic-select {
        width: 180px;
      }
    }
  }

  .post-dialog {
    border-radius: 16px;
    overflow: visible;

    .el-dialog__header {
      padding: 18px 24px 0 24px;
    }

    .el-dialog__body {
      padding: 24px 32px 8px 32px;
    }
  }

  .custom-close {
    position: absolute;
    right: 18px;
    top: 18px;
    font-size: 22px;
    color: #888;
    cursor: pointer;
    z-index: 10;
    transition: color 0.2s;

    &:hover {
      color: #f56c6c;
    }
  }

  .feed-banner {
    margin-bottom: 24px;
    background: linear-gradient(90deg, #e3f2fd 0%, #fff 100%);
    border-radius: 18px;
    border: none;
    box-shadow: 0 2px 12px rgba(33,150,243,0.08);

    .banner-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 32px 12px 32px;

      .banner-left {
        display: flex;
        align-items: center;

        .banner-logo {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          margin-right: 22px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.10);
        }

        .banner-title {
          font-size: 28px;
          font-weight: bold;
          color: #1976d2;
          margin-right: 18px;
        }

        .banner-desc {
          font-size: 16px;
          color: #666;
          margin-left: 8px;
        }
      }

      .banner-actions {
        display: flex;
        align-items: center;
      }
    }
  }

  .topic-bar {
    margin-bottom: 18px;
    background: #f5f7fa;
    border-radius: 12px;
    border: none;
    box-shadow: 0 1px 6px rgba(33,150,243,0.04);
    padding: 10px 24px 6px 24px;

    .topic-tag {
      margin-right: 12px;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;

      &:hover {
        background: #e3f2fd;
        color: #1976d2;
      }
    }
  }

  .post-list-container {
    padding: 20px;
    border-radius: 16px;
    background-color: #f9f9f9;
  }

  .post-card {
    margin-bottom: 25px;
    border-radius: 16px;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .post-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .post-user-info {
        margin-left: 20px;

        .username {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .post-meta {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;

          .time {
            font-size: 14px;
            color: #888;
          }
        }
      }
    }

    .post-content {
      .post-text {
        margin: 0 0 20px;
        line-height: 1.8;
        color: #555;
      }

      .post-images {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-top: 12px;

        .post-image {
          position: relative;
          height: 200px;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;

          .image-more-count {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }
        }
      }

      .post-extra-info {
        margin-top: 8px;
        display: flex;
        gap: 10px;

        .post-user-college,
        .post-user-major {
          margin-right: 6px;
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #555;
          background-color: #f0f2f5;
          padding: 5px 10px;
          border-radius: 12px;

          i {
            margin-right: 4px;
            font-size: 16px;
          }
        }
      }
    }

    .post-actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 30px;

      .action-item {
        display: flex;
        align-items: center;
        cursor: pointer;
        color: #666;
        transition: all 0.3s;

        i {
          font-size: 20px;
          margin-right: 8px;
        }

        &:hover {
          color: #409EFF;

          i {
            transform: scale(1.2);
          }
        }

        &.liked {
          color: #F56C6C;

          i {
            animation: like 0.6s ease;
          }
        }
      }
    }
  }

  .pagination {
    margin: 30px 0;
    display: flex;
    justify-content: center;
  }

  .comment-list {
    .comment-item {
      display: flex;
      gap: 15px;
      padding: 15px 0;
      border-bottom: 1px solid #f0f2f5;

      .comment-content {
        flex: 1;

        .comment-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;

          .username {
            font-size: 16px;
            color: #333;
          }

          .time {
            font-size: 14px;
            color: #888;
          }
        }

        .comment-text {
          margin: 0;
          color: #555;
          line-height: 1.6;
        }
      }
    }
  }

  .comment-input {
    margin-top: 25px;

    .submit-btn {
      margin-top: 15px;
      float: right;
    }
  }
}

@keyframes like {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.post-list-enter-active,
.post-list-leave-active {
  transition: all 0.5s ease;
}
.post-list-enter,
.post-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>