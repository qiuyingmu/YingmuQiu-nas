import dayjs from 'dayjs'

/**
 * 格式化文件大小（自动选择单位）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = (bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化日期（仅日期）
 */
export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD')
}
