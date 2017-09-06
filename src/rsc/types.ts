import { RscCompositeComponent } from './rsc'

declare global {
  interface SvgTransformMatrix {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number
  }

  interface SetStateCallback {
    (): void
  }

  interface CanvasRenderingContext2D {
    fill(path2d: Path2D): void

    __rscRootComponentInstance: RscCompositeComponent
    __redrawScheduled: boolean
    __pendingSetStateCallbacks: SetStateCallback[]
  }

  type Ctx = CanvasRenderingContext2D

  interface InternalComponent {
    ctx: Ctx
    _currentElement: JSX.Element
    _parentComponent: InternalComponent

    mountComponent(ctx: Ctx, context: any): void
    receiveComponent(nextElement: JSX.Element, nextContext: any): void
    unmountComponent(): void
    draw(): void
  }
}
