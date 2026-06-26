import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const API_URL = 'https://crudcrud.com/api/5fb63a1082ba4e6bad6c20ba0a4eeafa/tasks'
const STORAGE_KEY = 'task-manager-data'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const isLoading = ref(false)

  // 从 crudcrud 加载数据
  const loadFromStorage = async () => {
    isLoading.value = true
    try {
      console.log('Loading from crudcrud...')
      const response = await fetch(API_URL)
      if (response.ok) {
        const data = await response.json()
        console.log('crudcrud data:', data)
        if (Array.isArray(data)) {
          tasks.value = data.map(item => ({
            ...item,
            id: item._id || item.id
          }))
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
      }
    } catch (e) {
      console.error('Load error:', e)
      // 从 localStorage 恢复
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          tasks.value = JSON.parse(saved)
          console.log('Fallback to localStorage:', tasks.value.length, 'tasks')
        } catch {}
      }
    } finally {
      isLoading.value = false
    }
  }

  // 保存到 crudcrud - 使用更可靠的更新策略
  const saveToCloud = async () => {
    if (tasks.value.length === 0) return

    try {
      console.log('Saving to crudcrud...', tasks.value.length, 'tasks')

      // 获取现有数据的 _id 映射
      const existingRes = await fetch(API_URL)
      if (existingRes.ok) {
        const existingTasks = await existingRes.json()
        console.log('Existing tasks:', existingTasks.length)

        // 删除不存在的任务
        const existingIds = new Set(existingTasks.map(t => t._id))
        for (const task of existingTasks) {
          const localTask = tasks.value.find(t => t._id === task._id || t.id === task._id)
          if (!localTask) {
            await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' })
          }
        }

        // 添加或更新任务
        for (const task of tasks.value) {
          if (task._id) {
            // 更新现有任务
            const { _id, id, createdAt, ...updateData } = task
            await fetch(`${API_URL}/${task._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(task)
            })
          } else {
            // 添加新任务
            const { id, ...taskData } = task
            await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            })
          }
        }
      }
    } catch (e) {
      console.error('Save error:', e)
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
  const addTask = async (taskData) => {
    const task = {
      _id: 'task_' + Date.now(),  // 使用 _id 便于 crudcrud 更新
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
    // 立即保存到云端
    await saveToCloud()
    return task
  }

  // 更新任务
  const updateTask = async (id, updates) => {
    const index = tasks.value.findIndex(t => t._id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates }
      await saveToCloud()
    }
  }

  // 删除任务
  const deleteTask = async (id) => {
    const index = tasks.value.findIndex(t => t._id === id)
    if (index !== -1) {
      // 先从云端删除
      try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      } catch (e) {}
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