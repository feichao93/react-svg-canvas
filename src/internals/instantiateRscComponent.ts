import {
  InternalComponent,
  RscCompositeComponent,
  RscDefsComponent,
  RscDOMComponent,
  RscClipPathComponent,
  RscEmptyComponent,
  RscOffScreenComponent,
} from '../internalComponents'

export default function instantiateRscComponent(element: JSX.Element): InternalComponent {
  if (element == null) {
    return new RscEmptyComponent(element)
  } else if (typeof element.type === 'string') {
    if (element.type === 'offscreen') {
      return new RscOffScreenComponent(element)
    } else if (element.type === 'defs') {
      return new RscDefsComponent(element)
    } else if (element.type === 'clipPath') {
      return new RscClipPathComponent(element)
    } else {
      return new RscDOMComponent(element)
    }
  } else if (typeof element.type === 'function') {
    return new RscCompositeComponent(element)
  } else {
    // console.warn('Rsc only accecpts null/SVG or components that renders null/SVG, other elements will be ignored.')
    return new RscEmptyComponent(element)
  }
}
