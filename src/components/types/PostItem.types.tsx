import { IGatsbyImageData } from 'gatsby-plugin-image'

export type PostFrontMatterType = {
  title: string
  date: string
  categories: string[]
  summary: string
  timeToRead: number
  thumbnail: {
    childImagesSharp: {
      gatsbyImageData: IGatsbyImageData
    }
    publicURL: string
  }
}

export type PostListItemType = {
  node: {
    id: string
    filed: {
      slug: string
    }
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
