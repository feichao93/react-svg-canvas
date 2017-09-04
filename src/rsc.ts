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
    __feactInternalInstance: RscCompositeComponentWrapper
  }
}

class TopLevelWrapper extends React.Component {
  render() {
    return React.Children.only(this.props.children)
  }
}

const RscInstanceMap = {
  set(key: PublicComponent, value: RscCompositeComponentWrapper) {
    key.__feactInternalInstance = value
  },
  get(key: PublicComponent) {
    return key.__feactInternalInstance
  },
}

function transformMatrix(ctx: Ctx, m: Matrix) {
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

const RscReconciler = {
  mountComponent(internalInstance: InternalComponentClass, ctx: Ctx) {
    return internalInstance.mountComponent(ctx)
  },
  // receiveComponent(internalInstance: InternalComponent, nextElement: Element) {
  //   internalInstance.receiveComponent(nextElement)
  // },
  // performUpdateIfNecessary(internalInstance: InternalComponent) {
  //   internalInstance.performUpdateIfNecessary()
  // },
}

function instantiateRscComponent(element: Element): InternalComponentClass {
  if (typeof element.type === 'string') {
    return new RscDOMComponent(element)
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponentWrapper(element)
  }
}


interface InternalComponentClass {
  _currentElement: Element
  mountComponent(ctx: Ctx): void
  /* TODO */ receiveComponent(nextElement: JSX.Element): void
  /* TODO */ performUpdateIfNecessary(): void
}

class RscDOMComponent implements InternalComponentClass {
  _currentElement: Element
  /* SFC */
  _renderedChildren: InternalComponentClass[] = []

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx) {
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


  /* TODO */ receiveComponent(nextElement: JSX.Element) { }
  /* TODO */ performUpdateIfNecessary() { }
}

class RscCompositeComponentWrapper implements InternalComponentClass {
  _currentElement: Element
  _renderedComponent: InternalComponentClass
  _instance: PublicComponent

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx) {
    const Component = this._currentElement.type as PublicComponentClass
      ; /TODO/
      ; /考虑stateless component的情况/
    const componentInstance = new Component(this._currentElement.props)
    this._instance = componentInstance

    RscInstanceMap.set(componentInstance, this)

    const markup = this.performInitialMount(ctx)
  }

  receiveComponent(nextElement: Element) { }

  performUpdateIfNecessary() { }

  performInitialMount(ctx: Ctx) {
    const inst = this._instance
    if (inst.componentWillMount) {
      inst.componentWillMount()
    }
    const renderedElement = inst.render() as Element
    const child = instantiateRscComponent(renderedElement)
    this._renderedComponent = child

    return RscReconciler.mountComponent(child, ctx)
  }
}

function drawRootComponent(element: JSX.Element, ctx: Ctx) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponentWrapper(wrapperElement)
  const markup = RscReconciler.mountComponent(componentInstance, ctx)
  // 存放ctx到markup的对应关系, 这样下次渲染的时候可以找到上次渲染的结果
  return markup
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx) {
    // 直接清除已经绘制的图形
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // 清除上一次绘制结果之后, 我们直接进行本次绘制
    // debugger
    drawRootComponent(element, ctx)
  },
}

export default Rsc

