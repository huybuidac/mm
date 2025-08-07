export function PriceChart(props: { tokenAddress: string; chainId: string }) {
  const { chainId } = props

  const src = `https://www.dextools.io/widget-chart/en/abstract/pe-light/0x4004d7893128c9e09b57c5e3708ff6516d517cbf?theme=light&chartType=2&chartResolution=30&drawingToolbars=false`
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
