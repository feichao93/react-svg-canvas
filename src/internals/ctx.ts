import { SetStateCallback, ClipPathFn } from '../types'
import { RscCompositeComponent } from '../internalComponents'
import { noop, defaultClipPathId } from './constants'

interface StackItem {
  fillIsNone: boolean
  strokeIsNone: boolean
  visible: boolean
}

class CanvasRenderingContext2DWrapper {
  readonly renderingContext2D: CanvasRenderingContext2D
  private stack: StackItem[] = []
  readonly clipPathMap = new Map<string, ClipPathFn[]>()

  // fill === 'none'
  fillIsNone = false
  // stroke === 'none'
  strokeIsNone = true
  // style.visibility === 'hidden' || style.display === 'none'
  visible = true

  rscRootComponentInstance: RscCompositeComponent = null
  redrawScheduled = false
  pendingSetStateCallbacks: SetStateCallback[] = []

  constructor(renderingContext2D: CanvasRenderingContext2D) {
    this.renderingContext2D = renderingContext2D
    this.clipPathMap.set(defaultClipPathId, [noop])
  }

  save() {
    this.renderingContext2D.save()
    this.stack.push({
      fillIsNone: this.fillIsNone,
      strokeIsNone: this.strokeIsNone,
      visible: this.visible,
    })
  }

  restore() {
    this.renderingContext2D.restore()
    const top = this.stack.pop()
    this.fillIsNone = top.fillIsNone
    this.strokeIsNone = top.strokeIsNone
    this.visible = top.visible
  }
}

type Ctx = CanvasRenderingContext2DWrapper & CanvasRenderingContext2D

function Ctx(renderingContext2D: CanvasRenderingContext2D): Ctx {
  return new Proxy(new CanvasRenderingContext2DWrapper(renderingContext2D), {
    get(target, p) {
      if (p === 'fillStyle') {
        if (target.fillIsNone || !target.visible) {
          return false
        }
      } else if (p === 'strokeStyle') {
        if (target.strokeIsNone || !target.visible) {
          return false
        }
      }
      if (p in target) {
        const value = Reflect.get(target, p)
        if (typeof value === 'function') {
          return value.bind(target)
        } else {
          return value
        }
      } else {
        const value = Reflect.get(target.renderingContext2D, p)
        if (typeof value === 'function') {
          return value.bind(target.renderingContext2D)
        } else {
          return value
        }
      }
    },

    set(target, p, value) {
      let useReflectSet = true
      if (p === 'fillStyle') {
        if (value === 'none') {
          target.fillIsNone = true
          useReflectSet = false
        } else {
          target.fillIsNone = false
        }
      } else if (p === 'strokeStyle') {
        if (value === 'none') {
          target.strokeIsNone = true
          useReflectSet = false
        } else {
          target.strokeIsNone = false
        }
      }
      if (useReflectSet) {
        if (p in target) {
          Reflect.set(target, p, value)
        } else {
          Reflect.set(target.renderingContext2D, p, value)
        }
      }
      return true
    },
  }) as any
}

export default Ctx
