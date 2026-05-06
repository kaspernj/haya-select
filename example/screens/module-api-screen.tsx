import Text from "@kaspernj/api-maker/build/utils/text"
import {useEvent} from "expo"
import React from "react"
import {Button} from "react-native"

import HayaSelectModule, {HayaSelectView} from "../haya-select-module"
import {Group, styles, TestScrollView} from "./shared"

export default function ModuleApiScreen() {
  const onChangePayload = useEvent(HayaSelectModule, "onChange")

  return (
    <TestScrollView>
      <Text style={styles.header}>Module API Example</Text>
      <Group name="Constants">
        <Text>{HayaSelectModule.PI}</Text>
      </Group>
      <Group name="Functions">
        <Text>{HayaSelectModule.hello()}</Text>
      </Group>
      <Group name="Async functions">
        <Button
          title="Set value"
          onPress={async () => {
            await HayaSelectModule.setValueAsync("Hello from JS!")
          }}
        />
      </Group>
      <Group name="Events">
        <Text>{onChangePayload?.value}</Text>
      </Group>
      <Group name="Views">
        <HayaSelectView
          url="https://www.example.com"
          onLoad={({nativeEvent: {url}}) => console.log(`Loaded: ${url}`)}
          style={styles.view}
        />
      </Group>
    </TestScrollView>
  )
}
