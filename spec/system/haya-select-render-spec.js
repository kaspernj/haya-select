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

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000})
      })
    })
  })

  it("renders optionContent callbacks", async () => {
    await timeout({timeout: 90000}, async () => {
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
    await timeout({timeout: 90000}, async () => {
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

  it("filters options when searching", async () => {
    await timeout({timeout: 90000}, async () => {
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
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMultipleRoot"})

        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 60000})
        await helper.open()

        await waitFor({timeout: 5000}, async () => {
          await systemTest.find("[data-class='select-option'][data-value='one']", {useBaseSelector: false})
        })

        await helper.selectOption({value: "one"})
        await helper.selectOption({value: "two"})

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

        await helper.close()
      })
    })
  })

  it("keeps rounded corners after opening and closing", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

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
