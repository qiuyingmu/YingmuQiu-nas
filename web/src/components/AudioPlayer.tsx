import { useRef, useState, useEffect, useCallback } from 'react'
import { Modal, Slider, Typography, Button } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
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

export default function AudioPlayer({ open, fileId, fileName, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)

  const audioUrl = `/api/files/${fileId}/download?token=${getToken()}`

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value
      setVolume(value)
    }
  }

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
    sourceRef.current = null
    onClose()
  }

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        gradient.addColorStop(0, '#1677ff')
        gradient.addColorStop(1, '#69b1ff')
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        x += barWidth
      }
    }

    draw()
  }, [])

  // Initialize audio context and analyser when playback starts
  useEffect(() => {
    if (!playing || !audioRef.current) return

    if (!audioCtxRef.current) {
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaElementSource(audioRef.current)
      sourceRef.current = source
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyserRef.current = analyser
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
    }

    drawWaveform()

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [playing, drawWaveform])

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      style={{ top: '30%' }}
      closeIcon={
        <CloseOutlined className="text-xl hover:text-gray-500" />
      }
    >
      <audio
        key={String(open)}
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex flex-col items-center gap-4 py-4">
        {/* Song icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <SoundOutlined className="text-white text-3xl" />
        </div>

        {/* File name */}
        <Text strong className="text-lg text-center px-4">
          {fileName}
        </Text>

        {/* Progress */}
        <div className="w-full px-4">
          <Slider
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
            tooltip={{ formatter: formatTime }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={60}
          className="w-full max-w-[400px] h-[60px] rounded"
        />

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={
              playing ? (
                <PauseCircleOutlined className="text-2xl" />
              ) : (
                <PlayCircleOutlined className="text-2xl" />
              )
            }
            onClick={togglePlay}
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-40">
          <SoundOutlined className="text-gray-400" />
          <Slider
            className="flex-1 !m-0"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </Modal>
  )
}
