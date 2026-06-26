<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <header class="modal-header">
        <h2>{{ isEdit ? '编辑任务' : '新建任务' }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label>任务标题 *</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="请输入任务标题"
            required
          />
        </div>

        <div class="form-group">
          <label>负责人</label>
          <input 
            v-model="form.owner" 
            type="text" 
            placeholder="请输入负责人姓名"
          />
        </div>

        <div class="form-group">
          <label>任务描述</label>
          <textarea 
            v-model="form.description" 
            placeholder="请输入任务描述"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>任务目标</label>
          <textarea 
            v-model="form.goal" 
            placeholder="请输入任务目标"
            rows="3"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始时间</label>
            <input 
              v-model="form.startTime" 
              type="date"
            />
          </div>

          <div class="form-group">
            <label>结束时间</label>
            <input 
              v-model="form.endTime" 
              type="date"
            />
          </div>
        </div>

        <div class="form-group">
          <label>使用设备</label>
          <select v-model="form.device" @change="handleDeviceChange">
            <option value="">请选择设备</option>
            <option v-for="device in deviceOptions" :key="device.value" :value="device.value">
              {{ device.label }}
            </option>
          </select>
        </div>

        <div class="form-group" v-if="form.device === '其他'">
          <label>自定义设备</label>
          <input 
            v-model="form.customDevice" 
            type="text" 
            placeholder="请输入设备名称"
          />
        </div>

        <div class="form-group" v-if="isEdit">
          <label>状态</label>
          <select v-model="form.status">
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存' : '创建' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  task: Object
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.task)

const deviceOptions = [
  { value: '无', label: '无' },
  { value: 'PMM', label: 'PMM' },
  { value: 'GLOBAL+X5', label: 'GLOBAL+X5' },
  { value: 'GLOBAL+白光', label: 'GLOBAL+白光' },
  { value: 'GLOBAL3米设备', label: 'GLOBAL3米设备' },
  { value: '其他', label: '其他' }
]

const form = ref({
  title: '',
  owner: '',
  description: '',
  goal: '',
  startTime: '',
  endTime: '',
  device: '',
  customDevice: '',
  status: 'todo'
})

const handleDeviceChange = () => {
  if (form.value.device !== '其他') {
    form.value.customDevice = ''
  }
}

onMounted(() => {
  if (props.task) {
    form.value = { 
      ...props.task,
      customDevice: props.task.device && !deviceOptions.find(d => d.value === props.task.device) ? props.task.device : '',
      startTime: props.task.startTime || '',
      endTime: props.task.deadline || ''
    }
  }
})

const handleSubmit = () => {
  const submitData = {
    ...form.value,
    device: form.value.device === '其他' ? form.value.customDevice : form.value.device
  }
  // 使用 deadline 字段而非 endTime，保持一致性
  if (submitData.endTime) {
    submitData.deadline = submitData.endTime
  }
  delete submitData.customDevice
  delete submitData.endTime
  emit('submit', submitData)
}
</script>

<style scoped>
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
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #1a1a2e;
}

.form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1a1a2e;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
  padding: 12px 28px;
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
  padding: 12px 28px;
  background: white;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #f5f5f5;
}
</style>