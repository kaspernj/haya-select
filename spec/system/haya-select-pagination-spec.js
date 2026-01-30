import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import SystemTest from "system-testing/build/system-test.js"

import HayaSelectSystemTestHelper from "../../src/system-test-helpers.js"

SystemTest.rootPath = "/?systemTest=true"
const systemTestArgs = {debug: false}
let didStartSystemTest = false

beforeAll(async () => {
  const systemTest = SystemTest.current(systemTestArgs)
  if (!systemTest.isStarted()) {
    await timeout({timeout: 60000}, async () => {
      await systemTest.start()
    })
    didStartSystemTest = true
  }
  systemTest.setBaseSelector("[data-testid='systemTestingComponent']")
})

afterAll(async () => {
  if (!didStartSystemTest) return

  await timeout({timeout: 60000}, async () => {
    await SystemTest.current().stop()
  })
})

const setPaginationInputValue = async (systemTest, value) => {
  await waitFor({timeout: 5000}, async () => {
    const element = await systemTest.find("[data-class='pagination-input']", {useBaseSelector: false})
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', {bubbles: true})); arguments[0].dispatchEvent(new Event('change', {bubbles: true})); arguments[0].blur();",
      element,
      String(value)
    )
  })
}

const openPaginatedSelect = async (systemTest) => {
  const selectContainer = await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-class='select-container']")
  const driver = systemTest.getDriver()
  const searchInputs = await systemTest.all(
    "[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']",
    {timeout: 0, visible: true}
  )

  if (searchInputs.length > 0) {
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
      selectContainer
    )
    await systemTest.click(selectContainer)
    await waitFor({timeout: 10000}, async () => {
      const searchInputsAfterClick = await systemTest.all(
        "[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']",
        {timeout: 0, visible: true}
      )

      if (searchInputsAfterClick.length > 0) {
        throw new Error("Search input still visible")
      }
    })
  }

  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
    selectContainer
  )
  await systemTest.click(selectContainer)
  await waitFor({timeout: 10000}, async () => {
    const searchInputsAfterClick = await systemTest.all(
      "[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']",
      {timeout: 0, visible: true}
    )

    if (searchInputsAfterClick.length === 0) {
      throw new Error("Search input not visible yet")
    }
  })

  await waitFor({timeout: 5000}, async () => {
    const paginationElements = await systemTest.all("[data-class='options-pagination']", {timeout: 0, useBaseSelector: false})

    if (paginationElements.length === 0) {
      throw new Error("Pagination not visible yet")
    }
  })

  await paginationLabelText(systemTest)
}

const closePaginatedSelect = async (systemTest) => {
  const inputs = await systemTest.all(
    "[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']",
    {timeout: 0, visible: true}
  )

  if (inputs.length > 0) {
    const selectContainer = await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-class='select-container']")
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
      selectContainer
    )
    await systemTest.click(selectContainer)
  }
}

const paginationLabelText = async (systemTest) => {
  const labelElements = await systemTest.all("[data-class='pagination-input']", {timeout: 0, useBaseSelector: false})

  if (labelElements.length === 0) return null

  const value = await labelElements[0].getAttribute("value")

  return value ? value.trim() : ""
}

const waitForPaginationLabel = async (systemTest, expectedText) => {
  const expectedPage = Number(expectedText.match(/Page (\\d+) of/)?.[1])
  await waitFor({timeout: 5000}, async () => {
    const labelText = await paginationLabelText(systemTest)

    if (labelText === expectedText) return

    if (Number.isFinite(expectedPage) && labelText === String(expectedPage)) return

    if (!Number.isFinite(expectedPage) && labelText === expectedText) return

    if (labelText !== expectedText) {
      throw new Error(`Unexpected pagination label: ${labelText}`)
    }
  })
}

const findPaginationPageButton = async (systemTest, pageNumber) => {
  let matchingButton

  await waitFor({timeout: 5000}, async () => {
    const pageButtons = await systemTest.all("[data-class='pagination-page']", {useBaseSelector: false})

    for (const pageButton of pageButtons) {
      const buttonText = (await pageButton.getText()).trim()

      if (buttonText === String(pageNumber)) {
        matchingButton = pageButton
        return
      }
    }

    throw new Error(`Pagination button not found for page ${pageNumber}`)
  })

  return matchingButton
}

const clickPaginationSelector = async (systemTest, selector) => {
  await waitFor({timeout: 5000}, async () => {
    const element = await systemTest.find(selector, {useBaseSelector: false})
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
      element
    )
    await driver.executeScript("arguments[0].focus()", element)
    await systemTest.click(element)
  })
}

describe("HayaSelect pagination", () => {
  afterEach(async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await closePaginatedSelect(systemTest)
      })
    })
  })

  it("changes page when clicking a page number", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)

        const pageTwo = await findPaginationPageButton(systemTest, 2)
        await systemTest.click(pageTwo)

        await waitForPaginationLabel(systemTest, "Page 2 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 2 Item 6")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })
      })
    })
  })

  it("accepts manual page entry from the pagination label", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)

        await setPaginationInputValue(systemTest, "4")

        await waitForPaginationLabel(systemTest, "Page 4 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 4 Item 16")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })
      })
    })
  })

  it("supports next and previous pagination buttons", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)
        await waitForPaginationLabel(systemTest, "Page 1 of 5")

        await clickPaginationSelector(systemTest, "[data-class='pagination-next']")
        await waitForPaginationLabel(systemTest, "Page 2 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 2 Item 6")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })

        await clickPaginationSelector(systemTest, "[data-class='pagination-prev']")
        await waitForPaginationLabel(systemTest, "Page 1 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 1 Item 1")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })
      })
    })
  })
})
