import { useRef, useEffect, useState, useCallback } from 'react'
import { Skeleton } from 'antd'
import {
  FileImageOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { mediaApi } from '../api/media'

interface Props {
  fileId: string
  fileName: string
  mediaType: string
  hasThumbnail: boolean
  size?: 'small' | 'medium'
  className?: string
  onClick?: () => void
}

const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
  image: { icon: <FileImageOutlined className="text-3xl" />, bg: 'bg-blue-50' },
  video: { icon: <PlayCircleOutlined className="text-3xl" />, bg: 'bg-purple-50' },
  audio: { icon: <SoundOutlined className="text-3xl" />, bg: 'bg-green-50' },
  document: { icon: <FileOutlined className="text-3xl" />, bg: 'bg-gray-50' },
  folder: { icon: <FolderOutlined className="text-3xl" />, bg: 'bg-yellow-50' },
}

const iconColors: Record<string, string> = {
  image: '#1677ff',
  video: '#722ed1',
  audio: '#52c41a',
  document: '#8c8c8c',
  folder: '#faad14',
}

export default function Thumbnail({
  fileId,
  fileName,
  mediaType,
  hasThumbnail,
  size = 'small',
  className = '',
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const dimClass = size === 'medium' ? 'w-32 h-32' : 'w-20 h-20'

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  const showThumb = visible && hasThumbnail && !error
  const showIcon = !visible || !hasThumbnail || error

  const entry = iconMap[mediaType] || iconMap.document
  const color = iconColors[mediaType] || iconColors.document

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg cursor-pointer ${dimClass} ${className}`}
      onClick={onClick}
    >
      {showThumb && !loaded && (
        <Skeleton.Image className={`!w-full !h-full !${dimClass}`} active />
      )}

      {showThumb && (
        <img
          src={mediaApi.getThumbnailUrl(fileId, size)}
          alt={fileName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {showIcon && (
        <div
          className={`w-full h-full flex items-center justify-center ${entry.bg}`}
        >
          <span style={{ color }}>{entry.icon}</span>
        </div>
      )}

      {size === 'medium' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
          <p className="text-white text-xs truncate">{fileName}</p>
        </div>
      )}
    </div>
  )
}
