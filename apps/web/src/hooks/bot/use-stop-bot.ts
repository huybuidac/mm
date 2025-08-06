import { useMutation } from '@tanstack/react-query'
import { authAxios } from '@/lib/api'

export const useStopBot = () => {
  return useMutation({
    mutationFn: async (tokenAddress: string) => {
      const response = await authAxios.post(`/bot/${tokenAddress}/stop`)
      return response.data
    },
  })
}
