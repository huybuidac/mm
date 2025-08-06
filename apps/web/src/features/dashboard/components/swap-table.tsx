import { useState } from 'react'
import { TokenSwapEntity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconExternalLink, IconCopy, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'
import { toast } from 'sonner'
import { FormatedOnchainNumber } from '@/components/formated-onchain-number'
import { ChainConfigs } from '@/lib/config'

interface SwapTableProps {
  swaps: TokenSwapEntity[]
  chainId: string
}

export function SwapTable({ swaps, chainId }: SwapTableProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const chain = ChainConfigs[chainId]

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (_err) {
      toast.error('Failed to copy')
    }
  }

  const openScan = (txHash: string) => {
    // You can customize this URL based on the chain
    const scanUrl = `${chain.scan}/tx/${txHash}`
    window.open(scanUrl, '_blank')
  }

  // Pagination logic
  const totalPages = Math.ceil(swaps.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentSwaps = swaps.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5" />
              Swap History
            </CardTitle>
            <CardDescription>
              Recent trading swaps and transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Token Amount</TableHead>
                <TableHead>ETH Amount</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSwaps.map((swap) => (
                <TableRow key={`${swap.txHash}-${swap.index}`}>
                  <TableCell>
                    <Badge variant={swap.isBuy ? "default" : "secondary"} className="flex items-center gap-1">
                      {swap.isBuy ? (
                        <IconTrendingUp className="h-3 w-3" />
                      ) : (
                        <IconTrendingDown className="h-3 w-3" />
                      )}
                      {swap.isBuy ? 'Buy' : 'Sell'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{formatAddress(swap.txHash)}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openScan(swap.txHash)}
                        className="h-6 w-6 p-0"
                      >
                        <IconExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <FormatedOnchainNumber value={swap.tokenAmount} />
                    {/* <span className="font-mono">{formatTokenAmount(swap.tokenAmount)}</span> */}
                  </TableCell>
                  <TableCell>
                    <FormatedOnchainNumber value={swap.ethAmount} />
                    {/* <span className="font-mono">{formatBigInt(swap.ethAmount)} ETH</span> */}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{swap.blockNumber}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{formatAddress(swap.recipient)}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(swap.recipient)}
                        className="h-6 w-6 p-0"
                        title="Copy recipient address"
                      >
                        <IconCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, swaps.length)} of {swaps.length} swaps
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
