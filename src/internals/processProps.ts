import { CSSProperties } from 'react'
import Ctx from './ctx'
import parseSvgTransform from './parseSvgTransform'

function processTransform(ctx: Ctx, transform: string) {
  const m = parseSvgTransform(transform)
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

function processFill(ctx: Ctx, fill: string) {
  ctx.fillStyle = fill
}

function processStroke(ctx: Ctx, stroke: string) {
  ctx.strokeStyle = stroke
}

function processStyle(ctx: Ctx, style: CSSProperties) {
  if (style.visibility === 'hidden' || style.display === 'none') {
    ctx.visible = false
  }
}

export default function processProps(ctx: Ctx, element: JSX.Element) {
  const { transform, fill, stroke, style } = element.props

  transform && processTransform(ctx, transform)
  fill && processFill(ctx, fill)
  stroke && processStroke(ctx, stroke)
  style && processStyle(ctx, style)
  // clipPath属性在其他地方进行处理
}
