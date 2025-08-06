export function PriceChart(props: { tokenAddress: string; chainId: string }) {
  const { tokenAddress, chainId } = props
  const src = `https://www.dextools.io/widget-chart/en/abstract/pe-light/${tokenAddress}?theme=light&chartType=2&chartResolution=30&drawingToolbars=false`
  return (
    <>
      {chainId === '2741' ? (
        <iframe
          id='dextools-widget'
          title='DEXTools Trading Chart'
          width='500'
          height='400'
          src={src}
        ></iframe>
      ) : (
        <div>
          <p>Price chart is not available for this chain</p>
        </div>
      )}
    </>
  )
}
