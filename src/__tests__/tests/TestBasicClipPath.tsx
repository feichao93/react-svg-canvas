import * as React from 'react'
import * as d3 from 'd3'
import { Color } from 'd3'

const totalWidth = 800
const totalHeight = 400

const color = d3.scaleLinear<Color>()
  .domain([0, 1])
  .range([d3.rgb(60, 59, 63), d3.rgb(96, 92, 60)])

const width = d3.scaleLinear()
  .domain([0, 1, 2])
  .range([0, totalWidth, 0])
  .interpolate((left, right) => t => d3.interpolate(left, right)(d3.easeExp(t)))

const x = d3.scaleLinear()
  .domain([0, 1, 2])
  .range([0, 0, totalWidth])
  .interpolate((left, right) => t => d3.interpolate(left, right)(d3.easeExp(t)))

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
    const delta = (now - this.time) / 1000
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
            <rect x={x(t)} y={0} width={width(t)} height={totalHeight} />
          </clipPath>
        </defs>
        <rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          clipPath="url(#basic-clip-path)"
          fill={color(t).toString()}
        />
      </g>
    )
  }
}
