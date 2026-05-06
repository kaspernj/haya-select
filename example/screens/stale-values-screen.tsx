import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView} from "./shared"

const staleValueOptions = [
  {value: "one", text: "One"},
  {value: "two", text: "Two"}
]
const staleValues = ["one", "missing"]

export default function StaleValuesScreen() {
  return (
    <TestScrollView>
      <Group name="Stale Values Select">
        <View testID="hayaSelectStaleValuesRoot">
          <HayaSelect
            multiple
            name="stale_values"
            options={staleValueOptions}
            placeholder="Pick stale"
            values={staleValues}
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
