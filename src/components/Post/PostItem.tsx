import React, { FunctionComponent } from 'react'
import { navigate } from 'gatsby'
import styled from '@emotion/styled'
import { Link } from 'gatsby'
import { PostFrontMatterType } from 'components/types/PostItem.types'
import { GatsbyImage } from 'gatsby-plugin-image'
import CategoryListItem from './CategoryListItem'

type PostItemProps = PostFrontMatterType & { link: string }

const PostItem: FunctionComponent<PostItemProps> = function ({
  title,
  date,
  categories,
  summary,
  //   thumbnail: { publicURL },
  link,
}) {
  const handleClick = () => {
    navigate(link)
  }
  return (
    <Container to={link}>
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
      <ThumbnailContainer onClick={handleClick}>
        <ThumbnailImage src={''} alt="Post Item Image" />
      </ThumbnailContainer>
    </Container>
  )
}

export default PostItem

const Container = styled(Link)`
  display: flex;
  justify-content: space-between;
  padding: 2rem 0;
  border-bottom: 1px solid #757575;
  transition: all 0.1s ease-out;

  &:first-of-type {
    border-top: 1px solid #757575;
  }
`

const ThumbnailImage = styled(GatsbyImage)`
  width: 100%;
  height: 200px;
  border-radius: 10px 10px 0 0;
`

const TextInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100% - 200px);
  padding-right: 1rem;
`
const Title = styled.h3`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const CategoriesContainer = styled.div``

const Description = styled.div`
  /* stylelint-disable-next-line value-no-vendor-prefix */
  display: -webkit-box;
  overflow: hidden;
  color: #757575;
  text-overflow: ellipsis;
  word-break: keep-all;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const ThumbnailContainer = styled.div`
  display: flex;
  align-items: center;
  width: 200px;
  height: 200px;
`

const CreatedAtAndTimeToReadContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding-top: 1rem;
  color: #757575;
`

const CreatedAt = styled.span`
  font-size: 14px;
  white-space: nowrap;
`
