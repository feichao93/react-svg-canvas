import * as React from 'react'
import { ComponentClass } from 'react'
import { parseSvgTransform } from './utils'

type Element = JSX.Element
type Ctx = CanvasRenderingContext2D

class TopLevelWrapper extends React.Component {
  render() {
    return React.Children.only(this.props.children)
  }
}

function transformMatrix(ctx: Ctx, m: Matrix) {
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
}

const RscReconciler = {
  mountComponent(internalInstance: InternalComponent, ctx: Ctx) {
    return internalInstance.mountComponent(ctx)
  },
  // receiveComponent(internalInstance: InternalComponent, nextElement: Element) {
  //   internalInstance.receiveComponent(nextElement)
  // },
  // performUpdateIfNecessary(internalInstance: InternalComponent) {
  //   internalInstance.performUpdateIfNecessary()
  // },
}

interface InternalComponent {
  _currentElement: Element
  mountComponent(ctx: Ctx): void
  /* TODO */ receiveComponent(nextElement: JSX.Element): void
  /* TODO */ performUpdateIfNecessary(): void
}

class RscCompositeComponentWrapper implements InternalComponent {
  _currentElement: Element
  _renderedComponent: InternalComponent
  _instance: ComponentClass

  constructor(element: Element) {
    this._currentElement = element
  }

  mountComponent(ctx: Ctx) {
    const Component = this._currentElement.type as ComponentClass
    const componentInstance = new Component(this._currentElement.props)
    this._instance
  }

  receiveComponent(nextElement: Element) { }

  performUpdateIfNecessary() { }
}

function drawRootComponent(element: JSX.Element, ctx: Ctx) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponentWrapper(wrapperElement)
  // const markup = RscReconciler
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx) {
    // 直接清除已经绘制的图形
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // 清除上一次绘制结果之后, 我们直接进行本次绘制
    drawRootComponent(element, ctx)

    ctx.save()
    if (element.type === 'rect') {
      const props: React.SVGProps<SVGRectElement> = element.props
      const x = Number(props.x) || 0
      const y = Number(props.y) || 0
      const w = Number(props.width)
      const h = Number(props.height)
      if (props.fill) {
        ctx.fillStyle = props.fill
      }
      if (props.fill !== 'none') {
        ctx.fillRect(x, y, w, h)
      }

      if (props.stroke) {
        ctx.strokeStyle = props.stroke
      }
      if (props.stroke && props.stroke !== 'none') {
        ctx.strokeRect(x, y, w, h)
      }
    } else if (element.type === 'g') {
      const props: React.SVGProps<SVGGElement> = element.props
      const svgMatrix = parseSvgTransform(props.transform)

      transformMatrix(ctx, svgMatrix)
      React.Children.forEach(element.props.children,
        (child: JSX.Element) => Rsc.draw(child, ctx))
    } else if (element.type === 'path') {
      const props: React.SVGProps<SVGGElement> = element.props

      if (props.fill) {
        ctx.fillStyle = props.fill
      }
      ctx.fill(new Path2D(props.d as any))
    } else if (typeof element.type === 'function') {
      if (element.type.prototype instanceof React.Component) {
        // this.draw(element.type.prototype.render.call(element))
        // !!!! TODO !!!!
        Rsc.draw((element as any)._owner._instance.render(), ctx)
      } else {
        // stateless function component
        Rsc.draw((element.type as React.SFC)(element.props), ctx)
      }
    } else {
      console.warn('unknown element', element)
    }
    ctx.restore()
  },
}

export default Rsc

