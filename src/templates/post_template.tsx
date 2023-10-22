import React, { FunctionComponent } from 'react'
import { graphql } from 'gatsby'
import Template from 'components/Common/Template'
import PostHead from 'components/Post/PostHead'
import { PostFrontMatterType } from 'components/types/PostItem.types'
import PostContent from 'components/Post/PostContent'
import CommentWidget from 'components/Post/CommentWidget'

type PostTemplateProps = {
  data: {
    allMarkdownRemark: {
      edges: PostPageIemType[]
    }
  }
  location: {
    href: string
  }
}
const PostTemplate: FunctionComponent<PostTemplateProps> = function ({
  data: {
    allMarkdownRemark: { edges },
  },
  location: { href },
}) {
  const {
    node: {
      html,
      frontmatter: {
        title,
        summary,
        date,
        categories,
        thumbnail: { publicURL },
      },
    },
  } = edges[0]

  return (
    <Template>
      <PostHead title={title} date={date} categories={categories} />
      <PostContent html={html} />
      <CommentWidget />
    </Template>
  )
}
export default PostTemplate

export const queryMarkdownDataBySlug = graphql`
  query queryMarkdownDataBySlug($slug: String) {
    allMarkdownRemark(filter: { fields: { slug: { eq: $slug } } }) {
      edges {
        node {
          html
          frontmatter {
            title
            summary
            date(formatString: "YYYY.MM.DD.")
            categories
            thumbnail
          }
        }
      }
    }
  }
`
export type PostPageIemType = {
  node: {
    html: string
    frontmatter: PostFrontMatterType
  }
}
