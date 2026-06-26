<template>
  <div class="task-detail" v-if="task">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="actions" v-if="isAdmin">
        <button class="btn-secondary" @click="showEditForm = true">编辑</button>
        <button class="btn-danger" @click="confirmDelete">删除</button>
      </div>
    </header>

    <div class="content">
      <div class="status-row">
        <span :class="['status-badge', task.status]">
          {{ getStatusLabel(task.status) }}
        </span>
        <button 
          v-if="isAdmin && canToggleStatus"
          class="btn-toggle"
          @click="toggleStatus"
        >
          切换到 {{ getNextStatusLabel() }}
        </button>
      </div>

      <h1 class="title">{{ task.title }}</h1>

      <div class="info-grid">
        <div class="info-item">
          <label>负责人</label>
          <span>{{ task.owner || '-' }}</span>
        </div>
        <div class="info-item">
          <label>创建时间</label>
          <span>{{ formatFullDate(task.createdAt) }}</span>
        </div>
        <div class="info-item" v-if="task.startTime && task.deadline">
          <label>时间节点</label>
          <span>{{ formatFullDate(task.startTime) }} - {{ formatFullDate(task.deadline) }}</span>
        </div>
        <div class="info-item" v-if="task.device">
          <label>使用设备</label>
          <span>{{ task.device }}</span>
        </div>
      </div>

      <div class="section">
        <h3>任务描述</h3>
        <p class="description">{{ task.description || '暂无描述' }}</p>
      </div>

      <div class="section">
        <h3>注意事项</h3>
        <p class="goal">{{ task.goal || '暂无' }}</p>
      </div>
    </div>

    <TaskForm 
      v-if="showEditForm" 
      :task="task"
      @close="showEditForm = false"
      @submit="handleUpdate"
    />
  </div>

  <div v-else class="not-found">
    <p>任务不存在</p>
    <button class="btn-primary" @click="goBack">返回列表</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '../stores/tasks'
import TaskForm from '../components/TaskForm.vue'

const props = defineProps({
  id: String
})

const router = useRouter()
const route = useRoute()
const store = useTaskStore()

const task = ref(null)
const showEditForm = ref(false)

const isAdmin = computed(() => {
  return localStorage.getItem('taskManagerAdmin') === 'true'
})

const statusOptions = [
  { value: 'todo', label: '待办', next: '进行中' },
  { value: 'in_progress', label: '进行中', next: '已完成' },
  { value: 'done', label: '已完成', next: '待办' }
]

onMounted(() => {
  store.loadFromStorage()
  const id = props.id || route.params.id
  task.value = store.getTask(id)
})

const canToggleStatus = computed(() => task.value && task.value.status !== undefined)

const getStatusLabel = (status) => {
  const option = statusOptions.find(s => s.value === status)
  return option ? option.label : status
}

const getNextStatusLabel = () => {
  if (!task.value) return ''
  const option = statusOptions.find(s => s.value === task.value.status)
  return option ? option.next : ''
}

const formatFullDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const goBack = () => {
  router.push('/')
}

const toggleStatus = () => {
  if (task.value) {
    store.toggleStatus(task.value.id)
    task.value = store.getTask(task.value.id)
  }
}

const handleUpdate = (updates) => {
  store.updateTask(task.value.id, updates)
  task.value = store.getTask(task.value.id)
  showEditForm.value = false
}

const confirmDelete = () => {
  if (confirm('确定要删除这个任务吗？')) {
    store.deleteTask(task.value.id)
    router.push('/')
  }
}
</script>

<style scoped>
.task-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  padding: 8px 0;
}

.back-btn:hover {
  color: #1a1a2e;
}

.actions {
  display: flex;
  gap: 12px;
}

.content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #f0f0f0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.todo {
  background: #fff3e0;
  color: #e65100;
}

.status-badge.in_progress {
  background: #e3f2fd;
  color: #1565c0;
}

.status-badge.done {
  background: #e8f5e9;
  color: #2e7d32;
}

.btn-toggle {
  padding: 6px 16px;
  border: 1px solid #1a1a2e;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
}

.btn-toggle:hover {
  background: #1a1a2e;
  color: white;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 24px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 15px;
  color: #1a1a2e;
  font-weight: 500;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 12px 0;
}

.description,
.goal {
  font-size: 15px;
  color: #666;
  line-height: 1.7;
  margin: 0;
}

.not-found {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.not-found p {
  margin-bottom: 20px;
}

.btn-primary {
  padding: 12px 24px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  padding: 8px 20px;
  background: white;
  color: #1a1a2e;
  border: 1px solid #1a1a2e;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger {
  padding: 8px 20px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>