import { IGatsbyImageData } from 'gatsby-plugin-image'

export type PostFrontMatterType = {
  title: string
  date: string
  categories: string[]
  summary: string
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
