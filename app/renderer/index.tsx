import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Editor } from './Editor'


const render = (Component) => {
  ReactDOM.render(
    <Component />,
    document.getElementById('root')
  )
}

render(Editor)
