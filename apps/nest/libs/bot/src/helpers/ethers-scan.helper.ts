import axios from 'axios'

export const getContractCreation = async (options: { address: string; chainId: string }) => {
  const res = await axios.get(
    `https://api.etherscan.io/v2/api?chainid=${options.chainId}&module=contract&action=getcontractcreation&contractaddresses=${options.address}&apikey=${process.env.ETHERSCAN_API_KEY}`,
  )
  return res.data
}
