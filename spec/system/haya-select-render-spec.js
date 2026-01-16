import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import SystemTest from "system-testing/build/system-test.js"

SystemTest.rootPath = "/?systemTest=true"
const systemTestArgs = {debug: true}

beforeAll(async () => {
  const systemTest = SystemTest.current(systemTestArgs)
  await timeout({timeout: 90000}, async () => {
    await systemTest.start()
  })
  systemTest.setBaseSelector("[data-testid='systemTestingComponent']")
})

afterAll(async () => {
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

describe("HayaSelect", () => {
  afterEach(async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await closePaginatedSelect(systemTest)
      })
    })
  })

  it("renders in the example app", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})
      })
    })
  })

  it("filters options when searching", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})
        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']")

        const searchInput = await systemTest.find("[data-testid='hayaSelectRoot'] [data-class='search-text-input']")
        await systemTest.interact(searchInput, "sendKeys", "tw")

        await waitFor({timeout: 5000}, async () => {
          const options = await systemTest.all("[data-class='select-option']", {useBaseSelector: false})
          const texts = await Promise.all(options.map(async (option) => (await option.getText()).trim()))

          if (texts.length !== 1 || texts[0] !== "Two") {
            throw new Error(`Unexpected options: ${texts.join(", ")}`)
          }
        })

        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']")
        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          )

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible")
          }
        })
      })
    })
  })

  it("highlights selected options in multiple select", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 60000})
        await systemTest.click("[data-testid='hayaSelectMultipleRoot'] [data-class='select-container']")

        await waitFor({timeout: 5000}, async () => {
          await systemTest.find("[data-class='select-option'][data-value='one']", {useBaseSelector: false})
        })

        const optionOne = await systemTest.find("[data-class='select-option'][data-value='one']", {useBaseSelector: false})
        await systemTest.click(optionOne)

        const optionTwo = await systemTest.find("[data-class='select-option'][data-value='two']", {useBaseSelector: false})
        await systemTest.click(optionTwo)

        const scoundrel = await systemTest.getScoundrelClient()
        const colors = await scoundrel.evalResult(`
          const toRgb = (color) => {
            const element = document.createElement("div")
            element.style.backgroundColor = color
            document.body.appendChild(element)
            const rgb = window.getComputedStyle(element).backgroundColor
            element.remove()
            return rgb
          }

          const selected = Array.from(document.querySelectorAll("[data-class='select-option'][data-selected='true']"))
            .map((element) => window.getComputedStyle(element).backgroundColor)

          return {
            allowed: [toRgb("#cfe1ff"), toRgb("#9bbcfb")],
            selected
          }
        `)

        expect(colors.selected.length).toBeGreaterThan(0)
        colors.selected.forEach((color) => {
          expect(colors.allowed.includes(color)).toBe(true)
        })

        await systemTest.click("[data-testid='hayaSelectMultipleRoot'] [data-class='select-container']")
        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectMultipleRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          )

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible")
          }
        })
      })
    })
  })

  it("keeps rounded corners after opening and closing", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})

        const scoundrel = await systemTest.getScoundrelClient()
        const getBorderRadii = async () => await scoundrel.evalResult(`
          const element = document.querySelector("[data-testid='hayaSelectRoot'] [data-class='select-container']")
          if (!element) return null
          const style = window.getComputedStyle(element)

          return {
            topLeft: style.borderTopLeftRadius,
            topRight: style.borderTopRightRadius,
            bottomLeft: style.borderBottomLeftRadius,
            bottomRight: style.borderBottomRightRadius
          }
        `)

        const isOpen = await scoundrel.evalResult(`
          return Boolean(document.querySelector("[data-testid='hayaSelectRoot'] [data-class='search-text-input']"))
        `)

        if (isOpen) {
          await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']")
          await waitFor({timeout: 5000}, async () => {
            const searchInputs = await systemTest.all(
              "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
              {timeout: 0, visible: false}
            )

            if (searchInputs.length > 0) {
              throw new Error("Search input is still visible")
            }
          })
        }

        const initialRadii = await getBorderRadii()
        expect(initialRadii).not.toBeNull()

        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']")
        await systemTest.find("[data-testid='hayaSelectRoot'] [data-class='search-text-input']")
        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']")

        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          )

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible")
          }
        })

        const finalRadii = await getBorderRadii()

        expect(finalRadii).toEqual(initialRadii)
        expect(finalRadii.topLeft).not.toBe("0px")
        expect(finalRadii.topRight).not.toBe("0px")
        expect(finalRadii.bottomLeft).not.toBe("0px")
        expect(finalRadii.bottomRight).not.toBe("0px")
      })
    })
  })

  it("changes page when clicking a page number", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)

        const pageTwo = await findPaginationPageButton(systemTest, 2)
        await systemTest.click(pageTwo)

        await waitFor({timeout: 5000}, async () => {
          const labelText = await paginationLabelText(systemTest)
          if (labelText !== "Page 2 of 5") {
            throw new Error(`Unexpected pagination label: ${labelText}`)
          }
        })

        await waitFor({timeout: 5000}, async () => {
          const options = await systemTest.all("[data-class='select-option']", {useBaseSelector: false})
          const texts = await Promise.all(options.map(async (option) => (await option.getText()).trim()))

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
      })
    })
  })

  it("supports next and previous pagination buttons", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 60000})
        await openPaginatedSelect(systemTest)
        await waitForPaginationLabel(systemTest, "Page 1 of 5")

        await clickPaginationSelector(systemTest, "[data-class='pagination-next']")
        await waitForPaginationLabel(systemTest, "Page 2 of 5")

        await clickPaginationSelector(systemTest, "[data-class='pagination-prev']")
        await waitForPaginationLabel(systemTest, "Page 1 of 5")
      })
    })
  })
})
