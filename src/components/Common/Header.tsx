import styled from '@emotion/styled'
import React from 'react'
import { Link } from 'gatsby'
import {
  AiFillGithub,
  //   AiOutlineInstagram,
  AiFillLinkedin,
} from 'react-icons/ai'
const Header = () => {
  return (
    <Container>
      <TextWrapper to="/">박건희</TextWrapper>
      <Menu>
        <a href="https://github.com/connieya" target="_blank" rel="noreferrer">
          <AiFillGithub />
        </a>
        {/* <a href="#" target="_blank">
          <AiOutlineInstagram />
        </a> */}
        <a
          href="https://www.linkedin.com/in/%EA%B1%B4%ED%9D%AC-%EB%B0%95-6ab959238/"
          target="_blank"
          rel="noreferrer"
        >
          <AiFillLinkedin />
        </a>
      </Menu>
    </Container>
  )
}

export default Header

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 80px;
  );
`

const TextWrapper = styled(Link)`
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
  color: inherit;
`

const Menu = styled.div`
  display: flex;
  gap: 15px;
  font-size: 25px;

  & > a {
    display: flex;
    color: initial;
  }

  @media (max-width: 768px) {
    font-size: 20px;
  }
`
