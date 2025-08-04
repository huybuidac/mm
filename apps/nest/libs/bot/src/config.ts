import { ethers } from 'ethers'

export interface ChainConfig {
  name: string
  rpc: string
  weth: string
  usdc: string
  uniswapv3: {
    factory: string
    positionManager: string
    quoter: string
    swapRouter: string
    universalRouter: string
  }
}

export const USDC_DECIMALS = 6

export const ChainConfigs: Record<string, ChainConfig> = {
  '11124': {
    name: 'Abstract Sepolia Testnet',
    rpc: 'https://api.testnet.abs.xyz',
    weth: '0x9EDCde0257F2386Ce177C3a7FCdd97787F0D841d',
    usdc: '0xe4C7fBB0a626ed208021ccabA6Be1566905E2dFc',
    uniswapv3: {
      factory: '0x2E17FF9b877661bDFEF8879a4B31665157a960F0',
      positionManager: '0x069f199763c045A294C7913E64bA80E5F362A5d7',
      quoter: '0xdE41045eb15C8352413199f35d6d1A32803DaaE2',
      swapRouter: '0xb9D4347d129a83cBC40499Cd4fF223dE172a70dF',
      universalRouter: '0xCdFB71b46bF3f44FC909B5B4Eaf4967EC3C5B4e5',
    },
  },
  '2741': {
    name: 'Abstract',
    rpc: 'https://api.mainnet.abs.xyz',
    weth: '0x3439153EB7AF838Ad19d56E1571FBD09333C2809',
    usdc: '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1',
    uniswapv3: {
      factory: '0xA1160e73B63F322ae88cC2d8E700833e71D0b2a1',
      positionManager: '0xfA928D3ABc512383b8E5E77edd2d5678696084F9',
      quoter: '0x728BD3eC25D5EDBafebB84F3d67367Cd9EBC7693',
      swapRouter: '0x7712FA47387542819d4E35A23f8116C90C18767C',
      universalRouter: '0xE1b076ea612Db28a0d768660e4D81346c02ED75e',
    },
  },
}

const cachedProviders = new Map<string, ethers.JsonRpcProvider>()

export const getProvider = (chainId: string) => {
  const config = ChainConfigs[chainId]
  if (cachedProviders.has(chainId)) {
    return cachedProviders.get(chainId)
  }
  const provider = new ethers.JsonRpcProvider(config.rpc)
  cachedProviders.set(chainId, provider)
  return provider
}

// Contract Type	Mainnet	Testnet
// UniswapV3Factory	0xA1160e73B63F322ae88cC2d8E700833e71D0b2a1	0x2E17FF9b877661bDFEF8879a4B31665157a960F0
// multicall2Address	0x9CA4dcb2505fbf536F6c54AA0a77C79f4fBC35C0	0x84B11838e53f53DBc1fca7a6413cDd2c7Ab15DB8
// proxyAdminAddress	0x76d539e3c8bc2A565D22De95B0671A963667C4aD	0x10Ef01fF2CCc80BdDAF51dF91814e747ae61a5f1
// tickLensAddress	0x9c7d30F93812f143b6Efa673DB8448EfCB9f747E	0x2EC62f97506E0184C423B01c525ab36e1c61f78A
// nftDescriptorLibraryAddressV1_3_0	0x30cF3266240021f101e388D9b80959c42c068C7C	0x99C98e979b15eD958d0dfb8F24D8EfFc2B41f9Fe
// nonfungibleTokenPositionDescriptorV1_3_0	0xb9F2d038150E296CdAcF489813CE2Bbe976a4C62	0x8041c4f03B6CA2EC7b795F33C10805ceb98733dB
// descriptorProxyAddress	0x8433dEA5F658D9003BB6e52c5170126179835DaC	0x7a5d1718944bfA246e42c8b95F0a88E37bAC5495
// nonfungibleTokenPositionManagerAddress	0xfA928D3ABc512383b8E5E77edd2d5678696084F9	0x069f199763c045A294C7913E64bA80E5F362A5d7
// v3MigratorAddress	0x117Fc8DEf58147016f92bAE713533dDB828aBB7e	0xf3C430AF1C9C18d414b5cf890BEc08789431b6Ed
// quoterV2Address	0x728BD3eC25D5EDBafebB84F3d67367Cd9EBC7693	0xdE41045eb15C8352413199f35d6d1A32803DaaE2
// swapRouter02	0x7712FA47387542819d4E35A23f8116C90C18767C	0xb9D4347d129a83cBC40499Cd4fF223dE172a70dF
// permit2	0x0000000000225e31d15943971f47ad3022f714fa	0x7d174F25ADcd4157EcB5B3448fEC909AeCB70033
// universalRouter	0xE1b076ea612Db28a0d768660e4D81346c02ED75e	0xCdFB71b46bF3f44FC909B5B4Eaf4967EC3C5B4e5
// v3StakerAddress	0x2cB10Ac97F2C3dAEDEaB7b72DbaEb681891f51B8	0xe17e6f1518a5185f646eB34Ac5A8055792bD3c9D
