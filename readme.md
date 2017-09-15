# react-svg-canvas

## 主要目标

用Canvas来渲染react生成的svg, 并尽量保持和svg的兼容性. react-svg-canvas有许多限制(见下方). 主要是为了作为[battle-city](https://github.com/shinima/battle-city)的一个渲染器.

## 用法

react-svg-canvas的用法非常简单, 导入`Svg`组件, 并替换原先的`svg`即可(注意大小写).

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

react-svg-canvas支持用off-screen pre-rendering机制对渲染进行优化.

## 限制

1. react-svg-canvas没有事件机制.
2. react-svg-canvas只能处理一部分svg标签和属性, 以下是目前支持的功能:
   * 对g标签, rect标签, path标签的基本支持
   * 对fill属性, stroke属性, transform属性的基本支持
   * style.visibility='hidden' 与 style.display='none'
   * 支持clipPath标签与clipPath属性, 允许rect和path作为clipPath (因为大部分浏览器没有实现Path2D#addPath方法, 所以这里的实现效率很低, 尽量避免以path为clipPath的情况)
   * 支持pattern标签和fill=url(#some-pattern-id)  (仅支持patternUnits="userSpaceOnUse"的pattern)
3. 使用react-svg-canvas渲染的组件只能使用`setState`来修改组件的state, 无法使用`replaceState`.
4. 使用Svg组件时, 必须指定width和height属性
5. react-svg-canvas对多次setState调用进行了batch. 因为使用了requestAnimationFrame, 导致setState触发的reconciliation task需要在下一个动画帧才执行. 所以基于react-svg-canvas的交互会有一定的延迟, react-svg-canvas更适合网页游戏.

## 优势(其实并没有什么优势)

react-svg-canvas比较适合用来渲染网页游戏, 相比于SVG, react-svg-canvas可以获取更稳定的帧率. 通过offScreen优化, react-svg-canvas也往往会比直接用DOM快一些.

## 其他

react-svg-canvas实现了一套简单的virtual dom, 并将React element翻译为canvas绘制API的调用. 每当virtual dom发生变化时, react-svg-canvas会处理组件的更新/加载/卸载, 并重新绘制canvas.
