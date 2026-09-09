import Text from "@kaspernj/api-maker/build/utils/text"
import {PortalHost, PortalProvider} from "conjointment"
import OutsideEyeProvider from "outside-eye/build/provider.js"
import React, {useEffect} from "react"
import {Platform, SafeAreaView} from "react-native"
import SystemTestBrowserHelper from "system-testing/build/system-test-browser-helper.js"

import HayaSelectConfiguration from "../src/config.js"
import {screenForName} from "./screens"
import {styles} from "./screens/shared"

const currentScreenName = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") return null

  return new URLSearchParams(window.location.search).get("screen")
}

export default function App() {
  const Screen = screenForName(currentScreenName())

  useEffect(() => {
    HayaSelectConfiguration.current().setUseTranslate(() => ({
      t: (msgID, options = {}) => {
        if (typeof options.defaultValue == "string") return options.defaultValue

        return msgID
      }
    }))

    if (Platform.OS !== "web" || typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    if (params.get("systemTest") !== "true") return

    const helper = new SystemTestBrowserHelper()
    helper.enableOnBrowser()
  }, [])

  return (
    <PortalProvider>
      <PortalHost>
        <OutsideEyeProvider>
          <SafeAreaView
            dataSet={{focussed: "true"}}
            style={styles.container}
            testID="systemTestingComponent"
          >
            <Text testID="blankText" style={styles.blankText}>
              {" "}
            </Text>
            <Screen />
          </SafeAreaView>
        </OutsideEyeProvider>
      </PortalHost>
    </PortalProvider>
  )
}
