import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'task-manager-data'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])

  // 从localStorage加载数据
  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        tasks.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse tasks from storage', e)
        tasks.value = []
      }
    }
  }

  // 监听变化自动保存
  watch(tasks, (newTasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
  }, { deep: true })

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 创建任务
  const addTask = (taskData) => {
    const task = {
      id: generateId(),
      title: taskData.title,
      owner: taskData.owner || '',
      description: taskData.description || '',
      goal: taskData.goal || '',
      startTime: taskData.startTime || '',
      deadline: taskData.deadline || '',
      device: taskData.device || '',
      status: 'todo',
      createdAt: new Date().toISOString(),
      ...taskData
    }
    tasks.value.unshift(task)
    return task
  }

  // 更新任务
  const updateTask = (id, updates) => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates }
    }
  }

  // 删除任务
  const deleteTask = (id) => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  // 获取单个任务
  const getTask = (id) => {
    return tasks.value.find(t => t.id === id)
  }

  // 按状态筛选
  const filterByStatus = (status) => {
    if (!status || status === 'all') {
      return tasks.value
    }
    return tasks.value.filter(t => t.status === status)
  }

  // 切换状态
  const toggleStatus = (id) => {
    const task = getTask(id)
    if (task) {
      const statusOrder = ['todo', 'in_progress', 'done']
      const currentIndex = statusOrder.indexOf(task.status)
      const nextIndex = (currentIndex + 1) % statusOrder.length
      task.status = statusOrder[nextIndex]
    }
  }

  return {
    tasks,
    loadFromStorage,
    addTask,
    updateTask,
    deleteTask,
    getTask,
    filterByStatus,
    toggleStatus
  }
})