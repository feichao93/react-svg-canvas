import * as React from 'react'
import * as drawing from '../internals/drawing'
import RscReconciler from '../internals/RscReconciler'
import instantiateRscComponent from '../internals/instantiateRscComponent'
import Ctx from '../internals/ctx'
import processProps from '../internals/processProps'
import shouldUpdateRscComponent from '../internals/shouldUpdateRscComponent'
import ClipPathFnArrayBuilder from '../internals/ClipPathFnArrayBuilder'
import { defaultClipPathId } from '../internals/constants'
import { InternalComponent } from './index'

export default class RscDOMComponent implements InternalComponent {
  ctx: Ctx
  _currentElement: JSX.Element
  _parentComponent: InternalComponent
  _renderedChildren: InternalComponent[] = []

  constructor(element: JSX.Element) {
    this._currentElement = element
  }

  draw() {
    const ctx = this.ctx
    const element = this._currentElement

    const clipPathId = element.props.clipPath || defaultClipPathId
    const clipPathFnArray = ctx.clipPathMap.get(clipPathId)
    ctx.save()
    processProps(ctx, element)
    const needSaveRestore = clipPathFnArray.length > 1
    for (const clipPathFn of clipPathFnArray) {
      needSaveRestore && ctx.save()
      clipPathFn(ctx)
      drawing.draw(ctx, element)
      this._renderedChildren.forEach(child => child.draw())
      needSaveRestore && ctx.restore()
    }
    ctx.restore()
  }

  buildClipPathFnArray(builder: ClipPathFnArrayBuilder) {
    const element = this._currentElement
    if (element.type === 'rect') {
      const x = Number(element.props.x) || 0
      const y = Number(element.props.y) || 0
      const w = Number(element.props.width)
      const h = Number(element.props.height)
      builder.rect(x, y, w, h)
    } else if (element.type === 'path') {
      builder.path(element.props.d)
    }
  }

  mountComponent(ctx: Ctx, context: any) {
    this.ctx = ctx
    const element = this._currentElement

    const children = React.Children.toArray(element.props.children) as JSX.Element[]

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
    const nextChildElements = React.Children.toArray(nextElement.props.children) as JSX.Element[]

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
