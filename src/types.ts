import * as React from 'react'

declare global {
  interface CanvasRenderingContext2D {
    fill(path2d: Path2D): void
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
