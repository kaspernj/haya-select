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

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})
      })
    })
  })

  it("renders optionContent callbacks", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectOptionContentRoot"})

        await systemTest.findByTestID("hayaSelectOptionContentRoot", {timeout: 60000})
        await helper.open()

        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts.includes("Custom One")) {
            throw new Error(`Unexpected option content: ${texts.join(", ")}`)
          }
        })

        await helper.close()
      })
    })
  })

  it("renders right option content", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRightOptionRoot"})

        await systemTest.findByTestID("hayaSelectRightOptionRoot", {timeout: 60000})
        await helper.open()

        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts.some((text) => text.includes("Right One"))) {
            throw new Error(`Unexpected right option content: ${texts.join(", ")}`)
          }
        })

        await helper.close()
      })
    })
  })

  it("closes options after change-triggered re-render", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectCloseOnChangeRoot"})

        await systemTest.findByTestID("hayaSelectCloseOnChangeRoot", {timeout: 60000})
        await helper.open()
        await helper.selectOption({value: "points"})

        const optionsContainerSelector = await helper.optionsContainerSelector()

        await waitFor({timeout: 5000}, async () => {
          const visibleOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false})

          if (visibleOptions.length > 0) {
            throw new Error(`Expected options container to be hidden, found ${visibleOptions.length} visible`)
          }
        })
      })
    })
  })

  it("filters options when searching", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})
        await helper.open()

        const searchInput = await systemTest.find(helper.searchInputSelector)
        await systemTest.interact(searchInput, "sendKeys", "tw")

        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (texts.length !== 1 || !texts[0].includes("Two")) {
            throw new Error(`Unexpected options: ${texts.join(", ")}`)
          }
        })

        await helper.close()
      })
    })
  })

  it("highlights selected options in multiple select", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMultipleRoot"})

        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 60000})
        await helper.open()

        const optionsContainerSelector = await helper.optionsContainerSelector()

        await waitFor({timeout: 5000}, async () => {
          await systemTest.find(
            `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
            {useBaseSelector: false}
          )
        })

        await helper.selectOption({value: "one"})
        await helper.selectOption({value: "two"})

        const toRgb = async (color) => await systemTest.getDriver().executeScript(`
          const element = document.createElement("div")
          element.style.backgroundColor = ${JSON.stringify(color)}
          document.body.appendChild(element)
          const rgb = window.getComputedStyle(element).backgroundColor
          element.remove()
          return rgb
        `)

        const selectedElements = await systemTest.all(
          "[data-class='select-option'][data-selected='true']",
          {timeout: 0, useBaseSelector: false}
        )
        const selected = await Promise.all(selectedElements.map((element) => element.getCssValue("background-color")))
        const normalizeColor = (value) => value.replace(/rgba\((\d+), (\d+), (\d+), 1\)/, "rgb($1, $2, $3)")
        const normalizedSelected = selected.map(normalizeColor)
        const allowed = [await toRgb("#cfe1ff"), await toRgb("#9bbcfb")]

        if (selected.length <= 0) {
          throw new Error("Expected at least one selected option")
        }
        normalizedSelected.forEach((color) => {
          if (!allowed.includes(color)) {
            throw new Error(`Unexpected selected color: ${color}`)
          }
        })

        await helper.selectOption({value: "one"})
        await helper.selectOption({value: "two"})

        await helper.close()
      })
    })
  })

  it("clears selected options after deselecting all values", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMultipleRoot"})

        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 60000})

        const currentSelectedText = async () => {
          const elements = await systemTest.all(
            "[data-testid='hayaSelectMultipleRoot'] [data-class='current-selected']",
            {timeout: 0}
          )
          return elements.length > 0 ? (await elements[0].getText()).trim() : ""
        }

        const currentOptionCount = async () => {
          const options = await systemTest.all(
            "[data-testid='hayaSelectMultipleRoot'] [data-class='current-option']",
            {timeout: 0}
          )
          return options.length
        }

        if (await helper.isOpen()) {
          await helper.close()
        }

        await helper.open()

        const selectedElements = await systemTest.all(
          "[data-testid='hayaSelectMultipleRoot'] [data-class='select-option'][data-selected='true']",
          {timeout: 0, useBaseSelector: false}
        )
        const selectedValues = await Promise.all(
          selectedElements.map((element) => element.getAttribute("data-value"))
        )

        for (const value of selectedValues) {
          await helper.selectOption({value})
        }

        await helper.close()

        await helper.open()
        await helper.selectOption({value: "one"})
        await helper.close()

        await waitFor({timeout: 5000}, async () => {
          const text = await currentSelectedText()

          if (!text.includes("One")) {
            throw new Error(`Expected selected label, got: ${text}`)
          }
        })

        await helper.open()
        await helper.selectOption({value: "one"})
        await helper.close()

        await waitFor({timeout: 5000}, async () => {
          const count = await currentOptionCount()
          const text = await currentSelectedText()

          if (count !== 0) {
            throw new Error(`Expected 0 current options, got: ${count}`)
          }

          if (!text.includes("Pick multiple")) {
            throw new Error(`Expected placeholder, got: ${text}`)
          }
        })
      })
    })
  })

  it("keeps rounded corners after opening and closing", async () => {
    await timeout({timeout: 60000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})

        const getBorderRadii = async () => {
          const elements = await systemTest.all(
            "[data-testid='hayaSelectRoot'] [data-class='select-container']",
            {timeout: 0}
          )
          if (elements.length === 0) return null
          const element = elements[0]

          return {
            topLeft: await element.getCssValue("border-top-left-radius"),
            topRight: await element.getCssValue("border-top-right-radius"),
            bottomLeft: await element.getCssValue("border-bottom-left-radius"),
            bottomRight: await element.getCssValue("border-bottom-right-radius")
          }
        }

        if (await helper.isOpen()) {
          await helper.close()
        }

        const initialRadii = await getBorderRadii()
        expect(initialRadii).not.toBeNull()

        await helper.open()
        await helper.close()

        const finalRadii = await getBorderRadii()

        expect(finalRadii).toEqual(initialRadii)
        expect(finalRadii.topLeft).not.toBe("0px")
        expect(finalRadii.topRight).not.toBe("0px")
        expect(finalRadii.bottomLeft).not.toBe("0px")
        expect(finalRadii.bottomRight).not.toBe("0px")
      })
    })
  })

})
