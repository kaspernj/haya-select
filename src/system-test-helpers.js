import waitFor from "awaitery/build/wait-for.js"

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
    this.componentSelector = `${this.rootSelector} [data-component='haya-select']`
    this.selectContainerSelector = `${this.rootSelector} [data-class='select-container']`
    this.searchInputSelector = `${this.rootSelector} [data-class='search-text-input']`
    this.optionsContainerSelectorFallback = "[data-class='options-container']"
  }

  /** @returns {Promise<void>} */
  async open() {
    if (await this.isOpen()) return

    const selectContainer = await this.systemTest.find(this.selectContainerSelector)
    const driver = this.systemTest.getDriver()
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'})", selectContainer)
    await this.systemTest.click(selectContainer)
    try {
      await waitFor({timeout: 2000}, async () => {
        if (!(await this.isOpen())) {
          throw new Error("Options not visible yet")
        }
      })
    } catch (_error) {
      await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))", selectContainer)
      await waitFor({timeout: 10000}, async () => {
        if (!(await this.isOpen())) {
          throw new Error("Options not visible yet")
        }
      })
    }
    this._optionsContainerSelector = null
  }

  /** @returns {Promise<void>} */
  async close() {
    const selectContainer = await this.systemTest.find(this.selectContainerSelector)
    const driver = this.systemTest.getDriver()
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'})", selectContainer)
    await this.systemTest.click(selectContainer)
    try {
      await waitFor({timeout: 2000}, async () => {
        if (await this.isOpen()) {
          throw new Error("Options are still visible")
        }
      })
    } catch (_error) {
      await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))", selectContainer)
      await waitFor({timeout: 5000}, async () => {
        if (await this.isOpen()) {
          throw new Error("Options are still visible")
        }
      })
    }
  }

  /** @returns {Promise<boolean>} */
  async isOpen() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false})

    for (const option of options) {
      if (await option.isDisplayed()) return true
      const visibility = await option.getCssValue("visibility")
      if (visibility && visibility !== "hidden") return true
    }

    const searchInputs = await this.systemTest.all(this.searchInputSelector, {timeout: 0, visible: true})

    return searchInputs.length > 0
  }

  /** @returns {Promise<string>} */
  async optionsContainerSelector() {
    if (this._optionsContainerSelector) return this._optionsContainerSelector

    let elements = await this.systemTest.all(this.componentSelector, {timeout: 0})

    if (elements.length === 0) {
      elements = await this.systemTest.all(this.rootSelector, {timeout: 0})
    }

    const id = elements.length > 0 ? await elements[0].getAttribute("data-id") : null

    this._optionsContainerSelector = id ? `[data-class='options-container'][data-id='${id}']` : this.optionsContainerSelectorFallback

    return this._optionsContainerSelector
  }

  /** @returns {Promise<string[]>} */
  async optionTexts() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.systemTest.all(`${optionsContainerSelector} [data-class='select-option']`, {useBaseSelector: false})

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
        const option = await this.systemTest.find(`${optionsContainerSelector} [data-class='select-option'][data-value='${value}']`, {useBaseSelector: false})

        await this.systemTest.click(option)
      })
      return
    }

    if (typeof index == "number") {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.systemTest.all(`${optionsContainerSelector} [data-class='select-option']`, {useBaseSelector: false})
        const option = options[index]

        if (!option) throw new Error(`No option at index: ${index}`)

        await this.systemTest.click(option)
      })
      return
    }

    if (text) {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.systemTest.all(`${optionsContainerSelector} [data-class='select-option']`, {useBaseSelector: false})

        for (const option of options) {
          const optionText = (await option.getText()).trim()

          if (optionText === text) {
            await this.systemTest.click(option)
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
