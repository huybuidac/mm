import { useQuery } from '@tanstack/react-query'
import { BotTokenEntity, authAxios } from '@/lib/api'

export const useAllTokens = () => {
  return useQuery({
    queryKey: ['all-tokens'],
    queryFn: async () => {
      const response = await authAxios.get<BotTokenEntity[]>('bot-config/tokens')
      return response.data 
    },
  })
}