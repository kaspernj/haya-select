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

    const selectContainer = await this.systemTest.find(this.selectContainerSelector, {timeout: 5000})
    const driver = this.systemTest.getDriver()
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'})", selectContainer)
    await driver.executeScript("arguments[0].click()", selectContainer)
    this._optionsContainerSelector = null
  }

  /** @returns {Promise<void>} */
  async close() {
    const selectContainer = await this.systemTest.find(this.selectContainerSelector, {timeout: 5000})
    const driver = this.systemTest.getDriver()
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'})", selectContainer)
    await driver.executeScript("arguments[0].click()", selectContainer)
    await driver.executeScript("document.body && document.body.click()")
  }

  /** @returns {Promise<boolean>} */
  async isOpen() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false})

    if (options.length > 0) return true

    const searchInputs = await this.systemTest.all(this.searchInputSelector, {timeout: 0, visible: true})

    return searchInputs.length > 0
  }

  /** @returns {Promise<string>} */
  async optionsContainerSelector() {
    if (this._optionsContainerSelector) return this._optionsContainerSelector

    const rootElements = await this.systemTest.all(this.rootSelector, {timeout: 0})
    const rootId = rootElements.length > 0 ? await rootElements[0].getAttribute("data-id") : null
    let elements = rootElements

    if (!rootId) {
      elements = await this.systemTest.all(this.componentSelector, {timeout: 0})
    }

    const id = rootId || (elements.length > 0 ? await elements[0].getAttribute("data-id") : null)

    this._optionsContainerSelector = id ? `[data-class='options-container'][data-id='${id}']` : this.optionsContainerSelectorFallback

    return this._optionsContainerSelector
  }

  /** @returns {Promise<string[]>} */
  async optionTexts() {
    const optionsContainerSelector = await this.optionsContainerSelector()
    const options = await this.systemTest.all(`${optionsContainerSelector} [data-class='select-option']`, {useBaseSelector: false, timeout: 0})

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
        const options = await this.systemTest.all(
          `${optionsContainerSelector} [data-class='select-option'][data-value='${value}']`,
          {useBaseSelector: false, timeout: 0}
        )
        const option = options[0]

        if (!option) {
          throw new Error(`No option for value: ${value}`)
        }
        const driver = this.systemTest.getDriver()
        await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))", option)
      })
      return
    }

    if (typeof index == "number") {
      await waitFor({timeout: 5000}, async () => {
        const optionsContainerSelector = await this.optionsContainerSelector()
        const options = await this.systemTest.all(`${optionsContainerSelector} [data-class='select-option']`, {useBaseSelector: false, timeout: 0})
        const option = options[index]

        if (!option) throw new Error(`No option at index: ${index}`)

        const driver = this.systemTest.getDriver()
        await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))", option)
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
