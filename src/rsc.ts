import * as React from 'react'
import { parseSvgTransform } from './utils'

export function transformMatrix(ctx: CanvasRenderingContext2D, m: Matrix) {
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

export function draw(ctx: CanvasRenderingContext2D, element: JSX.Element) {
  ctx.save()
  if (element.type === 'rect') {
    const props: React.SVGProps<SVGRectElement> = element.props
    const x = Number(props.x) || 0
    const y = Number(props.y) || 0
    const w = Number(props.width)
    const h = Number(props.height)
    if (props.fill) {
      ctx.fillStyle = props.fill
    }
    if (props.fill !== 'none') {
      ctx.fillRect(x, y, w, h)
    }

    if (props.stroke) {
      ctx.strokeStyle = props.stroke
    }
    if (props.stroke && props.stroke !== 'none') {
      ctx.strokeRect(x, y, w, h)
    }
  } else if (element.type === 'g') {
    const props: React.SVGProps<SVGGElement> = element.props
    const svgMatrix = parseSvgTransform(props.transform)

    transformMatrix(ctx, svgMatrix)
    React.Children.forEach(element.props.children,
      (child: JSX.Element) => draw(ctx, child))
  } else if (element.type === 'path') {
    const props: React.SVGProps<SVGGElement> = element.props

    if (props.fill) {
      ctx.fillStyle = props.fill
    }
    ctx.fill(new Path2D(props.d as any))
  } else if (typeof element.type === 'function') {
    if (element.type.prototype instanceof React.Component) {
      // this.draw(element.type.prototype.render.call(element))
      // !!!! TODO !!!!
      draw(ctx, (element as any)._owner._instance.render())
    } else {
      // stateless function component
      draw(ctx, (element.type as React.SFC)(element.props))
    }
  } else {
    console.warn('unknown element', element)
  }
  ctx.restore()
}
