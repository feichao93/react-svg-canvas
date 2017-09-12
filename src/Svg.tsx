import * as React from 'react'
import rsc from './rsc'
import Ctx from './ctx'

interface P {
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  viewBox?: string
}

export default class Svg extends React.Component<P> {
  private ctx: Ctx = null

  refFn = (node: HTMLCanvasElement) => {
    this.ctx = Ctx(node.getContext('2d'))
  }

  componentDidMount() {
    const contextFromReact = (this as any)._reactInternalInstance._context
    const transform = this.calculateTransform()
    rsc.draw(
      <g role="rsc-svg" transform={transform}>{this.props.children}</g>,
      this.ctx,
      contextFromReact,
    )
  }

  componentWillReceiveProps(nextProps: any, nextContext: any) {
    /* TODO BUG context的变化可能 无法传递到react-svg-canvas内 */
    const transform = this.calculateTransform()
    rsc.draw(
      <g role="rsc-svg" transform={transform}>{nextProps.children}</g>,
      this.ctx,
    )
  }

  shouldComponentUpdate() {
    return false
  }

  componentWillUnmount() {
    console.log('Svg will-unmount')
    rsc.draw(null, this.ctx)
  }

  calculateTransform() {
    const { width, height, viewBox = `0 0 ${width} ${height}` } = this.props
    const [vx, vy, vw, vh] = viewBox.split(/ +/g).map(Number)
    const scale = width / vw
    return `translate(${vx},${vy})scale(${scale})`
  }

  render() {
    const { width, height, className, style = {} } = this.props

    return (
      <canvas
        ref={this.refFn}
        className={className}
        style={style}
        width={width}
        height={height}
      />
    )
  }
}
