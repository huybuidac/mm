import { useMutation } from '@tanstack/react-query'
import { guestAxios } from '@/lib/api'

export const useCreateToken = () => {
  return useMutation({
    mutationFn: async (data: { address: string; chainId: string; fee: number }) => {
      const response = await guestAxios.post('/tokens', data)
      return response.data
    },
  })
}