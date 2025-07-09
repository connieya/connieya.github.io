import React from 'react'
import { navigate } from 'gatsby'
import styled from '@emotion/styled'
import { Link } from 'gatsby'
import { PostFrontMatterType } from 'components/types/PostItem.types'
import CategoryListItem from './CategoryListItem'

type Props = PostFrontMatterType & { link: string }

const PostItem = ({ categories, date, summary, title, link }: Props) => {
  const handleClick = () => {
    navigate(link)
  }
  return (
    <Container to={link}>
      {/* 텍스트 정보 컨테이너가 이제 전체 공간을 사용 */}
      <TextInfoContainer>
        <CategoriesContainer>
          {categories?.map(category => (
            <CategoryListItem key={category} category={category} />
          ))}
        </CategoriesContainer>
        <Title onClick={handleClick}>{title}</Title>
        <Description>{summary}</Description>
        <CreatedAtAndTimeToReadContainer>
          <CreatedAt>{date}</CreatedAt>
        </CreatedAtAndTimeToReadContainer>
      </TextInfoContainer>
    </Container>
  )
}

export default PostItem

const Container = styled(Link)`
  display: block; /* Flexbox 대신 블록 요소로 변경 */
  padding: 2rem 0;

  transition: all 0.1s ease-out;

  &:first-of-type {
    border-top: 1px solid #757575;
  }
`

const TextInfoContainer = styled.div`
  /* 썸네일 제거로 인한 width 100% */
  width: 100%;
  padding: 0 1rem; /* 좌우 패딩으로 내용물 여백 확보 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* 모바일 환경에서 패딩 조정 */
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`
const Title = styled.h3`
  margin-top: 0.5rem; /* 카테고리 아래 여백 */
  margin-bottom: 0.5rem; /* 설명 위 여백 */
  font-size: 1.3rem; /* 제목 크기 키우기 */
  line-height: 1.3; /* 줄 간격 조정 */
  word-break: keep-all; /* 단어 단위 줄바꿈 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 제목이 길 경우 두 줄까지 표시 */
  -webkit-box-orient: vertical;
  cursor: pointer; /* Link 컴포넌트가 아닌 H3 자체에도 cursor: pointer 유지 */

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`

const CategoriesContainer = styled.div`
  display: flex; /* 카테고리 아이템이 가로로 나열되도록 */
  flex-wrap: wrap; /* 공간 부족 시 다음 줄로 넘어가도록 */
  gap: 0.2rem; /* 카테고리 아이템 간 간격 */
  margin-bottom: 0.5rem; /* 제목 위 여백 */
`

const Description = styled.div`
  /* stylelint-disable-next-line value-no-vendor-prefix */
  display: -webkit-box;
  overflow: hidden;
  color: #757575;
  text-overflow: ellipsis;
  word-break: keep-all;
  -webkit-line-clamp: 3; /* 설명을 2줄에서 3줄로 늘려 정보량 확보 */
  -webkit-box-orient: vertical;
  margin-bottom: 1rem; /* 생성일 위 여백 */
`

const CreatedAtAndTimeToReadContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding-top: 0.5rem; /* 상단 여백 조금 줄이기 */
  color: #757575;
  font-size: 14px; /* CreatedAt 폰트 사이즈 통합 */
`

const CreatedAt = styled.span`
  white-space: nowrap;
`
