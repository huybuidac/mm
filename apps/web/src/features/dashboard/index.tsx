import { IconFileText } from '@tabler/icons-react'
import { useTokenStore } from '@/stores/tokenStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { LogDisplay } from './components/log-display'
import { PriceChart } from './components/price-chart'
import { StartBot } from './components/start-bot'
import { TokenSettings } from './components/token-settings'
import { WalletConfigs } from './components/wallet-configs'
import { SwapTable } from './components/swap-table'

export default function Dashboard() {
  const { selectedToken } = useTokenStore()
  const tokenData = useTokenStore((state) =>
    selectedToken ? state.tokenData[selectedToken.address] : undefined
  )

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
            <Button>Download</Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              {/* <TabsTrigger value='analytics' disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value='reports' disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                Notifications
              </TabsTrigger> */}
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Token Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <TokenSettings />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Wallet Configs</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedToken && (
                  <WalletConfigs
                    tokenAddress={selectedToken.address}
                    chainId={selectedToken.chainId}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedToken && (
                  <PriceChart
                    tokenAddress={selectedToken.address}
                    chainId={selectedToken.chainId}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bot Status</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedToken && <StartBot token={selectedToken} />}
              </CardContent>
            </Card>

            {/* Server Logs */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconFileText className='h-5 w-5' />
                  Server Logs
                </CardTitle>
                <CardDescription>
                  Real-time logs from the trading bot server.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogDisplay logs={tokenData?.logs || []} />
              </CardContent>
            </Card>

            {/* Swap Table */}
            {selectedToken && tokenData?.swaps && tokenData.swaps.length > 0 && (
              <SwapTable swaps={tokenData.swaps} chainId={selectedToken.chainId} />
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
