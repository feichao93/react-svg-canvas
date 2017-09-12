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


export default function renderInst(inst: PublicComponent, Component: PublicComponentClass) {
  const useOffScreenCanvas = Boolean((Component as any).offScreen)
  if (useOffScreenCanvas) {
    constructOffScreenCanvasIfNeeded(Component)
    return React.createElement('offscreen', { inst, Component })
  } else {
    return inst.render() as JSX.Element
  }
}
