import { useMutation } from '@tanstack/react-query'
import { authAxios } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

export const useToggleToken = () => {
  const queryClient = useQueryClient()
  const toggleTokenMut = useMutation({
    mutationFn: async (address: string) => {
      const response = await authAxios.patch(`/bot-config/tokens/${address}/toggle-enabled`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tokens'] })
    },
  })
  return {
    toggleTokenMut,
  }
}