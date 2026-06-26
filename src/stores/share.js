// 任务数据分享服务
// 管理员创建任务后，生成分享 URL 给工程师

// 将任务数据编码为 URL
export function encodeTasksToUrl(tasks) {
  const json = JSON.stringify(tasks)
  const base64 = btoa(unescape(encodeURIComponent(json)))  // 支持中文
  return base64
}

// 从 URL 解码任务数据
export function decodeTasksFromUrl(hash) {
  try {
    if (hash.startsWith('#/share?data=')) {
      const base64 = hash.replace('#/share?data=', '')
      const json = decodeURIComponent(escape(atob(base64)))
      return JSON.parse(json)
    }
  } catch (e) {
    console.error('Failed to decode tasks from URL:', e)
  }
  return null
}

// 检测是否是分享链接
export function isShareUrl() {
  return window.location.hash.startsWith('#/share?data=')
}