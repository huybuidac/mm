import { useAuthStore } from '@/stores/authStore'
import { useTokenStore } from '@/stores/tokenStore'
import { useMutation } from '@tanstack/react-query'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useState } from 'react'

export const useReconnectBot = () => {
  const { addLog, addSwap, setTokenState } = useTokenStore()
  const auth = useAuthStore()

  const [_es, setEventSource] = useState<EventSourcePolyfill | null>(null)

  return useMutation({
    mutationFn: (tokenAddress: string) => {
      return new Promise((resolve, reject) => {
        const eventSource = new EventSourcePolyfill(
          `https://mm-production-1f2f.up.railway.app/bot/reconnect/${tokenAddress}`,
          {
            headers: {
              Authorization: `Bearer ${auth.jwt}`,
            },
          }
        )
        _es?.close()
        setEventSource(eventSource)
        eventSource.onmessage = (event) => {
          // console.log('useReconnectBot.onmessage', event)
          if (event.lastEventId === 'END') {
            resolve(true)
            eventSource.close()
          } else {
            const eventData = JSON.parse(event.data)
            if (eventData.message) {
              console.log('useStartBot.onmessage.message', eventData.message)
              addLog(tokenAddress, eventData.jobId, eventData.message)
            }
            if (eventData.swap) {
              console.log('useStartBot.onmessage.swap', eventData.swap)
              addSwap(tokenAddress, eventData.jobId, eventData.swap)
            }
            if (eventData.state) {
              console.log('useStartBot.onmessage.state', eventData.state)
              setTokenState(tokenAddress, eventData.jobId, eventData.state)
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
