import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function HelperScopeScreen() {
  return (
    <TestScrollView>
      <Group name="Helper Scope">
        <View testID="hayaSelectHelperTargetRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Pick target"
          />
        </View>
        <View testID="hayaSelectHelperOtherRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Pick other"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
