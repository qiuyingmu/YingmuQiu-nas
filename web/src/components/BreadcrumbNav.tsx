import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import { useFileStore } from '../stores/fileStore'

export default function BreadcrumbNav() {
  const navigate = useNavigate()
  const currentPath = useFileStore((s) => s.currentPath)
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId)
  const setCurrentPath = useFileStore((s) => s.setCurrentPath)

  const items = [
    {
      key: 'root',
      title: (
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => {
            setCurrentFolderId(null)
            setCurrentPath([])
            navigate('/files')
          }}
        >
          <HomeOutlined className="mr-1" />
          全部文件
        </span>
      ),
    },
    ...currentPath.map((folder) => ({
      key: String(folder.id),
      title: (
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => {
            const idx = currentPath.indexOf(folder)
            setCurrentFolderId(folder.id)
            setCurrentPath(currentPath.slice(0, idx + 1))
            navigate(`/files/${folder.id}`)
          }}
        >
          {folder.name}
        </span>
      ),
    })),
  ]

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-200">
      <Breadcrumb items={items} />
    </div>
  )
}
