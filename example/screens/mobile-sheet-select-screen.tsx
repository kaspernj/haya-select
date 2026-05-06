import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView} from "./shared"

const mobileSheetOptions = Array.from({length: 40}).map((_, index) => ({
  value: `mobile-sheet-${index + 1}`,
  text: `Mobile Sheet Option ${index + 1}`
}))

export default function MobileSheetSelectScreen() {
  return (
    <TestScrollView>
      <Group name="Mobile Sheet Select">
        <View testID="hayaSelectMobileSheetRoot">
          <HayaSelect
            options={mobileSheetOptions}
            placeholder="Pick mobile sheet"
            search
          />
        </View>
      </Group>
    </TestScrollView>
  )
}
