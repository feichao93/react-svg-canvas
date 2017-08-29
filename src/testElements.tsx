import * as React from 'react'

export const SteelWall = ({ x, y }: { x: number, y: number }) => (
  <g role="steelwall" transform={`translate(${x},${y})`}>
    <rect width="8" height="8" fill="#ADADAD" />
    <rect x="2" y="2" width="4" height="4" fill="#FFFFFF" />
    <path d="M6,2 h1,v-1,h1,v7,h-7,v-1,h1,v-1,h4,v-4" fill="#636363" />
  </g>
)

export class BrickWall extends React.PureComponent<{ x: number, y: number }> {
  render() {
    const { x, y } = this.props
    const brickWallPart = (transform: string, shape: boolean) => (
      <g role="brickwall" transform={transform}>
        <rect width={4} height={4} fill="#636363" />
        <rect
          x={shape ? 0 : 1}
          y={0}
          width={shape ? 4 : 3}
          height={3}
          fill="#6B0800"
        />
        <rect
          x={shape ? 0 : 2}
          y={1}
          width={shape ? 4 : 2}
          height={2}
          fill="#9C4A00"
        />
      </g>
    )
    const row = Math.floor(y / 4)
    const col = Math.floor(x / 4)

    if ((row + col) % 2 === 0) {
      return (
        brickWallPart(`translate(${x},${y})`, true)
      )
    } else {
      return brickWallPart(`translate(${x},${y})`, false)
    }
  }
}
