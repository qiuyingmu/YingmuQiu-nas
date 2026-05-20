import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useFileStore } from '../stores/fileStore'
import { useNavigate } from 'react-router-dom'

export default function SearchBar() {
  const [value, setValue] = useState('')
  const search = useFileStore((s) => s.search)
  const clearSearch = useFileStore((s) => s.clearSearch)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const navigate = useNavigate()

  const handleSearch = useCallback(
    (query: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        if (query.trim()) {
          navigate('/files')
          search(query)
        } else {
          clearSearch()
        }
      }, 300)
    },
    [search, clearSearch, navigate],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <Input
      prefix={<SearchOutlined className="text-gray-400" />}
      placeholder="????..."
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        handleSearch(e.target.value)
      }}
      allowClear
      onClear={() => {
        setValue('')
        clearSearch()
      }}
    />
  )
}
