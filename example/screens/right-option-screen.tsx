import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView, Text} from "./shared"

const rightSelectOptions = selectOptions.map((option) => ({
  ...option,
  right: <Text>Right {option.text}</Text>
}))

export default function RightOptionScreen() {
  return (
    <TestScrollView>
      <Group name="Right Option Select">
        <View testID="hayaSelectRightOptionRoot">
          <HayaSelect
            options={rightSelectOptions}
            placeholder="Pick with right"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
