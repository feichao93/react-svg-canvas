import * as React from 'react'
import { SetStateCallback } from './types'
import Ctx from './internals/ctx'
import TopLevelWrapper from './internals/TopLevelWrapper'
import RscReconciler from './internals/RscReconciler'
import { InternalComponent, RscCompositeComponent } from './internalComponents'

function mountRootComponent(element: JSX.Element, ctx: Ctx, initContext: any) {
  const wrapperElement = React.createElement(TopLevelWrapper, null, element)
  const componentInstance = new RscCompositeComponent(wrapperElement)
  RscReconciler.mountComponent(componentInstance, ctx, initContext)
  // 将compnentInstance放在ctx.__rscRootComponentInstance中, 下次重新更新/重新加载的时候可以找到上次渲染的结果
  ctx.rscRootComponentInstance = componentInstance
  scheduleRedrawRootComponent(componentInstance)
}

function updateRootComponent(component: RscCompositeComponent, element: JSX.Element, initContext: any) {
  RscReconciler.receiveComponent(
    component,
    React.createElement(TopLevelWrapper, null, element),
    initContext,
  )
  scheduleRedrawRootComponent(component)
}

export function scheduleRedrawRootComponent(componentInstance: InternalComponent, callback?: SetStateCallback) {
  const ctx = componentInstance.ctx
  if (callback) {
    ctx.pendingSetStateCallbacks = ctx.pendingSetStateCallbacks || []
    ctx.pendingSetStateCallbacks.push(callback)
  }
  if (!ctx.redrawScheduled) {
    ctx.redrawScheduled = true

    const reconciliationTask = () => {
      // 清除已经绘制的图形
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      const rootComponent = ctx.rscRootComponentInstance
      RscReconciler.receiveComponent(
        rootComponent,
        rootComponent._currentElement,
        rootComponent._context,
      )
      rootComponent.draw()

      ctx.redrawScheduled = false
      const callbacks = ctx.pendingSetStateCallbacks
      ctx.pendingSetStateCallbacks = null
      if (callbacks) {
        callbacks.forEach(cb => cb())
      }
    }
    requestAnimationFrame(reconciliationTask)
  }
}

const Rsc = {
  draw(element: JSX.Element, ctx: Ctx, initContext?: any) {
    const prevRootComponent = ctx.rscRootComponentInstance
    if (prevRootComponent == null) {
      mountRootComponent(element, ctx, initContext || {})
    } else {
      updateRootComponent(prevRootComponent, element, initContext || prevRootComponent._context)
    }
  },
}

export default Rsc
