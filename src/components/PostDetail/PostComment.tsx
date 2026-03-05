import styled from '@emotion/styled'
import React, { createRef, useEffect } from 'react'
import { useTheme } from 'context/ThemeContext'

const src = 'https://utteranc.es/client.js'
const repo = 'connieya/connieya.github.io'

type UtterancesAttributesType = {
  src: string
  repo: string
  'issue-term': string
  label: string
  theme: string
  crossorigin: string
  async: string
}

const UtterancesWrapper = styled.div`
  @media (max-width: 768px) {
    padding: 0 20px;
  }
`

const CommentWidget = () => {
  const element = createRef<HTMLDivElement>()
  const { theme } = useTheme()

  useEffect(() => {
    if (element.current === null) return

    const utterancesTheme = theme === 'dark' ? 'github-dark' : 'github-light'

    // Remove existing utterances iframe if any
    const existingIframe = element.current.querySelector('.utterances')
    if (existingIframe) {
      existingIframe.remove()
    }

    const utterances: HTMLScriptElement = document.createElement('script')

    const attributes: UtterancesAttributesType = {
      src,
      repo,
      'issue-term': 'pathname',
      label: 'Comment',
      theme: utterancesTheme,
      crossorigin: 'anonymous',
      async: 'true',
    }

    Object.entries(attributes).forEach(([key, value]) => {
      utterances.setAttribute(key, value)
    })

    element.current.appendChild(utterances)
  }, [theme])

  return <UtterancesWrapper ref={element} />
}

export default CommentWidget
