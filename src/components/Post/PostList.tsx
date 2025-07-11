import React, { FunctionComponent, useMemo } from 'react'
import styled from '@emotion/styled'
import { PostListItemType } from 'components/types/PostItem.types'
import PostItem from './PostItem'

export type PostType = {
  node: {
    id: string
    frontmatter: {
      title: string
      summary: string
      date: string
      timeToRead: number
      categories: string[]
      thumbnail: {
        publicURL: string
      }
    }
  }
}

type PostListProps = {
  posts: PostType[]
}

const Container = styled.div`
  display: grid;
  width: 780px;
  margin: 0 auto;
  padding: 40px 0 100px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    width: 100%;
    padding: 50px 20px;
  }
`

const PostListContainer = styled.div``

const PostList: FunctionComponent<PostListProps> = function ({ posts }) {
  return (
    <Container>
      <PostListContainer>
        {posts.map(
          ({
            node: {
              id,
              fields: { slug },
              timeToRead,
              frontmatter,
            },
          }: PostListItemType) => (
            <PostItem
              {...frontmatter}
              link={slug}
              key={id}
              timeToRead={timeToRead}
            />
          ),
        )}
      </PostListContainer>
    </Container>
  )
}

export default PostList
