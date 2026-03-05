import React from 'react'
import styled from '@emotion/styled'
import { Link } from 'gatsby'
import { PostFrontMatterType } from 'components/types/PostItem.types'

type Props = PostFrontMatterType & {
  link: string
  timeToRead: number
}

const PostItem = ({ date, title, link, timeToRead }: Props) => {
  return (
    <Container to={link}>
      <Title>{title}</Title>
      <Meta>
        {date} · 약 {timeToRead}분
      </Meta>
    </Container>
  )
}

export default PostItem

const Container = styled(Link)`
  display: block;
  padding: 1rem 0;
`

const Title = styled.h3`
  font-size: 1.2rem;
  line-height: 1.4;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.35rem;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`

const Meta = styled.span`
  font-size: 0.85rem;
  color: var(--color-text-muted);
`
