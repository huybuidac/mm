import { useState } from 'react'
import {
  IconPlayerPlay,
  IconSettings,
  IconPlayerStop,
} from '@tabler/icons-react'
import { BotTokenEntity } from '@/lib/api'
import { useStartBot, StartBotArgs } from '@/hooks/bot/use-start-bot'
import { useStopBot } from '@/hooks/bot/use-stop-bot'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTokenStore } from '@/stores/tokenStore'
import { BotState } from './bot-state'
import { useReconnectBot } from '@/hooks/bot/use-reconnect-bot'

const CHAIN_OPTIONS = [
  { value: '2741', label: 'Abstract Mainnet' },
  { value: '11124', label: 'Abstract Testnet' },
]

export function StartBot({ token }: { token: BotTokenEntity }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const tokenData = useTokenStore(state => state.tokenData[token.address])

  const [formData, setFormData] = useState({
    token: token.address,
    chainId: token.chainId,
    fee: token.fee,
    sellVolume: 0.01,
    sellOrder: 5,
    buyVolume: 0.001,
    buyOrder: 5,
    sellDelay: 1,
    duration: 5,
  })

  const { mutate: startBot, isPending: isBotRunning } = useStartBot() // the running until finish
  const { mutate: stopBot, isPending: isStopping } = useStopBot()
  const { mutate: reconnectBot, isPending: isBotReRunning } = useReconnectBot()

  const handleInputChange = (
    field: keyof StartBotArgs,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = () => {
    // addLog(token.address, '1', 'test')
    startBot(formData)
    setShowConfirmDialog(false)
  }

  const validateForm = () => {
    return (
      formData.sellVolume &&
      formData.sellOrder &&
      formData.buyVolume &&
      formData.buyOrder &&
      formData.sellDelay >= 0 &&
      formData.duration > 0
    )
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconSettings className='h-5 w-5' />
            Bot Configuration
          </CardTitle>
          <CardDescription>
            Configure your trading bot parameters. Make sure you have wallets
            configured for this token before starting.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Token and Chain Info */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Token Address</Label>
              <div className='bg-muted rounded-md px-3 py-2 font-mono text-sm'>
                {formData.token}
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Chain</Label>
              <div className='bg-muted rounded-md px-3 py-2 text-sm'>
                {CHAIN_OPTIONS.find((c) => c.value === formData.chainId)
                  ?.label || formData.chainId}
              </div>
            </div>
          </div>

          <Separator />

          {/* Trading Parameters */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Trading Parameters</h3>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Fee (in basis points)</Label>
                <div className='bg-muted rounded-md px-3 py-2 text-sm'>
                  {formData.fee}
                </div>
                <p className='text-muted-foreground text-xs'>
                  1 basis point = 0.01%
                </p>
              </div>
              <div className='space-y-2'>
                <Label>Duration (minutes)</Label>
                <Input
                  type='number'
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange('duration', Number(e.target.value))
                  }
                  placeholder='60'
                  min='1'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Buy Configuration */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Buy Configuration</h3>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Buy Volume (ETH)</Label>
                <Input
                  type='number'
                  value={formData.buyVolume}
                  onChange={(e) =>
                    handleInputChange('buyVolume', e.target.value)
                  }
                  placeholder='1.0'
                  step='0.1'
                  min='0'
                />
              </div>
              <div className='space-y-2'>
                <Label>Buy Orders</Label>
                <Input
                  type='number'
                  value={formData.buyOrder}
                  onChange={(e) =>
                    handleInputChange('buyOrder', e.target.value)
                  }
                  placeholder='5'
                  min='1'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sell Configuration */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Sell Configuration</h3>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Sell Volume (ETH)</Label>
                <Input
                  type='number'
                  value={formData.sellVolume}
                  onChange={(e) =>
                    handleInputChange('sellVolume', e.target.value)
                  }
                  placeholder='1.0'
                  step='0.1'
                  min='0'
                />
              </div>
              <div className='space-y-2'>
                <Label>Sell Orders</Label>
                <Input
                  type='number'
                  value={formData.sellOrder}
                  onChange={(e) =>
                    handleInputChange('sellOrder', e.target.value)
                  }
                  placeholder='5'
                  min='1'
                />
              </div>
              <div className='space-y-2'>
                <Label>Sell Delay (minutes)</Label>
                <Input
                  type='number'
                  value={formData.sellDelay}
                  onChange={(e) =>
                    handleInputChange('sellDelay', Number(e.target.value))
                  }
                  placeholder='10'
                  min='0'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot State */}
      {tokenData?.state && (
        <BotState state={tokenData.state} />
      )}

      {/* Action Button */}
      <div className='flex justify-end gap-2'>
        <Button
          onClick={() => stopBot(token.address)}
          disabled={isStopping}
          variant='destructive'
          size='lg'
          className='min-w-[200px]'
        >
          <IconPlayerStop className='mr-2 h-4 w-4' />
          {isStopping ? 'Stopping Bot...' : 'Stop Bot'}
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!validateForm() || isBotRunning}
          size='lg'
          className='min-w-[200px]'
        >
          <IconPlayerPlay className='mr-2 h-4 w-4' />
          {isBotRunning ? 'Stop Bot' : 'Start Bot'}
        </Button>
        <Button
          onClick={() => reconnectBot(token.address)}
          disabled={!validateForm() || isBotReRunning || isBotRunning}
          size='lg'
          className='min-w-[200px]'
        >
          <IconPlayerPlay className='mr-2 h-4 w-4' />
          Reconnect Bot
        </Button>
      </div>

      

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bot Start</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to start the trading bot with the
                  following configuration?
                </p>
                <div className='mt-4 space-y-2 text-sm'>
                  <div>
                    <strong>Token:</strong> {formData.token}
                  </div>
                  <div>
                    <strong>Chain:</strong>{' '}
                    {
                      CHAIN_OPTIONS.find((c) => c.value === formData.chainId)
                        ?.label
                    }
                  </div>
                  <div>
                    <strong>Fee:</strong> {formData.fee} basis points
                  </div>
                  <div>
                    <strong>Duration:</strong> {formData.duration} minutes
                  </div>
                  <div>
                    <strong>Buy Volume:</strong> {formData.buyVolume} ETH
                  </div>
                  <div>
                    <strong>Sell Volume:</strong> {formData.sellVolume} ETH
                  </div>
                  <div>
                    <strong>Sell Delay:</strong> {formData.sellDelay} minutes
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Start Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
