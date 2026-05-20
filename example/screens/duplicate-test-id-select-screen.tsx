import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function DuplicateTestIdSelectScreen() {
  return (
    <TestScrollView>
      <View style={{display: "none"}}>
        <Group name="Hidden Duplicate Select">
          <View testID="hayaSelectRoot">
            <HayaSelect
              options={selectOptions}
              placeholder="Pick hidden"
              search
            />
          </View>
        </Group>
      </View>
      <Group name="Visible Duplicate Select">
        <View testID="hayaSelectRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Pick visible"
            search
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
