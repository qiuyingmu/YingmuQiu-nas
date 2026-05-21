import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Switch,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Tooltip,
} from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  StopOutlined,
  SendOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { shareApi, type ShareLinkResponse, type CreateShareRequest } from '../api/share'

const { Text } = Typography

const EXPIRY_OPTIONS = [
  { label: '1 小时', value: 1 },
  { label: '1 天', value: 24 },
  { label: '7 天', value: 168 },
  { label: '30 天', value: 720 },
  { label: '永不过期', value: 0 },
]

interface Props {
  open: boolean
  fileId: string
  fileName: string
  isFolder: boolean
  onClose: () => void
}

export default function ShareDialog({ open, fileId, fileName, isFolder, onClose }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [shareInfo, setShareInfo] = useState<ShareLinkResponse | null>(null)
  const [passwordProtected, setPasswordProtected] = useState(false)

  // 查询当前文件的分享状态
  const fetchStatus = async () => {
    try {
      const info = await shareApi.getStatus(fileId)
      setShareInfo(info)
    } catch {
      // 没有分享时返回 null
      setShareInfo(null)
    }
  }

  useEffect(() => {
    if (open) {
      form.resetFields()
      setPasswordProtected(false)
      fetchStatus()
    }
  }, [open, fileId])

  // 创建分享链接
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const data: CreateShareRequest = { fileId }

      // 密码
      if (passwordProtected && values.password) {
        data.password = values.password
      }

      // 有效期 (小时 -> ISO 字符串)
      if (values.expiresIn && values.expiresIn > 0) {
        data.expiresAt = new Date(
          Date.now() + values.expiresIn * 60 * 60 * 1000,
        ).toISOString()
      }

      // 下载次数限制
      if (values.maxDownloads && values.maxDownloads > 0) {
        data.maxDownloads = values.maxDownloads
      }

      const result = await shareApi.create(data)
      setShareInfo(result)
      message.success('分享链接已生成')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return // form validation error
      message.error('创建分享链接失败')
    } finally {
      setLoading(false)
    }
  }

  // 取消分享
  const handleCancel = async () => {
    if (!shareInfo) return
    try {
      setLoading(true)
      await shareApi.cancel(shareInfo.id)
      setShareInfo(null)
      message.success('已取消分享')
    } catch {
      message.error('取消失败')
    } finally {
      setLoading(false)
    }
  }

  // 复制链接
  const handleCopy = () => {
    if (!shareInfo) return
    const url = `${window.location.origin}/s/${shareInfo.token}`
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制')
    })
  }

  const shareUrl = shareInfo ? `${window.location.origin}/s/${shareInfo.token}` : ''

  return (
    <Modal
      title={
        <Space>
          {isFolder ? <FolderOutlined /> : <FileOutlined />}
          <span>分享文件</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnClose
    >
      {/* 文件名 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <Text ellipsis>{fileName}</Text>
      </div>

      {shareInfo ? (
        /* 已分享状态 */
        <div>
          <div className="mb-3">
            <Text type="secondary" className="text-xs">分享链接</Text>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Tooltip title="复制链接">
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                />
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <span>已下载: {shareInfo.downloadCount}
              {shareInfo.maxDownloads > 0 ? ` / ${shareInfo.maxDownloads}` : ''}
            </span>
            {shareInfo.expiresAt && (
              <span>过期时间: {new Date(shareInfo.expiresAt).toLocaleString()}</span>
            )}
          </div>

          <Divider className="my-3" />

          <Button
            danger
            icon={<StopOutlined />}
            onClick={handleCancel}
            loading={loading}
            block
          >
            取消分享
          </Button>
        </div>
      ) : (
        /* 未分享 — 创建分享 */
        <Form
          form={form}
          layout="vertical"
          initialValues={{ expiresIn: 24, maxDownloads: 0 }}
        >
          {/* 密码保护 */}
          <Form.Item label="密码保护">
            <div className="flex items-center gap-3">
              <Switch
                checked={passwordProtected}
                onChange={setPasswordProtected}
              />
              <Text type="secondary" className="text-xs">
                开启后访问需要输入密码
              </Text>
            </div>
          </Form.Item>

          {passwordProtected && (
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入分享密码' }]}
            >
              <Input.Password
                placeholder="设置分享密码"
                autoComplete="new-password"
              />
            </Form.Item>
          )}

          {/* 有效期 */}
          <Form.Item name="expiresIn" label="有效期">
            <Select options={EXPIRY_OPTIONS} />
          </Form.Item>

          {/* 下载次数限制 */}
          <Form.Item
            name="maxDownloads"
            label="下载次数限制"
            help="设为 0 表示不限制"
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleCreate}
            loading={loading}
            block
            size="large"
          >
            生成分享链接
          </Button>
        </Form>
      )}
    </Modal>
  )
}
