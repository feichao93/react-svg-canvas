interface SvgTransformMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

interface CanvasRenderingContext2D {
  fill(path2d: Path2D): void
}

type Ctx = CanvasRenderingContext2D
