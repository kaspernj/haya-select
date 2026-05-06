import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView} from "./shared"

const paginationPageSize = 5
const paginationTotalCount = 24

const paginatedOptions = async ({searchValue, page = 1}: {searchValue?: string; page?: number}) => {
  const availableOptions = Array.from({length: paginationTotalCount}).map((_, index) => ({
    value: `option-${index + 1}`,
    text: `Item ${index + 1}`
  }))
  const filteredOptions = searchValue
    ? availableOptions.filter((option) => option.text.toLowerCase().includes(searchValue.toLowerCase()))
    : availableOptions
  const startIndex = (page - 1) * paginationPageSize
  const pageOptions = filteredOptions
    .slice(startIndex, startIndex + paginationPageSize)
    .map((option) => ({...option, text: `Page ${page} ${option.text}`}))

  return {
    options: pageOptions,
    totalCount: filteredOptions.length,
    page,
    pageSize: paginationPageSize
  }
}

export default function PaginationSelectScreen() {
  return (
    <TestScrollView>
      <Group name="Paginated Select">
        <View testID="hayaSelectPaginationRoot">
          <HayaSelect
            options={paginatedOptions}
            placeholder="Pick a page"
            search
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
