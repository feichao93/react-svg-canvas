import * as React from 'react'
import rsc from './rsc'

interface P {
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  viewBox?: string
}

export default class Svg extends React.Component<P> {
  private ctx: CanvasRenderingContext2D = null

  refFn = (node: HTMLCanvasElement) => this.ctx = node.getContext('2d')

  componentDidMount() {
    console.log('Svg did-mount')

    const contextFromReact = (this as any)._reactInternalInstance._context
    rsc.draw(<g>{this.props.children}</g>, this.ctx, contextFromReact)
  }

  componentWillReceiveProps(nextProps: any, nextContext: any) {
    /* TODO BUG context的变化可能 无法传递到react-svg-canvas内 */
    rsc.draw(<g>{nextProps.children}</g>, this.ctx)
  }

  shouldComponentUpdate() {
    return false
  }

  componentWillUnmount() {
    console.log('Svg will-unmount')
    rsc.draw(null, this.ctx)
  }

  render() {
    const { width, height, className, style = {}, viewBox = `0 0 ${width} ${height}` } = this.props
    console.log('view-box:', viewBox)
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
