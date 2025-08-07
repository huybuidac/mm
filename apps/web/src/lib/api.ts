import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'

// Get API URL with fallback for development
const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_APP_API_URL
  if (!apiUrl) {
    console.warn('VITE_APP_API_URL is not defined. Using fallback URL.')
    // Fallback for development
    return 'http://localhost:3000'
  }
  return apiUrl
}

export const guestAxios = axios.create({
  baseURL: getApiUrl(),
})

export const authAxios = axios.create({
  baseURL: getApiUrl(),
})

authAxios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().jwt
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface UserEntity {
  id: bigint
  username: string
  name: string
  role: string
  profileId: bigint
  createdAt: string
  updatedAt: string
}

export interface ProfileEntity {
  id: bigint
  name: string
  email: string
  phone: string
  address: string
}

export interface LoginResponse {
  jwt: string
  jwtRefresh: string
  user: UserEntity
  profile: ProfileEntity
}

export interface BotTokenEntity {
  address: string
  chainId: string
  enabled: boolean
  fee: number
  createdAt: string
  updatedAt: string
}

export interface BotTokenWalletEntity {
  walletAddress?: string
  tokenAddress?: string
  buyable?: boolean
  sellable?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BotWalletEntity {
  address: string
  privateKey: string
  createdAt: string
  updatedAt: string
}

export interface CreateBotTokenWalletsDto {
  tokenAddress: string
  wallets: {
    privateKey: string
    buyable: boolean
    sellable: boolean
  }[]
}

export interface TokenSwapEntity {
    txHash: string
    index: number
    jobId: string | null
    isBuy: boolean
    tokenAddress: string
    blockNumber: number
    tokenAmount: bigint
    ethAmount: bigint
    sender: string
    recipient: string
    amount0: bigint
    amount1: bigint
    sqrtPriceX96: string
    liquidity: bigint
    tick: number
}