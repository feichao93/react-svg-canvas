import Ctx from '../internals/ctx'
import RscCompositeComponent from './RscCompositeComponent'
import { InternalComponent } from './index'

/**
 * 用于进行off-screen-render的组件.
 * 该组件的主要作用在于: 调用RscOffScreenComponent#draw方法时,
 * 该组件会找到对应的参数调用PublicComponent.offScreen.render函数
 */
export default class RscOffScreenComponent implements InternalComponent {
  ctx: Ctx
  publicComponent: any
  // 在RscOffScreenComponent中_currentElement没用
  _currentElement: JSX.Element
  _parentComponent: InternalComponent

  constructor(element: any) {
    // publicComponent上面存放了我们所需要的数据
    // publicComponent._offScreenCanvas存放了已经绘制好的内容
    // publicComponent.offScreen.render是用户自定的offScreen render方法
    this.publicComponent = element.props.Component
  }

  mountComponent(ctx: Ctx, context: any) {
    this.ctx = ctx
  }

  receiveComponent() {
  }

  unmountComponent() {
    this.ctx = null
    this.publicComponent = null
  }

  draw() {
    const ctx = this.ctx
    const offScreenRenderFn = this.publicComponent.offScreen.render
    const offScreenCanvas = this.publicComponent._offScreenCanvas
    const parentComponent = this._parentComponent as RscCompositeComponent
    offScreenRenderFn.call(parentComponent._instance, ctx, offScreenCanvas)
  }
}
