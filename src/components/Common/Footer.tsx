import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import {
  AiFillGithub,
  //   AiOutlineInstagram,
  AiFillLinkedin,
} from 'react-icons/ai'

const FooterWrapper = styled.div`
  display: grid;
  place-items: center;
  margin-top: 40px;
  padding: 25px 0;
  font-size: 15px;
  color: #aaa;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  background-color: #f0f0f0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`

const Menu = styled.div`
  display: flex;
  gap: 5px;
  font-size: 25px;

  & > a {
    display: flex;
    color: inherit; /* a 태그의 기본 색상 제거 (아이콘 색상 적용 위함) */
  }

  @media (max-width: 768px) {
    font-size: 20px;
  }
`

const Footer: FunctionComponent = function () {
  const currentYear = new Date().getFullYear()
  return (
    <FooterWrapper>
      © {currentYear} 박건희
      {/* <Menu>
        <a href="https://github.com/connieya" target="_blank" rel="noreferrer">
          <AiFillGithub />
        </a>
        <a href="#" target="_blank">
                 <AiOutlineInstagram />
               </a>
        <a
          href="https://www.linkedin.com/in/%EA%B1%B4%ED%9D%AC-%EB%B0%95-6ab959238/"
          target="_blank"
          rel="noreferrer"
        >
          <AiFillLinkedin />
        </a>
      </Menu> */}
    </FooterWrapper>
  )
}

export default Footer
