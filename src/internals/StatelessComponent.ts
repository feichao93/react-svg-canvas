import RscInstanceMap from './RscInstanceMap'

export default class StatelessComponent {
  render(this: PublicComponent) {
    const Component = RscInstanceMap.get(this)._currentElement.type as React.SFC
    return Component(this.props)
  }
}
