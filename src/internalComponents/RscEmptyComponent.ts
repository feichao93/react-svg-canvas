import Ctx from '../internals/ctx'
import { InternalComponent } from './index'

export default class RscEmptyComponent implements InternalComponent {
  ctx: Ctx
  _currentElement: JSX.Element
  _parentComponent: InternalComponent

  constructor(element: JSX.Element) {
  }

  mountComponent() {
  }

  receiveComponent() {
  }

  unmountComponent() {
  }

  draw() {
  }

  buildClipPathFnArray() {
  }
}
