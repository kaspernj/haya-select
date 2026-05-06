import React from "react"
import {View} from "react-native"

import {Group, HayaSelect, placementStyleCallback, selectOptions, styles, TestScrollView} from "./shared"

const placementAboveOptions = Array.from({length: 25}).map((_, index) => ({
  value: `placement-above-${index + 1}`,
  text: `Placement Option ${index + 1}`
}))

export default function PlacementCallbackScreen() {
  return (
    <>
      <TestScrollView>
        <Group name="Placement Callback Select Top">
          <View testID="hayaSelectPlacementBelowRoot">
            <HayaSelect
              options={selectOptions}
              placeholder="Placement below"
              styles={placementStyleCallback}
            />
          </View>
        </Group>
      </TestScrollView>
      <View style={styles.fixedBottomSelectContainer}>
        <View testID="hayaSelectPlacementAboveRoot">
          <HayaSelect
            options={placementAboveOptions}
            placeholder="Placement above"
            styles={placementStyleCallback}
          />
        </View>
      </View>
    </>
  )
}
