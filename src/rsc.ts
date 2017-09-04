import * as React from 'react'
import * as drawing from './drawing'
import {
  ComponentClass as PublicComponentClass,
  Component as PublicComponent,
} from 'react'
import { parseSvgTransform } from './utils'

type Element = JSX.Element

declare module 'react' {
  interface Component {
    __rscInternalInstance: RscCompositeComponentWrapper
  }
}

declare global {
  interface CanvasRenderingContext2D {
    __rscComponentInstance: RscCompositeComponentWrapper
  }
}

class StatelessComponent {
  render(this: PublicComponent) {
    const Component = RscInstanceMap.get(this)._currentElement.type as React.SFC
    return Component(this.props)
  }
}

class TopLevelWrapper extends React.Component {
  render() {
    return React.Children.only(this.props.children)
  }
}

const RscInstanceMap = {
  set(key: PublicComponent, value: RscCompositeComponentWrapper) {
    key.__rscInternalInstance = value
  },
  get(key: PublicComponent) {
    return key.__rscInternalInstance
  },
}

function transformMatrix(ctx: Ctx, m: Matrix) {
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

const RscReconciler = {
  mountComponent(internalInstance: InternalComponent, ctx: Ctx) {
    return internalInstance.mountComponent(ctx)
  },
  receiveComponent(internalInstance: InternalComponent, nextElement: Element) {
    internalInstance.receiveComponent(nextElement)
  },
}

function instantiateRscComponent(element: Element): InternalComponent {
  if (typeof element.type === 'string') {
    return new RscDOMComponent(element)
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponentWrapper(element)
  }
}


interface InternalComponent {
  ctx: Ctx
  _currentElement: Element
  mountComponent(ctx: Ctx): void
  receiveComponent(nextElement: JSX.Element): void
}

class RscDOMComponent implements InternalComponent {
  ctx: Ctx = null
  _currentElement: Element
  /* SFC */
  _renderedChildren: InternalComponent[] = []

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx) {
    this.ctx = ctx
    const element = this._currentElement

    ctx.save()

    if (element.props.transform) {
      const svgTransformMatrix = parseSvgTransform(element.props.transform)
      transformMatrix(ctx, svgTransformMatrix)
    }

    if (element.type === 'rect') {
      drawing.rect(ctx, element.props)
    } else if (element.type === 'path') {
      drawing.path(ctx, element.props)
    }

    if (element.props.children) {
      const children = React.Children.toArray(element.props.children) as Element[]

      children.forEach(childElement => {
        const child = instantiateRscComponent(childElement)
        child.mountComponent(ctx)
        this._renderedChildren.push(child)
      })
    }

    ctx.restore()

    return /* 返回一个代表mount结果的值 */
  }

  receiveComponent(nextElement: JSX.Element) {
    this._currentElement = nextElement
    const element = nextElement
    const ctx = this.ctx

    ctx.save()

    if (element.props.transform) {
      const svgTransformMatrix = parseSvgTransform(element.props.transform)
      transformMatrix(ctx, svgTransformMatrix)
    }

    if (element.type === 'rect') {
      drawing.rect(ctx, element.props)
    } else if (element.type === 'path') {
      drawing.path(ctx, element.props)
    }

    if (element.props.children) {
      const children = React.Children.toArray(element.props.children) as Element[]
      // TODO LAST-EDIT 
      // 这里需要使用DIFF算法来确定 是 unmount+mount 还是 update
      children.forEach(childElement => {
        const child = instantiateRscComponent(childElement)
        child.mountComponent(ctx)
        this._renderedChildren.push(child)
      })
    }

    ctx.restore()
  }
}

class RscCompositeComponentWrapper implements InternalComponent {
  private _rendering = false
  ctx: Ctx = null
  _pendingRscPartialState: any[] = []
  _currentElement: Element
  _renderedComponent: InternalComponent
  _instance: PublicComponent

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx) {
    this.ctx = ctx
    const publicProps = this._currentElement.props
    const Component = this._currentElement.type as PublicComponentClass

    let inst: PublicComponent
    if (Component.prototype && Component.prototype.isReactComponent) {
      inst = new Component(this._currentElement.props)
    } else { // stateless-functional-components
      inst = new StatelessComponent() as PublicComponent
    }

    inst.props = publicProps
    // inst.state 已经在构造函数中初始化好了, 这里就不进行赋值了

    RscInstanceMap.set(inst, this)
    this._instance = inst

    if (inst.componentWillMount) {
      inst.componentWillMount()
    }
    const markup = this.performInitialMount(ctx)
    if (inst.componentDidMount) {
      // TODO did-mount在这里是否调用就可以吗?  还是需要等待某个事件?
      inst.componentDidMount()
    }

    this.injectRscSetState(ctx)

    return markup
  }

  receiveComponent(nextElement: Element) {
    const prevElement = this._currentElement
    this.updateComponent(prevElement, nextElement)
  }

  performInitialMount(ctx: Ctx) {
    const inst = this._instance

    const renderedElement = inst.render() as Element
    const child = instantiateRscComponent(renderedElement)
    this._renderedComponent = child

    return RscReconciler.mountComponent(child, ctx)
  }

  updateComponent(prevElement: Element, nextElement: Element) {
    this._rendering = true
    const nextProps = prevElement.props
    const inst = this._instance

    const willReceive = prevElement !== nextElement

    if (willReceive && inst.componentWillReceiveProps) {
      // TODO 在这里生命周期里面 调用setState会直接改变组件的state且不需要额外的render
      inst.componentWillReceiveProps(nextProps, null)
    }

    // 注意:  这里不需要shouldComponentUpdate  反正总是需要更新的

    const nextState = this._processPendingState()

    // this._performComponentUpdate(nextElement, nextProps, nextState)
    this._currentElement = nextElement
    inst.props = nextProps
    inst.state = nextState

    const nextRenderedElement = inst.render() as Element
    RscReconciler.receiveComponent(this._renderedComponent, nextRenderedElement)

    this._rendering = false
  }

  private _processPendingState() {
    const inst = this._instance
    let nextState = inst.state
    for (const partialState of this._pendingRscPartialState) {
      if (typeof partialState === 'function') {
        nextState = partialState(nextState)
      } else {
        Object.assign(nextState, partialState)
      }
    }
    this._pendingRscPartialState = []
    return nextState
  }

  /* 修改setState的处理逻辑 */
  private injectRscSetState(ctx: Ctx) {
    const inst: any = this._instance
    if (inst.setState) {
      inst.setState = rscSetState
    }
  }
}

function rscSetState(this: PublicComponent, partialState: any) {
  const internalComponent = RscInstanceMap.get(this)
  internalComponent._pendingRscPartialState.push(partialState)
  RscReconciler.receiveComponent(internalComponent, internalComponent._currentElement)
}

function drawRootComponent(element: JSX.Element, ctx: Ctx) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponentWrapper(wrapperElement)
  const markup = RscReconciler.mountComponent(componentInstance, ctx)
  ctx.__rscComponentInstance = componentInstance
  // 存放ctx到markup的对应关系, 这样下次渲染的时候可以找到上次渲染的结果
  return markup
}

function updateRootComponent(prevComponent: InternalComponent, nextElement: Element) {
  RscReconciler.receiveComponent(prevComponent, nextElement)
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx) {
    const prevComponentInstance = ctx.__rscComponentInstance
    if (prevComponentInstance == null) {
      console.log('clearing canvas...')
      // 直接清除已经绘制的图形
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // 清除上一次绘制结果之后, 我们直接进行本次绘制
      return drawRootComponent(element, ctx)
    } else {
      return updateRootComponent(prevComponentInstance, element)
    }
  },
}

export default Rsc
