import React from 'react'
import { graphql } from 'gatsby'
import { IGatsbyImageData } from 'gatsby-plugin-image'
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
    file: {
      childImageSharp: { gatsbyImageData: IGatsbyImageData }
      publicURL: string
    }
  }
}

const Study = ({
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
    allMarkdownRemark: { edges: posts },
    file: { publicURL },
  },
}: Props) => (
  <Template
    title={`${title} - 공부`}
    description="개발하며 궁금해진 내용을 찾아보고 기록합니다."
    url={`${siteUrl}study`}
    image={publicURL}
  >
    <PostList posts={posts as any} />
  </Template>
)

export default Study

export const getStudyData = graphql`
  query getStudyData {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
    allMarkdownRemark(
      filter: { frontmatter: { categories: { in: ["study"] }, deploy: { ne: false } } }
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
            deploy
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
