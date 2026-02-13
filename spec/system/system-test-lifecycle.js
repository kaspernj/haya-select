import timeout from "awaitery/build/timeout.js"
import SystemTest from "system-testing/build/system-test.js"

SystemTest.rootPath = "/?systemTest=true"

const systemTestHttpHost = process.env.SYSTEM_TEST_HTTP_HOST || "127.0.0.1"
const systemTestHttpConnectHost = process.env.SYSTEM_TEST_HTTP_CONNECT_HOST || systemTestHttpHost

export const systemTestArgs = {
  debug: true,
  httpConnectHost: systemTestHttpConnectHost,
  httpHost: systemTestHttpHost
}

export const setupSystemTestLifecycle = () => {
  let didStartSystemTest = false

  beforeAll(async () => {
    const systemTest = SystemTest.current(systemTestArgs)
    if (!systemTest.isStarted()) {
      await timeout({errorMessage: "beforeAll: timed out starting SystemTest", timeout: 40000}, async () => {
        await systemTest.start()
      })
      didStartSystemTest = true
    }
    systemTest.setBaseSelector("[data-testid='systemTestingComponent']")
  })

  afterAll(async () => {
    if (!didStartSystemTest) return

    await timeout({errorMessage: "afterAll: timed out stopping SystemTest", timeout: 40000}, async () => {
      await SystemTest.current().stop()
    })
  })
}
