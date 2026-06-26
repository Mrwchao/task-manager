<template>
  <div class="task-list">
    <header class="header">
      <h1>工程师任务管理</h1>
      <div class="header-actions">
        <template v-if="isAdmin">
          <button class="btn-primary" @click="showForm = true">+ 新建任务</button>
          <button class="btn-secondary" @click="logout">退出登录</button>
        </template>
        <button v-else class="btn-secondary" @click="showLogin = true">管理员登录</button>
      </div>
    </header>

    <div class="week-nav">
      <button class="nav-btn" @click="prevWeek">←</button>
      <span class="current-week">{{ currentWeekLabel }}</span>
      <button class="nav-btn" @click="nextWeek">→</button>
      <button class="today-btn" @click="goToCurrentWeek">今天</button>
    </div>

    <div class="week-table-wrapper">
      <table class="week-table">
        <thead>
          <tr>
            <th class="week-col">工作周</th>
            <th v-for="(day, index) in displayWeeks[0]?.days || []" :key="index" class="day-col">
              <div class="day-header">
                <span class="day-name">{{ weekDays[index] }}</span>
                <span class="day-date">{{ day.date }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in displayWeeks" :key="week.weekLabel">
            <td class="week-col week-label">{{ week.weekLabel }}</td>
            <td v-for="day in week.days" :key="day.dateStr" class="day-cell">
              <div class="day-tasks">
                <div 
                  v-for="task in day.tasks" 
                  :key="task.id"
                  class="mini-task"
                  @click="goToDetail(task.id)"
                >
                  <div class="mini-task-row">
                    <span class="mini-task-title">{{ task.title }}</span>
                    <span v-if="task.owner" class="mini-task-owner">{{ task.owner }}</span>
                  </div>
                  <span v-if="task.description" class="mini-task-desc">{{ task.description }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="status-dot todo"></span>待办</span>
      <span class="legend-item"><span class="status-dot in_progress"></span>进行中</span>
      <span class="legend-item"><span class="status-dot done"></span>已完成</span>
    </div>

    <TaskForm v-if="showForm" @close="showForm = false" @submit="handleSubmit" />

    <div v-if="showLogin" class="modal-overlay" @click.self="showLogin = false">
      <div class="modal">
        <h3>管理员登录</h3>
        <input 
          v-model="loginPassword" 
          type="password" 
          placeholder="请输入管理员密码"
          @keyup.enter="handleLogin"
        />
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLogin = false">取消</button>
          <button class="btn-primary" @click="handleLogin">登录</button>
        </div>
        <p v-if="loginError" class="error-msg">{{ loginError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/tasks'
import TaskForm from '../components/TaskForm.vue'

const router = useRouter()
const store = useTaskStore()

const showForm = ref(false)
const showLogin = ref(false)
const loginPassword = ref('')
const loginError = ref('')
const currentDate = ref(new Date())
const isAdmin = ref(localStorage.getItem('taskManagerAdmin') === 'true')

// 监听 localStorage 变化
window.addEventListener('storage', () => {
  isAdmin.value = localStorage.getItem('taskManagerAdmin') === 'true'
})

const ADMIN_PASSWORD = 'admin123'

const login = () => {
  localStorage.setItem('taskManagerAdmin', 'true')
  isAdmin.value = true
  showLogin.value = false
  loginPassword.value = ''
  loginError.value = ''
  // 使用 nextTick 确保 DOM 更新后再刷新
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

const logout = () => {
  localStorage.removeItem('taskManagerAdmin')
  isAdmin.value = false
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

const handleLogin = () => {
  if (loginPassword.value === ADMIN_PASSWORD) {
    login()
  } else {
    loginError.value = '密码错误'
  }
}

const weekDays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']

onMounted(() => {
  store.loadFromStorage()
})

const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

const formatDate = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const currentWeekLabel = computed(() => {
  const start = getWeekStart(currentDate.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${formatDate(start)} - ${formatDate(end)}`
})

const prevWeek = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - 7)
  currentDate.value = d
}

const nextWeek = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + 7)
  currentDate.value = d
}

const goToCurrentWeek = () => {
  currentDate.value = new Date()
}

const getTaskWeekKey = (task) => {
  if (!task.startTime && !task.deadline) return null
  const date = task.startTime || task.deadline
  const start = getWeekStart(new Date(date))
  return {
    start,
    label: `${formatDate(start)}-${formatDate(new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000))}`
  }
}

const displayWeeks = computed(() => {
  const weekStart = getWeekStart(currentDate.value)
  const weeks = []
  
  for (let i = 0; i < 2; i++) {
    const start = new Date(weekStart)
    start.setDate(start.getDate() + i * 7)
    
    const days = []
    for (let j = 0; j < 7; j++) {
      const dayDate = new Date(start)
      dayDate.setDate(dayDate.getDate() + j)
      const dateStr = dayDate.toISOString().split('T')[0]
      
      const dayTasks = store.tasks.filter(task => {
        if (!task.startTime && !task.deadline) return false
        const start = task.startTime || task.deadline
        const end = task.deadline || task.startTime
        return dateStr >= start && dateStr <= end
      })
      
      days.push({
        name: weekDays[j],
        date: formatDate(dayDate),
        dateStr,
        tasks: dayTasks
      })
    }
    
    const weekEnd = new Date(start)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    weeks.push({
      weekLabel: `${formatDate(start)}-${formatDate(weekEnd)}`,
      days
    })
  }
  
  return weeks
})

const goToDetail = (id) => {
  router.push(`/task/${id}`)
}

const handleSubmit = (taskData) => {
  store.addTask(taskData)
  showForm.value = false
}
</script>

<style scoped>
.task-list {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.current-week {
  font-size: 18px;
  font-weight: 500;
  color: #1a1a2e;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: #f5f5f5;
}

.today-btn {
  padding: 8px 16px;
  border: 1px solid #1a1a2e;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}

.week-table-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
}

.week-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 1200px;
}

.week-col {
  width: 80px;
  min-width: 80px;
  background: #f8f9fa;
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #1a1a2e;
  border-right: 1px solid #e0e0e0;
}

.day-col {
  width: calc((100% - 80px) / 7);
  min-width: 150px;
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.day-name {
  font-weight: 600;
  color: #1a1a2e;
}

.day-date {
  font-size: 12px;
  color: #999;
}

.day-cell {
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  min-height: 150px;
  vertical-align: top;
}

.day-tasks {
  padding: 8px;
}

.mini-task {
  background: #f0f4ff;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid #6366f1;
}

.mini-task:hover {
  background: #e0e7ff;
}

.mini-task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mini-task-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-task-owner {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}

.mini-task-desc {
  display: block;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  line-height: 1.4;
}

.legend {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.todo {
  background: #e65100;
}

.status-dot.in_progress {
  background: #1565c0;
}

.status-dot.done {
  background: #2e7d32;
}

.btn-primary {
  padding: 12px 24px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary:hover {
  background: #2a2a4e;
}

.btn-secondary {
  padding: 12px 24px;
  background: white;
  color: #1a1a2e;
  border: 1px solid #1a1a2e;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
}

.modal h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.modal input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.error-msg {
  color: #e65100;
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
}
</style>