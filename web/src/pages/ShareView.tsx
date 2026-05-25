import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  Button,
  Input,
  Typography,
  Space,
  Spin,
  Result,
  message,
} from 'antd'
import {
  DownloadOutlined,
  LockOutlined,
  FileOutlined,
  FolderOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { shareApi, type ShareLinkResponse } from '../api/share'

const { Title, Text } = Typography

export default function ShareView() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [fileInfo, setFileInfo] = useState<ShareLinkResponse | null>(null)
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('无效的分享链接')
      setLoading(false)
      return
    }

    setLoading(true)
    shareApi
      .getPublic(token)
      .then((info) => {
        setFileInfo(info)
        setNeedPassword(info.hasPassword)
        // 如果没有密码，直接标记已验证
        if (!info.hasPassword) {
          setVerified(true)
        }
      })
      .catch(() => {
        setError('分享链接无效或已过期')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const handleVerify = async () => {
    if (!token || !password.trim()) {
      message.warning('请输入密码')
      return
    }
    setVerifying(true)
    try {
      const result = await shareApi.verifyPassword(token, password.trim())
      if (!result.verifyToken) {
        message.error('验证失败，后端未返回验证令牌')
        return
      }
      setVerifyToken(result.verifyToken)
      setVerified(true)
    } catch {
      message.error('密码错误')
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = async () => {
    if (!token) return
    setVerifying(true)
    try {
      const url = shareApi.getDownloadUrl(token, verifyToken || undefined)
      const response = await fetch(url)

      if (response.status === 401 || response.status === 403) {
        // Token expired — reset to password entry
        setVerified(false)
        setVerifyToken(null)
        setPassword('')
        message.error('密码验证已过期，请重新输入密码')
        return
      }

      if (!response.ok) {
        message.error('下载失败')
        return
      }

      // Successful download — trigger file save
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileInfo?.fileName || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      message.error('下载失败')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Result
          status="error"
          title="分享链接无效"
          subTitle={error}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部品牌 */}
      <header className="flex items-center justify-center h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <Space>
          <img src="/logo.png" alt="YingmuQiu-nas" className="w-8 h-8 rounded-lg" />
          <Title level={4} className="!mb-0">
            YingmuQiu-nas 分享
          </Title>
        </Space>
      </header>

      {/* 主内容 */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          {/* 文件信息 */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {fileInfo?.isFolder ? (
                <FolderOutlined className="text-yellow-500" />
              ) : (
                <FileOutlined className="text-blue-500" />
              )}
            </div>
            <Title level={4} className="!mb-1">
              {fileInfo?.fileName}
            </Title>
          </div>

          {needPassword && !verified ? (
            /* 密码验证 */
            <div className="space-y-4">
              <div className="text-center">
                <LockOutlined className="text-2xl text-gray-400 mb-2" />
                <Text className="block">此文件受密码保护，请输入访问密码</Text>
              </div>
              <Input.Password
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPressEnter={handleVerify}
                autoFocus
                size="large"
              />
              <Button
                type="primary"
                block
                size="large"
                onClick={handleVerify}
                loading={verifying}
              >
                验证密码
              </Button>
            </div>
          ) : (
            /* 验证通过 — 下载/预览按钮 */
            <div className="space-y-3">
              {!fileInfo?.isFolder && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  block
                  size="large"
                  onClick={handleDownload}
                >
                  下载文件
                </Button>
              )}
              {!fileInfo?.isFolder && (
                <Button
                  icon={<EyeOutlined />}
                  block
                  size="large"
                  onClick={() => {
                    const url = shareApi.getDownloadUrl(token!, verifyToken || undefined)
                    window.open(url, '_blank')
                  }}
                >
                  在线预览
                </Button>
              )}
            </div>
          )}
        </Card>
      </main>

      {/* 底部 */}
      <footer className="text-center py-4 text-gray-400 text-sm bg-white/80 backdrop-blur-sm border-t border-gray-200">
        文件由 YingmuQiu-nas 用户分享
      </footer>
    </div>
  )
}
