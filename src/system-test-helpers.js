import waitFor from "awaitery/build/wait-for.js"
import {By} from "selenium-webdriver"

/** @typedef {{systemTest: object, testId: string}} HayaSelectSystemTestHelperOptions */
/** @typedef {{timeout?: number, useBaseSelector?: boolean}} HayaSelectOpenOptions */
/** @typedef {{optionText?: string, optionValue?: string | number, search?: boolean, timeout?: number, useBaseSelector?: boolean}} PickHayaSelectOptionOptions */
/** @typedef {{optionValue: string | number, timeout?: number}} ClickVisibleHayaSelectOptionOptions */
/** @typedef {{timeout?: number}} ExpectHayaSelectCurrentOptionsOptions */
/** @typedef {{timeout?: number}} ExpectHayaSelectOptionsClosedOptions */
/** @typedef {import("selenium-webdriver").WebElement} WebElement */

const DEFAULT_TIMEOUT = 5000

/**
 * Selects an option in a HayaSelect instance.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {PickHayaSelectOptionOptions} options Text/value to choose and whether to type into the search field first.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 * @rejects {Error} When neither text nor value is supplied.
 */
export async function pickHayaSelectOption(systemTest, testId, {optionText, optionValue, search = false, timeout = DEFAULT_TIMEOUT, useBaseSelector = true}) {
  const helper = new HayaSelectSystemTestHelper({systemTest, testId})
  const selectElement = await systemTest.find(helper.selectContainerSelector, {timeout, useBaseSelector})
  await selectElement.click()

  if (search) {
    if (!optionText) {
      throw new Error(`Expected optionText when searching ${testId}`)
    }

    const searchElement = await systemTest.find(helper.searchInputSelector, {timeout, useBaseSelector})
    await searchElement.sendKeys(optionText)
  }

  const optionsContainerSelector = await helper.optionsContainerSelector()

  if (typeof optionValue !== "undefined") {
    await clickVisibleSelectOptionByValue(systemTest, optionValue, timeout, optionsContainerSelector)
    return
  }

  if (optionText) {
    await clickVisibleSelectOptionByText(systemTest, optionText, timeout, optionsContainerSelector)
    return
  }

  throw new Error(`Expected optionValue or optionText for ${testId}`)
}

/**
 * Clicks an option in an already-open HayaSelect dropdown.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {ClickVisibleHayaSelectOptionOptions} options Option value to choose.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
export async function clickVisibleHayaSelectOption(systemTest, {optionValue, timeout = DEFAULT_TIMEOUT}) {
  await clickVisibleSelectOptionByValue(systemTest, optionValue, timeout)
}

/**
 * Opens a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select opens.
 */
export async function openHayaSelect(systemTest, testId, {timeout = DEFAULT_TIMEOUT, useBaseSelector = true} = {}) {
  const helper = new HayaSelectSystemTestHelper({systemTest, testId})

  await helper.open({timeout, useBaseSelector})
}

/**
 * Closes a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select closes.
 */
export async function closeHayaSelect(systemTest, testId, {timeout = DEFAULT_TIMEOUT, useBaseSelector = true} = {}) {
  const helper = new HayaSelectSystemTestHelper({systemTest, testId})

  await helper.close({timeout, useBaseSelector})
}

/**
 * Waits until a HayaSelect renders exactly the expected current-option labels.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {string[]} expectedTexts Current option text fragments in rendered order.
 * @param {ExpectHayaSelectCurrentOptionsOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after the current options match.
 */
export async function expectHayaSelectCurrentOptions(systemTest, testId, expectedTexts, {timeout = DEFAULT_TIMEOUT} = {}) {
  const selector = `${testIdSelector(testId)} [data-testid="haya-select/current-option"]`
  await systemTest.getDriver().wait(
    async () => {
      const elements = await systemTest.getDriver().findElements(By.css(selector))
      /** @type {string[]} */
      const visibleTexts = []

      for (const element of elements) {
        if (await element.isDisplayed()) {
          visibleTexts.push(await element.getText())
        }
      }

      if (visibleTexts.length !== expectedTexts.length) {
        return false
      }

      return expectedTexts.every((expectedText, index) => visibleTexts[index]?.includes(expectedText))
    },
    timeout,
    `Timed out waiting for ${testId} current options: ${expectedTexts.join(", ")}`
  )
}

/**
 * Waits until a HayaSelect and its portal-rendered options are closed.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after no visible options remain.
 */
export async function expectHayaSelectOptionsClosed(systemTest, testId, {timeout = DEFAULT_TIMEOUT} = {}) {
  const helper = new HayaSelectSystemTestHelper({systemTest, testId})

  await helper.expectClosed({timeout})
}

/**
 * System test helper for interacting with HayaSelect instances.
 */
export default class HayaSelectSystemTestHelper {
  /** @param {HayaSelectSystemTestHelperOptions} options */
  constructor(options) {
    if (!options) {
      throw new Error(`Expected options for HayaSelectSystemTestHelper, got: ${options}`)
    }

    const {systemTest, testId, ...restArgs} = options
    const extraKeys = Object.keys(restArgs)

    if (extraKeys.length > 0) {
      throw new Error(`Unexpected options for HayaSelectSystemTestHelper: ${extraKeys.join(", ")}`)
    }

    this.systemTest = systemTest
    this.testId = testId
    this.rootSelector = testIdSelector(testId)
    this.componentSelector = `${this.rootSelector} [data-testid='haya-select']`
    this.chevronContainerSelector = `${this.rootSelector} [data-testid='haya-select/chevron-container']`
    this.selectContainerSelector = `${this.rootSelector} [data-testid='haya-select/select-container']`
    this.searchInputSelector = `${this.rootSelector} [data-testid='haya-select/search-input']`
    this.optionsContainerSelectorFallback = "[data-testid='haya-select/options-container']"
  }

  /**
   * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
   * @returns {Promise<void>} Completes after the select opens.
   */
  async open({timeout = DEFAULT_TIMEOUT, useBaseSelector = true} = {}) {
    await this.clickSelectContainer({timeout, useBaseSelector})
    this._optionsContainerSelector = null

    await waitFor({timeout}, async () => {
      const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)

      if (openedElements.length === 0) {
        throw new Error(`Expected HayaSelect to open: ${this.testId}`)
      }
    })
  }

  /**
   * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
   * @returns {Promise<void>} Completes after the select closes.
   */
  async close({timeout = DEFAULT_TIMEOUT, useBaseSelector = true} = {}) {
    await this.clickSelectContainer({timeout, useBaseSelector})

    await waitFor({timeout}, async () => {
      const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)

      if (openedElements.length > 0) {
        throw new Error(`Expected HayaSelect to close: ${this.testId}`)
      }
    })
  }

  /**
   * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional timeout.
   * @returns {Promise<void>} Completes after no visible options remain.
   */
  async expectClosed({timeout = DEFAULT_TIMEOUT} = {}) {
    await waitFor({timeout}, async () => {
      const open = await this.isOpen()
      const visibleContainersCount = (await this.findVisibleElements("[data-testid='haya-select/options-container']")).length
      const visibleOptionsCount = (await this.findVisibleElements("[data-testid='haya-select/option']")).length

      if (open || visibleContainersCount > 0 || visibleOptionsCount > 0) {
        throw new Error(`Expected ${this.testId} options to close, got open=${open}, visibleContainers=${visibleContainersCount}, visibleOptions=${visibleOptionsCount}`)
      }
    })
  }

  /** @returns {Promise<boolean>} */
  async isOpen() {
    const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)

    if (openedElements.length > 0) return true

    const searchInputs = await this.findVisibleElements(this.searchInputSelector)

    return searchInputs.length > 0
  }

  /**
   * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
   * @returns {Promise<void>} Completes after the select container click.
   */
  async clickSelectContainer({timeout = DEFAULT_TIMEOUT, useBaseSelector = true} = {}) {
    const selectContainer = await this.systemTest.find(this.selectContainerSelector, {timeout, useBaseSelector})

    await selectContainer.click()
  }

  /**
   * @param {string} selector
   * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
   */
  async findElements(selector) {
    return await this.systemTest.getDriver().findElements(By.css(selector))
  }

  /**
   * @param {string} selector
   * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
   */
  async findVisibleElements(selector) {
    const elements = await this.findElements(selector)
    const visibleElements = []

    for (const element of elements) {
      if (await element.isDisplayed()) {
        visibleElements.push(element)
      }
    }

    return visibleElements
  }

  /** @returns {Promise<string>} */
  async optionsContainerSelector() {
    if (this._optionsContainerSelector) return this._optionsContainerSelector

    const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)
    const componentElements = openedElements.length > 0 ? openedElements : await this.findVisibleElements(this.componentSelector)
    const id = componentElements.length > 0 ? await componentElements[0].getAttribute("data-id") : null

    this._optionsContainerSelector = id ? `[data-testid='haya-select/options-container'][data-id="${cssAttributeValue(id)}"]` : this.optionsContainerSelectorFallback

    return this._optionsContainerSelector
  }

  /** @returns {Promise<string[]>} */
  async optionTexts() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`)

    return await Promise.all(options.map(async (option) => (await option.getText()).trim()))
  }

  /**
   * @param {{index?: number, text?: string, value?: string|number}} criteria
   * @returns {Promise<void>}
   */
  async selectOption({index, text, value, ...restArgs} = {}) {
    if (arguments.length === 0) {
      throw new Error("Expected criteria for selectOption, got: undefined")
    }

    const extraKeys = Object.keys(restArgs)

    if (extraKeys.length > 0) {
      throw new Error(`Unexpected selectOption criteria: ${extraKeys.join(", ")}`)
    }

    if (typeof value != "undefined") {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option'][data-value="${cssAttributeValue(value)}"]`)
        const option = options[0]

        if (!option) {
          throw new Error(`No option for value: ${value}`)
        }

        await option.click()
      })
      return
    }

    if (typeof index == "number") {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`)
        const option = options[index]

        if (!option) throw new Error(`No option at index: ${index}`)

        await option.click()
      })
      return
    }

    if (text) {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`)

        for (const option of options) {
          const optionText = (await option.getText()).trim()

          if (optionText === text) {
            await option.click()
            return
          }
        }

        throw new Error(`No option found with text: ${text}`)
      })
      return
    }

    throw new Error("Expected value, text, or index when selecting an option")
  }
}

/**
 * Clicks a visible HayaSelect option by backend value.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string | number} optionValue Backend value stored in `data-value`.
 * @param {number} timeout Maximum wait in milliseconds.
 * @param {string} [optionsContainerSelector] Options container selector to scope the lookup.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
async function clickVisibleSelectOptionByValue(systemTest, optionValue, timeout, optionsContainerSelector = "") {
  const selector = `${optionsContainerSelector ? `${optionsContainerSelector} ` : ""}[data-testid="haya-select/option"][data-value="${cssAttributeValue(optionValue)}"]`
  const element = await findVisibleElement(systemTest, selector, timeout)
  await element.click()
}

/**
 * Clicks a visible HayaSelect option by displayed text.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} expectedText Visible fragment rendered by the option.
 * @param {number} timeout Maximum wait in milliseconds.
 * @param {string} [optionsContainerSelector] Options container selector to scope the lookup.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
async function clickVisibleSelectOptionByText(systemTest, expectedText, timeout, optionsContainerSelector = "") {
  const element = /** @type {WebElement} */ (
    await systemTest.getDriver().wait(
      async () => {
        const selector = `${optionsContainerSelector ? `${optionsContainerSelector} ` : ""}[data-testid='haya-select/option']`
        const optionElements = await systemTest.getDriver().findElements(By.css(selector))

        for (const optionElement of optionElements) {
          if (!(await optionElement.isDisplayed())) {
            continue
          }

          const actualText = await optionElement.getText()
          if (actualText.includes(expectedText)) {
            return optionElement
          }
        }

        return false
      },
      timeout,
      `Timed out waiting for visible select option text ${expectedText}`
    )
  )

  await element.click()
}

/**
 * Finds a visible element by CSS selector.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} selector CSS query that can match one or more nodes.
 * @param {number} timeout Maximum wait in milliseconds.
 * @returns {Promise<WebElement>} First displayed match.
 */
async function findVisibleElement(systemTest, selector, timeout) {
  const element = await systemTest.getDriver().wait(
    async () => {
      const elements = await systemTest.getDriver().findElements(By.css(selector))

      for (const element of elements) {
        if (await element.isDisplayed()) {
          return element
        }
      }

      return false
    },
    timeout,
    `Timed out waiting for visible selector ${selector}`
  )

  return /** @type {WebElement} */ (element)
}

/**
 * Builds a data-testid CSS selector.
 * @param {string} testId Raw value from the component's `testID` prop.
 * @returns {string} Attribute selector for the value.
 */
function testIdSelector(testId) {
  return `[data-testid="${cssAttributeValue(testId)}"]`
}

/**
 * Escapes a value for use inside a double-quoted CSS attribute selector.
 * @param {string | number} value Raw attribute value to interpolate.
 * @returns {string} String safe for a double-quoted attribute selector.
 */
function cssAttributeValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}
