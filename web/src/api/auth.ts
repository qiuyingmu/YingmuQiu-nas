import client from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    username: string
    email: string
  }
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/login', data)
  return response.data
}

export async function register(data: RegisterRequest): Promise<void> {
  await client.post('/auth/register', data)
}

export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const response = await client.get<AuthResponse['user']>('/auth/me')
  return response.data
}
