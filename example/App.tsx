import Text from "@kaspernj/api-maker/build/utils/text"
import {PortalHost,PortalProvider} from "conjointment"
import {useEvent} from "expo"
import OutsideEyeProvider from "outside-eye/build/provider.js"
import React,{useEffect,useState} from "react"
import {Button,Platform,SafeAreaView,ScrollView,View} from "react-native"
import SystemTestBrowserHelper from "system-testing/build/system-test-browser-helper.js"

import HayaSelectModule,{HayaSelectView} from "./haya-select-module"
// The example app needs the select component for system testing.
// @ts-expect-error - the component is authored in JS.
import HayaSelect from "../src/select/index.jsx"

export default function App() {
  const onChangePayload = useEvent(HayaSelectModule, "onChange")
  const selectOptions = [
    {value: "one", text: "One"},
    {value: "two", text: "Two"},
    {value: "three", text: "Three"}
  ]
  const rightSelectOptions = selectOptions.map((option) => ({
    ...option,
    right: <Text>Right {option.text}</Text>
  }))
  const paginationPageSize = 5
  const paginationTotalCount = 24
  const [actionTypeValue, setActionTypeValue] = useState<string | null>(null)
  const actionTypeOptions = [
    {value: "email", text: "Email"},
    {value: "points", text: "Points"},
    {value: "sms", text: "SMS"}
  ]

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search)
    if (params.get("systemTest") !== "true") return;

    const helper = new SystemTestBrowserHelper()
    helper.enableOnBrowser()
  }, [])

  const paginatedOptions = async ({searchValue, page = 1}: {searchValue?: string; page?: number}) => {
    const availableOptions = Array.from({length: paginationTotalCount}).map((_, index) => ({
      value: `option-${index + 1}`,
      text: `Item ${index + 1}`
    }))
    const filteredOptions = searchValue
      ? availableOptions.filter((option) => option.text.toLowerCase().includes(searchValue.toLowerCase()))
      : availableOptions
    const startIndex = (page - 1) * paginationPageSize
    const pageOptions = filteredOptions
      .slice(startIndex, startIndex + paginationPageSize)
      .map((option) => ({...option, text: `Page ${page} ${option.text}`}))

    return {
      options: pageOptions,
      totalCount: filteredOptions.length,
      page,
      pageSize: paginationPageSize
    }
  }

  return (
    <PortalProvider>
      <PortalHost>
        <OutsideEyeProvider>
          <SafeAreaView
            dataSet={{focussed: "true"}}
            style={styles.container}
            testID="systemTestingComponent"
          >
            <ScrollView style={styles.container}>
              <Text testID="blankText" style={styles.blankText}>
                {" "}
              </Text>
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
                    await HayaSelectModule.setValueAsync('Hello from JS!');
                  }}
                />
              </Group>
              <Group name="Events">
                <Text>{onChangePayload?.value}</Text>
              </Group>
              <Group name="Select">
                <View testID="hayaSelectRoot">
                  <HayaSelect
                    options={selectOptions}
                    placeholder="Pick one"
                  />
                </View>
              </Group>
              <Group name="Right Option Select">
                <View testID="hayaSelectRightOptionRoot">
                  <HayaSelect
                    options={rightSelectOptions}
                    placeholder="Pick with right"
                  />
                </View>
              </Group>
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
              <Group name="Multiple Select">
                <View testID="hayaSelectMultipleRoot">
                  <HayaSelect
                    multiple
                    options={selectOptions}
                    placeholder="Pick multiple"
                  />
                </View>
              </Group>
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
              <Group name="Paginated Select">
                <View testID="hayaSelectPaginationRoot">
                  <HayaSelect
                    options={paginatedOptions}
                    placeholder="Pick a page"
                    search
                  />
                </View>
              </Group>
              <Group name="Views">
                <HayaSelectView
                  url="https://www.example.com"
                  onLoad={({nativeEvent: {url}}) => console.log(`Loaded: ${url}`)}
                  style={styles.view}
                />
              </Group>
            </ScrollView>
          </SafeAreaView>
        </OutsideEyeProvider>
      </PortalHost>
    </PortalProvider>
  );
}

function Group(props: {name: string; children: React.ReactNode}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  view: {
    flex: 1,
    height: 200,
  },
  blankText: {
    height: 1,
    opacity: 0.01,
    width: 1,
  },
}
