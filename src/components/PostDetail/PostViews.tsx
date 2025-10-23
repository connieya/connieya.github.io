import React, { useEffect } from 'react'
import styled from '@emotion/styled'
import { Eye } from 'lucide-react'
import { usePostViews } from '../../hooks/usePostViews'

type PostViewsProps = {
  slug: string
  title?: string
}

const PostViews: React.FC<PostViewsProps> = ({ slug, title }) => {
  const { viewCount, loading, error, incrementViewCount } = usePostViews(
    slug,
    title,
  )

  // 페이지 진입 시 조회수 증가 (한 번만)
  useEffect(() => {
    const hasViewed = sessionStorage.getItem(`viewed-${slug}`)
    if (!hasViewed) {
      incrementViewCount()
      sessionStorage.setItem(`viewed-${slug}`, 'true')
    }
  }, [slug, incrementViewCount])

  if (loading) {
    return (
      <ViewsContainer>
        <Eye size={16} />
        <ViewsText>조회수 로딩 중...</ViewsText>
      </ViewsContainer>
    )
  }

  if (error) {
    return (
      <ViewsContainer>
        <Eye size={16} />
        <ViewsText>조회수 불러오기 실패</ViewsText>
      </ViewsContainer>
    )
  }

  return (
    <ViewsContainer>
      <Eye size={16} />
      <ViewsText>{viewCount.toLocaleString()}회 조회</ViewsText>
    </ViewsContainer>
  )
}

export default PostViews

const ViewsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`

const ViewsText = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`
