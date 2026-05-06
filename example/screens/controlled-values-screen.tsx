import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

const controlledValues = ["one", "two"]

const controlledOptions = async ({values}: {values?: Array<string>}) => {
  if (Array.isArray(values)) return {options: []}

  return {options: selectOptions}
}

export default function ControlledValuesScreen() {
  return (
    <TestScrollView>
      <Group name="Controlled Values Select">
        <View testID="hayaSelectControlledValuesRoot">
          <HayaSelect
            multiple
            name="controlled_values"
            options={controlledOptions}
            placeholder="Pick controlled"
            values={controlledValues}
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
