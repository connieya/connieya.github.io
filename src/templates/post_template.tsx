import React, { useRef } from 'react'
import { graphql } from 'gatsby'
import Template from 'components/Common/Template'
import PostHead from 'components/PostDetail/PostHead'
import { PostDetail } from 'types/Post'
import TableOfContents from 'components/PostDetail/TableOfContent'
import styled from '@emotion/styled'
import PostBody from 'components/PostDetail/PostBody'

type PostTemplateProps = {
  data: {
    site: {
      siteMetadata: {
        siteUrl: string
      }
    }
    allMarkdownRemark: {
      edges: PostDetail[]
    }
  }
  pageContext: {
    slug: string
  }
}
const PostTemplate = ({
  data: {
    site: {
      siteMetadata: { siteUrl },
    },
    allMarkdownRemark: { edges },
  },
  pageContext: { slug },
}: PostTemplateProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    node: {
      tableOfContents,
      html,
      excerpt,
      timeToRead,
      frontmatter: { title, summary, date, categories, thumbnail },
    },
  } = edges[0]

  const description = summary || excerpt || ''
  const url = `${siteUrl}${slug}`

  return (
    <Template title={title} description={description} url={url} image={thumbnail?.publicURL || ''} ogType="article">
      <Container>
        <PostHead
          title={title}
          date={date}
          categories={categories}
          timeToRead={timeToRead}
        />
        <PostBody ref={contentRef} html={html} />
        <TableOfContents ref={contentRef} tableOfContents={tableOfContents} />
      </Container>
    </Template>
  )
}
export default PostTemplate

export const queryMarkdownDataBySlug = graphql`
  query queryMarkdownDataBySlug($slug: String) {
    site {
      siteMetadata {
        siteUrl
      }
    }
    allMarkdownRemark(filter: { fields: { slug: { eq: $slug } } }) {
      edges {
        node {
          tableOfContents
          html
          excerpt(pruneLength: 160)
          timeToRead
          frontmatter {
            title
            summary
            date(formatString: "YYYY-MM-DD")
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
