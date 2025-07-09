import styled from '@emotion/styled'
import React, { FunctionComponent } from 'react'
import { IGatsbyImageData } from 'gatsby-plugin-image'
import { FaGithub } from 'react-icons/fa'
import { FiMail } from 'react-icons/fi'
import ProfileImage from './ProfileImage'
import StyledReactIconLink from './ReactIconLink'

type IntroductionProps = {
  profileImage: IGatsbyImageData
}

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 20rem;
`

const ContentContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
`

const InfoContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-self: flex-end;
`

const Introduction: FunctionComponent<IntroductionProps> = function ({
  profileImage,
}) {
  return (
    <Container>
      <ContentContainer>
        {/* <ProfileImage profileImage={profileImage} /> */}
        박건희
        <InfoContainer>
          <StyledReactIconLink
            href="https://github.com/connieya"
            tooltipText="Github"
          >
            <FaGithub />
          </StyledReactIconLink>
          <StyledReactIconLink
            mailTo
            href="gunny6026@naver.com"
            tooltipText="gunny6026@naver.com"
          >
            <FiMail />
          </StyledReactIconLink>
        </InfoContainer>
      </ContentContainer>
    </Container>
  )
}

export default Introduction
