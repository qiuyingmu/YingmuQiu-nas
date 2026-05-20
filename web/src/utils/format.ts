import dayjs from 'dayjs'

/**
 * ?????????????????
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
 * ???????
 */
export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

/**
 * ?????(???)
 */
export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD')
}
