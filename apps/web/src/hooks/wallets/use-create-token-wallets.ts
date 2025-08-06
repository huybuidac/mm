import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authAxios, BotTokenWalletEntity, CreateBotTokenWalletsDto } from '@/lib/api'

export const useCreateTokenWallets = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (options: CreateBotTokenWalletsDto) => {
      const response = await authAxios.post<BotTokenWalletEntity[]>(`/bot-config/token-wallets`, options)
      return response.data
    },
    onSuccess: (data, options) => {
      queryClient.setQueryData(['token-wallets', options.tokenAddress], () => {
        return data
      })
    },
  })
}