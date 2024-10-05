import styled from 'styled-components'

type PostHeadProps = {
  title: string
  category: string[]
  date: string
}

const Wrapper = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 20px;
  padding: 30px;
  border-radius: 20px;

  @media (max-width: 1024px) {
    padding: 30px;
    gap: 15px;
  }

  @media (max-width: 768px) {
    padding: 20px;
    gap: 10px;
    border-radius: 10px;
  }
`

const Title = styled.div`
  display: -webkit-box;
  max-height: 2.4em;
  overflow: hidden;
  font-size: 30px;
  font-weight: 700;
  color: black;
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.2em;

  @media (max-width: 1024px) {
    font-size: 24px;
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`

const Information = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 15px;
  border-bottom: 1px solid #ffffff;
  font-size: 15px;
  font-weight: 300;
  color: black;

  @media (max-width: 1024px) {
    padding-bottom: 10px;
    font-size: 13px;
  }

  @media (max-width: 768px) {
    padding-bottom: 8px;
    font-size: 11px;
  }
`

const Category = styled.div`
  display: flex;
  gap: 7px;
`

export default function PostHead({ title, category, date }: PostHeadProps) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      <Information>
        <Category>
          {category.map(item => (
            <div key={item}>#{item}</div>
          ))}
        </Category>
        <div>{date}</div>
      </Information>
    </Wrapper>
  )
}
