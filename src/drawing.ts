import Ctx from './ctx'

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

  if (ctx.fillStyle) {
    ctx.fillRect(x, y, w, h)
  }

  if (ctx.strokeStyle) {
    ctx.strokeRect(x, y, w, h)
  }
}

export function path(ctx: Ctx, props: React.SVGProps<SVGRectElement>) {
  const path2d = new Path2D(props.d as any)

  if (ctx.fillStyle) {
    ctx.fill(path2d)
  }

  if (ctx.strokeStyle) {
    ctx.stroke(path2d)
  }
}
