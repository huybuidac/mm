import { useQuery } from '@tanstack/react-query'
import { BotTokenEntity, authAxios } from '@/lib/api'

export const useGetToken = (tokenAddress: string) => {
  return useQuery({
    queryKey: ['token', tokenAddress],
    queryFn: async () => {
      const response = await authAxios.get<BotTokenEntity>(`bot-config/tokens/${tokenAddress}`)
      return response.data
    },
  })
}