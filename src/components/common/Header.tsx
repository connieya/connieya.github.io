import { Link } from 'gatsby'
import styled from 'styled-components'
import {
  AiFillGithub,
  //   AiOutlineInstagram,
  AiFillLinkedin,
} from 'react-icons/ai'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
`

const Title = styled(Link)`
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

export default function Header() {
  return (
    <Wrapper>
      <Title to="/">GeonHee Park</Title>

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
    </Wrapper>
  )
}
