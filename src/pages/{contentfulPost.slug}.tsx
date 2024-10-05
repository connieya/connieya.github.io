import { HeadFC, HeadProps, PageProps, graphql } from 'gatsby'
import PostHead from '../\bcomponents/post/PostHead'
import PostBody from '../\bcomponents/post/PostBody'
import SEO from '../\bcomponents/common/Seo'

export default function Post({
  data: { contentfulPost },
}: PageProps<Queries.PostPageQuery>) {
  return (
    <>
      <PostHead
        title={contentfulPost?.title as string}
        category={contentfulPost?.category as string[]}
        date={contentfulPost?.date as string}
      />
      <PostBody
        content={contentfulPost?.content as Queries.ContentfulPostContent}
      />
    </>
  )
}

export const Head: HeadFC<Queries.PostPageQuery> = ({
  data: { contentfulPost },
}: HeadProps<Queries.PostPageQuery>) => {
  return (
    <SEO
      title={contentfulPost?.title as string}
      description={contentfulPost?.description?.description as string}
      pathname={`/${contentfulPost?.slug}`}
    />
  )
}

export const query = graphql`
  query PostPage($slug: String!) {
    contentfulPost(slug: { eq: $slug }) {
      title
      category
      date
      slug
      description {
        description
      }
      content {
        raw
      }
    }
  }
`
