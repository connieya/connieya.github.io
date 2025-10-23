#!/usr/bin/env node

/**
 * 수동으로 마크다운 파일들을 Supabase에 동기화하는 스크립트
 * 사용법: node scripts/sync-posts.js
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

// Supabase 연결
let supabase = null
try {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.GATSBY_SUPABASE_URL
  const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
    console.error(
      'GATSBY_SUPABASE_URL과 GATSBY_SUPABASE_ANON_KEY를 설정해주세요.',
    )
    process.exit(1)
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (error) {
  console.error('❌ Supabase 클라이언트 생성 실패:', error.message)
  process.exit(1)
}

// 마크다운 파일들 읽기
const contentsDir = path.join(__dirname, '../contents')
const markdownFiles = fs
  .readdirSync(contentsDir)
  .filter(file => file.endsWith('.md'))

console.log(`📁 발견된 마크다운 파일: ${markdownFiles.length}개`)

async function syncPosts() {
  const posts = []

  for (const file of markdownFiles) {
    const filePath = path.join(contentsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data: frontmatter } = matter(fileContent)

    const slug = file.replace('.md', '')
    const title = frontmatter.title || 'Untitled'

    posts.push({
      slug,
      title,
      view_count: 0,
    })

    console.log(`📄 처리됨: ${slug} - ${title}`)
  }

  // Supabase에 동기화
  console.log('\n🔄 Supabase에 동기화 중...')

  for (const post of posts) {
    try {
      // 기존 포스트 확인
      const { data: existingPost } = await supabase
        .from('posts')
        .select('slug')
        .eq('slug', post.slug)
        .single()

      if (existingPost) {
        console.log(`⏭️  건너뜀: ${post.slug} (이미 존재)`)
      } else {
        const { error } = await supabase.from('posts').insert([post])

        if (error) {
          console.error(`❌ 실패: ${post.slug} - ${error.message}`)
        } else {
          console.log(`✅ 추가됨: ${post.slug}`)
        }
      }
    } catch (error) {
      console.error(`❌ 오류: ${post.slug} - ${error.message}`)
    }
  }

  console.log('\n🎉 동기화 완료!')
}

// 스크립트 실행
syncPosts().catch(console.error)
