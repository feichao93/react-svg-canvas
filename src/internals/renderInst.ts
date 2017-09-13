import * as React from 'react'
import Ctx from './ctx'
import RscReconciler from './RscReconciler'
import instantiateRscComponent from './instantiateRscComponent'

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
    const offScreenContentElement = tempInst.render() as JSX.Element

    const internalInstance = instantiateRscComponent(offScreenContentElement)
    RscReconciler.mountComponent(
      internalInstance,
      Ctx(offScreenCanvas.getContext('2d')),
      null,
    )
    internalInstance.draw()
    Component._offScreenCanvas = offScreenCanvas
  }
}

/** 调用inst.render()的方法来获得renderedElement
 * 如果组件启用了off-screen pre-rendering, 则会返回一个type='offscreen'的element
 * 这将导致后续调用instantiateRscComponent时会返回一个RscOffScreenComponent, 该组件的draw会执行off-screen rendering
 */
export default function renderInst(inst: PublicComponent, Component: PublicComponentClass) {
  const useOffScreenCanvas = Boolean((Component as any).offScreen)
  if (useOffScreenCanvas) {
    constructOffScreenCanvasIfNeeded(Component)
    return React.createElement('offscreen', { inst, Component })
  } else {
    return inst.render() as JSX.Element
  }
}
