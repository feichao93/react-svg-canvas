import * as React from 'react'
import Ctx from './internals/ctx'

declare global {
  interface CanvasRenderingContext2D {
    fill(path2d: Path2D): void
    clip(path2d: Path2D, fillRule?: CanvasFillRule): void
  }

  type PublicComponent = React.Component
  type PublicComponentClass = React.ComponentClass
}

declare module 'react' {
  function createElement(type: 'offscreen', props: {
    inst: PublicComponent,
    Component: PublicComponentClass
  }): JSX.Element;
}

export interface SetStateCallback {
  (): void
}

export interface ClipPathFn {
  (ctx: Ctx): void
}

export interface PatternFn {
  (ctx: Ctx): void
}
