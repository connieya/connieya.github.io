/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

// Load environment variables
require('dotenv').config({
  path: `.env.local`,
})

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
        name: `images`,
        path: `${__dirname}/static`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-reading-time`,
          `gatsby-remark-mermaid`,
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
              wrapperStyle: 'margin: 1rem 0;',
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
          {
            resolve: 'gatsby-plugin-gtag',
            options: {
              trackingId: process.env.GOOGLE_ANALYTICS_ID,
              head: true, // 애널리틱스 스크립트를 Head 태그 내에 둘지에 대한 속성입니다.
            },
          },
        ],
      },
    },
  ],
}
