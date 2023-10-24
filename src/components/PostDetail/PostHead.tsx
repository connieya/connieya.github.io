import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image'
import PostHeadInfo, { PostHeadInfoProps } from './PostHeadInfo'
import COLORS from 'utils/constant/colors'
import CategoryListItem from 'components/Post/CategoryListItem'

type GatsbyImgProps = {
  image: IGatsbyImageData
  alt: string
  className?: string
}

type PostHeadProps = PostHeadInfoProps & {
  thumbnail: IGatsbyImageData
}

const PostHeadWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;

  @media (max-width: 768px) {
    height: 300px;
  }
`

const BackgroundImage = styled((props: GatsbyImgProps) => (
  <GatsbyImage {...props} style={{ position: 'absolute' }} />
))`
  z-index: -1;
  width: 100%;
  height: 400px;
  object-fit: cover;
  filter: brightness(0.25);

  @media (max-width: 768px) {
    height: 300px;
  }
`

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
`

const CategoriesCreatedAtContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${COLORS.GRAY_BOLD};
`

const Title = styled.h1`
  word-break: keep-all;
`

const CategoriesAndTimeToReadContainer = styled.div`
  display: flex;
  align-items: center;
`

const CreatedAt = styled.div``
