import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { getImage } from 'gatsby-plugin-image'
import { NodeRenderer, Options } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, MARKS, Text } from '@contentful/rich-text-types'
import {
  Blockquote,
  Heading,
  Image,
  HorizontalRule,
  OrderedList,
  UnorderedList,
  Link,
  Code,
} from './node'

export const HEADERS = [
  BLOCKS.HEADING_1,
  BLOCKS.HEADING_2,
  BLOCKS.HEADING_3,
] as const

const options: Options = {
  renderMark: {
    [MARKS.CODE]: text => <Code>{text}</Code>,
  },
  renderNode: {
    ...HEADERS.reduce<{ [block: string]: NodeRenderer }>((nodes, header) => {
      nodes[header] = (node, children) => (
        <Heading
          type={header}
          id={`${(node.content[0] as Text).value.replaceAll(' ', '-')}_`}
        >
          {children}
        </Heading>
      )

      return nodes
    }, {}),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <OrderedList>{children}</OrderedList>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <UnorderedList>{children}</UnorderedList>
    ),
    [BLOCKS.HR]: () => <HorizontalRule />,
    [BLOCKS.QUOTE]: (_node, children) => <Blockquote>{children}</Blockquote>,
    [BLOCKS.EMBEDDED_ASSET]: node => {
      const { gatsbyImageData, description } = node.data.target
      const image = getImage(gatsbyImageData)

      if (image) return <Image image={image} alt={description} />
    },
    [INLINES.HYPERLINK]: (node, children) => (
      <Link
        href={node.data.uri as string}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </Link>
    ),
  },
}

export default function useRenderRichText({
  raw,
}: Queries.ContentfulPostContent) {
  if (!raw) return null

  return renderRichText(
    {
      raw,
    },
    options,
  )
}
