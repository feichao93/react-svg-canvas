import './preloaded'
import * as React from 'react'
import * as drawing from './drawing'
import {
  ComponentClass as PublicComponentClass,
  Component as PublicComponent,
} from 'react'
import { parseSvgTransform } from './utils'

type Element = JSX.Element
type SetStateCallback = () => void

const emptyObject = {}

declare module 'react' {
  interface Component {
    __rscInternalInstance: RscCompositeComponent
  }
}

declare global {
  interface CanvasRenderingContext2D {
    __rscRootComponentInstance: RscCompositeComponent
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
  set(key: PublicComponent, value: RscCompositeComponent) {
    key.__rscInternalInstance = value
  },
  get(key: PublicComponent) {
    return key.__rscInternalInstance
  },
}

function transformMatrix(ctx: Ctx, m: SvgTransformMatrix) {
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

const RscReconciler = {
  mountComponent(internalInstance: InternalComponent, ctx: Ctx, context: any) {
    return internalInstance.mountComponent(ctx, context)
  },
  receiveComponent(internalInstance: InternalComponent, nextElement: Element, nextContext: any) {
    internalInstance.receiveComponent(nextElement, nextContext)
  },
  unmountComponent(internalInstance: InternalComponent) {
    internalInstance.unmountComponent()
  },
}

function warnIfHasShouldComponentUpdate(component: PublicComponent) {
  // 注意: Rsc不需要shouldComponentUpdate  canvas都是进行重新绘制的
  if (component.shouldComponentUpdate) {
    console.warn('In react-svg-canvas, lifecycle method `shouldComponentUpdate` is skipped')
  }
}

function instantiateRscComponent(element: Element): InternalComponent {
  if (element == null) {
    return new RscEmptyComponent(element)
  } else if (typeof element.type === 'string') {
    return new RscDOMComponent(element)
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponent(element)
  } else {
    console.warn('Rsc only accecpts null/SVG or components that renders null/SVG, other elements will be ignored.')
    return new RscEmptyComponent(element)
  }
}

/** 判断从prevElement到nextElement是否可以通过"更新"的方式进行转变
 * 该函数返回false代表着 我们需要卸载原来的组件, 然后加载新的组件
 * 注意在Rsc里面, element都是null或object, 不会出现number或string的情况
 */
function shouldUpdateRscComponent(prevElement: Element, nextElement: Element) {
  if (prevElement != null && nextElement != null) {
    return prevElement.type === nextElement.type
      && prevElement.key === nextElement.key
  } else {
    return false
  }
}

interface Markup {
  markup: boolean
}

interface InternalComponent {
  ctx: Ctx
  _currentElement: Element
  mountComponent(ctx: Ctx, context: any): Markup
  receiveComponent(nextElement: JSX.Element, nextContext: any): void
  unmountComponent(): void
  draw(): void
}

class RscEmptyComponent implements InternalComponent {
  ctx: Ctx = null
  _currentElement: Element

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx, context: any): Markup {
    console.log('mount-empty-component')
    this.ctx = ctx
    return { markup: true }
  }

  receiveComponent(nextElement: JSX.Element, nextContext: any) {
    this._currentElement = nextElement
  }

  unmountComponent() {
    this.ctx = null
    this._currentElement = null
  }
  draw() {
  }
}

class RscDOMComponent implements InternalComponent {
  ctx: Ctx = null
  _currentElement: Element
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

  mountComponent(ctx: Ctx, context: any) {
    this.ctx = ctx
    const element = this._currentElement

    const children = React.Children.toArray(element.props.children) as Element[]

    children.forEach(childElement => {
      const child = instantiateRscComponent(childElement)
      child.mountComponent(ctx, context)
      this._renderedChildren.push(child)
    })

    /* 返回一个代表mount结果的值 */
    return { markup: true }
  }

  receiveComponent(nextElement: JSX.Element, nextContext: any) {
    const prevElement = this._currentElement
    this._currentElement = nextElement

    const prevRenderedComponentByKey: { [key: string]: InternalComponent } = {}
    for (const prevRenderedComponent of this._renderedChildren) {
      prevRenderedComponentByKey[prevRenderedComponent._currentElement.key] = prevRenderedComponent
    }

    /** reusedComponentSet用来记录哪些internal-instance被复用了 */
    const reusedComponentSet = new Set<InternalComponent>()
    const nextChildElements = React.Children.toArray(nextElement.props.children) as Element[]

    const nextRenderedChildren: InternalComponent[] = []

    for (const nextChildElement of nextChildElements) {
      const prevChildComponent = prevRenderedComponentByKey[nextChildElement.key]
      if (prevChildComponent && shouldUpdateRscComponent(prevChildComponent._currentElement, nextChildElement)) {
        RscReconciler.receiveComponent(prevChildComponent, nextChildElement, nextContext)
        nextRenderedChildren.push(prevChildComponent)
        reusedComponentSet.add(prevChildComponent)
      } else {
        const newChildComponent = instantiateRscComponent(nextChildElement)
        RscReconciler.mountComponent(newChildComponent, this.ctx, nextContext)
        nextRenderedChildren.push(newChildComponent)
      }
    }

    for (const prevRenderedComponent of this._renderedChildren) {
      if (!reusedComponentSet.has(prevRenderedComponent)) {
        RscReconciler.unmountComponent(prevRenderedComponent)
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

class RscCompositeComponent implements InternalComponent {
  ctx: Ctx = null
  _context: any = null
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

    const renderedElement = inst.render() as Element
    const child = instantiateRscComponent(renderedElement)
    this._renderedComponent = child

    const markup = RscReconciler.mountComponent(child, ctx, this.processChildContext(context))

    if (inst.componentDidMount) {
      inst.componentDidMount()
    }

    this.injectRscUpdaters()

    return markup
  }

  receiveComponent(nextElement: Element, nextContext: any) {
    const prevElement = this._currentElement
    const prevContext = this._context
    this.updateComponent(prevElement, nextElement, prevContext, nextContext)
  }

  private updateComponent(
    prevElement: Element,
    nextElement: Element,
    prevUnmaskedContext: any,
    nextUnmaskedContext: any,
  ) {
    const inst = this._instance
    warnIfHasShouldComponentUpdate(inst)

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
      console.warn('In react-svg-canvas, calling `setState` in `shouldComponentUpdate`'
        + ' will trigger a re-render because I have not implement it...')
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
    const nextRenderedElement = inst.render() as Element
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
      const nextChild = instantiateRscComponent(nextElement)
      this._renderedComponent = nextChild
      RscReconciler.mountComponent(
        nextChild,
        this.ctx,
        this.processChildContext(this._context),
      )
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
      return emptyObject
    }
    const maskedContext: any = {}
    for (const contextName in contextTypes) {
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

/** 用于代替React的setState函数
 *  该setState会调用receiveComponent来更新自己的state以及其子孙节点的props/state
 *  然后调用scheduleRedrawRootComponent触发canvas的重新绘制 */
function rscSetState(this: PublicComponent, partialState: any, callback: () => void) {
  // TODO 这里根本就没有对setState做优化 0_0
  const internalComponent = RscInstanceMap.get(this)
  internalComponent._pendingRscPartialState.push(partialState)
  RscReconciler.receiveComponent(
    internalComponent,
    internalComponent._currentElement,
    internalComponent._context,
  )
  scheduleRedrawRootComponent(internalComponent, callback)
}

function mountRootComponent(element: JSX.Element, ctx: Ctx, initContext: any) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponent(wrapperElement)
  const markup = RscReconciler.mountComponent(componentInstance, ctx, initContext)
  ctx.__rscRootComponentInstance = componentInstance
  // 存放ctx到markup的对应关系, 这样下次渲染的时候可以找到上次渲染的结果
  scheduleRedrawRootComponent(componentInstance)
  return markup
}

function scheduleRedrawRootComponent(componentInstance: InternalComponent, callback?: SetStateCallback) {
  const ctx = componentInstance.ctx
  if (callback) {
    ctx.__pendingSetStateCallbacks = ctx.__pendingSetStateCallbacks || []
    ctx.__pendingSetStateCallbacks.push(callback)
  }
  if (!ctx.__redrawScheduled) {
    ctx.__redrawScheduled = true

    Promise.resolve().then(() => {
      // 清除已经绘制的图形
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      ctx.__rscRootComponentInstance.draw()
      ctx.__redrawScheduled = false
      const callbacks = ctx.__pendingSetStateCallbacks
      ctx.__pendingSetStateCallbacks = null
      if (callbacks) {
        callbacks.forEach(cb => cb())
      }
    })
  }
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx, initContext: any = emptyObject) {
    const prevComponentInstance = ctx.__rscRootComponentInstance
    if (prevComponentInstance == null) {
      return mountRootComponent(element, ctx, initContext)
    } else {
      // update root component
      // todo ?这里context传递正确么?
      RscReconciler.receiveComponent(
        prevComponentInstance,
        element,
        initContext || prevComponentInstance._context,
      )
    }
  },
}

export default Rsc
