import { useEvent } from 'expo';
import HayaSelectModule, { HayaSelectView } from './haya-select-module';
import SystemTestBrowserHelper from 'system-testing/build/system-test-browser-helper.js';
import OutsideEyeProvider from 'outside-eye/build/provider.js';
import React, { useEffect } from 'react';
import { Button, Platform, SafeAreaView, ScrollView, Text, View } from 'react-native';
// The example app needs the select component for system testing.
// @ts-expect-error - the component is authored in JS.
import HayaSelect from '../src/select/index.jsx';

export default function App() {
  const onChangePayload = useEvent(HayaSelectModule, 'onChange');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('systemTest') !== 'true') return;

    const helper = new SystemTestBrowserHelper();
    helper.enableOnBrowser();
  }, []);

  return (
    <OutsideEyeProvider>
      <SafeAreaView
        dataSet={{ focussed: 'true' }}
        style={styles.container}
        testID="systemTestingComponent"
      >
        <ScrollView style={styles.container}>
          <Text testID="blankText" style={styles.blankText}>
            {' '}
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
                options={[
                  { value: 'one', text: 'One' },
                  { value: 'two', text: 'Two' },
                ]}
                placeholder="Pick one"
              />
            </View>
          </Group>
          <Group name="Views">
            <HayaSelectView
              url="https://www.example.com"
              onLoad={({ nativeEvent: { url } }) => console.log(`Loaded: ${url}`)}
              style={styles.view}
            />
          </Group>
        </ScrollView>
      </SafeAreaView>
    </OutsideEyeProvider>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
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
};
