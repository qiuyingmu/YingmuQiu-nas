import { Empty, Button } from 'antd'
import { FolderAddOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  description?: string
  onCreateFolder?: () => void
}

export default function EmptyState({
  description = '暂无文件',
  onCreateFolder,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Empty description={description}>
        {onCreateFolder && (
          <Button
            type="primary"
            icon={<FolderAddOutlined />}
            onClick={onCreateFolder}
          >
            新建文件夹?
          </Button>
        )}
      </Empty>
    </div>
  )
}
