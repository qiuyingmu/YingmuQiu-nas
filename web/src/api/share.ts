import client from './client'

export interface ShareLinkResponse {
  id: string
  fileId: string
  fileName: string
  isFolder: boolean
  token: string
  hasPassword: boolean
  expiresAt: string | null
  maxDownloads: number
  downloadCount: number
  isActive: boolean
  createdAt: string
  shareUrl: string
  verifyToken?: string
}

export interface CreateShareRequest {
  fileId: string
  password?: string
  expiresAt?: string
  maxDownloads?: number
}

export const shareApi = {
  // 创建分享 (认证)
  create: (data: CreateShareRequest) =>
    client.post<ShareLinkResponse>('/shares', data).then(r => r.data),

  // 取消分享 (认证)
  cancel: (id: string) =>
    client.delete(`/shares/${id}`),

  // 我的分享列表 (认证)
  getList: () =>
    client.get<ShareLinkResponse[]>('/shares').then(r => r.data),

  // 查询文件分享状态 (认证)
  // 后端未分享时返回 {shared: false}，已分享时返回 ShareLinkResponse
  getStatus: async (fileId: string): Promise<ShareLinkResponse | null> => {
    const res = await client.get<unknown>(`/shares/${fileId}/status`)
    const data = res.data as Record<string, unknown>
    if (data && data.shared === false) {
      return null
    }
    return data as unknown as ShareLinkResponse
  },

  // 获取分享信息 (公开)
  getPublic: (token: string) =>
    client.get<ShareLinkResponse>(`/s/${token}`).then(r => r.data),

  // 验证密码 (公开)
  verifyPassword: (token: string, password: string) =>
    client.post<{ verifyToken: string }>(`/s/${token}/verify`, { password }).then(r => r.data),

  // 获取分享下载URL (公开) — 用 /api/s/ 路径走 nginx API 代理
  getDownloadUrl: (token: string, verifyToken?: string) => {
    let url = `/api/s/${token}/download`
    if (verifyToken) url += `?verifyToken=${verifyToken}`
    return url
  },
}
