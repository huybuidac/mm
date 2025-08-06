import { useMutation } from '@tanstack/react-query'
import { guestAxios, LoginResponse } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from '@tanstack/react-router'

export const useLogin = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  const loginMut = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await guestAxios.post('/auth/local', {
        username: data.email,
        password: data.password,
      })
      return response.data as LoginResponse
    },
    onSuccess: (data) => {
      authStore.setJwt(data.jwt)
      authStore.setUser(data.user)
      // navigate to dashboard
      router.navigate({ to: '/' })
      //   authAxios.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`
    },
  })
  return {
    loginMut,
  }
}
