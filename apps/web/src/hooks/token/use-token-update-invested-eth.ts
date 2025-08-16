import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authAxios } from '@/lib/api'

export const useTokenUpdateInvestedEth = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (options: { address: string; investedEth: string }) => {
      const response = await authAxios.patch(
        `/bot-config/tokens/${options.address}/invested-eth`,
        { investedEth: options.investedEth }
      )
      return response.data
    },
    onSuccess: (data, options) => {
      queryClient.setQueryData(['token', options.address], data)
    },
  })
}
