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

  // Generate Post Page And Passing Slug Props for Query
  queryAllMarkdownData.data.allMarkdownRemark.edges.forEach(generatePostPage)
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
      categories: [String!]! # 카테고리 배열도 항상 있어야 하므로 !
      summary: String # 요약은 없을 수도 있으므로 ! 없음
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
