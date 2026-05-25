import { useEffect, useCallback, useState } from 'react'
import { Modal, Button, Typography, Spin } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { formatDateTime } from '../utils/format'
import { createAuthBlobUrl, revokeBlobUrl } from '../api/authResource'

const { Text } = Typography

export interface PreviewItem {
  fileId: string
  fileName: string
  width?: number
  height?: number
  takenAt?: string
}

interface Props {
  open: boolean
  items: PreviewItem[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function ImagePreview({
  open,
  items,
  currentIndex,
  onClose,
  onIndexChange,
}: Props) {
  const current = items[currentIndex]
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 通过 Axios 带 JWT 认证加载当前图片
  useEffect(() => {
    if (!open || !current) return
    setLoading(true)
    setBlobUrl(null)
    let cancelled = false
    createAuthBlobUrl(`/files/${current.fileId}/download`)
      .then((url) => {
        if (!cancelled) {
          setBlobUrl(url)
          setLoading(false)
        } else {
          revokeBlobUrl(url)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      revokeBlobUrl(blobUrl)
    }
  }, [open, current?.fileId]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, items.length, onIndexChange])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }, [currentIndex, onIndexChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, goNext, goPrev, onClose])

  if (!current) return null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: '90vw', top: 20 }}
      styles={{ body: { padding: 0, height: 'calc(100vh - 100px)' } }}
      closeIcon={
        <CloseOutlined className="text-white text-xl hover:text-gray-300" />
      }
      maskStyle={{ background: 'rgba(0,0,0,0.9)' }}
    >
      <div className="relative flex flex-col h-full bg-black">
        {/* Top info bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/80 text-white z-10">
          <div className="flex items-center gap-4">
            <Text className="text-white font-medium">{current.fileName}</Text>
            {current.width && current.height && (
              <Text className="text-gray-400 text-sm">
                {current.width} × {current.height}
              </Text>
            )}
            {current.takenAt && (
              <Text className="text-gray-400 text-sm">
                拍摄于 {formatDateTime(current.takenAt)}
              </Text>
            )}
          </div>
          <Text className="text-gray-400 text-sm">
            {currentIndex + 1} / {items.length}
          </Text>
        </div>

        {/* Image area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {currentIndex > 0 && (
            <Button
              type="text"
              icon={<LeftOutlined className="text-white text-2xl" />}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hover:bg-white/20"
              onClick={goPrev}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center w-full h-full">
              <Spin size="large" />
            </div>
          ) : (
            <img
              src={blobUrl || ''}
              alt={current.fileName}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {currentIndex < items.length - 1 && (
            <Button
              type="text"
              icon={<RightOutlined className="text-white text-2xl" />}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hover:bg-white/20"
              onClick={goNext}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
