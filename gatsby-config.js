/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `박건희`,
    description: `gatsby 로 나만의 블로그 만들기`,
    author: `Park Geon Hee`,
    siteUrl: `https://connieya.github.io/`,
  },
  plugins: [
    `gatsby-plugin-emotion`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-react-helmet`,
    'gatsby-plugin-sitemap',
    'gatsby-plugin-sharp',

    {
      resolve: 'gatsby-plugin-typescript',
      options: {
        isTSX: true,
        allExtensions: true,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `contents`,
        path: `${__dirname}/contents`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content-images`, // 'images' 라는 이름으로 노드를 생성
        path: `${__dirname}/images`, // 실제 이미지가 있는 경로는 static 폴더
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/static`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          'gatsby-remark-autolink-headers',
          // {
          //   resolve: 'gatsby-remark-smartypants',
          //   options: {
          //     dashes: 'oldschool',
          //   },
          // },
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
            },
          },
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 768,
              quality: 100,
              withWebp: true,
            },
          },
          {
            resolve: 'gatsby-remark-copy-linked-files',
            options: {},
          },
          {
            resolve: 'gatsby-remark-external-links',
            options: {
              target: '_blank',
              rel: 'nofollow',
            },
          },
          // {
          //   resolve: `gatsby-plugin-sharp`,
          //   options: {
          //     defaults: {
          //       formats: ['auto', 'webp'],
          //       quality: 100,
          //       placeholder: 'blurred',
          //     },
          //   },
          // },
          {
            resolve: 'gatsby-plugin-robots-txt',
            options: {
              host: 'https://connieya.github.io',
              sitemap: 'https://connieya.github.io/sitemap-index.xml',
              policy: [{ userAgent: '*', allow: '/' }],
            },
          },
          {
            resolve: 'gatsby-plugin-canonical-urls',
            options: {
              siteUrl: 'https://connieya.github.io/',
              stripQueryString: true,
            },
          },
        ],
      },
    },
  ],
}
