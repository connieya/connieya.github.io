import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import { PostHeadInfoProps } from './PostHeadInfo'
import COLORS from 'utils/constant/colors'
import { usePostViews } from '../../hooks/usePostViews'

type PostHeadProps = PostHeadInfoProps & {
  slug: string
}

const PostHead: FunctionComponent<PostHeadProps> = function ({
  title,
  date,
  timeToRead,
  slug,
}) {
  const { viewCount, loading } = usePostViews(slug, title)
  return (
    <Container>
      <Title>{title}</Title>
      <CreatedAtContainer>
        <CreatedAt>
          {date}
          <TimeInfo>약 {timeToRead}분</TimeInfo>
        </CreatedAt>
        {!loading && <ViewCount>{viewCount.toLocaleString()}회 조회</ViewCount>}
      </CreatedAtContainer>
    </Container>
  )
}

export default PostHead

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2.5rem 1rem 2rem; /* 상단, 좌우, 하단 패딩 */
  max-width: 768px; /* 콘텐츠 최대 너비 제한 (가운데 정렬) */
  margin: 0 auto; /* 가운데 정렬 */

  @media (max-width: 768px) {
    padding: 2rem 0.75rem 1.5rem; /* 모바일 패딩 조정 (이전 3rem에서 2rem으로) */
  }
`

const Title = styled.h1`
  word-break: keep-all;
  line-height: 1.3; /* 제목 줄 간격 조정 (이전 1.4에서 1.3으로) */
  font-size: 1.9rem; /* 제목 크기 키우기 (이전 1.6rem에서 2.2rem으로) */
  margin-bottom: 1.3rem; /* 제목 아래 여백 (이전 1.5rem에서 1rem으로) */

  @media (max-width: 768px) {
    font-size: 1.8rem; /* 모바일 제목 크기 조정 (이전 2rem에서 1.8rem으로) */
    margin-bottom: 0.8rem; /* 모바일 제목 아래 여백 (이전 1rem에서 0.8rem으로) */
  }
`

// 카테고리 관련 컨테이너 이름 및 스타일 변경
const CreatedAtContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: ${COLORS.GRAY_BOLD};
  font-size: 0.9rem; /* 날짜 폰트 사이즈 유지 */

  @media (max-width: 768px) {
    justify-content: flex-start; /* 모바일에서는 좌측 정렬 */
  }
`

const CreatedAt = styled.div`
  white-space: nowrap; /* 날짜 줄바꿈 방지 */
`

const TimeInfo = styled.span`
  margin-left: 0.5rem; /* 왼쪽에 0.5rem (약 8px) 간격 추가 */
  /* 또는 padding-left를 사용할 수도 있습니다. */
  /* padding-left: 0.5rem; */
`

const ViewCount = styled.span`
  margin-left: 1rem;
  font-size: 0.9rem;
`
