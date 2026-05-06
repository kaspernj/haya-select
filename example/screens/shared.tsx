import Text from "@kaspernj/api-maker/build/utils/text"
import React from "react"
import {ScrollView, View} from "react-native"

// The example app needs the select component for system testing.
// @ts-expect-error - the component is authored in JS.
import HayaSelect from "../../src/select/index.jsx"

export {HayaSelect, Text}

export const selectOptions = [
  {value: "one", text: "One"},
  {value: "two", text: "Two"},
  {value: "three", text: "Three"}
]

export const placementStyleCallback = {
  optionsContainer: ({optionsPlacement, style}: {optionsPlacement?: "above" | "below"; style: Record<string, unknown>}) => {
    Object.freeze(style)

    if (optionsPlacement === "above") {
      return {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
      }
    }

    return {
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    }
  }
}

export const styles = {
  header: {
    fontSize: 30,
    margin: 20
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20
  },
  container: {
    flex: 1,
    backgroundColor: "#eee"
  },
  view: {
    flex: 1,
    height: 200
  },
  blankText: {
    height: 1,
    opacity: 0.01,
    width: 1
  },
  fixedBottomSelectContainer: {
    bottom: 20,
    left: 20,
    position: "absolute",
    right: 20
  }
}

export function Group(props: {name: string; children: React.ReactNode}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  )
}

export function TestScrollView(props: {children: React.ReactNode}) {
  return (
    <ScrollView style={styles.container}>
      {props.children}
    </ScrollView>
  )
}
