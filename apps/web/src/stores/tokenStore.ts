import { DateTime } from 'luxon'
import { create } from 'zustand'
import { BotTokenEntity, TokenSwapEntity } from '@/lib/api'

export interface TokenStoreState {
  selectedToken: BotTokenEntity | null
  tokenData: {
    [tokenAddress: string]: {
      jobId: string
      logs: string[]
      swaps: TokenSwapEntity[]
      state: {
        remainSellOrder: number
        remainBuyOrder: number
        remainSellVolume: number
        remainBuyVolume: number
        nextBuyAt: string
        nextSellAt: string
      }
    }
  }
}

export interface TokenWalletActions {
  selectToken: (token: BotTokenEntity) => void
  addLog: (tokenAddress: string, jobId: string, log: string) => void
  addSwap: (tokenAddress: string, jobId: string, swap: TokenSwapEntity) => void
  setTokenState: (
    tokenAddress: string,
    jobId: string,
    state: TokenStoreState['tokenData'][string]['state']
  ) => void
}

export const useTokenStore = create<TokenStoreState & TokenWalletActions>(
  (set) => ({
    selectedToken: null,
    tokenData: {},
    selectToken: (token) => set({ selectedToken: token }),
    addLog: (tokenAddress, jobId, log) => {
      console.log('addLog', tokenAddress, jobId, log)
      return set((state) => {
        if (state.tokenData[tokenAddress]?.jobId !== jobId) {
          delete state.tokenData[tokenAddress]
        }
        return {
          tokenData: {
            ...state.tokenData,
            [tokenAddress]: {
              ...state.tokenData[tokenAddress],
              jobId,
              logs: [
                ...(state.tokenData[tokenAddress]?.logs || []),
                `[${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}] ${log}`,
              ],
            },
          },
        }
      })
    },
    addSwap: (tokenAddress, jobId, swap) =>
      set((state) => {
        console.log('addSwap', tokenAddress, jobId, swap)
        if (state.tokenData[tokenAddress]?.jobId !== jobId) {
          delete state.tokenData[tokenAddress]
        }
        return {
          tokenData: {
            ...state.tokenData,
            [tokenAddress]: {
              ...state.tokenData[tokenAddress],
              jobId,
              swaps: [...(state.tokenData[tokenAddress]?.swaps || []), swap],
            },
          },
        }
      }),
    setTokenState: (
      tokenAddress,
      jobId,
      botState: TokenStoreState['tokenData'][string]['state']
    ) =>
      set((state) => {
        return {
          tokenData: {
            ...state.tokenData,
            [tokenAddress]: {
              ...state.tokenData[tokenAddress],
              jobId,
              state: botState,
            },
          },
        }
      }),
  })
)
