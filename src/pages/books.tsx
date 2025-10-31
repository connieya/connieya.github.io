import React from 'react'
import { graphql } from 'gatsby'
import styled from '@emotion/styled'
import Template from 'components/Common/Template'
import PostList from 'components/Post/PostList'
import { PostItem } from 'types/Post'

type Props = {
  data: {
    site: {
      siteMetadata: {
        title: string
        description: string
        siteUrl: string
      }
    }
    allMarkdownRemark: {
      edges: PostItem[]
    }
  }
}

const BooksPage = ({
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
    allMarkdownRemark: { edges: books },
  },
}: Props) => {
  return (
    <Template
      title={`${title} - 읽은 책`}
      description={description}
      url={`${siteUrl}/books`}
      image=""
    >
      <ContentContainer>
        <SectionTitle>읽고 있는 책</SectionTitle>
        <CurrentReading>레거시 코드 활용 전략</CurrentReading>

        <Divider />

        <SectionTitle>읽은 책</SectionTitle>
        {books.length > 0 ? (
          <PostList posts={books as any} />
        ) : (
          <EmptyState>아직 기록된 책이 없습니다.</EmptyState>
        )}
      </ContentContainer>
    </Template>
  )
}

export default BooksPage

export const query = graphql`
  query getBooksPageData {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date, frontmatter___title] }
      filter: { frontmatter: { categories: { in: ["books"] } } }
    ) {
      edges {
        node {
          id
          fields {
            slug
          }
          timeToRead
          frontmatter {
            title
            summary
            date(formatString: "YYYY-MM-DD")
            categories
          }
        }
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

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 0.75rem;
  color: #333;
`

const CurrentReading = styled.p`
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
  color: #444;
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 1.5rem 0;
`

const EmptyState = styled.p`
  font-size: 1rem;
  color: #777;
  margin: 0;
`
