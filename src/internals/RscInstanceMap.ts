import RscCompositeComponent from '../internalComponents/RscCompositeComponent'

/** external-instance到internal-instance映射 */
const RscInstanceMap = {
  set(key: PublicComponent, value: RscCompositeComponent) {
    (key as any).__rscInternalInstance = value
  },
  get(key: PublicComponent) {
    return (key as any).__rscInternalInstance
  },
}

export default RscInstanceMap
