import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView} from "./shared"

const paginationPageSize = 40
const paginationTotalCount = 80

const paginatedOptions = async ({page = 1}: {page?: number}) => {
  const availableOptions = Array.from({length: paginationTotalCount}).map((_, index) => ({
    value: `long-option-${index + 1}`,
    text: `Long Page Item ${index + 1}`
  }))
  const startIndex = (page - 1) * paginationPageSize
  const pageOptions = availableOptions
    .slice(startIndex, startIndex + paginationPageSize)
    .map((option) => ({...option, text: `Page ${page} ${option.text}`}))

  return {
    options: pageOptions,
    totalCount: paginationTotalCount,
    page,
    pageSize: paginationPageSize
  }
}

export default function PaginationLongPageScreen() {
  return (
    <TestScrollView>
      <Group name="Long Paginated Select">
        <View testID="hayaSelectPaginationRoot">
          <HayaSelect
            options={paginatedOptions}
            placeholder="Pick a long page"
            search
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
