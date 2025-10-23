import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'

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

const Guestbook: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Supabase가 설정되지 않은 경우
  if (!supabase) {
    return (
      <GuestbookContainer>
        <Title>방명록</Title>
        <ErrorMessage>
          방명록 기능 준비 중입니다.
          <br />
        </ErrorMessage>
      </GuestbookContainer>
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
    }
  }

  // 실시간 구독 설정
  useEffect(() => {
    fetchGuestbookEntries()

    // 실시간 구독
    const subscription = supabase
      .channel('guestbook_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guestbook' },
        () => {
          fetchGuestbookEntries() // 새로운 방명록이 추가되면 자동으로 새로고침
        },
      )
      .subscribe()

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
        setSubmitted(true)
        setName('')
        setMessage('')
        setTimeout(() => setSubmitted(false), 3000) // 3초 후 성공 메시지 숨김
      }
    } catch (err) {
      console.error('Error:', err)
      setError('방명록 등록에 실패했습니다.')
    }

    setLoading(false)
  }

  return (
    <GuestbookContainer>
      <Title>방명록</Title>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* 방명록 작성 폼 */}
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            disabled={loading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="message">내용</Label>
          <Textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="방명록 내용을 입력해주세요"
            disabled={loading}
            rows={4}
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? '등록 중...' : '방명록 등록'}
        </SubmitButton>

        {submitted && (
          <SuccessMessage>방명록이 등록되었습니다! 감사합니다.</SuccessMessage>
        )}
      </Form>

      {/* 방명록 목록 */}
      <EntriesContainer>
        <EntriesTitle>방명록 목록</EntriesTitle>
        {entries.length === 0 ? (
          <EmptyMessage>
            아직 방명록이 없습니다. 첫 번째 방명록을 남겨보세요!
          </EmptyMessage>
        ) : (
          <EntriesList>
            {entries.map(entry => (
              <EntryItem key={entry.id}>
                <EntryHeader>
                  <EntryName>{entry.name}</EntryName>
                  <EntryDate>
                    {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </EntryDate>
                </EntryHeader>
                <EntryMessage>{entry.message}</EntryMessage>
              </EntryItem>
            ))}
          </EntriesList>
        )}
      </EntriesContainer>
    </GuestbookContainer>
  )
}

export default Guestbook

// 스타일 컴포넌트들
const GuestbookContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 2rem 0.75rem;
  }
`

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
`

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
`

const Form = styled.form`
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`

const SubmitButton = styled.button`
  background: #007bff;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
`

const EntriesContainer = styled.div`
  margin-top: 2rem;
`

const EntriesTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
`

const EmptyMessage = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
`

const EntriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const EntryItem = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`

const EntryName = styled.div`
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
`

const EntryDate = styled.div`
  color: #666;
  font-size: 0.9rem;
`

const EntryMessage = styled.div`
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
`
