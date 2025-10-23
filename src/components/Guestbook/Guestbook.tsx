import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { RotateCw } from 'lucide-react'

// Supabase 연결을 안전하게 처리
let supabase: any = null
try {
  const { supabase: supabaseClient } = require('../../lib/supabase')
  supabase = supabaseClient
} catch (error) {
  console.warn('Supabase not configured:', error)
}

type GuestbookEntry = {
  id: number
  name: string
  message: string
  created_at: string
}

// 형용사와 명사 리스트
const adjectives = [
  '귀여운',
  '엉뚱한',
  '유쾌한',
  '신비한',
  '바쁜',
  '느긋한',
  '빠른',
  '용감한',
  '솔직한',
  '긍정적인',
  '반짝이는',
  '활발한',
  '장난스러운',
  '호기심많은',
  '수줍은',
  '까부는',
  '철학적인',
  '낯가리는',
  '멍때리는',
  '진지한',
  '미묘한',
  '허세로운',
  '알쏭달쏭한',
  '고민많은',
  '산뜻한',
  '어두운',
  '명랑한',
]

const nouns = [
  '여행자',
  '방랑자',
  '몽상가',
  '시인',
  '친구',
  '손님',
  '관찰자',
  '도전자',
  '수집가',
  '산책자',
  '꿈꾸는이',
  '이야기꾼',
  '독서가',
  '탐험가',
  '요리사',
  '화가',
  '커피잔',
  '연필',
  '안경',
  '노트북',
  '스푼',
  '우산',
  '이어폰',
  '카메라',
  '모자',
  '쿠키',
]

// 랜덤 이름 생성 함수
const getRandomName = () => {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${randomAdjective} ${randomNoun}`
}

const Guestbook: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState(getRandomName())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 랜덤 이름 생성 핸들러
  const handleRandomName = () => {
    setName(getRandomName())
  }

  // Supabase가 설정되지 않은 경우
  if (!supabase) {
    return (
      <Container>
        <ErrorMessage>
          방명록 기능에 문제가 생겼습니다.
          <br />
        </ErrorMessage>
      </Container>
    )
  }

  // 방명록 목록 가져오기
  const fetchGuestbookEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching guestbook entries:', error)
        setError('방명록을 불러오는데 실패했습니다.')
      } else {
        setEntries(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('방명록을 불러오는데 실패했습니다.')
    } finally {
      setInitialLoading(false)
    }
  }

  // 실시간 구독 설정
  useEffect(() => {
    fetchGuestbookEntries()

    // 실시간 구독
    const subscription = supabase.channel('guestbook_changes').on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'guestbook',
      },
      payload => {
        fetchGuestbookEntries() // 새로운 방명록이 추가되면 자동으로 새로고침
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 방명록 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !message.trim()) {
      alert('이름과 내용을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('guestbook')
        .insert([{ name: name.trim(), message: message.trim() }])

      if (error) {
        console.error('Error submitting guestbook entry:', error)
        setError('방명록 등록에 실패했습니다.')
      } else {
        // 즉시 목록 새로고침
        await fetchGuestbookEntries()
        // 새로운 랜덤 이름 생성
        setName(getRandomName())
        setMessage('')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('방명록 등록에 실패했습니다.')
    }

    setLoading(false)
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Container>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* 방명록 작성 폼 */}
      <Form onSubmit={handleSubmit}>
        <FormCard>
          <InputRow>
            <NameInput
              name="name"
              maxLength={20}
              placeholder="이름"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
            <RandomButton
              type="button"
              onClick={handleRandomName}
              disabled={loading}
            >
              <RotateCw size={14} />
            </RandomButton>
          </InputRow>
          <MessageInput
            name="message"
            maxLength={200}
            placeholder="방명록을 남겨주세요..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={loading}
            rows={3}
          />
          <SubmitButton type="submit" disabled={loading}>
            {loading ? '등록 중...' : '방명록 남기기'}
          </SubmitButton>
        </FormCard>
      </Form>

      {/* 방명록 목록 */}
      <EntriesContainer>
        {initialLoading ? (
          <LoadingState>
            <LoadingText>방명록을 불러오는 중...</LoadingText>
          </LoadingState>
        ) : (
          <EntriesList>
            {entries.length === 0 ? (
              <EmptyState>
                <EmptyIcon>📝</EmptyIcon>
                <EmptyText>
                  아직 방명록이 없습니다.
                  <br />첫 번째 방명록을 남겨보세요!
                </EmptyText>
              </EmptyState>
            ) : (
              entries.map(({ id, name, message, created_at }) => (
                <EntryItem key={id}>
                  <EntryHeader>
                    <EntryName>{name}</EntryName>
                    <EntryDate>{formatDate(created_at)}</EntryDate>
                  </EntryHeader>
                  <EntryMessage>{message}</EntryMessage>
                </EntryItem>
              ))
            )}
          </EntriesList>
        )}
      </EntriesContainer>
    </Container>
  )
}

export default Guestbook

// 스타일 컴포넌트들
const Container = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 2rem 0.75rem;
  }
`

const Form = styled.form`
  margin-bottom: 3rem;
`

const FormCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 500px;
`

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
`

const NameInput = styled.input`
  flex: 0 0 150px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  background: #f9fafb;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6b7280;
    box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
    background: white;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`

const RandomButton = styled.button`
  padding: 0.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 40px;

  &:hover:not(:disabled) {
    background: #4b5563;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`

const MessageInput = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  background: #f9fafb;
  resize: none;
  min-height: 60px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6b7280;
    box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
    background: white;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`

const SubmitButton = styled.button`
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background: #374151;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #1f2937;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  border: 1px solid #fecaca;
`

const EntriesContainer = styled.div`
  margin-top: 2rem;
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
`

const EntriesList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  list-style: none;
  padding: 0;
  margin: 0;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`

const EntryItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const EntryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const EntryName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`

const EntryDate = styled.time`
  font-size: 0.75rem;
  color: #6b7280;
`

const EntryMessage = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
`
