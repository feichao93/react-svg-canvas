export function rect(ctx: Ctx, props: React.SVGProps<SVGRectElement>) {
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
}

export function path(ctx: Ctx, props: React.SVGProps<SVGRectElement>) {
  const path2d = new Path2D(props.d as any)

  if (props.fill) {
    ctx.fillStyle = props.fill
  }
  if (props.fill !== 'none') {
    ctx.fill(path2d)
  }

  if (props.stroke) {
    ctx.strokeStyle = props.stroke
  }
  if (props.stroke && props.stroke !== 'none') {
    ctx.stroke(path2d)
  }
}
