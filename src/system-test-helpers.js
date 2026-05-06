import waitFor from "awaitery/build/wait-for.js"
import {By} from "selenium-webdriver"

/** @typedef {{systemTest: object, testId: string}} HayaSelectSystemTestHelperOptions */

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
    this.rootSelector = `[data-testid='${testId}']`
    this.componentSelector = `${this.rootSelector} [data-testid='haya-select']`
    this.chevronContainerSelector = `${this.rootSelector} [data-testid='haya-select-chevron-container']`
    this.selectContainerSelector = `${this.rootSelector} [data-testid='haya-select-select-container']`
    this.searchInputSelector = `${this.rootSelector} [data-testid='haya-select-search-input']`
    this.optionsContainerSelectorFallback = "[data-testid='haya-select-options-container']"
  }

  /** @returns {Promise<void>} */
  async open() {
    await this.clickSelectContainer()
    this._optionsContainerSelector = null

    await waitFor({timeout: 5000}, async () => {
      const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)

      if (openedElements.length === 0) {
        throw new Error(`Expected HayaSelect to open: ${this.testId}`)
      }
    })
  }

  /** @returns {Promise<void>} */
  async close() {
    await this.clickSelectContainer()

    await waitFor({timeout: 5000}, async () => {
      const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`)

      if (openedElements.length > 0) {
        throw new Error(`Expected HayaSelect to close: ${this.testId}`)
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

  /** @returns {Promise<void>} */
  async clickSelectContainer() {
    const selectContainer = await this.systemTest.find(this.selectContainerSelector, {timeout: 5000})

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

    const rootElements = await this.findElements(this.rootSelector)
    const rootId = rootElements.length > 0 ? await rootElements[0].getAttribute("data-id") : null
    let elements = rootElements

    if (!rootId) {
      elements = await this.findElements(this.componentSelector)
    }

    const id = rootId || (elements.length > 0 ? await elements[0].getAttribute("data-id") : null)

    this._optionsContainerSelector = id ? `[data-testid='haya-select-options-container'][data-id='${id}']` : this.optionsContainerSelectorFallback

    return this._optionsContainerSelector
  }

  /** @returns {Promise<string[]>} */
  async optionTexts() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select-option']`)

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
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select-option'][data-value='${value}']`)
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
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select-option']`)
        const option = options[index]

        if (!option) throw new Error(`No option at index: ${index}`)

        await option.click()
      })
      return
    }

    if (text) {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select-option']`)

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
