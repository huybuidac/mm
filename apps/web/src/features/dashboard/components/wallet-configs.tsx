import { useState, useRef, useMemo, useEffect } from 'react'
import { IconUpload, IconDownload, IconTrash, IconCheck, IconX, IconTrendingUp, IconTrendingDown, IconEdit } from '@tabler/icons-react'
import { useTokenWallets } from '@/hooks/wallets/use-token-wallets'
import { useCreateTokenWallets } from '@/hooks/wallets/use-create-token-wallets'
import { useTokenUpdateInvestedEth } from '@/hooks/token/use-token-update-invested-eth'
import { CreateBotTokenWalletsDto } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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
import { ethers, parseEther } from 'ethers'
import { useWalletEthBalances } from '@/hooks/wallets/use-wallet-eth-balance'
import { useWalletErc20Balances } from '@/hooks/wallets/use-wallet-erc20-balance'
import { FormatedOnchainNumber } from '@/components/formated-onchain-number'
import { useGetToken } from '@/hooks/token/use-get-token'
import { useQuoteExactTokenIn } from '@/hooks/dex/use-quote-exact-token-in'
import { formatOnchain } from '@/lib/fn.helper'

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
  
  // New state for invested ETH editing
  const [isEditingInvestedEth, setIsEditingInvestedEth] = useState(false)
  const [editingInvestedEth, setEditingInvestedEth] = useState('')
  
  const { data: token } = useGetToken(tokenAddress)
  const { data: existingWallets } = useTokenWallets({ tokenAddress })
  const { mutate: createTokenWallets, isPending: isCreating } = useCreateTokenWallets()
  const { mutate: updateInvestedEth, isPending: isUpdatingInvestedEth } = useTokenUpdateInvestedEth()

  useEffect(() => {
    if (token) {
      setEditingInvestedEth(formatOnchain({ value: BigInt(token.investedEth || '0'), decimals: 18 }))
    }
  }, [token])

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
  }, [existingWallets, mergedWallets, parsedWallets.length])

  const ethBalances = useWalletEthBalances({ addresses: mergedWallets.map(wallet => wallet.address), chainId: chainId })
  const erc20Balances = useWalletErc20Balances({ addresses: mergedWallets.map(wallet => wallet.address), chainId: chainId, tokenAddress: tokenAddress })
  const totalEthBalance = useMemo(() => {
    return mergedWallets.reduce((acc, wallet) => acc + (ethBalances[wallet.address] ?? 0n), 0n)
  }, [mergedWallets, ethBalances])
  const totalErc20Balance = useMemo(() => {
    return mergedWallets.reduce((acc, wallet) => acc + (erc20Balances[wallet.address] ?? 0n), 0n)
  }, [mergedWallets, erc20Balances])

  const { data: totalTokenValue } = useQuoteExactTokenIn({ token: tokenAddress, tokenIn: totalErc20Balance.toString(), chainId, fee: token?.fee })

  const pnl = useMemo(() => {
    return BigInt(token?.investedEth || '0') + BigInt(totalTokenValue || 0) - totalEthBalance
  }, [totalTokenValue, totalEthBalance, token?.investedEth])

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

  // Handle invested ETH editing
  const handleEditInvestedEth = () => {
    setEditingInvestedEth(formatOnchain({ value: BigInt(token?.investedEth || '0'), decimals: 18 }))
    setIsEditingInvestedEth(true)
  }

  const handleUpdateInvestedEth = () => {
    if (token) {
      updateInvestedEth({
        address: token.address,
        investedEth: parseEther(editingInvestedEth).toString()
      })
      setIsEditingInvestedEth(false)
    }
  }

  const handleDiscardInvestedEth = () => {
    setEditingInvestedEth(token?.investedEth || '0')
    setIsEditingInvestedEth(false)
  }

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested ETH */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested ETH</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEditingInvestedEth ? (
              <div className="space-y-2">
                <Input
                  value={editingInvestedEth}
                  onChange={(e) => setEditingInvestedEth(e.target.value)}
                  placeholder="Enter invested ETH amount"
                  className="text-lg font-mono"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUpdateInvestedEth}
                    disabled={isUpdatingInvestedEth}
                    className="h-8 w-8 p-0"
                    title="Update"
                  >
                    <IconCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDiscardInvestedEth}
                    disabled={isUpdatingInvestedEth}
                    className="h-8 w-8 p-0"
                    title="Discard"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  <FormatedOnchainNumber value={BigInt(token?.investedEth || '0')} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Token Balance
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditInvestedEth}
                    className="h-6 px-2"
                  >
                    <IconEdit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total ETH */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ETH</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <FormatedOnchainNumber value={totalEthBalance} />
            </div>
            <p className="text-xs text-muted-foreground pt-3">
              Available for trading
            </p>
          </CardContent>
        </Card>

        {/* Total Token */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Token</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <FormatedOnchainNumber value={totalErc20Balance} maxFractionDigits={0} />
            </div>
            <p className="text-xs text-muted-foreground pt-3">
              Value: <FormatedOnchainNumber value={totalTokenValue || 0n} /> ETH
            </p>
          </CardContent>
        </Card>

        {/* PnL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PnL (ETH)</CardTitle>
            {pnl >= 0n ? (
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <IconTrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnl >= 0n ? 'text-green-600' : 'text-red-600'}`}>
              <FormatedOnchainNumber value={pnl} />
            </div>
            <p className="text-xs text-muted-foreground pt-3">
              {pnl >= 0n ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>
      </div>
      
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={wallet.sellable}
                          onCheckedChange={() => handleToggleSellable(wallet.address)}
                        />
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
