import Ctx from '../internals/ctx'

export { default as RscCompositeComponent } from './RscCompositeComponent'
export { default as RscDefsComponent } from './RscDefsComponent'
export { default as RscDOMComponent } from './RscDOMComponent'
export { default as RscEmptyComponent } from './RscEmptyComponent'
export { default as RscOffScreenComponent } from './RscOffScreenComponent'

export interface InternalComponent {
  ctx: Ctx
  _currentElement: JSX.Element
  _parentComponent: InternalComponent

  mountComponent(ctx: Ctx, context: any): void

  receiveComponent(nextElement: JSX.Element, nextContext: any): void

  unmountComponent(): void

  draw(): void
}
