import Ctx from '../internals/ctx'
import ClipPathFnArrayBuilder from '../internals/ClipPathFnArrayBuilder'

export { default as RscCompositeComponent } from './RscCompositeComponent'
export { default as RscDOMComponent } from './RscDOMComponent'
export { default as RscEmptyComponent } from './RscEmptyComponent'
export { default as RscOffScreenComponent } from './RscOffScreenComponent'
export { default as RscClipPathComponent } from './RscClipPathComponent'

export interface InternalComponent {
  ctx: Ctx
  _currentElement: JSX.Element
  _parentComponent: InternalComponent

  mountComponent(ctx: Ctx, context: any): void

  receiveComponent(nextElement: JSX.Element, nextContext: any): void

  unmountComponent(): void

  draw(): void

  buildClipPathFnArray(builder: ClipPathFnArrayBuilder): void
}
