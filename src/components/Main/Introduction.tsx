import styled from '@emotion/styled'
import React, { FunctionComponent } from 'react'
import { Link } from 'gatsby'

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 10rem;
`

const ContentContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
`

const InfoContainer = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
`

const Introduction: FunctionComponent = function ({}) {
  return (
    <Container>
      <ContentContainer>
        {/* <ProfileImage profileImage={profileImage} /> */}
        <InfoContainer to="/">박건희</InfoContainer>
      </ContentContainer>
    </Container>
  )
}

export default Introduction
