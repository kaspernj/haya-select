import timeout from "awaitery/build/timeout.js"
import wait from "awaitery/build/wait.js"
import SystemTest from "system-testing/build/system-test.js"

SystemTest.rootPath = "/?systemTest=true"

const systemTestHttpHost = process.env.SYSTEM_TEST_HTTP_HOST || "127.0.0.1"
const systemTestHttpConnectHost = process.env.SYSTEM_TEST_HTTP_CONNECT_HOST || systemTestHttpHost

export const systemTestArgs = {
  debug: true,
  httpConnectHost: systemTestHttpConnectHost,
  httpHost: systemTestHttpHost
}

let runQueue = Promise.resolve()

/** @param {unknown} error */
const dismissToListenerMissingError = (error) => error instanceof Error && error.message.includes("No listener registered for command event: dismissTo")

/**
 * @param {import("system-testing/build/system-test.js").default} systemTest
 * @returns {Promise<void>}
 */
const initializeSystemTestRun = async (systemTest) => {
  const rootPath = systemTest.getRootPath()

  await systemTest.driverVisit(rootPath)
  await systemTest.waitForClientWebSocket()
  await systemTest.findByTestID("blankText", {useBaseSelector: false})
}

/**
 * Runs system test callbacks sequentially to avoid overlapping WebSocket commands.
 * @param {(systemTest: import("system-testing/build/system-test.js").default) => Promise<void>} callback
 * @returns {Promise<void>}
 */
export const runSystemTest = async (callback) => {
  const run = async () => {
    const systemTest = SystemTest.current(systemTestArgs)

    for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber++) {
      try {
        await initializeSystemTestRun(systemTest)
        await callback(systemTest)
        return
      } catch (error) {
        if (!dismissToListenerMissingError(error) || attemptNumber === 3) {
          await systemTest.takeScreenshot()
          throw error
        }

        await wait(200)
      }
    }
  }
  const queuedRun = runQueue.then(run, run)

  runQueue = queuedRun.catch(() => {})

  await queuedRun
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
