import React from 'react'
import { graphql } from 'gatsby'
import styled from '@emotion/styled'
import Template from 'components/Common/Template'
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai'
import { HiOutlineMail } from 'react-icons/hi'

type Props = {
  data: {
    site: {
      siteMetadata: {
        title: string
        description: string
        siteUrl: string
      }
    }
  }
}

const Home = ({
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
  },
}: Props) => {
  return (
    <Template title={title} description={description} url={siteUrl} image="">
      <ContentContainer>
        <Description>
          결제 시스템과 카드사 연동 인프라를 설계해 온 백엔드 개발자입니다.
          <br />
          <br />
          신한카드 Apple Pay 토큰 시스템에서 4개 브랜드사 간 장애 격리 구조를
          설계했습니다. <br /> Netty 기반 단말 관리 서버에서는 100만 건 규모의
          데이터 동기화 파이프라인을 구현했습니다.
          <br />
          <br />
          시스템 경계를 명확히 정의해 외부 장애가 내부로 전파되지 않는 구조를
          고민합니다. <br />
          불필요한 추상화보다 읽기 쉬운 코드를, 빠른 구현보다 변경에 안전한
          설계를 선호합니다.
        </Description>
        <ContactSection>
          <ContactTitle>Contact</ContactTitle>
          <ContactList>
            <ContactLink href="mailto:gunny6026@gmail.com" aria-label="Email">
              <HiOutlineMail />
              <span>gunny6026@gmail.com</span>
            </ContactLink>
            <ContactLink
              href="https://github.com/connieya"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <AiFillGithub />
              <span>GitHub</span>
            </ContactLink>
            <ContactLink
              href="https://www.linkedin.com/in/%EA%B1%B4%ED%9D%AC-%EB%B0%95-6ab959238/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <AiFillLinkedin />
              <span>LinkedIn</span>
            </ContactLink>
          </ContactList>
        </ContactSection>
      </ContentContainer>
    </Template>
  )
}

export default Home

export const getAboutData = graphql`
  query getAboutData {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
  }
`

const ContentContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 2rem 0.75rem;
  }
`

const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: left;
`

const ContactSection = styled.div`
  margin-top: 2.5rem;
`

const ContactTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
`

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ContactLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
  transition: color 0.2s ease;

  svg {
    font-size: 1.2rem;
  }

  &:hover {
    color: var(--color-accent);
  }
`
