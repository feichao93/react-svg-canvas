import * as React from 'react'
import SteelWall from '../components/SteelWall'

export default class TestBrickWallZoomIn extends React.Component {
  private requestId: number
  state = {
    scale: 1,
  }

  componentDidMount() {
    this.requestId = requestAnimationFrame(this.zoom)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.requestId)
  }

  zoom = () => {
    const { scale } = this.state
    this.setState({ scale: scale * 1.05 })
    if (scale * 1.05 < 20) {
      this.requestId = requestAnimationFrame(this.zoom)
    }
  }

  render() {
    const { scale } = this.state
    return (
      <g transform={`translate(150, 30)scale(${scale})`}>
        <SteelWall x={0} y={0} />
        <SteelWall x={8} y={0} />
        <SteelWall x={0} y={8} />
        <SteelWall x={8} y={8} />
      </g>
    )
  }
}
