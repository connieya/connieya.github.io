import React from 'react'
import PostList, { PostType } from 'components/Post/PostList'
import { graphql } from 'gatsby'
import { IGatsbyImageData } from 'gatsby-plugin-image'
import styled from '@emotion/styled' // PostList를 감쌀 컨테이너를 위해 추가
import Template from 'components/Common/Template'
import { PostItem } from 'types/Post'
type Props = {
  location: {
    search: string
    href: string
  }
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
    file: {
      childImageSharp: { gatsbyImageData: IGatsbyImageData }
      publicURL: string
    }
  }
}
const Home = ({
  location: { search },
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
    allMarkdownRemark: { edges: posts },
    file: {
      childImageSharp: { gatsbyImageData: any },
      publicURL,
    },
  },
}: Props) => {
  return (
    <Template
      title={title}
      description={description}
      url={siteUrl}
      image={publicURL}
    >
      {/* <Introduction /> */}
      <PostListContainer>
        {' '}
        {/* PostList를 감싸서 너비 및 마진 조정 */}
        <PostList posts={posts} />
      </PostListContainer>
    </Template>
  )
}

export default Home

export const getPostList = graphql`
  query getPostList {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date, frontmatter___title] }
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
    file(name: { eq: "profile-image" }) {
      childImageSharp {
        gatsbyImageData(width: 120, height: 120)
      }
      publicURL
    }
  }
`
const PostListContainer = styled.div`
  width: 100%;
`
