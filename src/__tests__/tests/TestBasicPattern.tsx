import * as React from 'react'
import BrickWall from '../components/BrickWall'

export default class TestBasicPattern extends React.Component {
  render() {
    const size = 4
    return (
      <g>
        <defs>
          <pattern
            id="pattern-brickwall"
            width={size * 2}
            height={size * 2}
            patternUnits="userSpaceOnUse"
          >
            <BrickWall x={0} y={0} />
            <BrickWall x={0} y={size} />
            <BrickWall x={size} y={0} />
            <BrickWall x={size} y={size} />
          </pattern>
        </defs>
        <rect
          x={200}
          y={50}
          width={400}
          height={300}
          fill="url(#pattern-brickwall)"
        />
      </g>
    )
  }
}
