import { useCallback } from 'react'
import { Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { uploadFile } from '../api/files'
import { useFileStore } from '../stores/fileStore'

const { Dragger } = Upload

interface FileUploaderProps {
  visible: boolean
  onClose: () => void
}

export default function FileUploader({ visible, onClose }: FileUploaderProps) {
  const currentFolderId = useFileStore((s) => s.currentFolderId)
  const fetchFiles = useFileStore((s) => s.fetchFiles)

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onProgress, onSuccess, onError } = options

    try {
      await uploadFile(
        file as File,
        currentFolderId ?? undefined,
        (percent) => {
          onProgress?.({ percent })
        },
      )
      onSuccess?.({})
      message.success(`${(file as File).name} 上传成功`)
      fetchFiles(currentFolderId ?? undefined)
    } catch (error) {
      onError?.(error as Error)
      message.error(`${(file as File).name} 上传失败`)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" key={String(visible)}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">上传文件</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <Dragger
          multiple
          customRequest={customRequest}
          showUploadList={{
            showRemoveIcon: false,
          }}
          className="mb-4"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个或批量上传</p>
        </Dragger>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
