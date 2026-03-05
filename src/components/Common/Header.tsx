import styled from '@emotion/styled'
import React from 'react'
import { Link } from 'gatsby'
import { useTheme } from 'context/ThemeContext'

const Header = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Container>
      <ContentContainer>
        <NavigationContainer>
          <NavLeft>
            <MainLink to="/">
              <MainText>박건희</MainText>
            </MainLink>
            <SubLink to="/blog">
              <SubText>개발</SubText>
            </SubLink>
          </NavLeft>
          <ThemeToggle
            onClick={toggleTheme}
            aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </ThemeToggle>
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
  border-bottom: 1px solid var(--color-border);
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
  justify-content: space-between;
`

const NavLeft = styled.div`
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
  color: var(--color-text-tertiary);
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

const ThemeToggle = styled.button`
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }
`
