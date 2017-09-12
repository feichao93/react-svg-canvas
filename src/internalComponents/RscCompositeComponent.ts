import Ctx from '../internals/ctx'
import StatelessComponent from '../internals/StatelessComponent'
import rscSetState from '../internals/rscSetState'
import RscInstanceMap from '../internals/RscInstanceMap'
import instantiateRscComponent from '../internals/instantiateRscComponent'
import RscReconciler from '../internals/RscReconciler'
import renderInst from '../internals/renderInst'
import shouldUpdateRscComponent from '../internals/shouldUpdateRscComponent'
import ClipPathFnArrayBuilder from '../internals/ClipPathFnArrayBuilder'
import { InternalComponent } from './index'

export default class RscCompositeComponent implements InternalComponent {
  ctx: Ctx = null
  _context: any = null
  _pendingRscPartialState: any[] = []
  _currentElement: JSX.Element
  _parentComponent: InternalComponent
  _renderedComponent: InternalComponent
  _instance: PublicComponent

  constructor(element: JSX.Element) {
    this._currentElement = element
  }

  draw() {
    this._renderedComponent.draw()
  }

  buildClipPathFnArray(builder: ClipPathFnArrayBuilder) {
    this._renderedComponent.buildClipPathFnArray(builder)
  }

  mountComponent(ctx: Ctx, context: any) {
    this.ctx = ctx
    this._context = context

    const publicProps = this._currentElement.props
    const publicContext = this.processContext(context)

    const Component = this._currentElement.type as PublicComponentClass

    let inst: PublicComponent
    if (Component.prototype && Component.prototype.isReactComponent) {
      inst = new Component(publicProps, publicContext)
    } else { // stateless-functional-components
      inst = new StatelessComponent() as PublicComponent
    }

    inst.props = publicProps
    // inst.state 已经在inst的构造函数中设置好了
    inst.context = publicContext

    RscInstanceMap.set(inst, this)
    this._instance = inst

    if (inst.componentWillMount) {
      inst.componentWillMount()
    }

    const renderedElement = renderInst(inst, Component)
    this._renderedComponent = instantiateRscComponent(renderedElement)

    RscReconciler.mountComponent(
      this._renderedComponent,
      ctx,
      this.processChildContext(context),
    )

    this._renderedComponent._parentComponent = this

    if (inst.componentDidMount) {
      inst.componentDidMount()
    }

    this.injectRscUpdaters()
  }

  receiveComponent(nextElement: JSX.Element, nextContext: any) {
    const prevElement = this._currentElement
    const prevContext = this._context
    this.updateComponent(prevElement, nextElement, prevContext, nextContext)
  }

  private updateComponent(prevElement: JSX.Element,
    nextElement: JSX.Element,
    prevUnmaskedContext: any,
    nextUnmaskedContext: any, ) {
    const inst = this._instance

    const prevProps = prevElement.props
    const prevState = inst.state
    const prevContext = inst.context
    const nextProps = nextElement.props

    let nextContext: any
    if (this._context === nextUnmaskedContext) {
      nextContext = inst.context
    } else {
      nextContext = this.processContext(nextUnmaskedContext)
    }

    const willReceive = prevElement !== nextElement
    if (willReceive && inst.componentWillReceiveProps) {
      // console.warn('In react-svg-canvas, calling `setState` in `shouldComponentUpdate`'
      //   + ' will trigger a re-render because I have not implement it...')
      inst.componentWillReceiveProps(nextProps, nextContext)
    }
    const nextState = this.processPendingState(nextProps, nextContext)

    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext)
    }

    this._currentElement = nextElement
    this._context = nextUnmaskedContext
    inst.props = nextProps
    inst.state = nextState
    inst.context = nextContext

    const prevRenderedComponent = this._renderedComponent
    const nextRenderedElement = renderInst(inst, this._currentElement.type as PublicComponentClass)

    if (shouldUpdateRscComponent(prevRenderedComponent._currentElement, nextRenderedElement)) {
      RscReconciler.receiveComponent(
        this._renderedComponent,
        nextRenderedElement,
        this.processChildContext(this._context))
      if (inst.componentDidUpdate) {
        inst.componentDidUpdate(prevProps, prevState, prevContext)
      }
    } else {
      // 已经是不同的两个东西了, 需要进行重新渲染
      RscReconciler.unmountComponent(this._renderedComponent)

      this._renderedComponent = instantiateRscComponent(nextElement)
      RscReconciler.mountComponent(
        this._renderedComponent,
        this.ctx,
        this.processChildContext(this._context),
      )
      this._renderedComponent._parentComponent = this
    }
  }

  unmountComponent() {
    this._renderedComponent.unmountComponent()
    const inst = this._instance
    if (inst.componentWillUnmount) {
      inst.componentWillUnmount()
    }

    this._currentElement = null
    this._context = null
    this._instance = null
    this._pendingRscPartialState = null
    this._renderedComponent = null
    this.ctx = null
    // 等待root重新绘制
  }

  private processContext(context: any) {
    const Component: any = this._currentElement.type
    const contextTypes = Component.contextTypes
    if (!contextTypes) {
      return {}
    }
    const maskedContext: any = {}
    for (const contextName of Object.keys(contextTypes)) {
      maskedContext[contextName] = context[contextName]
    }
    return maskedContext
  }

  private processChildContext(currentContext: any) {
    const inst: any = this._instance

    let childContext = null
    if (inst.getChildContext) {
      childContext = inst.getChildContext()
    }
    return Object.assign({}, currentContext, childContext)
  }

  private processPendingState(nextProps: any, nextContext: any) {
    const inst = this._instance
    let nextState = Object.assign({}, inst.state)
    for (const partialState of this._pendingRscPartialState) {
      if (typeof partialState === 'function') {
        nextState = partialState(nextState, nextProps, nextContext)
      } else {
        Object.assign(nextState, partialState)
      }
    }
    this._pendingRscPartialState = []
    return nextState
  }

  /* 修改组件的setState/replaceState等相关函数 */
  private injectRscUpdaters() {
    const inst: any = this._instance
    if (inst.setState) {
      inst.setState = rscSetState
    }
  }
}
