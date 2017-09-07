import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Svg from '../Svg'

const div1 = document.querySelector('#div-1')
const div2 = document.querySelector('#div-2')

export default function render(element: JSX.Element) {
  ReactDOM.render(
    <Svg width={800} height={400}>
      {element}
    </Svg>,
    div1,
  )

  ReactDOM.render(
    <svg width={800} height={400}>
      {element}
    </svg>,
    div2,
  )
}
