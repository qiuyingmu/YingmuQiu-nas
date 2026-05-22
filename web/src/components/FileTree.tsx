import { useEffect, useState, useCallback } from 'react'
import { Tree, Dropdown, Modal, Input, message, Spin } from 'antd'
import type { MenuProps } from 'antd'
import {
  FolderOutlined,
  FileOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderAddOutlined,
} from '@ant-design/icons'
import type { DataNode, EventDataNode } from 'antd/es/tree'
import type { TreeProps } from 'antd/es/tree'
import type { FileTreeItem } from '../api/files'
import { useFileStore } from '../stores/fileStore'
import { useNavigate } from 'react-router-dom'

type AntTreeNode = EventDataNode<DataNode>
type PathItem = { id: string; name: string }

export default function FileTree() {
  const fetchFileTree = useFileStore((s) => s.fetchFileTree)
  const createFolder = useFileStore((s) => s.createFolder)
  const rename = useFileStore((s) => s.rename)
  const remove = useFileStore((s) => s.remove)
  const fetchFiles = useFileStore((s) => s.fetchFiles)
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId)
  const setCurrentPath = useFileStore((s) => s.setCurrentPath)
  const setSelectedFileIds = useFileStore((s) => s.setSelectedFileIds)
  const fileTree = useFileStore((s) => s.fileTree)
  const currentFolderId = useFileStore((s) => s.currentFolderId)
  const navigate = useNavigate()

  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [contextNode, setContextNode] = useState<DataNode | null>(null)
  const [loading, setLoading] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [modalValue, setModalValue] = useState('')

  const convertToTreeData = useCallback(
    (nodes: FileTreeItem[], parentPath: PathItem[] = []): DataNode[] => {
      return nodes.map((node) => {
        const path = [...parentPath, { id: node.id, name: node.name }]
        return {
          key: String(node.id),
          title: node.name,
          icon: node.isFolder ? <FolderOutlined /> : <FileOutlined />,
          isLeaf: !node.isFolder || !node.children?.length,
          children: node.children ? convertToTreeData(node.children, path) : undefined,
          _path: path,
        }
      })
    },
    [],
  )

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true)
      try {
        await fetchFileTree()
      } catch {
        message.error('加载文件树失败')
      } finally {
        setLoading(false)
      }
    }
    loadTree()
  }, [fetchFileTree])

  useEffect(() => {
    setTreeData(convertToTreeData(fileTree))
  }, [fileTree, convertToTreeData])

  const handleSelect: TreeProps['onSelect'] = (_, info) => {
    const node = info.node as DataNode & { _path?: PathItem[] }
    const nodeId = String(node.key)
    if (node._path) {
      setCurrentPath(node._path)
    }
    setCurrentFolderId(nodeId)
    setSelectedFileIds([])
    fetchFiles(nodeId)
    navigate(`/files/${nodeId}`)
  }

  const handleMenuClick = (action: string) => {
    if (!contextNode) return

    const nodeId = String(contextNode.key)

    switch (action) {
      case 'create-folder': {
        setModalValue('')
        setCreateModalOpen(true)
        break
      }
      case 'rename': {
        setModalValue(contextNode.title as string)
        setRenameModalOpen(true)
        break
      }
      case 'delete': {
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除"${contextNode.title}"吗？`,
          okText: '删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: async () => {
            try {
              await remove(nodeId)
              message.success('删除成功')
            } catch {
              message.error('删除失败')
            }
          },
        })
        break
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!modalValue.trim()) return
    const parentId = contextNode ? String(contextNode.key) : undefined
    try {
      await createFolder(modalValue.trim(), parentId)
      message.success('创建文件夹成功')
      setCreateModalOpen(false)
    } catch {
      message.error('创建文件夹失败')
    }
  }

  const handleRename = async () => {
    if (!modalValue.trim() || !contextNode) return
    try {
      await rename(String(contextNode.key), modalValue.trim())
      message.success('重命名成功')
      setRenameModalOpen(false)
    } catch {
      message.error('重命名失败')
    }
  }

  const menuItems: MenuProps['items'] = [
    { key: 'create-folder', label: '新建文件夹', icon: <FolderAddOutlined /> },
    { key: 'rename', label: '重命名', icon: <EditOutlined /> },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-gray-400">文件夹</span>
        <PlusOutlined
          className="cursor-pointer text-gray-400 hover:text-blue-500"
          onClick={() => {
            setContextNode(null)
            setModalValue('')
            setCreateModalOpen(true)
          }}
        />
      </div>

      <Dropdown
        menu={{
          items: menuItems,
          onClick: ({ key }) => handleMenuClick(key),
        }}
        trigger={['contextMenu']}
        onOpenChange={(open) => {
          if (!open) setContextNode(null)
        }}
      >
        <div>
          {treeData.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">暂无文件夹</div>
          ) : (
            <Tree
              showIcon
              defaultExpandAll
              treeData={treeData}
              selectedKeys={currentFolderId ? [String(currentFolderId)] : []}
              onSelect={handleSelect}
              onRightClick={({ node }) => setContextNode(node as DataNode)}
            />
          )}
        </div>
      </Dropdown>

      <Modal
        title="新建文件夹"
        open={createModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => setCreateModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={modalValue}
          onChange={(e) => setModalValue(e.target.value)}
          placeholder="请输入文件夹名称"
          autoFocus
          onPressEnter={handleCreateFolder}
        />
      </Modal>

      <Modal
        title="重命名"
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => setRenameModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={modalValue}
          onChange={(e) => setModalValue(e.target.value)}
          placeholder="请输入新名称"
          autoFocus
          onPressEnter={handleRename}
        />
      </Modal>
    </>
  )
}
