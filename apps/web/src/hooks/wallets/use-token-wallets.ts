import { useQuery } from '@tanstack/react-query'
import { authAxios, BotTokenWalletEntity } from '@/lib/api'
import { isAddress } from 'ethers'

export const useTokenWallets = (options: { tokenAddress: string }) => {
  const { tokenAddress } = options
  return useQuery({
    queryKey: ['token-wallets', tokenAddress],
    enabled: !!tokenAddress && isAddress(tokenAddress),
    queryFn: async () => {
      const response = await authAxios.get<BotTokenWalletEntity[]>(
        `/bot-config/tokens/${tokenAddress}/wallets`
      )
      return response.data
    },
  })
}
