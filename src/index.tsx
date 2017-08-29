import './preloaded'
import * as React from 'react'
import * as rsc from './rsc'
import { range } from './utils'
import { BrickWall, SteelWall } from './testElements'

const canvasElement = document.querySelector('canvas')
const ctx = canvasElement.getContext('2d')

rsc.draw(ctx,
  <g role="brickwall" transform="translate(16, 16)scale(8)">
    {range(8).map(x =>
      range(8).map(y =>
        <BrickWall x={4 * x} y={4 * y} />
      )
    )}
  </g>
)

rsc.draw(ctx,
  <g transform="scale(8)">
    <SteelWall x={4} y={4} />
    <SteelWall x={12} y={4} />
    <SteelWall x={20} y={4} />
    <SteelWall x={28} y={4} />
    <SteelWall x={4} y={20} />
    <SteelWall x={12} y={20} />
    <SteelWall x={20} y={20} />
    <SteelWall x={28} y={20} />
  </g>
)
