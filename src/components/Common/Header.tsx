import styled from '@emotion/styled'
import React from 'react'

const Header = () => {
  return <Container></Container>
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
