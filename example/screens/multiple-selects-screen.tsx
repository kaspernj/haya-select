import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

export default function MultipleSelectsScreen() {
  return (
    <TestScrollView>
      <Group name="Multiple Selects (Only One Open)">
        <View testID="hayaSelectMultipleRoot">
          <View style={{marginBottom: 20}}>
            <HayaSelect
              options={selectOptions}
              placeholder="First select"
            />
          </View>
          <View style={{marginBottom: 20}}>
            <HayaSelect
              options={selectOptions}
              placeholder="Second select"
            />
          </View>
          <View>
            <HayaSelect
              options={selectOptions}
              placeholder="Third select"
            />
          </View>
        </View>
      </Group>
    </TestScrollView>
  )
}
