import React, { FunctionComponent, ReactNode } from 'react'
import styled from '@emotion/styled'

import CategoryListItem from './CategoryListItem'

export type CategoryListProps = {
  selectedCategory: string
  categoryList: {
    [key: string]: number
  }
}

const CategoryList: FunctionComponent<CategoryListProps> = function ({
  selectedCategory,
  categoryList,
}) {
  return (
    <Container>
      {Object.entries(categoryList).map(([name]) => (
        <CategoryListItem
          active={selectedCategory === name}
          innerText={`${name}`}
          category={name}
          key={name}
        />
      ))}
    </Container>
  )
}

export default CategoryList

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 768px;
  margin: 5px auto 0;
  background-color: #f4f4f4;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 50px;
    padding: 0 20px;
  }
`
