/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */
/**
 * @type {import('gatsby').GatsbyNode['createPages']}
 */
const path = require('path')
const { createFilePath } = require('gatsby-source-filesystem')

// Supabase 연결을 위한 설정
let supabase = null
try {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.GATSBY_SUPABASE_URL
  const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (error) {
  console.warn(
    'Supabase not configured for build-time operations:',
    error.message,
  )
}
// Setup Import Alias
exports.onCreateWebpackConfig = ({ getConfig, actions }) => {
  const output = getConfig().output || {}

  actions.setWebpackConfig({
    output,
    resolve: {
      alias: {
        components: path.resolve(__dirname, 'src/components'),
        utils: path.resolve(__dirname, 'src/utils'),
        hooks: path.resolve(__dirname, 'src/hooks'),
      },
    },
  })
}

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions

  // Get All Markdown File For Paging
  const queryAllMarkdownData = await graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date, frontmatter___title] }
      ) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              deploy
            }
          }
        }
      }
    }
  `)

  // Handling GraphQL Query Error
  if (queryAllMarkdownData.errors) {
    reporter.panicOnBuild(`Error while running query`)
    return
  }

  // Import Post Template Component
  const PostTemplateComponent = path.resolve(
    __dirname,
    'src/templates/post_template.tsx',
  )

  // Page Generating Function
  const generatePostPage = ({
    node: {
      fields: { slug },
    },
  }) => {
    const pageOptions = {
      path: slug,
      component: PostTemplateComponent,
      context: { slug },
    }

    createPage(pageOptions)
  }

  // Generate Post Page only when deploy flag is not false
  const visibleEdges = queryAllMarkdownData.data.allMarkdownRemark.edges.filter(
    ({ node }) => node.frontmatter?.deploy !== false,
  )
  visibleEdges.forEach(generatePostPage)

  // Supabase에 포스트 자동 추가 (빌드 시)
  if (supabase) {
    try {
      const posts = visibleEdges.map(({ node }) => ({
        slug: node.fields.slug.replace(/\//g, ''), // 슬래시 제거
        title: node.frontmatter?.title || 'Untitled',
        view_count: 0,
      }))

      // 기존 포스트들과 비교하여 새 포스트만 추가
      for (const post of posts) {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('slug')
          .eq('slug', post.slug)
          .single()

        if (!existingPost) {
          const { error } = await supabase.from('posts').insert([post])

          if (error) {
            console.warn(`Failed to insert post ${post.slug}:`, error.message)
          } else {
            console.log(`✅ Added new post to database: ${post.slug}`)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to sync posts with Supabase:', error.message)
    }
  }
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  if (node.internal.type === 'MarkdownRemark') {
    const slug = createFilePath({ node, getNode })
    // node라는 필드에 slug 필드를 만들어 넣는다.
    createNodeField({
      node,
      name: 'slug',
      value: slug,
    })
  }
}

// 이거 해주면 알아서 React 컴포넌트인지 인식한다. 따로 FunctionComponent 등 타입을 넣어줄 필요가 없어진다.
exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: '@babel/plugin-transform-react-jsx',
    options: {
      runtime: 'automatic',
    },
  })
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
    
    type MarkdownRemarkFrontmatter @dontInfer {
      title: String! 
      date: Date! @dateformat # 날짜도 항상 있어야 하므로 !
      categories: [String!] # 카테고리 배열도 항상 있어야 하므로 !
      summary: String # 요약은 없을 수도 있으므로 ! 없음
      deploy: Boolean # 배포 여부 플래그 (기본: true)
      thumbnail: File @fileByRelativePath
    }

     type Fields { # <-- 이 부분을 새로 추가합니다.
      slug: String! # slug 필드가 String 타입임을 명시
    }
    # MarkdownRemark 노드 타입의 스키마를 명시적으로 정의합니다.
    # @dontInfer를 사용하여 자동 추론을 막고, frontmatter 필드에 위에서 정의한 타입을 연결합니다.
    type MarkdownRemark implements Node @dontInfer {
      frontmatter: MarkdownRemarkFrontmatter
      html: String
      excerpt: String
      fields: Fields # <-- 여기에 fields 필드를 추가합니다.
    }
  `
  createTypes(typeDefs)
}
