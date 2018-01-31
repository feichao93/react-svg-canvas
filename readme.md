# react-svg-canvas (EXPERIMENTAL)

## 主要目标

用 Canvas 来渲染 react 生成的 svg, 并尽量保持和 svg 的兼容性. react-svg-canvas 有许多限制（见下方）。react-svg-canvas 主要是为了作为[battle-city](https://github.com/shinima/battle-city)的一个渲染器。

## 在线版本

目前在[这里](http://shinima.pw/react-svg-canvas/)部署的是 \_\_tests\_\_ 文件夹中的内容。注意网页[同时使用 SVG 和 Canvas 渲染了 React 组件](https://github.com/shinima/react-svg-canvas/blob/dd4583d573aa69852a58524d693690aa7942cd9a/src/__tests__/render.tsx#L8)。更复杂的用例请见 battle-city 的 [rsc 分支](https://github.com/shinima/battle-city/tree/rsc)。

## 用法

react-svg-canvas 的用法非常简单, 导入 `Svg` 组件, 并替换原先的 `svg` 即可（注意大小写）.

```javascript
import { Svg } from 'react-svg-canvas'

function render() {
  return (
    // <svg width={100} height={200} viewBox="0 0 50 100">
    //   {/* content of svg */}
    // </svg>
    <Svg width={100} height={200} viewBox="0 0 50 100">
      {/* content of svg */}
    </Svg>
  )
}
```

react-svg-canvas 支持用 off-screen pre-rendering 机制对渲染进行优化，用法详见 [battle-city rsc 分支代码](https://github.com/shinima/battle-city/blob/rsc/app/components/BrickWall.tsx#L10)

## 限制

1. react-svg-canvas 没有事件机制.
2. react-svg-canvas 只能处理一部分 svg 标签和属性, 以下是目前支持的功能:
   * 对 g 标签, rect 标签, path 标签的基本支持
   * 对 fill 属性, stroke 属性, transform 属性的基本支持
   * style.visibility='hidden' 与 style.display='none'
   * 支持 clipPath 标签与 clipPath 属性, 允许 rect 和 path 作为 clipPath (因为大部分浏览器没有实现 Path2D#addPath 方法, 所以这里的实现效率很低, 尽量避免以 path 为 clipPath 的情况)
   * 支持 pattern 标签和 fill=url(#some-pattern-id) (仅支持 patternUnits="userSpaceOnUse"的 pattern)
3. 使用 react-svg-canvas 渲染的组件只能使用 `setState` 来修改组件的 state, 无法使用 `replaceState`.
4. 使用 Svg 组件时, 必须指定 width 和 height 属性
5. react-svg-canvas 对多次 setState 调用进行了 batch. 因为使用了 requestAnimationFrame, 导致 setState 触发的 reconciliation task 需要在下一个动画帧才执行. 所以基于 react-svg-canvas 的交互会有一定的延迟, react-svg-canvas 更适合网页游戏.

## 优势（其实并没有什么优势）

react-svg-canvas 比较适合用来渲染网页游戏, 相比于 SVG, react-svg-canvas 可以获取更稳定的帧率. 通过 offScreen 优化, react-svg-canvas 也往往会比直接用 DOM 快一些.

## 其他

react-svg-canvas 实现了一套简单的 virtual dom, 并将 React element 翻译为 canvas 绘制 API 的调用. 每当 virtual dom 发生变化时, react-svg-canvas 会处理组件的更新/加载/卸载, 并重新绘制 canvas.
