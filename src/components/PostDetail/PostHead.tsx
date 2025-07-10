import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import PostHeadInfo, { PostHeadInfoProps } from './PostHeadInfo'
import COLORS from 'utils/constant/colors'
import CategoryListItem from 'components/Post/CategoryListItem'

type PostHeadProps = PostHeadInfoProps & {}

const PostHead: FunctionComponent<PostHeadProps> = function ({
  title,
  date,
  categories,
}) {
  return (
    <Container>
      <Title>{title}</Title>
      <CategoriesCreatedAtContainer>
        <CategoriesAndTimeToReadContainer>
          {categories.map(category => (
            <CategoryListItem category={category} key={category} />
          ))}
        </CategoriesAndTimeToReadContainer>
        <CreatedAt>{date}</CreatedAt>
      </CategoriesCreatedAtContainer>
    </Container>
  )
}

export default PostHead

const Container = styled.div`
  display: flex;
  flex-direction: column;
  /* 썸네일이 없어지면서 상단 여백 및 좌우 패딩 추가 */
  padding: 2.5rem 1rem 2rem; /* 상단, 좌우, 하단 패딩 */
  max-width: 768px; /* 콘텐츠 최대 너비 제한 (가운데 정렬) */
  margin: 0 auto; /* 가운데 정렬 */

  @media (max-width: 768px) {
    padding: 3rem 0.75rem 1.5rem; /* 모바일 패딩 조정 */
  }
`

const Title = styled.h1`
  word-break: keep-all;
  line-height: 1.4; /* 제목 줄 간격 조정 */
  font-size: 1.6rem; /* 제목 크기 키우기 */
  margin-bottom: 1rem; /* 제목 아래 여백 */

  @media (max-width: 768px) {
    font-size: 2rem; /* 모바일 제목 크기 조정 */
    margin-bottom: 1rem;
  }
`

const CategoriesCreatedAtContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${COLORS.GRAY_BOLD};
  font-size: 0.9rem; /* 날짜/카테고리 폰트 사이즈 조정 */

  @media (max-width: 768px) {
    flex-direction: column; /* 모바일에서는 세로로 정렬 */
    align-items: flex-start; /* 왼쪽 정렬 */
    gap: 0.5rem; /* 요소 간 간격 */
  }
`

const CategoriesAndTimeToReadContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 카테고리가 많을 경우 줄바꿈 */
  gap: 0.5rem; /* 카테고리 아이템 간 간격 */
`

const CreatedAt = styled.div`
  white-space: nowrap; /* 날짜 줄바꿈 방지 */
`
