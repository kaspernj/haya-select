import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function NoOptionsSelectScreen() {
  return (
    <TestScrollView>
      <Group name="No Options Select">
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
