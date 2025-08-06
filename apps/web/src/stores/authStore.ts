import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserEntity } from '@/lib/api'

interface AuthState {
  user: UserEntity | null
  jwt: string
}

interface AuthActions {
  setUser: (user: UserEntity | null) => void
  setJwt: (jwt: string) => void
  resetJwt: () => void
  reset: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, _, store) => {
      return {
        user: null,
        setUser: (user) =>
          set((state) => ({ ...state, user })),
        jwt: '',
        setJwt: (jwt) =>
          set((state) => {
            return { ...state, jwt }
          }),
        resetJwt: () =>
          set((state) => {
            return { ...state, jwt: '' }
          }),
        reset: () =>
          set(store.getInitialState()),
      }
    },
    {
      name: 'auth',
      // storage: createJSONStorage(() => localStorage),
    }
  )
)

// export const useAuth = () => useAuthStore((state) => state.auth)
