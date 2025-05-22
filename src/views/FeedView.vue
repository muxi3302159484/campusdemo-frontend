<template>
  <div class="campus-feed">
    <!-- 发布动态卡片 -->
    <el-card class="post-editor" shadow="always">
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
            :on-success="handleUploadSuccess"
            :file-list="newPost.images"
            :limit="9"
            :auto-upload="true"
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
    </el-card>

    <!-- 动态列表 -->
    <el-card class="post-list-container" shadow="always">
      <div v-loading="loading">
        <transition-group name="post-list">
          <el-card
              v-for="post in posts"
              :key="post.id"
              class="post-card"
              shadow="hover"
          >
            <!-- 头部 -->
            <div class="post-header">
              <el-avatar :size="50" :src="post.user.avatar"></el-avatar>
              <div class="post-user-info">
                <h4 class="username">{{ post.user.name }}</h4>
                <div class="post-meta">
                  <el-tag
                      :type="post.tag.type"
                      size="mini"
                      effect="plain"
                  >
                    {{ post.tag.label }}
                  </el-tag>
                  <span class="time">{{ formatTime(post.time) }}</span>
                </div>
              </div>
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
          <el-avatar :size="40" :src="comment.user.avatar"></el-avatar>
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
    return {
      currentUser: {
        name: this.$store?.state?.userInfo?.name || '',
        avatar: this.$store?.state?.userInfo?.avatar || '',
        college: this.$store?.state?.userInfo?.college || this.$store?.state?.userInfo?.department || this.$store?.state?.userInfo?.schoolName || '',
        major: this.$store?.state?.userInfo?.major || this.$store?.state?.userInfo?.specialty || ''
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
      currentPage: 1 // 当前页码
    }
  },
  watch: {
    // 保证切换用户后 currentUser 也能同步
    '$store.state.userInfo': {
      handler(val) {
        this.currentUser.name = val?.name || '';
        this.currentUser.avatar = val?.avatar || '';
        this.currentUser.college = val?.college || val?.department || val?.schoolName || '';
        this.currentUser.major = val?.major || val?.specialty || '';
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    resolvedAvatar() {
      // 兼容本地头像和网络头像
      const avatar = this.currentUser.avatar;
      if (!avatar) return require('@/assets/avatars/avatar_1.png');
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
    }
  },
  methods: {
    formatTime(time) {
      return dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    async publishPost() {
      if (!this.newPost.content.trim() || !this.newPost.tag) {
        this.$message.error('请填写完整的动态内容和选择话题！')
        return
      }
      try {
        const response = await axios.post('/api/posts', this.newPost)
        this.$message.success('动态发布成功！')
        this.posts.unshift(response.data) // 将新动态添加到列表顶部
        this.newPost = { content: '', images: [], tag: '' } // 重置输入框
      } catch (error) {
        this.$message.error('发布失败，请稍后重试！')
      }
    },
    handleUploadSuccess(response) {
      this.newPost.images.push(response.url)
    },
    handleLike(post) {
      post.isLiked = !post.isLiked
      post.likes += post.isLiked ? 1 : -1
    },
    showCommentDialog(post) {
      this.currentPost = { ...post, comments: post.comments || [] } // 确保 comments 存在
      this.commentDialogVisible = true
    },
    async submitComment() {
      if (!this.newComment.trim()) {
        this.$message.error('评论内容不能为空！')
        return
      }
      try {
        const response = await axios.post(`/api/posts/${this.currentPost.id}/comments`, {
          content: this.newComment
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
    }
  },
  async created() {
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