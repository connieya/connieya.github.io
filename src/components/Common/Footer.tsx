import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import { AiFillGithub } from 'react-icons/ai'

const Footer: FunctionComponent = function () {
  const currentYear = new Date().getFullYear()
  return (
    <FooterWrapper>
      <Divider />
      <FooterContent>
        <Copyright>&copy; {currentYear} 박건희</Copyright>
        <IconLinks>
          <a href="https://github.com/connieya" target="_blank" rel="noreferrer" aria-label="GitHub">
            <AiFillGithub />
          </a>
        </IconLinks>
      </FooterContent>
    </FooterWrapper>
  )
}

export default Footer

const FooterWrapper = styled.footer`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1rem 2rem;

  @media (max-width: 768px) {
    padding: 0 0.75rem 1.5rem;
  }
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
`

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Copyright = styled.span`
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const IconLinks = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 1.25rem;

  a {
    display: flex;
    color: var(--color-text-muted);
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-accent);
    }
  }
`
