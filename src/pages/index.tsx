import React from 'react'
import { graphql } from 'gatsby'
import styled from '@emotion/styled'
import Template from 'components/Common/Template'

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
          오랫동안 개발하고 싶은 사람입니다. 개발자로서 지속적으로 성장하기 위해
          꾸준히 공부하고 있습니다.
          <br />
          <br />
          스트레스를 받을 때면 산책을 자주 하고, 출근 전에 가끔 가볍게 러닝을
          즐깁니다. <br />
          주말에는 한강에서 8km 이상 러닝하며 몸과 마음을 단련하고 있습니다.
          <br />
          <br />
          개발과 러닝 모두 꾸준함이 중요하다고 생각합니다. 매일 조금씩이라도
          앞으로 나아가며, 더 나은 개발자가 되고 싶습니다.
        </Description>
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
  color: #555;
  margin: 0;
  text-align: left;
`
