import { RscDOMComponent } from './index'
import ClipPathFnArrayBuilder from '../internals/ClipPathFnArrayBuilder'

export default class RscClipPathComponent extends RscDOMComponent {
  draw() {
    const ctx = this.ctx
    const element = this._currentElement

    const clipPathId: string = element.props.id
    if (clipPathId == null) {
      throw new Error('<clipPath /> needs an id')
    }

    const builder = new ClipPathFnArrayBuilder()
    this._renderedChildren.forEach(child => {
      child.buildClipPathFnArray(builder)
    })
    ctx.clipPathMap.set(`url(#${clipPathId})`, builder.get())
  }
}
