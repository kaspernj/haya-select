import React, {useState} from "react"
import {View} from "react-native"

import {Group, HayaSelect, TestScrollView, Text} from "./shared"

const actionTypeOptions = [
  {value: "email", text: "Email"},
  {value: "points", text: "Points"},
  {value: "sms", text: "SMS"}
]

export default function CloseOnChangeScreen() {
  const [actionTypeValue, setActionTypeValue] = useState<string | null>(null)

  return (
    <TestScrollView>
      <Group name="Close On Change Select">
        <View testID="hayaSelectCloseOnChangeRoot">
          <HayaSelect
            onChangeValue={(value) => setActionTypeValue(value)}
            options={actionTypeOptions}
            placeholder="Pick action"
          />
          {actionTypeValue === "points" &&
            <Text testID="hayaSelectCloseOnChangeDetails">
              Points selected
            </Text>
          }
        </View>
      </Group>
    </TestScrollView>
  )
}
