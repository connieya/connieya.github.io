import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'

const FooterWrapper = styled.div`
  display: grid;
  place-items: center;
  margin-top: auto;
  padding: 50px 0;
  font-size: 15px;
  color: #aaa;
  font-weight: bold;
  text-align: center;
  line-height: 1.5;
  background-color: #f0f0f0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`

const Footer: FunctionComponent = function () {
  return (
    <FooterWrapper>
      <br />© 2023 박건희 Powered By Gatsby.
    </FooterWrapper>
  )
}

export default Footer
