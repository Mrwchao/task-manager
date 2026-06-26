import { createRouter, createWebHashHistory } from 'vue-router'
import TaskList from '../views/TaskList.vue'
import TaskDetail from '../views/TaskDetail.vue'

const routes = [
  {
    path: '/',
    name: 'TaskList',
    component: TaskList
  },
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: TaskDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router