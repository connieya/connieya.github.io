import styled from 'styled-components'

const SubText = styled.div`
  font-size: 30px;
  font-weight: 100;
`

const MainText = styled.div`
  font-size: 40px;
  font-weight: 700;
`

export default function Introduction() {
  return (
    <div>
      <MainText>Blog.</MainText>
      <SubText>Development, Record</SubText>
    </div>
  )
}
