import client from './client'

/**
 * 通过 Axios（带 JWT 认证）获取资源 Blob，并创建可被 <img>/<video>/<audio> 标签使用的对象 URL。
 * 使用完后需调用 revokeBlobUrl 释放内存。
 */
export function createAuthBlobUrl(endpoint: string): Promise<string> {
  return client
    .get(endpoint, { responseType: 'blob', timeout: 60000 })
    .then((response) => URL.createObjectURL(response.data))
}

/**
 * 释放通过 createAuthBlobUrl 创建的临时 URL，防止内存泄漏。
 * 在组件卸载或图片加载完成后调用（用 useEffect 的清理函数）。
 */
export function revokeBlobUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url)
}

/**
 * 通过 Axios 下载文件到本地（触发浏览器下载）。
 */
export async function downloadWithAuth(
  endpoint: string,
  filename: string,
): Promise<void> {
  const response = await client.get(endpoint, {
    responseType: 'blob',
    timeout: 120000,
  })
  const blob = response.data
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 从 localStorage 获取 JWT token（适用于直接 URL 传参的场景）。
 */
export function getAuthToken(): string {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.state?.token || ''
  } catch {
    return ''
  }
}
