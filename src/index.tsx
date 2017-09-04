import './preloaded'
import * as React from 'react'
import Rsc from './rsc'
import { range } from './utils'
import { BrickWall, SteelWall } from './testElements'

const canvasElement = document.querySelector('canvas')
const ctx = canvasElement.getContext('2d')

class Test extends React.PureComponent {
  state = {
    x: 16,
    y: 16,
  }

  componentDidMount() {
    console.log('did-mount')

    requestAnimationFrame(this.addX)
  }

  addX = () => {
    this.setState({ x: this.state.x + 1, y: this.state.y + 0.5 })
    requestAnimationFrame(this.addX)
  }

  render() {
    const { x, y } = this.state
    return (
      <g role="brickwall" transform={`translate(${x}, ${y})scale(8)`}>
        {range(8).map(x =>
          range(8).map(y =>
            <BrickWall x={4 * x} y={4 * y} />
          )
        )}
      </g>
    )
  }
}

// Rsc.draw(
//   <Test />,
//   ctx,
// )

Rsc.draw(
  <g transform="scale(8)">
    <SteelWall x={4} y={4} />
    <SteelWall x={12} y={4} />
    <SteelWall x={20} y={4} />
    <SteelWall x={28} y={4} />
    <SteelWall x={4} y={20} />
    <SteelWall x={12} y={20} />
    <SteelWall x={20} y={20} />
    <SteelWall x={28} y={20} />
  </g>,
  ctx,
)
