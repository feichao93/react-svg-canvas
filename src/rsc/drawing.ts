import { parseSvgTransform } from './utils'

export function draw(ctx: Ctx, element: JSX.Element) {
  if (element.type === 'rect') {
    return rect(ctx, element.props)
  } else if (element.type === 'path') {
    return path(ctx, element.props)
  } else {
    // console.warn(`Invalid shape type ${props.type}`)
  }
}

export function rect(ctx: Ctx, props: React.SVGProps<SVGRectElement>) {
  const x = Number(props.x) || 0
  const y = Number(props.y) || 0
  const w = Number(props.width)
  const h = Number(props.height)

  if (props.fill !== 'none') {
    ctx.fillRect(x, y, w, h)
  }

  if (props.stroke && props.stroke !== 'none') {
    ctx.strokeRect(x, y, w, h)
  }
}

export function path(ctx: Ctx, props: React.SVGProps<SVGRectElement>) {
  const path2d = new Path2D(props.d as any)

  if (props.fill !== 'none') {
    ctx.fill(path2d)
  }

  if (props.stroke && props.stroke !== 'none') {
    ctx.stroke(path2d)
  }
}

export function processTransform(ctx: Ctx, transform: string) {
  if (transform) {
    const m = parseSvgTransform(transform)
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
  }
}

export function processFill(ctx: Ctx, fill: string) {
  if (fill) {
    ctx.fillStyle = fill
  }
}

export function processStroke(ctx: Ctx, stroke: string) {
  if (stroke) {
    ctx.strokeStyle = stroke
  }
}
