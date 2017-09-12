import Ctx from './ctx'
import { InternalComponent } from '../internalComponents/index'

const RscReconciler = {
  mountComponent(internalInstance: InternalComponent, ctx: Ctx, context: any) {
    internalInstance.mountComponent(ctx, context)
  },
  receiveComponent(internalInstance: InternalComponent, nextElement: JSX.Element, nextContext: any) {
    internalInstance.receiveComponent(nextElement, nextContext)
  },
  unmountComponent(internalInstance: InternalComponent) {
    internalInstance.unmountComponent()
  },
}

export default RscReconciler

