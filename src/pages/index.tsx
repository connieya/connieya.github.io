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
          저는 협업을 방해하는 구조적 문제를 정의하고 개선하는 백엔드 개발자입니다.
          <br />
          <br />
          교통 결제 시스템과 카드 브랜드사 연동을 경험하며, 단순한 기능 구현을 넘어
          운영 안정성을 고려한 설계에 집중합니다. 외부 시스템의 장애를 통제할 수
          없어도 내부로 전파되지 않도록 타임아웃 설정과 서킷 브레이커를 적용하며,
          시스템 안정성을 지키는 역할을 수행해왔습니다.
          <br />
          <br />
          레거시 CLI 기반 테스트 환경을 GUI로 전환해 팀의 협업 효율을 높인 경험이
          있습니다. 명령어를 몰라도 누구나 테스트할 수 있는 환경을 만드는 과정에서,
          기술이 팀의 생산성을 높일 수 있다는 것을 배웠습니다. 또한 10년이 넘은
          레거시 인증 서버를 리팩토링하며 전략 패턴과 템플릿 메소드 패턴을 적용해
          수백 라인의 중복 코드를 제거하고, 더 유연하고 유지보수하기 좋은 구조로
          개선한 경험이 있습니다.
          <br />
          <br />
          프론트엔드 리소스가 부족한 상황에서 고객사 데모 일정이 임박했을 때,
          Cursor AI 유료 모델 도입을 주도하여 1주일 만에 어드민 웹을 성공적으로
          구축한 경험이 있습니다. 이후 .cursorrules 파일에 팀의 개발 컨벤션을
          명시하여 AI가 생성하는 코드가 기존 구조와 일관성을 유지하도록 했고,
          이 경험을 팀 전체에 확산시켜 모든 팀원이 활용하게 되었습니다. 제한된
          리소스와 시간이라는 제약 속에서도 적절한 도구를 선택하고 활용하여
          목표를 달성하는 것의 중요성을 배웠고, 개인의 개선 노력이 팀 전체의
          생산성 향상으로 이어질 수 있다는 것을 경험했습니다.
          <br />
          <br />
          새로운 지식과 기술을 실무에 적용하며 성장하는 과정에서 큰 보람을 느끼고,
          더 나은 개발 환경과 구조를 만드는 데 기여하고 싶습니다.
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
