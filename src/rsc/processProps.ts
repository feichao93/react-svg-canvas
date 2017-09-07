import { CSSProperties } from 'react'
import { Ctx } from './types'
import { parseSvgTransform } from './utils'

function processTransform(ctx: Ctx, transform: string) {
  if (transform) {
    const m = parseSvgTransform(transform)
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
  }
}

function processFill(ctx: Ctx, fill: string) {
  if (fill) {
    ctx.fillStyle = fill
  }
}

function processStroke(ctx: Ctx, stroke: string) {
  if (stroke) {
    ctx.strokeStyle = stroke
  }
}

function processStyle(ctx: Ctx, style: CSSProperties) {
  if (style) {
    if (style.visibility === 'hidden') {
      ctx.fillStyle = 'transparent'
    }
    if (style.display === 'none') {
      ctx.fillStyle = 'transparent'
    }
  }
}

export default function processProps(ctx: Ctx, element: JSX.Element) {
  const { transform, fill, stroke, style } = element.props

  processTransform(ctx, transform)
  processFill(ctx, fill)
  processStroke(ctx, stroke)
  processStyle(ctx, style)
}
