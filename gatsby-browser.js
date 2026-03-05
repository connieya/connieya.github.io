import React from 'react'
import 'prismjs/themes/prism-tomorrow.css'
import { ThemeProvider } from './src/context/ThemeContext'

export const wrapRootElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}
