import React from 'react'
import PostList, { PostType } from 'components/Post/PostList'
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
      title={`${title} - 개발`}
      description={description}
      url={siteUrl}
      image={publicURL}
    >
      <PostList posts={posts} />
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
