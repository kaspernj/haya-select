import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, selectOptions, TestScrollView} from "./shared"

// The first select's portal options container can be up to 300px tall, so the
// second select is spaced well clear of it to stay clickable while the first is open.
const secondSelectTopSpacing = 400

export default function MultipleSelectsScreen() {
  return (
    <TestScrollView>
      <Group name="Multiple Selects (Only One Open)">
        <View style={{marginBottom: secondSelectTopSpacing}} testID="hayaSelectMultipleFirstRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="First select"
          />
        </View>
        <View testID="hayaSelectMultipleSecondRoot">
          <HayaSelect
            options={selectOptions}
            placeholder="Second select"
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
