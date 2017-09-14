import * as React from 'react'
import { RscDOMComponent } from './index'
import Ctx from '../internals/ctx'
import instantiateRscComponent from '../internals/instantiateRscComponent'
import RscReconciler from '../internals/RscReconciler'

export default class RscPatternComponent extends RscDOMComponent {
  draw() {
    const ctx = this.ctx
    const element = this._currentElement

    const patternId: string = element.props.id
    if (patternId == null) {
      throw new Error('<pattern /> must have an id property')
    }

    const image = document.createElement('canvas')
    image.width = element.props.width
    image.height = element.props.height
    const children = element.props.children

    const internalInstance = instantiateRscComponent(
      React.createElement('g', null, children)
    )
    RscReconciler.mountComponent(
      internalInstance,
      Ctx(image.getContext('2d')),
      null,
    )
    internalInstance.draw()

    // 这里已经提前绘制了image, 如果后面使用的时候对image进行缩放, image会变模糊
    // TODO 如果将image的绘制延迟到pattern使用时, 就可以保证缩放时不会模糊
    ctx.patternMap.set(`url(#${patternId})`, ctx => {
      const pat = ctx.createPattern(image, 'repeat')
      ctx.fillStyle = pat
    })
  }
}
