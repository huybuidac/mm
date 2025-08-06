import { useMutation } from '@tanstack/react-query'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useAuthStore } from '@/stores/authStore'
import { useTokenStore } from '@/stores/tokenStore'
import { fnHelper } from '@/lib/fn.helper'

export interface StartBotArgs {
  token: string
  chainId: string
  fee: number
  sellVolume: number
  sellOrder: number
  buyVolume: number
  buyOrder: number
  sellDelay: number
  duration: number
}

export const useStartBot = () => {
  const { addLog, addSwap, setTokenState } = useTokenStore()
  const auth = useAuthStore()
  return useMutation({
    retry: false,
    mutationFn: async (data: StartBotArgs) => {
      return new Promise((resolve, reject) => {
        const query = {
          sellVolume: fnHelper
            .from(data.sellVolume)
            .toFormat(18)
            .value.toString(),
          sellOrder: data.sellOrder.toString(),
          buyVolume: fnHelper
            .from(data.buyVolume)
            .toFormat(18)
            .value.toString(),
          buyOrder: data.buyOrder.toString(),
          sellDelay: data.sellDelay.toString(),
          duration: data.duration.toString(),
        }
        const queryStr = new URLSearchParams(query).toString()
        const eventSource = new EventSourcePolyfill(
          `${import.meta.env.VITE_APP_API_URL}/bot/start/${data.token}?${queryStr}`,
          {
            headers: {
              Authorization: `Bearer ${auth.jwt}`,
            },
          }
        )
        eventSource.onmessage = (event) => {
          console.log('useStartBot.onmessage', event)
          if (event.lastEventId === 'END') {
            resolve(true)
            eventSource.close()
          } else {
            const eventData = JSON.parse(event.data)
            if (eventData.message) {
              console.log('useStartBot.onmessage.message', eventData.message)
              addLog(data.token, eventData.jobId, eventData.message)
            }
            if (eventData.swap) {
              console.log('useStartBot.onmessage.swap', eventData.swap)
              addSwap(data.token, eventData.jobId, eventData.swap)
            }
            if (eventData.state) {
              console.log('useStartBot.onmessage.state', eventData.state)
              setTokenState(data.token, eventData.jobId, eventData.state)
            }
          }
        }
        eventSource.onerror = (event) => {
          console.log('useStartBot.onerror', event)
          reject(event)
          eventSource.close()
        }
        eventSource.onopen = () => {
          console.log('useStartBot.onopen')
        }
      })
    },
  })
}
