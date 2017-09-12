import { ClipPathFn } from '../types'

export default class ClipPathFnArrayBuilder {
  private readonly array: ClipPathFn[] = []
  private cntFn: ClipPathFn = null

  get() {
    this.flush()
    return this.array
  }

  // 多次rect可以连续调用
  rect(x: number, y: number, w: number, h: number) {
    if (this.cntFn == null) {
      this.cntFn = ctx => {
        ctx.beginPath()
        ctx.rect(x, y, w, h)
      }
    } else {
      const oldfn = this.cntFn
      const newfn: ClipPathFn = ctx => {
        oldfn(ctx)
        ctx.rect(x, y, w, h)
      }
      this.cntFn = newfn
    }
  }

  // 一个path只能调用一次
  path(d: string) {
    this.flush()
    this.array.push(ctx => ctx.clip(new Path2D(d as any)))
  }

  private flush() {
    if (this.cntFn != null) {
      const fn = this.cntFn

      this.array.push(ctx => {
        fn(ctx)
        ctx.clip()
      })
      this.cntFn = null
    }
  }
}
