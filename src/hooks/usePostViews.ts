import { useState, useEffect } from 'react'

// Supabase 연결을 안전하게 처리
let supabase: any = null
try {
  const { supabase: supabaseClient } = require('../lib/supabase')
  supabase = supabaseClient
} catch (error) {
  console.warn('Supabase not configured:', error)
}

export const usePostViews = (slug: string) => {
  const [viewCount, setViewCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 조회수 가져오기
  const fetchViewCount = async () => {
    if (!supabase) {
      setError('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('view_count')
        .eq('slug', slug)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116: no rows found
        console.error('Error fetching view count:', error)
        setError('조회수를 불러오는데 실패했습니다.')
      } else {
        setViewCount(data?.view_count || 0)
        setError(null)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('조회수를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 조회수 증가
  const incrementViewCount = async () => {
    if (!supabase) return

    try {
      // 먼저 포스트가 존재하는지 확인
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id, view_count')
        .eq('slug', slug)
        .single()

      if (existingPost) {
        // 기존 포스트의 조회수 증가
        const { error } = await supabase
          .from('posts')
          .update({ view_count: existingPost.view_count + 1 })
          .eq('slug', slug)

        if (error) {
          console.error('Error incrementing view count:', error)
        } else {
          setViewCount(existingPost.view_count + 1)
        }
      } else {
        // 새 포스트 생성 (조회수 1로 시작)
        const { error } = await supabase
          .from('posts')
          .insert([{ slug, title: 'Untitled', view_count: 1 }])

        if (error) {
          console.error('Error creating new post:', error)
        } else {
          setViewCount(1)
        }
      }
    } catch (err) {
      console.error('Error incrementing view count:', err)
    }
  }

  useEffect(() => {
    fetchViewCount()
  }, [slug])

  return {
    viewCount,
    loading,
    error,
    incrementViewCount,
    refetch: fetchViewCount,
  }
}
