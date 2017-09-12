import Ctx from './ctx'

declare global {
  interface CanvasRenderingContext2D {
    fill(path2d: Path2D): void
  }
}

export interface SvgTransformMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export interface SetStateCallback {
  (): void
}

export interface InternalComponent {
  ctx: Ctx
  _currentElement: JSX.Element
  _parentComponent: InternalComponent

  mountComponent(ctx: Ctx, context: any): void
  receiveComponent(nextElement: JSX.Element, nextContext: any): void
  unmountComponent(): void
  draw(): void
}
