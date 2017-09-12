/** 判断从prevElement到nextElement是否可以通过"更新"的方式进行转变
 * 该函数返回false代表着 我们需要卸载原来的组件, 然后加载新的组件
 * 注意在Rsc里面, element都是null或object, 不会出现number或string的情况
 */
export default function shouldUpdateRscComponent(prevElement: JSX.Element, nextElement: JSX.Element) {
  if (prevElement != null && nextElement != null) {
    return prevElement.type === nextElement.type
      && prevElement.key === nextElement.key
  } else {
    return false
  }
}
