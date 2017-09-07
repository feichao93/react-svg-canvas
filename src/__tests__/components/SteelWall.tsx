import * as React from 'react'

const SteelWall = ({ x, y }: { x: number, y: number }) => (
  <g role="steelwall" transform={`translate(${x},${y})`}>
    <rect width="8" height="8" fill="#ADADAD" />
    <rect x="2" y="2" width="4" height="4" fill="#FFFFFF" />
    <path d="M6,2 h1,v-1,h1,v7,h-7,v-1,h1,v-1,h4,v-4" fill="#636363" />
  </g>
)

export default SteelWall
