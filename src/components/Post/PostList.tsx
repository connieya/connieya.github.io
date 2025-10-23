import React, { FunctionComponent } from 'react'
import styled from '@emotion/styled'
import PostItem from './PostItem'

export type PostType = {
  node: {
    id: string
    fields: {
      slug: string
    }
    timeToRead: number
    frontmatter: {
      title: string
      summary: string
      date: string
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
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 40px 1rem 100px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    width: 100%;
    padding: 50px 0.75rem;
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
          }: PostType) => (
            <PostItem
              title={frontmatter.title}
              date={frontmatter.date}
              categories={frontmatter.categories}
              summary={frontmatter.summary}
              link={slug}
              key={id}
              timeToRead={timeToRead}
              slug={slug}
            />
          ),
        )}
      </PostListContainer>
    </Container>
  )
}

export default PostList
