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
  const [filterValues, setFilterValues] = useState<Array<string>>([])

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
      <Group name="Close On Change Multiple Select">
        <View testID="hayaSelectCloseOnChangeMultipleRoot">
          <HayaSelect
            closeOnChange
            multiple
            onChangeValue={(values) => setFilterValues(Array.isArray(values) ? values.map(String) : [])}
            options={actionTypeOptions}
            placeholder="Pick filters"
            values={filterValues}
          />
          <Text testID="hayaSelectCloseOnChangeMultipleValues">
            {filterValues.join(",")}
          </Text>
        </View>
      </Group>
    </TestScrollView>
  )
}
