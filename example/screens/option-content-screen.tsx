import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView, Text} from "./shared"

export default function OptionContentScreen() {
  return (
    <TestScrollView>
      <Group name="Option Content Select">
        <View testID="hayaSelectOptionContentRoot">
          <HayaSelect
            optionContent={({option}) => (
              <Text>
                Custom {option.text}
              </Text>
            )}
            options={selectOptions}
            placeholder="Pick custom"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
