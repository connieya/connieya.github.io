import React, { FunctionComponent } from 'react'
import { graphql } from 'gatsby'
import Template from 'components/Common/Template'
import PostHead from 'components/Post/PostHead'
import { PostFrontMatterType } from 'components/types/PostItem.types'
import PostContent from 'components/Post/PostContent'

type PostTemplateProps = {
  data: {
    allMarkdownRemark: {
      edges: PostPageIemType[]
    }
  }
}
const PostTemplate: FunctionComponent<PostTemplateProps> = function ({
  data: {
    allMarkdownRemark: { edges },
  },
}) {
  const {
    node: {
      html,
      frontmatter: { title, summary, date, categories, thumbnail },
    },
  } = edges[0]

  return (
    <Template>
      <PostHead title={title} date={date} categories={categories} />
      <PostContent html={html} />
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
