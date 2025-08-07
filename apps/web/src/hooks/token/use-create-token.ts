import { useMutation } from '@tanstack/react-query'
import { authAxios } from '@/lib/api'

export const useCreateToken = () => {
  return useMutation({
    mutationFn: async (data: { address: string; chainId: string; fee: number }) => {
      const response = await authAxios.post('/bot-config/tokens', data)
      return response.data
    },
  })
}