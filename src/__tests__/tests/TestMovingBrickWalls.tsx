import * as React from 'react'
import BrickWall from '../components/BrickWall'

function range(end: number) {
  const result: number[] = []
  for (let i = 0; i < end; i++) {
    result.push(i)
  }
  return result
}

const totalWidth = 800
const totalHeight = 400
const size = 32

export default class TestMovingBrickWalls extends React.Component {
  private startTime: number
  private t: number
  private requestId: number
  state = {
    x: 16,
    y: 16,
    vx: 300e-3,
    vy: 0,
  }

  componentDidMount() {
    this.t = this.startTime = performance.now()
    this.requestId = requestAnimationFrame(this.move)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.requestId)
  }

  move = () => {
    const { x, y, vx, vy } = this.state
    const now = performance.now()
    const delta = now - this.t
    this.t = now

    const f = 1 - delta * 500e-6
    const g = 500e-6

    const dx = vx * delta
    const invertX = x + dx < 0 || x + dx + size > totalWidth
    let nextVx = invertX ? -vx : vx
    nextVx *= f

    nextVx = Number(nextVx.toFixed(2))
    const dy = vy * delta
    const invertY = y + dy + size > totalHeight
    let nextVy = invertY ? -vy : vy
    if (!invertY) {
      nextVy += delta * g
    }
    nextVy *= f
    nextVy = Number(nextVy.toFixed(2))

    this.setState({
      x: x + nextVx * delta,
      y: y + nextVy * delta,
      vx: nextVx,
      vy: nextVy,
    })
    if (now - this.startTime < 15e3) {
      this.requestId = requestAnimationFrame(this.move)
    }
  }

  render() {
    const { x, y } = this.state

    return (
      <g role="brickwall" transform={`translate(${x}, ${y})`}>
        {range(size / 4).map(col =>
          range(size / 4).map(row => {
            let x = col * 4
            let y = row * 4
            return <BrickWall key={row * (size / 4) + col} x={x} y={y} />
          })
        )}
      </g>
    )
  }
}
