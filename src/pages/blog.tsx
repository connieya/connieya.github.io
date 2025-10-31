import React from 'react'
import PostList from 'components/Post/PostList'
import { graphql } from 'gatsby'
import { IGatsbyImageData } from 'gatsby-plugin-image'
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

const Blog = ({
  location: {},
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
    allMarkdownRemark: { edges: posts },
    file: { publicURL },
  },
}: Props) => {
  const filteredPosts = posts.filter(
    ({ node }) =>
      !node.frontmatter.categories?.includes('books') &&
      node.frontmatter.deploy !== false,
  )
  return (
    <Template
      title={`${title} - 개발`}
      description={description}
      url={siteUrl}
      image={publicURL}
    >
      <PostList posts={filteredPosts as any} />
    </Template>
  )
}

export default Blog

export const getBlogData = graphql`
  query getBlogData {
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
