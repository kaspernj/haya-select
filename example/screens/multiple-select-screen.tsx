import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function MultipleSelectScreen() {
  return (
    <TestScrollView>
      <Group name="Multiple Select">
        <View testID="hayaSelectMultipleRoot">
          <HayaSelect
            multiple
            options={selectOptions}
            placeholder="Pick multiple"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
