import * as React from 'react'

const totalWidth = 800
const totalHeight = 400

const color1 = [60, 59, 63]
const color2 = [96, 92, 60]

function color(t: number) {
  const list = [0, 1, 2].map(index => color1[index] * t + color2[index] * (1 - t)).map(Math.round)
  return `rgb(${list.join(',')})`
}

export default class TestBasicClipPath extends React.Component {
  private requestId: number
  private time: number
  state = {
    t: 0,
  }

  componentDidMount() {
    this.time = performance.now()
    this.requestId = requestAnimationFrame(this.animate)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.requestId)
  }

  animate = () => {
    const { t } = this.state
    const now = performance.now()
    const delta = (now - this.time) / 4000
    this.time = now

    this.setState({
      t: (t + delta) % 2,
    })
    this.requestId = requestAnimationFrame(this.animate)
  }

  render() {
    const { t } = this.state
    return (
      <g>
        <defs>
          <clipPath id="basic-clip-path">
            {t < 1 ? (
              <rect x={0} y={0} width={totalWidth * t} height={totalHeight} />
            ) : (
              <rect x={(t - 1) * totalWidth} y={0} width={totalWidth} height={totalHeight} />
            )}
          </clipPath>
        </defs>
        <rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          clipPath="url(#basic-clip-path)"
          fill={color(t)}
        />
      </g>
    )
  }
}
