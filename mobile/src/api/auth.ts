import client from './client'
import type { LoginResult, User } from '../types'

export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await client.post<LoginResult>('/auth/login', { username, password })
  return response.data
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const response = await client.post<User>('/auth/register', { username, email, password })
  return response.data
}

export async function getCurrentUser(): Promise<User> {
  const response = await client.get<User>('/auth/me')
  return response.data
}
