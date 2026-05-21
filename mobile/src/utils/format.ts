export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const images = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const videos = ['mp4', 'webm', 'mov', 'avi', 'mkv']
  const docs = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  if (images.includes(ext)) return 'image'
  if (videos.includes(ext)) return 'video'
  if (docs.includes(ext)) return 'document'
  return 'file'
}
