import * as React from 'react'
import * as ReactDOM from 'react-dom'
import render from './render'
import TestMovingBrickWalls from './tests/TestMovingBrickWalls'
import TestBrickWallZoomIn from './tests/TestBrickWallZoomIn'
import TestBasicClipPath from './tests/TestBasicClipPath'
import TestBasicPattern from './tests/TestBasicPattern'

const div1 = document.querySelector('#div-1')
const div2 = document.querySelector('#div-2')
for (const div of [div1, div2]) {
  ReactDOM.render(
    <p style={{ margin: 0, paddingTop: 96, fontSize: 32, textAlign: 'center' }}>
      Click button on the right to start a test.
    </p>,
    div,
  )
}

const testsMap: { [key: string]: React.ComponentClass } = {
  TestMovingBrickWalls,
  TestBrickWallZoomIn,
  TestBasicClipPath,
  TestBasicPattern,
}

const buttonContainer = document.querySelector('.buttons') as HTMLDivElement
Object.keys(testsMap).map(key => {
  const button = document.createElement('button')
  button.textContent = key
  button.addEventListener('click', () => {
    render(null)
    render(React.createElement(testsMap[key]))
  })
  buttonContainer.appendChild(button)
})
