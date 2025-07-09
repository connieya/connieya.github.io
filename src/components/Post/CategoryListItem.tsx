import styled from '@emotion/styled'
import { Link } from 'gatsby'
import { ReactNode } from 'react'
import COLORS from 'utils/constant/colors'
type Props = {
  active?: boolean
  innerText?: string
  category: string
}

type GatsbyLinkProps = {
  to: string
  active: boolean
  children: ReactNode
}

const CategoryListItem = ({ active = false, category, innerText }: Props) => {
  return (
    <Container role="checkbox" aria-checked={active}>
      <StyledLink
        active={active}
        aria-label={`${innerText || category} 카테고리`}
        to={`/?category=${encodeURI(category)}`}
      >
        #{category}
      </StyledLink>
    </Container>
  )
}

export default CategoryListItem

const Container = styled.span`
  &:first-of-type {
    margin: 0.25rem 0.25rem 0.25rem 0;
  }

  margin: 0.25rem;
  padding: 0.25rem;
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledLink = styled(({ active, ...props }: GatsbyLinkProps) => (
  <Link {...props} />
))<{ active: boolean }>`
  z-index: 9;
  display: inline-block;
  padding: 0.25rem 0.65rem;
  color: ${COLORS.BLACK}
  font-size: 0.85rem;
  font-weight : ${({ active }) => (active ? '800' : '400')};
  white-space: nowrap;
  background-color: ${({ active }) => (active ? COLORS : COLORS)};
  border: ${({ active }) =>
    active ? '1px solid #909da1' : '1px solid #b5a5a5'};
  border-radius: 1rem;
  transform: scale(${({ active }) => (active ? 1.15 : 1)});
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:not(:first-of-type) {
    margin-left: 1rem;
  }

  &:hover {
    color: ${COLORS.BLACK}
    background-color: ${({ active }) => (active ? '#a0a0a0' : '#b5a5a5')};
  }

  @media (max-width: 768px) {
    font-size: 0.55rem;
  }
`
