import { useRef, useState, useEffect, useCallback } from 'react'
import { Modal, Slider, Button, Typography, Spin, message } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FullscreenOutlined,
  SoundOutlined,
  CloseOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface Props {
  open: boolean
  fileId: string
  fileName: string
  onClose: () => void
}

function formatTime(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const AUTH_STORAGE_KEY = 'auth-storage'

function getToken(): string {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.state?.token || ''
  } catch {
    return ''
  }
}

export default function VideoPlayer({ open, fileId, fileName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const videoUrl = `/api/files/${fileId}/download?token=${getToken()}`

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setLoading(false)
    }
  }

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value
      setVolume(value)
    }
  }

  const handleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  const handleError_ = () => {
    setLoading(false)
    setError(true)
    message.error('视频播放失败')
  }

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setPlaying(false)
    setCurrentTime(0)
    setError(false)
    setLoading(true)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { padding: 0 } }}
      closeIcon={
        <CloseOutlined className="text-white text-xl hover:text-gray-300" />
      }
      maskStyle={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div className="relative bg-black rounded-t-lg overflow-hidden">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
            <Spin size="large" />
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full max-h-[60vh] outline-none"
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError_}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        />

        {error && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            视频加载失败，请重试
          </div>
        )}

        {/* Custom controls */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white">
          <Button
            type="text"
            icon={
              playing ? (
                <PauseCircleOutlined className="text-white text-xl" />
              ) : (
                <PlayCircleOutlined className="text-white text-xl" />
              )
            }
            onClick={togglePlay}
          />

          <Text className="text-gray-300 text-xs w-16">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          <Slider
            className="flex-1 !m-0"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
            tooltip={{ formatter: formatTime }}
          />

          <SoundOutlined className="text-white text-base" />
          <Slider
            className="!w-20 !m-0"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
          />

          <Button
            type="text"
            icon={<FullscreenOutlined className="text-white text-lg" />}
            onClick={handleFullscreen}
          />
        </div>
      </div>
    </Modal>
  )
}
