import styled from '@emotion/styled'
import React from 'react'
import { Link } from 'gatsby'
const Header = () => {
  return (
    <Container>
      <TextWrapper to="/">Connieya</TextWrapper>
    </Container>
  )
}

export default Header

const Container = styled.div`
  position: fixed;
  top: 0;
  z-index: 10;
  width: 100%;
  height: 60px;
  background: linear-gradient(
    90deg,
    #423434,
    #988b3f 25%,
    #967950 46%,
    #af7a28 69%,
    #eceb08
  );
`

const TextWrapper = styled(Link)`
  display: flex;
  font-size: 28px;
  padding-top: 6px;
  align-items: center;
  color: #fff;
  font-family: Catamaran;
  font-weight: 800;
  margin-left: 20px;
  opacity: 0.7;
`
