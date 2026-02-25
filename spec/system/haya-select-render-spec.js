import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import SystemTest from "system-testing/build/system-test.js"
import {setupSystemTestLifecycle, systemTestArgs} from "./system-test-lifecycle.js"

import HayaSelectSystemTestHelper from "../../src/system-test-helpers.js"

setupSystemTestLifecycle()

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({errorMessage: "render test timed out: renders in the example app", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
      })
    })
  })

  it("renders optionContent callbacks", async () => {
    await timeout({errorMessage: "render test timed out: renders optionContent callbacks", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectOptionContentRoot"})

        await systemTest.findByTestID("hayaSelectOptionContentRoot", {timeout: 5000})
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
    await timeout({errorMessage: "render test timed out: renders right option content", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRightOptionRoot"})

        await systemTest.findByTestID("hayaSelectRightOptionRoot", {timeout: 5000})
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
    await timeout({errorMessage: "render test timed out: closes options after change-triggered re-render", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectCloseOnChangeRoot"})

        await systemTest.findByTestID("hayaSelectCloseOnChangeRoot", {timeout: 5000})
        await helper.open()
        await helper.selectOption({value: "points"})

        await waitFor({timeout: 5000}, async () => {
          const details = await systemTest.all("[data-testid='hayaSelectCloseOnChangeDetails']", {timeout: 0, useBaseSelector: false})

          if (details.length === 0) {
            throw new Error("Expected points details to render")
          }
        })
      })
    })
  })

  it("renders hidden input for controlled values without current options", async () => {
    await SystemTest.run(systemTestArgs, async (systemTest) => {
      await systemTest.findByTestID("hayaSelectControlledValuesRoot", {timeout: 5000})

      await waitFor({timeout: 5000}, async () => {
        const inputs = await systemTest.all(
          "[data-testid='hayaSelectControlledValuesRoot'] [data-class='current-selected'] input[type='hidden']",
          {timeout: 0, visible: null}
        )
        const values = await Promise.all(inputs.map((input) => input.getAttribute("value")))
        const names = await Promise.all(inputs.map((input) => input.getAttribute("name")))

        if (!values.includes("one") || !values.includes("two")) {
          throw new Error(`Expected hidden inputs to include values 'one' and 'two', got: ${values.join(", ")}`)
        }

        if (names.some((name) => name !== "controlled_values[]")) {
          throw new Error(`Expected hidden input name to be 'controlled_values[]', got: ${names.join(", ")}`)
        }
      })
    })
  })

  it("filters options when searching", async () => {
    await timeout({errorMessage: "render test timed out: filters options when searching", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

        await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
        await helper.open()

        const searchInput = await systemTest.find(helper.searchInputSelector, {timeout: 5000})
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
    await timeout({errorMessage: "render test timed out: highlights selected options in multiple select", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMultipleRoot"})

        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 5000})
        await helper.open()

        const optionsContainerSelector = await helper.optionsContainerSelector()

        await waitFor({timeout: 5000}, async () => {
          await systemTest.find(
            `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
            {timeout: 0, useBaseSelector: false}
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
    await timeout({errorMessage: "render test timed out: clears selected options after deselecting all values", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const root = await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 5000})
        const rootId = await root.getAttribute("data-id")
        const componentElement = rootId
          ? null
          : await systemTest.find(
            "[data-testid='hayaSelectMultipleRoot'] [data-component='haya-select']",
            {timeout: 5000}
          )
        const componentId = rootId || (componentElement ? await componentElement.getAttribute("data-id") : null)
        const optionsContainerSelector = componentId ? `[data-class='options-container'][data-id='${componentId}']` : "[data-class='options-container']"
        const selectContainer = await systemTest.find(
          "[data-testid='hayaSelectMultipleRoot'] [data-class='select-container']",
          {timeout: 5000}
        )

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

        const waitForOptionsVisible = async () => {
          await waitFor({timeout: 5000}, async () => {
            const openOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false, visible: true})
            if (openOptions.length === 0) {
              throw new Error("Expected options container to be visible")
            }
          })
        }

        const waitForOptionsHidden = async () => {
          await waitFor({timeout: 5000}, async () => {
            const openOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false, visible: true})
            if (openOptions.length > 0) {
              throw new Error("Expected options container to be hidden")
            }
          })
        }

        const driver = systemTest.getDriver()
        const clickElement = async (element) => {
          await timeout({errorMessage: "clear selected options test timed out: clickElement script", timeout: 5000}, async () => {
            await driver.executeScript(
              "arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))",
              element
            )
          })
        }
        const clickBody = async () => {
          await timeout({errorMessage: "clear selected options test timed out: clickBody script", timeout: 5000}, async () => {
            await driver.executeScript(
              "document.body && document.body.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))"
            )
          })
        }

        await clickElement(selectContainer)
        await waitForOptionsVisible()
        await clickElement(await systemTest.find(
          `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
          {timeout: 5000, useBaseSelector: false}
        ))
        await waitFor({timeout: 5000}, async () => {
          const option = await systemTest.find(
            `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
            {timeout: 0, useBaseSelector: false}
          )
          const selected = await option.getAttribute("data-selected")

          if (selected !== "true") {
            throw new Error(`Expected option one to be selected, got: ${selected}`)
          }
        })

        await clickElement(await systemTest.find(
          `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
          {timeout: 5000, useBaseSelector: false}
        ))
        await waitFor({timeout: 5000}, async () => {
          const option = await systemTest.find(
            `${optionsContainerSelector} [data-class='select-option'][data-value='one']`,
            {timeout: 0, useBaseSelector: false}
          )
          const selected = await option.getAttribute("data-selected")

          if (selected !== "false") {
            throw new Error(`Expected option one to be deselected, got: ${selected}`)
          }
        })

        await clickElement(selectContainer)
        await clickBody()
        await waitForOptionsHidden()

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
    await timeout({errorMessage: "render test timed out: keeps rounded corners after opening and closing", timeout: 30000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const root = await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
        const rootId = await root.getAttribute("data-id")
        const componentElement = rootId
          ? null
          : await systemTest.find(
            "[data-testid='hayaSelectRoot'] [data-component='haya-select']",
            {timeout: 5000}
          )
        const componentId = rootId || (componentElement ? await componentElement.getAttribute("data-id") : null)
        const optionsContainerSelector = componentId ? `[data-class='options-container'][data-id='${componentId}']` : "[data-class='options-container']"
        const selectContainer = await systemTest.find(
          "[data-testid='hayaSelectRoot'] [data-class='select-container']",
          {timeout: 5000}
        )
        const driver = systemTest.getDriver()
        const clickElement = async (element) => {
          await timeout({errorMessage: "rounded corners test timed out: clickElement script", timeout: 5000}, async () => {
            await driver.executeScript(
              "arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))",
              element
            )
          })
        }
        const clickBody = async () => {
          await timeout({errorMessage: "rounded corners test timed out: clickBody script", timeout: 5000}, async () => {
            await driver.executeScript(
              "document.body && document.body.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))"
            )
          })
        }

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

        const initialRadii = await getBorderRadii()
        expect(initialRadii).not.toBeNull()

        await clickElement(selectContainer)
        await waitFor({timeout: 5000}, async () => {
          const openOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false, visible: true})

          if (openOptions.length === 0) {
            throw new Error("Expected options container to be visible")
          }
        })
        await clickElement(selectContainer)
        await clickBody()
        await waitFor({timeout: 5000}, async () => {
          const openOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false, visible: true})

          if (openOptions.length > 0) {
            throw new Error("Expected options container to be hidden")
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

  it("supports options container style callbacks with placement context", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        const belowHelper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPlacementBelowRoot"})
        const aboveHelper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPlacementAboveRoot"})
        const scoundrel = await systemTest.getScoundrelClient()
        const getPlacementAndRadii = async (helper) => {
          const optionsContainerSelector = await helper.optionsContainerSelector()

          return await scoundrel.evalResult(`
            const optionsContainer = document.querySelector(${JSON.stringify(optionsContainerSelector)})
            if (!optionsContainer) {
              throw new Error("Expected options container to exist for selector: " + ${JSON.stringify(optionsContainerSelector)})
            }

            const style = window.getComputedStyle(optionsContainer)
            const root = document.querySelector(${JSON.stringify(helper.rootSelector)} + " [data-component='haya-select']")
            const optionsPlacement = root ? root.getAttribute("data-options-placement") : null

            return {
              bottomLeft: style.borderBottomLeftRadius,
              bottomRight: style.borderBottomRightRadius,
              optionsPlacement,
              topLeft: style.borderTopLeftRadius,
              topRight: style.borderTopRightRadius
            }
          `)
        }

        await systemTest.findByTestID("hayaSelectPlacementBelowRoot", {timeout: 60000})
        await belowHelper.open()
        const belowPlacementAndRadii = await getPlacementAndRadii(belowHelper)

        expect(belowPlacementAndRadii.optionsPlacement).toBe("below")
        expect(belowPlacementAndRadii.topLeft).toBe("0px")
        expect(belowPlacementAndRadii.topRight).toBe("0px")
        expect(belowPlacementAndRadii.bottomLeft).not.toBe("0px")
        expect(belowPlacementAndRadii.bottomRight).not.toBe("0px")
        await belowHelper.close()

        await systemTest.getDriver().manage().window().setRect({height: 320, width: 1280})
        await aboveHelper.open()
        await waitFor({timeout: 5000}, async () => {
          const placementState = await getPlacementAndRadii(aboveHelper)

          if (placementState.optionsPlacement !== "above") {
            throw new Error(`${placementState.optionsPlacement} wasn't expected be above`)
          }
        })
        const abovePlacementAndRadii = await getPlacementAndRadii(aboveHelper)

        expect(abovePlacementAndRadii.optionsPlacement).toBe("above")
        expect(abovePlacementAndRadii.topLeft).not.toBe("0px")
        expect(abovePlacementAndRadii.topRight).not.toBe("0px")
        expect(abovePlacementAndRadii.bottomLeft).toBe("0px")
        expect(abovePlacementAndRadii.bottomRight).toBe("0px")
        await aboveHelper.close()
      })
    })
  })

})
