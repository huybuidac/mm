import { useState, useRef, useMemo } from 'react'
import { IconUpload, IconDownload, IconTrash, IconCheck, IconX } from '@tabler/icons-react'
import { useTokenWallets } from '@/hooks/wallets/use-token-wallets'
import { useCreateTokenWallets } from '@/hooks/wallets/use-create-token-wallets'
import { CreateBotTokenWalletsDto } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { ethers } from 'ethers'
import { useWalletEthBalances } from '@/hooks/wallets/use-wallet-eth-balance'
import { useWalletErc20Balances } from '@/hooks/wallets/use-wallet-erc20-balance'
import { FormatedOnchainNumber } from '@/components/formated-onchain-number'

interface CsvWalletData {
  privateKey?: string
  buyable?: string
  sellable?: string
}

interface ParsedWalletData {
  privateKey: string
  buyable: boolean
  sellable: boolean
  address: string
  isDeleted?: boolean
}

interface MergedWalletData {
  address: string
  privateKey?: string
  buyable: boolean
  sellable: boolean
  isFromServer: boolean
  isModified: boolean
}

export function WalletConfigs(options: { tokenAddress: string, chainId: string }) {
  const { tokenAddress, chainId } = options
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedWallets, setParsedWallets] = useState<ParsedWalletData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const { data: existingWallets } = useTokenWallets({ tokenAddress })
  const { mutate: createTokenWallets, isPending: isCreating } = useCreateTokenWallets()

  // Merge server data with imported data
  const mergedWallets = useMemo(() => {
    const merged: MergedWalletData[] = []
    
    // Add server wallets
    if (existingWallets) {
      existingWallets.forEach(wallet => {
        if (wallet.walletAddress) {
          merged.push({
            address: wallet.walletAddress,
            buyable: wallet.buyable ?? false,
            sellable: wallet.sellable ?? false,
            isFromServer: true,
            isModified: false
          })
        }
      })
    }
    
    // Add imported wallets, overwriting server wallets if same address
    parsedWallets.forEach(parsedWallet => {
      const existingIndex = merged.findIndex(w => w.address === parsedWallet.address)
      if (existingIndex >= 0) {
        // Update existing wallet
        merged[existingIndex] = {
          ...merged[existingIndex],
          privateKey: parsedWallet.privateKey,
          buyable: parsedWallet.buyable,
          sellable: parsedWallet.sellable,
          isModified: true
        }
      } else {
        // Add new wallet (only if not deleted)
        if (!parsedWallet.isDeleted) {
          merged.push({
            address: parsedWallet.address,
            privateKey: parsedWallet.privateKey,
            buyable: parsedWallet.buyable,
            sellable: parsedWallet.sellable,
            isFromServer: false,
            isModified: false
          })
        }
      }
    })

    // Remove wallets marked for deletion
    return merged.filter(wallet => {
      const parsedWallet = parsedWallets.find(p => p.address === wallet.address)
      return !parsedWallet?.isDeleted
    })
  }, [existingWallets, parsedWallets])

  // Check if data differs from server
  const hasChanges = useMemo(() => {
    if (!existingWallets) return parsedWallets.length > 0
    
    const serverAddresses = new Set(existingWallets.map(w => w.walletAddress).filter((addr): addr is string => !!addr))
    const mergedAddresses = new Set(mergedWallets.map(w => w.address))
    
    // Check if addresses differ
    if (serverAddresses.size !== mergedAddresses.size) return true
    
    for (const address of serverAddresses) {
      if (!mergedAddresses.has(address)) return true
    }
    
    // Check if any wallet properties differ
    for (const mergedWallet of mergedWallets) {
      const serverWallet = existingWallets.find(w => w.walletAddress === mergedWallet.address)
      if (!serverWallet) return true
      if (serverWallet.buyable !== mergedWallet.buyable || serverWallet.sellable !== mergedWallet.sellable) {
        return true
      }
    }
    
    return false
  }, [existingWallets, mergedWallets])

  const ethBalances = useWalletEthBalances({ addresses: mergedWallets.map(wallet => wallet.address), chainId: chainId })
  const erc20Balances = useWalletErc20Balances({ addresses: mergedWallets.map(wallet => wallet.address), chainId: chainId, tokenAddress: tokenAddress })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string
        const lines = csvContent.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        const wallets: ParsedWalletData[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const values = line.split(',').map(v => v.trim())
          const walletData: CsvWalletData = {}
          
          headers.forEach((header, index) => {
            if (values[index]) {
              walletData[header as keyof CsvWalletData] = values[index]
            }
          })

          // Validate private key
          if (!walletData.privateKey) {
            console.error(`Row ${i + 1}: Missing private key`)
            continue
          }

          try {
            // Validate private key format
            const wallet = new ethers.Wallet(walletData.privateKey)
            const address = wallet.address

            wallets.push({
              privateKey: walletData.privateKey,
              buyable: walletData.buyable === 'true' || walletData.buyable === '1' || false,
              sellable: walletData.sellable === 'true' || walletData.sellable === '1' || false,
              address
            })
          } catch (_error) {
            console.error(`Row ${i + 1}: Invalid private key`)
          }
        }

        setParsedWallets(wallets)
      } catch (error) {
        console.error('Error parsing CSV:', error)
      } finally {
        setIsUploading(false)
      }
    }

    reader.readAsText(file)
  }

  const handleSubmit = () => {
    const dto: CreateBotTokenWalletsDto = {
      tokenAddress,
      wallets: mergedWallets
        // .filter(wallet => wallet.privateKey && wallet.privateKey !== '') // Only include wallets with private keys
        .map(wallet => ({
          privateKey: wallet.privateKey,
          address: wallet.address,
          buyable: wallet.buyable,
          sellable: wallet.sellable
        }))
    }

    createTokenWallets(dto)
    setParsedWallets([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setShowConfirmDialog(false)
  }

  const handleDiscard = () => {
    setParsedWallets([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveWallet = (address: string) => {
    // Check if wallet is from server
    const serverWallet = existingWallets?.find(w => w.walletAddress === address)
    if (serverWallet) {
      // For server wallets, add them to parsedWallets with a delete marker
      const existingParsed = parsedWallets.find(w => w.address === address)
      if (!existingParsed) {
        setParsedWallets(prev => [...prev, {
          address,
          privateKey: '', // We don't have private key for server wallets
          buyable: serverWallet.buyable ?? false,
          sellable: serverWallet.sellable ?? false,
          isDeleted: true // Mark for deletion
        }])
      } else {
        // Update existing parsed wallet to mark as deleted
        setParsedWallets(prev => prev.map(wallet => 
          wallet.address === address ? { ...wallet, isDeleted: true } : wallet
        ))
      }
    } else {
      // For imported wallets, just remove from parsedWallets
      setParsedWallets(prev => prev.filter(wallet => wallet.address !== address))
    }
  }

  const handleToggleBuyable = (address: string) => {
    // Check if wallet is from server
    const serverWallet = existingWallets?.find(w => w.walletAddress === address)
    if (serverWallet) {
      // For server wallets, we need to add them to parsedWallets to track changes
      const existingParsed = parsedWallets.find(w => w.address === address)
      if (existingParsed) {
        setParsedWallets(prev => prev.map(wallet => 
          wallet.address === address ? { ...wallet, buyable: !wallet.buyable } : wallet
        ))
      } else {
        setParsedWallets(prev => [...prev, {
          address,
          privateKey: '', // We don't have private key for server wallets
          buyable: !serverWallet.buyable,
          sellable: serverWallet.sellable ?? false
        }])
      }
    } else {
      // For imported wallets
      setParsedWallets(prev => prev.map(wallet => 
        wallet.address === address ? { ...wallet, buyable: !wallet.buyable } : wallet
      ))
    }
  }

  const handleToggleSellable = (address: string) => {
    // Check if wallet is from server
    const serverWallet = existingWallets?.find(w => w.walletAddress === address)
    if (serverWallet) {
      // For server wallets, we need to add them to parsedWallets to track changes
      const existingParsed = parsedWallets.find(w => w.address === address)
      if (existingParsed) {
        setParsedWallets(prev => prev.map(wallet => 
          wallet.address === address ? { ...wallet, sellable: !wallet.sellable } : wallet
        ))
      } else {
        setParsedWallets(prev => [...prev, {
          address,
          privateKey: '', // We don't have private key for server wallets
          buyable: serverWallet.buyable ?? false,
          sellable: !serverWallet.sellable
        }])
      }
    } else {
      // For imported wallets
      setParsedWallets(prev => prev.map(wallet => 
        wallet.address === address ? { ...wallet, sellable: !wallet.sellable } : wallet
      ))
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const downloadSampleCsv = () => {
    const csvContent = 'privateKey,buyable,sellable\n0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,true,false\n0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,false,true'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wallet_sample.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* CSV Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Wallets</CardTitle>
          <CardDescription>
            Upload a CSV file with wallet private keys and configuration. Private key is mandatory, buyable and sellable are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">CSV File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <IconUpload className="h-4 w-4 mr-2" />
                {isUploading ? 'Processing...' : 'Choose CSV File'}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={downloadSampleCsv}
              size="sm"
            >
              <IconDownload className="h-4 w-4 mr-2" />
              Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wallets ({mergedWallets.length})</CardTitle>
              <CardDescription>
                {hasChanges ? 'Modified wallet configuration. Click "Save Changes" to apply.' : 'Current wallet configuration.'}
              </CardDescription>
            </div>
            {hasChanges && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={isCreating}
                  size="sm"
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isCreating}
                  size="sm"
                >
                  <IconCheck className="h-4 w-4 mr-2" />
                  {isCreating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mergedWallets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Buyable</TableHead>
                  <TableHead>Sellable</TableHead>
                  <TableHead>ETH Amount</TableHead>
                  <TableHead>Token Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedWallets.map((wallet) => (
                  <TableRow key={wallet.address}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {formatAddress(wallet.address)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={wallet.buyable}
                          onCheckedChange={() => handleToggleBuyable(wallet.address)}
                        />
                        {/* <span className="text-sm text-muted-foreground">
                          {wallet.buyable ? 'Yes' : 'No'}
                        </span> */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={wallet.sellable}
                          onCheckedChange={() => handleToggleSellable(wallet.address)}
                        />
                        {/* <span className="text-sm text-muted-foreground">
                          {wallet.sellable ? 'Yes' : 'No'}
                        </span> */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        <FormatedOnchainNumber value={ethBalances[wallet.address]} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        <FormatedOnchainNumber value={erc20Balances[wallet.address]} maxFractionDigits={0} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wallet.isFromServer ? "outline" : "default"}>
                        {wallet.isFromServer ? 'Server' : 'Imported'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWallet(wallet.address)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No wallets configured for this token yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Wallet Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the wallet configuration changes? This will update the server with the new wallet settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
