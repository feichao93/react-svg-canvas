import RscInstanceMap from './RscInstanceMap'
import { scheduleRedrawRootComponent } from '../rsc'

/** 用于代替React的setState函数
 *  该setState会调用会将partialState放到_pendingRscPartialState的队列尾部
 *  并调用scheduleRedrawRootComponent异步触发canvas的重新绘制 */
export default function rscSetState(this: PublicComponent, partialState: any, callback: () => void) {
  const internalComponent = RscInstanceMap.get(this)
  // 这里将partialState放到队列中, 在下一次队列flush的时候, 这些partialState才会真正反映到组件上
  internalComponent._pendingRscPartialState.push(partialState)
  scheduleRedrawRootComponent(internalComponent, callback)
}
