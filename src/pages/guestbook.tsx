import React from 'react'
import { graphql } from 'gatsby'
import Template from 'components/Common/Template'
import Guestbook from 'components/Guestbook/Guestbook'

type Props = {
  data: {
    site: {
      siteMetadata: {
        title: string
        description: string
        siteUrl: string
      }
    }
  }
}

const GuestbookPage = ({
  data: {
    site: {
      siteMetadata: { title, description, siteUrl },
    },
  },
}: Props) => {
  return (
    <Template
      title={`${title} - 방명록`}
      description="방명록을 남겨주세요"
      url={`${siteUrl}/guestbook`}
      image=""
    >
      <Guestbook />
    </Template>
  )
}

export default GuestbookPage

export const query = graphql`
  query getGuestbookData {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
  }
`
