import * as React from 'react'
import * as drawing from './drawing'
import {
  ComponentClass as PublicComponentClass,
  Component as PublicComponent,
} from 'react'
import { parseSvgTransform } from './utils'

type Element = JSX.Element
type SetStateCallback = () => void

declare module 'react' {
  interface Component {
    __rscInternalInstance: RscCompositeComponentWrapper
  }
}

declare global {
  interface CanvasRenderingContext2D {
    __rscComponentInstance: RscCompositeComponentWrapper
    __redrawScheduled: boolean
    __pendingSetStateCallbacks: SetStateCallback[]
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
  unmountComponent(internalInstance: InternalComponent) {
    internalInstance.unmountComponent()
  },
}

function instantiateRscComponent(element: Element): InternalComponent {
  if (typeof element.type === 'string') {
    return new RscDOMComponent(element)
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponentWrapper(element)
  }
}

function shouldUpdateRscComponent(prevElement: Element, nextElement: Element) {
  // 在Rsc里面, element都是object, 我们判断一下type和key属性是否相等就可以决定是'更新'/'卸载/重新装载'组件了
  return prevElement.type === nextElement.type
    && prevElement.key === nextElement.key
}

interface Markup {
  markup: boolean
}

interface InternalComponent {
  ctx: Ctx
  _currentElement: Element
  mountComponent(ctx: Ctx): Markup
  receiveComponent(nextElement: JSX.Element): void
  unmountComponent(): void
  draw(): void
}

class RscDOMComponent implements InternalComponent {
  ctx: Ctx = null
  _currentElement: Element
  /* SFC */
  _renderedChildren: InternalComponent[] = []

  constructor(element: Element) {
    this._currentElement = element
  }

  draw() {
    const ctx = this.ctx
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

    this._renderedChildren.forEach(child => child.draw())

    ctx.restore()
  }

  mountComponent(ctx: Ctx) {
    this.ctx = ctx
    const element = this._currentElement

    if (element.props.children) {
      const children = React.Children.toArray(element.props.children) as Element[]

      children.forEach(childElement => {
        const child = instantiateRscComponent(childElement)
        child.mountComponent(ctx)
        this._renderedChildren.push(child)
      })
    }

    /* 返回一个代表mount结果的值 */
    return { markup: true }
  }

  receiveComponent(nextElement: JSX.Element) {
    const prevElement = this._currentElement
    this._currentElement = nextElement

    const prevChildElements = React.Children.toArray(prevElement.props.children) as Element[]

    const prevRenderedComponentByKey: { [key: string]: InternalComponent } = {}
    for (const prevRenderedComponent of this._renderedChildren) {
      prevRenderedComponentByKey[prevRenderedComponent._currentElement.key] = prevRenderedComponent
    }

    const nextChildElements = React.Children.toArray(nextElement.props.children) as Element[]

    const nextRenderedChildren: InternalComponent[] = []

    for (const nextChildElement of nextChildElements) {
      const prevChildComponent = prevRenderedComponentByKey[nextChildElement.key]
      if (prevChildComponent != null) {
        RscReconciler.receiveComponent(prevChildComponent, nextChildElement)
        nextRenderedChildren.push(prevChildComponent)
      } else {
        const newChildComponent = instantiateRscComponent(nextChildElement)
        RscReconciler.mountComponent(newChildComponent, this.ctx)
        nextRenderedChildren.push(newChildComponent)
      }
    }
    const nextChildrenKeySet = new Set(nextChildElements.map(element => element.key))
    for (const prevChildElement of prevChildElements) {
      if (!nextChildrenKeySet.has(prevChildElement.key)) {
        RscReconciler.unmountComponent(prevRenderedComponentByKey[prevChildElement.key])
      }
    }

    this._renderedChildren = nextRenderedChildren
  }

  unmountComponent() {
    this._renderedChildren.forEach(child => child.unmountComponent())

    this._currentElement = null
    this._renderedChildren = null
    this.ctx = null
    // 等待root重新绘制
  }
}

class RscCompositeComponentWrapper implements InternalComponent {
  ctx: Ctx = null
  _pendingRscPartialState: any[] = []
  _currentElement: Element
  _renderedComponent: InternalComponent
  _instance: PublicComponent

  constructor(element: Element) {
    this._currentElement = element
  }

  draw() {
    this._renderedComponent.draw()
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

    const renderedElement = inst.render() as Element
    const child = instantiateRscComponent(renderedElement)
    this._renderedComponent = child

    const markup = RscReconciler.mountComponent(child, ctx)

    if (inst.componentDidMount) {
      inst.componentDidMount()
    }

    this.injectRscSetState(ctx)

    return markup
  }

  receiveComponent(nextElement: Element) {
    const prevElement = this._currentElement
    this.updateComponent(prevElement, nextElement)
  }

  private updateComponent(prevElement: Element, nextElement: Element) {
    const inst = this._instance

    const prevProps = prevElement.props
    const prevState = Object.assign({}, inst.state)
    const prevContext = inst.context

    const nextProps = nextElement.props
    const nextContext = null as null /* TODO 实现context相关机制 */

    const willReceive = prevElement !== nextElement
    if (willReceive && inst.componentWillReceiveProps) {
      console.warn('In react-svg-canvas, calling `setState` in `shouldComponentUpdate` will trigger a re-render because I have not implement it...')
      inst.componentWillReceiveProps(nextProps, null)
    }

    // 注意:  这里不需要shouldComponentUpdate  canvas都是进行重新绘制的
    if (inst.shouldComponentUpdate) {
      console.warn('In react-svg-canvas, lifecycle method `shouldComponentUpdate` is skipped')
    }

    const nextState = this._processPendingState()

    this._currentElement = nextElement
    inst.props = nextProps
    inst.state = nextState

    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext)
    }

    const prevRenderedComponent = this._renderedComponent
    const nextRenderedElement = inst.render() as Element
    if (shouldUpdateRscComponent(prevRenderedComponent._currentElement, nextRenderedElement)) {
      RscReconciler.receiveComponent(this._renderedComponent, nextRenderedElement)
      if (inst.componentDidUpdate) {
        inst.componentDidUpdate(prevProps, prevState, prevContext)
      }
    } else {
      // 已经是不同的两个东西了, 需要进行重新渲染
      RscReconciler.unmountComponent(this._renderedComponent)
      const nextChild = instantiateRscComponent(nextElement)
      this._renderedComponent = nextChild
      RscReconciler.mountComponent(nextChild, this.ctx)
    }
  }

  unmountComponent() {
    this._renderedComponent.unmountComponent()
    const inst = this._instance
    if (inst.componentWillUnmount) {
      inst.componentWillUnmount()
    }

    this._currentElement = null
    this._instance = null
    this._pendingRscPartialState = null
    this._renderedComponent = null
    this.ctx = null
    // 等待root重新绘制
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

function rscSetState(this: PublicComponent, partialState: any, callback: () => void) {
  const internalComponent = RscInstanceMap.get(this)
  internalComponent._pendingRscPartialState.push(partialState)
  RscReconciler.receiveComponent(internalComponent, internalComponent._currentElement)
  schedualRedrawRootComponent(internalComponent, callback)
}

function mountRootComponent(element: JSX.Element, ctx: Ctx) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponentWrapper(wrapperElement)
  const markup = RscReconciler.mountComponent(componentInstance, ctx)
  ctx.__rscComponentInstance = componentInstance
  // 存放ctx到markup的对应关系, 这样下次渲染的时候可以找到上次渲染的结果
  schedualRedrawRootComponent(componentInstance)
  return markup
}

function updateRootComponent(prevComponent: InternalComponent, nextElement: Element) {
  RscReconciler.receiveComponent(prevComponent, nextElement)
}

function schedualRedrawRootComponent(componentInstance: InternalComponent, callback?: SetStateCallback) {
  const ctx = componentInstance.ctx
  if (callback) {
    ctx.__pendingSetStateCallbacks.push(callback)
  }
  if (!ctx.__redrawScheduled) {
    ctx.__redrawScheduled = true
    if (componentInstance) {
      Promise.resolve().then(() => {
        const ctx = componentInstance.ctx
        // console.log('clearing canvas...')
        // 直接清除已经绘制的图形
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        componentInstance.draw()
        ctx.__redrawScheduled = false
        const callbacks = ctx.__pendingSetStateCallbacks
        ctx.__pendingSetStateCallbacks = []
        if (callbacks) {
          callbacks.forEach(cb => cb())
        }
      })
    }
  }
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx) {
    const prevComponentInstance = ctx.__rscComponentInstance
    if (prevComponentInstance == null) {
      return mountRootComponent(element, ctx)
    } else {
      return updateRootComponent(prevComponentInstance, element)
    }
  },
}

export default Rsc
