import { useState } from 'react'
import { HeadFC, PageProps, graphql } from 'gatsby'
import Category from '../\bcomponents/main/Category'
import PostList from '../\bcomponents/main/PostList'
import SEO from '../\bcomponents/common/Seo'
import Introduction from '../\bcomponents/main/Introduction'

export default function Index({
  data: {
    allContentfulPost: { nodes },
  },
}: PageProps<Queries.IndexPageQuery>) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = nodes.reduce<Record<string, number>>(
    (categories, post) => {
      post.category
        ?.filter((category): category is string => !!category)
        .forEach(
          category => (categories[category] = (categories[category] ?? 0) + 1),
        )

      return categories
    },
    { All: nodes.length },
  )

  const posts = nodes.filter(
    ({ category }) =>
      selectedCategory === 'All' || category?.includes(selectedCategory),
  )

  const handleSelectCategory = (category: string) =>
    setSelectedCategory(category)

  return (
    <>
      <Introduction />
      <Category
        categories={categories}
        selectedCategory={selectedCategory}
        handleSelect={handleSelectCategory}
      />

      <PostList posts={posts} />
    </>
  )
}

export const Head: HeadFC = () => <SEO />

export const query = graphql`
  query IndexPage {
    allContentfulPost(sort: { date: DESC }) {
      nodes {
        title
        category
        slug
        date
        description {
          description
        }
      }
    }
  }
`
