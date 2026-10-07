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
          복잡한 도메인을 운영 가능한 시스템으로 만드는 <strong>3년차 백엔드
          개발자</strong>입니다.
          <br />
          <br />
          스노우온카드에서는 교통 결제 요금 처리 서버와 Apple Pay 토큰 시스템을
          설계했습니다. 무신사에서는 SCM 조달 도메인(OTB 예산·공급률·발주·입고)을
          설계부터 BE·FE 구현, 운영 배포까지 맡았습니다.
          <br />
          Temporal saga와 Kafka 콜백으로 물류 파이프라인을 무중단 전환했고,
          AI 기반 E2E QA 자동화 대시보드를 단독 개발했습니다.
          <br />
          <br />
          DDD와 Clean Architecture로 도메인 불변식을 코드에 담고, 외부 장애가
          내부로 전파되지 않는 경계를 설계합니다.
          <br />
          AI를 개발의 기본 도구로 활용하는 <strong>AI Native Engineer</strong>를
          지향합니다. 코드 이해·구현·QA의 속도를 높이되, 도메인 규칙과 데이터
          정합성은 직접 설계하고 검증합니다.
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
