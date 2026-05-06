import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function RoundedCornersSelectScreen() {
  return (
    <TestScrollView>
      <Group name="Rounded Corners Select">
        <View testID="hayaSelectRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Pick one"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
