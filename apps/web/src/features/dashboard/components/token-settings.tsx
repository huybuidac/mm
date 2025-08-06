import { useState } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import { useAllTokens } from '@/hooks/token/use-all-tokens'
import { useCreateToken } from '@/hooks/token/use-create-token'
import { BotTokenEntity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToggleToken } from '@/hooks/token/use-toggle-token'
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
import { useTokenStore } from '@/stores/tokenStore'

const CHAIN_OPTIONS = [
  { value: '2741', label: 'Abstract Mainnet', defaultFee: 10000 },
  { value: '11124', label: 'Abstract Testnet', defaultFee: 500 },
]

export function TokenSettings() {
  const { selectedToken, selectToken } = useTokenStore()

  const [tokenAddress, setTokenAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const [fee, setFee] = useState<number>(500)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [tokenToToggle, setTokenToToggle] = useState<BotTokenEntity | null>(null)
  const { mutate: createToken } = useCreateToken()
  const { data: allTokens } = useAllTokens()
  const { toggleTokenMut } = useToggleToken()

  const handleChainChange = (chainId: string) => {
    setSelectedChain(chainId)
    // Set default fee based on selected chain
    const chainOption = CHAIN_OPTIONS.find(option => option.value === chainId)
    if (chainOption) {
      setFee(chainOption.defaultFee)
    }
  }

  const handleSubmit = () => {
    if (!tokenAddress || !selectedChain) {
      return
    }
    
    createToken({
      address: tokenAddress,
      chainId: selectedChain,
      fee: fee,
    })
    
    // Reset form
    setTokenAddress('')
    setSelectedChain('')
    setFee(500)
  }

  const handleToggleEnabled = (token: BotTokenEntity) => {
    setTokenToToggle(token)
    setShowConfirmDialog(true)
  }

  const handleConfirmToggle = () => {
    if (tokenToToggle) {
      toggleTokenMut.mutate(tokenToToggle.address)
      setShowConfirmDialog(false)
      setTokenToToggle(null)
    }
  }

  const handleCancelToggle = () => {
    setShowConfirmDialog(false)
    setTokenToToggle(null)
  }

  const handleSelectToken = (token: BotTokenEntity) => {
    selectToken(token)
    // reconnectBot(token.address)
  }

  const getChainLabel = (chainValue: string) => {
    return CHAIN_OPTIONS.find(option => option.value === chainValue)?.label || chainValue
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      {/* Create Token Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Token</CardTitle>
          <CardDescription>
            Add a new token to your settings by providing the token address, selecting the chain, and setting the fee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5 space-y-2">
              <label className="text-sm font-medium">Token Address</label>
              <Input
                placeholder="Enter token address (0x...)"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-span-12 lg:col-span-3 space-y-2">
              <label className="text-sm font-medium">Chain</label>
              <Select value={selectedChain} onValueChange={handleChainChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 lg:col-span-2 space-y-2">
              <label className="text-sm font-medium">Fee</label>
              <Input
                type="number"
                placeholder="Enter fee"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="col-span-12 lg:col-span-2 flex items-end">
              <Button 
                onClick={handleSubmit}
                disabled={!tokenAddress || !selectedChain}
                className="w-full"
              >
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Token Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Token Settings</CardTitle>
          <CardDescription>
            Manage your token configurations and enable/disable tokens as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token Address</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTokens?.map((token) => (
                <TableRow 
                  key={token.address}
                  className={selectedToken?.address === token.address ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {formatAddress(token.address)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://etherscan.io/address/${token.address}`, '_blank')}
                      >
                        <IconExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getChainLabel(token.chainId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{token.fee}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={token.enabled}
                        onCheckedChange={() => handleToggleEnabled(token)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {token.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectToken(token)}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Token Toggle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {tokenToToggle?.enabled ? 'disable' : 'enable'} the token{' '}
              <code className="text-sm bg-muted px-1 rounded">
                {tokenToToggle ? formatAddress(tokenToToggle.address) : ''}
              </code>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelToggle}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>
              {tokenToToggle?.enabled ? 'Disable' : 'Enable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
