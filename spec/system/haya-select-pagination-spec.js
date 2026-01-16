import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import SystemTest from "system-testing/build/system-test.js"

import HayaSelectSystemTestHelper from "../../src/system-test-helpers.js"

SystemTest.rootPath = "/?systemTest=true"
const systemTestArgs = {debug: true}
let didStartSystemTest = false

beforeAll(async () => {
  const systemTest = SystemTest.current(systemTestArgs)
  if (!systemTest.isStarted()) {
    await timeout({timeout: 90000}, async () => {
      await systemTest.start()
    })
    didStartSystemTest = true
  }
  systemTest.setBaseSelector("[data-testid='systemTestingComponent']")
})

afterAll(async () => {
  if (!didStartSystemTest) return

  await timeout({timeout: 120000}, async () => {
    await SystemTest.current().stop()
  })
})

const openPaginatedSelect = async (systemTest) => {
  const scoundrel = await systemTest.getScoundrelClient()
  const isOpen = await scoundrel.evalResult(`
    return Boolean(document.querySelector("[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']"))
  `)

  if (!isOpen) {
    await systemTest.click("[data-testid='hayaSelectPaginationRoot'] [data-class='select-container']")
    await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']")
  }

  await waitFor({timeout: 5000}, async () => {
    const paginationVisible = await scoundrel.evalResult(`
      return Boolean(document.querySelector("[data-class='options-pagination']"))
    `)

    if (!paginationVisible) {
      throw new Error("Pagination not visible yet")
    }
  })

  const labelText = await scoundrel.evalResult(`
    const label = document.querySelector("[data-class='pagination-label']")
    return label ? label.textContent.trim() : null
  `)

  if (labelText && !labelText.startsWith("Page 1 of ")) {
    const pageOne = await findPaginationPageButton(systemTest, 1)
    await systemTest.click(pageOne)
  }

  await waitForPaginationLabel(systemTest, "Page 1 of 5")
}

const closePaginatedSelect = async (systemTest) => {
  const scoundrel = await systemTest.getScoundrelClient()
  const isOpen = await scoundrel.evalResult(`
    return Boolean(document.querySelector("[data-testid='hayaSelectPaginationRoot'] [data-class='search-text-input']"))
  `)

  if (isOpen) {
    await systemTest.click("[data-testid='hayaSelectPaginationRoot'] [data-class='select-container']")
  }
}

const paginationLabelText = async (systemTest) => {
  const scoundrel = await systemTest.getScoundrelClient()

  return await scoundrel.evalResult(`
    const element = document.querySelector("[data-class='pagination-label']")
    return element ? element.textContent.trim() : null
  `)
}

const waitForPaginationLabel = async (systemTest, expectedText) => {
  await waitFor({timeout: 5000}, async () => {
    const labelText = await paginationLabelText(systemTest)

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
  const scoundrel = await systemTest.getScoundrelClient()

  await waitFor({timeout: 5000}, async () => {
    const clicked = await scoundrel.evalResult(`
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!element) return false
      element.click()
      return true
    `)

    if (!clicked) {
      throw new Error(`Pagination element not ready for selector: ${selector}`)
    }
  })
}

describe("HayaSelect pagination", () => {
  afterEach(async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await closePaginatedSelect(systemTest)
      })
    })
  })

  it("changes page when clicking a page number", async () => {
    await timeout({timeout: 90000}, async () => {
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
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)

        await clickPaginationSelector(systemTest, "[data-class='pagination-label']")
        const paginationInput = await systemTest.find("[data-class='pagination-input']", {useBaseSelector: false, timeout: 5000})
        await systemTest.interact(paginationInput, "click")
        await systemTest.interact(paginationInput, "sendKeys", "\uE009a")
        await systemTest.interact(paginationInput, "sendKeys", "\uE003")
        await systemTest.interact(paginationInput, "sendKeys", "4")
        await systemTest.interact(paginationInput, "sendKeys", "\uE006")

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
    await timeout({timeout: 90000}, async () => {
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
