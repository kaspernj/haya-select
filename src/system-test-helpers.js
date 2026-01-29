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
  }

  /** @returns {Promise<void>} */
  async open() {
    await this.systemTest.click(this.selectContainerSelector)
    await this.systemTest.find(this.searchInputSelector)
    this._optionsContainerSelector = null
  }

  /** @returns {Promise<void>} */
  async close() {
    await this.systemTest.click(this.selectContainerSelector)
    await waitFor({timeout: 5000}, async () => {
      const searchInputs = await this.systemTest.all(this.searchInputSelector, {timeout: 0, visible: false})

      if (searchInputs.length > 0) {
        throw new Error("Search input is still visible")
      }
    })
  }

  /** @returns {Promise<boolean>} */
  async isOpen() {
    const scoundrel = await this.systemTest.getScoundrelClient()

    return await scoundrel.evalResult(`
      return Boolean(document.querySelector(${JSON.stringify(this.searchInputSelector)}))
    `)
  }

  /** @returns {Promise<string>} */
  async optionsContainerSelector() {
    if (this._optionsContainerSelector) return this._optionsContainerSelector

    const scoundrel = await this.systemTest.getScoundrelClient()
    const selector = await scoundrel.evalResult(`
      const root = document.querySelector(${JSON.stringify(this.componentSelector)}) ||
        document.querySelector(${JSON.stringify(this.rootSelector)})
      const id = root?.dataset?.id
      return id ? "[data-class='options-container'][data-id='" + id + "']" : null
    `)

    this._optionsContainerSelector = selector || "[data-class='options-container']"

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
        const option = await this.systemTest.find(
          `${optionsContainerSelector} [data-class='select-option'][data-value='${value}']`,
          {useBaseSelector: false}
        )

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
