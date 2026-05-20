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
import { useFileStore } from '../stores/fileStore'
import { useNavigate } from 'react-router-dom'

type AntTreeNode = EventDataNode<DataNode>

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
    (nodes: any[], parentPath: any[] = []): DataNode[] => {
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
        message.error('???????')
      } finally {
        setLoading(false)
      }
    }
    loadTree()
  }, [fetchFileTree])

  useEffect(() => {
    setTreeData(convertToTreeData(fileTree))
  }, [fileTree, convertToTreeData])

  const handleSelect = (_: React.Key[], info: { node: DataNode }) => {
    const node = info.node as DataNode & { _path?: any[] }
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
          title: '????',
          content: `?????"${contextNode.title}"??`,
          okText: '??',
          okType: 'danger',
          cancelText: '??',
          onOk: async () => {
            try {
              await remove(nodeId)
              message.success('????')
            } catch {
              message.error('????')
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
      message.success('???????')
      setCreateModalOpen(false)
    } catch {
      message.error('???????')
    }
  }

  const handleRename = async () => {
    if (!modalValue.trim() || !contextNode) return
    try {
      await rename(String(contextNode.key), modalValue.trim())
      message.success('?????')
      setRenameModalOpen(false)
    } catch {
      message.error('?????')
    }
  }

  const menuItems: MenuProps['items'] = [
    { key: 'create-folder', label: '?????', icon: <FolderAddOutlined /> },
    { key: 'rename', label: '???', icon: <EditOutlined /> },
    { key: 'delete', label: '??', icon: <DeleteOutlined />, danger: true },
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
        <span className="text-xs text-gray-400">???</span>
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
            <div className="text-xs text-gray-400 text-center py-4">?????</div>
          ) : (
            <Tree
              showIcon
              defaultExpandAll
              treeData={treeData}
              selectedKeys={currentFolderId ? [String(currentFolderId)] : []}
              onSelect={handleSelect as any}
              onRightClick={({ node }) => setContextNode(node as DataNode)}
            />
          )}
        </div>
      </Dropdown>

      <Modal
        title="?????"
        open={createModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => setCreateModalOpen(false)}
        okText="??"
        cancelText="??"
      >
        <Input
          value={modalValue}
          onChange={(e) => setModalValue(e.target.value)}
          placeholder="????????"
          autoFocus
          onPressEnter={handleCreateFolder}
        />
      </Modal>

      <Modal
        title="???"
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => setRenameModalOpen(false)}
        okText="??"
        cancelText="??"
      >
        <Input
          value={modalValue}
          onChange={(e) => setModalValue(e.target.value)}
          placeholder="??????"
          autoFocus
          onPressEnter={handleRename}
        />
      </Modal>
    </>
  )
}
