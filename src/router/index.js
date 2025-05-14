import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView'
import Test from '../views/Test'
import Login from '../views/Login';
import ChatView from '../views/ChatView';
import FeedView from '../views/FeedView';
import PicAlbumView from '../views/PicAlbumView';
import ManageView from '../views/ManageView';
import ProfileManage from '../views/ProfileManage';
Vue.use(VueRouter)

const routes = [
  {
    path: '/PicAlbumView',
    name: 'PicAlbumView',
    component: PicAlbumView
  },
  {
    path: '/ManageView',
    name: 'ManageView',
    component: ManageView
  },
  {
    path: '/FeedView',
    name: 'FeedView',
    component: FeedView
  },
  {
    path: '/ChatView',
    name: 'ChatView',
    component: ChatView
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/test',
    name: 'Test',
    component: Test
  },
  {
    path: '/HomeView',
    name: 'home',
    component: HomeView
  },
  {
    path: '/ProfileManage',
    name: 'ProfileManage',
    component: ProfileManage
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    return next();
  }
  const token = localStorage.getItem('authToken');
  if (!token) {
    return next('/login');
  }
  next();
});

export default router
