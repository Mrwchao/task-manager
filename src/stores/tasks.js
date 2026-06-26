import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const API_URL = 'https://crudcrud.com/api/5fb63a1082ba4e6bad6c20ba0a4eeafa/tasks'
const STORAGE_KEY = 'task-manager-data'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // 从 crudcrud 加载数据
  const loadFromStorage = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(API_URL)
      if (response.ok) {
        tasks.value = await response.json()
        // 备份到 localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
      } else {
        // 如果网络失败，从 localStorage 读取
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          tasks.value = JSON.parse(saved)
        }
      }
    } catch (e) {
      console.error('Failed to load tasks:', e)
      // 网络失败时从 localStorage 读取
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        tasks.value = JSON.parse(saved)
      }
    } finally {
      isLoading.value = false
    }
  }

  // 保存到 crudcrud
  const saveToCloud = async () => {
    try {
      // 删除所有旧数据，然后重新添加
      const existing = await fetch(API_URL)
      if (existing.ok) {
        const existingTasks = await existing.json()
        // 删除旧数据
        for (const task of existingTasks) {
          await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' })
        }
      }
      // 添加新数据
      for (const task of tasks.value) {
        const { _id, ...taskData } = task
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        })
      }
    } catch (e) {
      console.error('Failed to save to cloud:', e)
    }
  }

  // 监听变化自动保存到 localStorage 和云端
  watch(tasks, async (newTasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
    // 保存到云端
    await saveToCloud()
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
  const updateTask = async (id, updates) => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates }
    }
  }

  // 删除任务
  const deleteTask = async (id) => {
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
    isLoading,
    error,
    loadFromStorage,
    addTask,
    updateTask,
    deleteTask,
    getTask,
    filterByStatus,
    toggleStatus
  }
})