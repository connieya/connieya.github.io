import React, { useRef } from 'react'
import { graphql } from 'gatsby'
import Template from 'components/Common/Template'
import PostHead from 'components/PostDetail/PostHead'
import PostComment from 'components/PostDetail/PostComment'
import { PostDetail } from 'types/Post'
import TableOfContents from 'components/PostDetail/TableOfContent'
import styled from '@emotion/styled'
import PostBody from 'components/PostDetail/PostBody'

type PostTemplateProps = {
  data: {
    allMarkdownRemark: {
      edges: PostDetail[]
    }
  }
  location: {
    href: string
  }
}
const PostTemplate = ({
  data: {
    allMarkdownRemark: { edges },
  },
  location: { href },
}: PostTemplateProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    node: {
      tableOfContents,
      html,
      frontmatter: { title, summary, date, categories },
    },
  } = edges[0]

  return (
    <Template title={title} description={summary} url={href}>
      <Container>
        <PostHead title={title} date={date} categories={categories} />
        <PostBody ref={contentRef} html={html} />
        <PostComment />
        <TableOfContents ref={contentRef} tableOfContents={tableOfContents} />
      </Container>
    </Template>
  )
}
export default PostTemplate

export const queryMarkdownDataBySlug = graphql`
  query queryMarkdownDataBySlug($slug: String) {
    allMarkdownRemark(filter: { fields: { slug: { eq: $slug } } }) {
      edges {
        node {
          tableOfContents
          html
          frontmatter {
            title
            summary
            date(formatString: "YYYY.MM.DD.")
            categories
            thumbnail {
              childImageSharp {
                gatsbyImageData
              }
              publicURL
            }
          }
        }
      }
    }
  }
`
const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
`
