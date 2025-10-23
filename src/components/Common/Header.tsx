import styled from '@emotion/styled'
import React from 'react'
import { Link } from 'gatsby'

const Header = () => {
  return (
    <Container>
      <ContentContainer>
        <NavigationContainer>
          <MainLink to="/">
            <MainText>박건희</MainText>
          </MainLink>
          <SubLink to="/blog">
            <SubText>개발</SubText>
          </SubLink>
        </NavigationContainer>
      </ContentContainer>
    </Container>
  )
}

export default Header

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 7rem;
`

const ContentContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
`

const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`

const MainLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`

const SubLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`

const MainText = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    Segoe UI,
    Roboto,
    Helvetica Neue,
    Arial,
    Noto Sans,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji';
`

const SubText = styled.span`
  font-size: 1.1rem;
  font-weight: 400;
  color: #666;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    Segoe UI,
    Roboto,
    Helvetica Neue,
    Arial,
    Noto Sans,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji';
`
