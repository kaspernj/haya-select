import timeout from "awaitery/build/timeout.js"
import wait from "awaitery/build/wait.js"
import SystemTest from "system-testing/build/system-test.js"

SystemTest.rootPath = "/?systemTest=true"

/**
 * @param {string} name Environment variable name.
 * @param {number} defaultValue Default port.
 * @returns {number} Resolved port.
 */
const systemTestPort = (name, defaultValue) => {
  const rawValue = process.env[name]
  if (!rawValue) return defaultValue

  const port = Number(rawValue)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${name} must be a positive integer port`)
  }

  return port
}

const systemTestHttpHost = process.env.SYSTEM_TEST_HTTP_HOST || "127.0.0.1"
const systemTestHttpConnectHost = process.env.SYSTEM_TEST_HTTP_CONNECT_HOST || systemTestHttpHost
const systemTestAppPort = systemTestPort("SYSTEM_TEST_APP_PORT", 3711)
const systemTestClientWsPort = systemTestPort("SYSTEM_TEST_CLIENT_WS_PORT", 3713)
const systemTestHttpPort = systemTestPort("SYSTEM_TEST_HTTP_PORT", 3712)
const systemTestScoundrelPort = systemTestPort("SYSTEM_TEST_SCOUNDREL_PORT", 3714)

export const systemTestArgs = {
  clientWsPort: systemTestClientWsPort,
  debug: true,
  httpConnectHost: systemTestHttpConnectHost,
  httpHost: systemTestHttpHost,
  httpPort: systemTestHttpPort,
  port: systemTestAppPort,
  scoundrelPort: systemTestScoundrelPort
}

let runQueue = Promise.resolve()

/** @param {unknown} error */
const dismissToListenerMissingError = (error) => error instanceof Error && error.message.includes("No listener registered for command event: dismissTo")

/** @typedef {{screen?: string}} RunSystemTestOptions */

/**
 * @param {string} rootPath System test root path.
 * @param {string|undefined} screen Example screen name.
 * @returns {string} Root path with the example screen query parameter.
 */
const rootPathForScreen = (rootPath, screen) => {
  if (!screen) return rootPath

  return `${rootPath}&screen=${encodeURIComponent(screen)}`
}

/**
 * @param {import("system-testing/build/system-test.js").default} systemTest
 * @param {RunSystemTestOptions} [options] Run options.
 * @returns {Promise<void>}
 */
const initializeSystemTestRun = async (systemTest, {screen} = {}) => {
  const rootPath = rootPathForScreen(systemTest.getRootPath(), screen)

  await systemTest.driverVisit(rootPath)
  await systemTest.waitForClientWebSocket()
  await systemTest.findByTestID("blankText", {useBaseSelector: false})
}

/**
 * Runs system test callbacks sequentially to avoid overlapping WebSocket commands.
 * @param {(systemTest: import("system-testing/build/system-test.js").default) => Promise<void>} callback
 * @param {RunSystemTestOptions} [options] Run options.
 * @returns {Promise<void>}
 */
export const runSystemTest = async (callback, options = {}) => {
  const run = async () => {
    const systemTest = SystemTest.current(systemTestArgs)

    for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber++) {
      try {
        await initializeSystemTestRun(systemTest, options)
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
