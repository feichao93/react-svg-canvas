import * as React from 'react'
import {
  ComponentClass as PublicComponentClass,
  Component as PublicComponent,
} from 'react'
import { Ctx, InternalComponent, SetStateCallback } from './types'
import * as drawing from './drawing'
import processProps from './processProps'

type Element = JSX.Element

const emptyObject = {}

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

/** external-instance到internal-instance映射 */
const RscInstanceMap = {
  set(key: PublicComponent, value: RscCompositeComponent) {
    (key as any).__rscInternalInstance = value
  },
  get(key: PublicComponent) {
    return (key as any).__rscInternalInstance
  },
}

const RscReconciler = {
  mountComponent(internalInstance: InternalComponent, ctx: Ctx, context: any) {
    internalInstance.mountComponent(ctx, context)
  },
  receiveComponent(internalInstance: InternalComponent, nextElement: Element, nextContext: any) {
    internalInstance.receiveComponent(nextElement, nextContext)
  },
  unmountComponent(internalInstance: InternalComponent) {
    internalInstance.unmountComponent()
  },
}

function instantiateRscComponent(element: Element): InternalComponent {
  if (element == null) {
    return new RscEmptyComponent(element)
  } else if (typeof element.type === 'string') {
    return new RscDOMComponent(element)
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponent(element)
  } else {
    // console.warn('Rsc only accecpts null/SVG or components that renders null/SVG, other elements will be ignored.')
    return new RscEmptyComponent(element)
  }
}

function constructOffScreenCanvasIfNeeded(Component: any) {
  if (Component.offScreen && Component._offScreenCanvas == null) {
    const { width, height, initProps, initState } = Component.offScreen

    // 生成offScreen内容与offScreenCanvas
    const offScreenCanvas = document.createElement('canvas')
    offScreenCanvas.width = width
    offScreenCanvas.height = height
    const tempInst = new Component(initProps)
    tempInst.props = initProps
    tempInst.state = initState
    const offScreenContentElement = tempInst.render() as Element

    const internalInstance = instantiateRscComponent(offScreenContentElement)
    RscReconciler.mountComponent(
      internalInstance,
      offScreenCanvas.getContext('2d'),
      null,
    )
    internalInstance.draw()
    Component._offScreenCanvas = offScreenCanvas
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

/**
 * 用于进行off-screen-render的组件.
 * 该组件的主要作用在于: 调用RscOffScreenComponent#draw方法时,
 * 该组件会找到对应的参数调用PublicComponent.offScreen.render函数
 */
class RscOffScreenComponent implements InternalComponent {
  ctx: Ctx
  publicComponent: any
  // 在RscOffScreenComponent中_currentElement没用
  _currentElement: Element
  _parentComponent: InternalComponent

  constructor(publicComponent: any) {
    // publicComponent上面存放了我们所需要的数据
    // publicComponent._offScreenCanvas存放了已经绘制好的内容
    // publicComponent.offScreen.render是用户自定的offScreen render方法
    this.publicComponent = publicComponent
  }

  mountComponent(ctx: Ctx, context: any) {
    this.ctx = ctx
  }

  receiveComponent() { }

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

class RscEmptyComponent implements InternalComponent {
  ctx: Ctx
  _currentElement: Element
  _parentComponent: InternalComponent
  constructor(element: Element) { }
  mountComponent() { }
  receiveComponent() { }
  unmountComponent() { }
  draw() { }
}

class RscDOMComponent implements InternalComponent {
  ctx: Ctx
  _currentElement: Element
  _parentComponent: InternalComponent
  _renderedChildren: InternalComponent[] = []

  constructor(element: Element) {
    this._currentElement = element
  }

  draw() {
    const ctx = this.ctx
    const element = this._currentElement

    ctx.save()

    processProps(ctx, element)
    drawing.draw(ctx, element)
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
      child._parentComponent = this
      this._renderedChildren.push(child)
    })
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
        newChildComponent._parentComponent = this
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

export class RscCompositeComponent implements InternalComponent {
  ctx: Ctx = null
  _context: any = null
  _pendingRscPartialState: any[] = []
  _currentElement: Element
  _parentComponent: InternalComponent
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
    const useOffScreenCanvas = (Component as any).offScreen

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

    if (useOffScreenCanvas) {
      constructOffScreenCanvasIfNeeded(Component)
      this._renderedComponent = new RscOffScreenComponent(Component)
    } else {
      const renderedElement = inst.render() as Element
      this._renderedComponent = instantiateRscComponent(renderedElement)
    }

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

  receiveComponent(nextElement: Element, nextContext: any) {
    const prevElement = this._currentElement
    const prevContext = this._context
    this.updateComponent(prevElement, nextElement, prevContext, nextContext)
  }

  private updateComponent(prevElement: Element,
    nextElement: Element,
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
    const useOffScreenCanvas = prevRenderedComponent instanceof RscOffScreenComponent
    if (useOffScreenCanvas) {
      // 如果使用了offScreenCanvas, 那么组件只需要更新就好了
      RscReconciler.receiveComponent(
        prevRenderedComponent,
        nextElement,
        nextContext,
      )
      if (inst.componentDidUpdate) {
        inst.componentDidUpdate(prevProps, prevState, prevContext)
      }
    } else {
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

        this._renderedComponent = instantiateRscComponent(nextElement)
        RscReconciler.mountComponent(
          this._renderedComponent,
          this.ctx,
          this.processChildContext(this._context),
        )
        this._renderedComponent._parentComponent = this
      }
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

/** 用于代替React的setState函数
 *  该setState会调用会将partialState放到_pendingRscPartialState的队列尾部
 *  并调用scheduleRedrawRootComponent异步触发canvas的重新绘制 */
function rscSetState(this: PublicComponent, partialState: any, callback: () => void) {
  const internalComponent = RscInstanceMap.get(this)
  // 这里将partialState放到队列中, 在下一次队列flush的时候, 这些partialState才会真正反映到组件上
  internalComponent._pendingRscPartialState.push(partialState)
  scheduleRedrawRootComponent(internalComponent, callback)
}

function mountRootComponent(element: JSX.Element, ctx: Ctx, initContext: any) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponent(wrapperElement)
  RscReconciler.mountComponent(componentInstance, ctx, initContext)
  // 将compnentInstance放在ctx.__rscRootComponentInstance中, 下次重新更新/重新加载的时候可以找到上次渲染的结果
  ctx.__rscRootComponentInstance = componentInstance
  scheduleRedrawRootComponent(componentInstance)
}

function updateRootComponent(component: RscCompositeComponent, element: Element, initContext: any) {
  RscReconciler.receiveComponent(
    component,
    React.createElement(TopLevelWrapper, null, element),
    initContext,
  )
  scheduleRedrawRootComponent(component)
}

function scheduleRedrawRootComponent(componentInstance: InternalComponent, callback?: SetStateCallback) {
  const ctx = componentInstance.ctx
  if (callback) {
    ctx.__pendingSetStateCallbacks = ctx.__pendingSetStateCallbacks || []
    ctx.__pendingSetStateCallbacks.push(callback)
  }
  if (!ctx.__redrawScheduled) {
    ctx.__redrawScheduled = true

    const reconciliationTask = () => {
      // 清除已经绘制的图形
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      const rootComponent = ctx.__rscRootComponentInstance
      RscReconciler.receiveComponent(
        rootComponent,
        rootComponent._currentElement,
        rootComponent._context,
      )
      rootComponent.draw()

      ctx.__redrawScheduled = false
      const callbacks = ctx.__pendingSetStateCallbacks
      ctx.__pendingSetStateCallbacks = null
      if (callbacks) {
        callbacks.forEach(cb => cb())
      }
    }
    requestAnimationFrame(reconciliationTask)
  }
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx, initContext?: any) {
    const prevRootComponent = ctx.__rscRootComponentInstance
    if (prevRootComponent == null) {
      mountRootComponent(element, ctx, initContext || emptyObject)
    } else {
      updateRootComponent(prevRootComponent, element, initContext || prevRootComponent._context)
    }
  },
}

export default Rsc
