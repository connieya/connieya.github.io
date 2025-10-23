import { IGatsbyImageData } from 'gatsby-plugin-image'

export type PostFrontMatterType = {
  title: string
  date: string
  categories: string[]
  summary: string
}

export type PostListItemType = {
  node: {
    id: string
    fields: {
      slug: string
    }
    timeToRead: number
    frontmatter: PostFrontMatterType
  }
}

export type PostDetail = {
  node: {
    tableOfContents: string
    timeToRead: number
    html: string
    frontmatter: PostFrontMatterType
  }
}
