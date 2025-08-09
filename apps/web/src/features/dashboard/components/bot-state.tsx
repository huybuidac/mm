import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconClock, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'

interface BotStateProps {
  state: {
    remainSellOrder: number
    remainBuyOrder: number
    remainSellVolume: number
    remainBuyVolume: number
    nextBuyAt: string
    nextSellAt: string
    soldVolume: number
    boughtVolume: number
  }
}

export function BotState({ state }: BotStateProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (targetTime: string) => {
    const target = new Date(targetTime)
    const diff = target.getTime() - currentTime.getTime()
    
    if (diff <= 0) return 'Now'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatVolume = (volume: number) => {
    const intl = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 2,
      notation: 'compact',
      compactDisplay: 'short',
    })
    return `${intl.format(volume)} ETH`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTrendingUp className="h-5 w-5" />
          Bot State
        </CardTitle>
        <CardDescription>
          Current trading bot status and remaining orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-600">Buy Orders</h3>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bought Volume:</span>
              <Badge variant="outline" className="font-mono">
                {formatVolume(state.boughtVolume)}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Orders:</span>
                <Badge variant="outline" className="font-mono">
                  {state.remainBuyOrder}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Volume:</span>
                <Badge variant="outline" className="font-mono">
                  {formatVolume(state.remainBuyVolume)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Buy:</span>
                <div className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  <Badge variant="secondary" className="font-mono">
                    {formatCountdown(state.nextBuyAt)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Sell Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconTrendingDown className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-600">Sell Orders</h3>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sold Volume:</span>
              <Badge variant="outline" className="font-mono">
                {formatVolume(state.soldVolume)}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Orders:</span>
                <Badge variant="outline" className="font-mono">
                  {state.remainSellOrder}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Volume:</span>
                <Badge variant="outline" className="font-mono">
                  {formatVolume(state.remainSellVolume)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Sell:</span>
                <div className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  <Badge variant="secondary" className="font-mono">
                    {formatCountdown(state.nextSellAt)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 