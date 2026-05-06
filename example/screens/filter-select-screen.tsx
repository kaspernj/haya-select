import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function FilterSelectScreen() {
  return (
    <TestScrollView>
      <Group name="Filter Select">
        <View testID="hayaSelectRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Pick one"
            search
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
