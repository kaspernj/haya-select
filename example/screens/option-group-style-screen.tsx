import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView} from "./shared"

const groupedOptions = [
  {key: "default-group", text: "Default Group", type: "group"},
  {text: "Default One", value: "default-one"}
]

const customGroupedOptions = [
  {key: "custom-group", text: "Custom Group", type: "group"},
  {text: "Custom One", value: "custom-one"}
]

const customGroupStyles = {
  optionGroup: {
    backgroundColor: "#eef2ff"
  },
  optionGroupText: {
    color: "#b91c1c",
    fontWeight: 800
  }
}

export default function OptionGroupStyleScreen() {
  return (
    <TestScrollView>
      <Group name="Option Group Style Select">
        <View testID="hayaSelectOptionGroupDefaultRoot">
          <HayaSelect
            options={groupedOptions}
            placeholder="Pick grouped"
          />
        </View>
        <View testID="hayaSelectOptionGroupCustomRoot">
          <HayaSelect
            options={customGroupedOptions}
            placeholder="Pick custom grouped"
            styles={customGroupStyles}
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
