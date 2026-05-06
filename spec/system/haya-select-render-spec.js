import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import {Key} from "selenium-webdriver"
import {runSystemTest, setupSystemTestLifecycle} from "./system-test-lifecycle.js"

import HayaSelectSystemTestHelper from "../../src/system-test-helpers.js"

setupSystemTestLifecycle()

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({errorMessage: "render test timed out: renders in the example app", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
      }, {screen: "basic-select"})
    })
  })

  it("renders optionContent callbacks", async () => {
    await timeout({errorMessage: "render test timed out: renders optionContent callbacks", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "option-content"})
    })
  })

  it("renders right option content", async () => {
    await timeout({errorMessage: "render test timed out: renders right option content", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "right-option"})
    })
  })

  it("closes options after change-triggered re-render", async () => {
    await timeout({errorMessage: "render test timed out: closes options after change-triggered re-render", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "close-on-change"})
    })
  })

  it("renders without crashing when values include ids missing from options", async () => {
    await runSystemTest(async (systemTest) => {
      await systemTest.findByTestID("hayaSelectStaleValuesRoot", {timeout: 5000})

      await waitFor({timeout: 5000}, async () => {
        const chips = await systemTest.all(
          "[data-testid='hayaSelectStaleValuesRoot'] [data-class='current-option']",
          {timeout: 0, useBaseSelector: false}
        )

        if (chips.length !== 1) {
          throw new Error(`Expected exactly one chip for the matching value, got: ${chips.length}`)
        }

        const text = (await chips[0].getText()).trim()

        if (!text.includes("One")) {
          throw new Error(`Expected chip text to include 'One', got: ${text}`)
        }
      })
    }, {screen: "stale-values"})
  })

  it("renders hidden input for controlled values without current options", async () => {
    await runSystemTest(async (systemTest) => {
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
    }, {screen: "controlled-values"})
  })

  it("filters options when searching", async () => {
    await timeout({errorMessage: "render test timed out: filters options when searching", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

        await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
        await helper.open()

        await systemTest.find(
          "[data-testid='hayaSelectRoot'] [data-component='haya-select'][data-applied-request-id='1']",
          {timeout: 5000}
        )

        await systemTest.interact(
          {selector: helper.searchInputSelector},
          "sendKeys",
          Key.chord(Key.CONTROL, "a"),
          Key.BACK_SPACE,
          "tw"
        )

        await waitFor({timeout: 5000}, async () => {
          const value = await systemTest.interact({selector: helper.searchInputSelector}, "getAttribute", "value")

          if (value !== "tw") {
            throw new Error(`Unexpected search value: ${value}`)
          }
        })

        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (texts.length !== 1 || !texts[0].includes("Two")) {
            throw new Error(`Unexpected options: ${texts.join(", ")}`)
          }
        })

        await helper.close()
      }, {screen: "filter-select"})
    })
  })

  it("keeps no-options content readable after filtering", async () => {
    await timeout({errorMessage: "render test timed out: keeps no-options content readable after filtering", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectRoot"})

        await systemTest.findByTestID("hayaSelectRoot", {timeout: 5000})
        await helper.open()

        await systemTest.find(
          "[data-testid='hayaSelectRoot'] [data-component='haya-select'][data-applied-request-id='1']",
          {timeout: 5000}
        )

        await systemTest.interact(
          {selector: helper.searchInputSelector},
          "sendKeys",
          Key.chord(Key.CONTROL, "a"),
          Key.BACK_SPACE,
          "not-a-real-option"
        )

        const optionsContainerSelector = await helper.optionsContainerSelector()

        await waitFor({timeout: 5000}, async () => {
          const noOptionsContainer = await systemTest.find(
            `${optionsContainerSelector} [data-class='no-options-container']`,
            {timeout: 0, useBaseSelector: false}
          )
          const paddingBottom = parseFloat(await noOptionsContainer.getCssValue("padding-bottom"))
          const paddingTop = parseFloat(await noOptionsContainer.getCssValue("padding-top"))

          if (paddingBottom < 10 || paddingTop < 10) {
            throw new Error(`Expected no-options container vertical padding, got: top=${paddingTop}, bottom=${paddingBottom}`)
          }
        })

        await helper.close()
      }, {screen: "no-options-select"})
    })
  })

  it("uses a bottom sheet on mobile-sized screens", async () => {
    await timeout({errorMessage: "render test timed out: uses a bottom sheet on mobile-sized screens", timeout: 60000}, async () => {
      await runSystemTest(async (systemTest) => {
        const driver = systemTest.getDriver()
        const originalWindowRect = await driver.manage().window().getRect()
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMobileSheetRoot"})

        try {
          await driver.manage().window().setRect({height: 844, width: 390})
          await waitFor({timeout: 5000}, async () => {
            const width = await driver.executeScript("return window.innerWidth")

            if (width > 768) {
              throw new Error(`Expected mobile viewport width, got: ${width}`)
            }
          })

          await systemTest.findByTestID("hayaSelectMobileSheetRoot", {timeout: 5000})
          await helper.open()

          const optionsContainerSelector = await helper.optionsContainerSelector()

          await systemTest.find(
            "[data-testid='hayaSelectMobileSheetRoot'] [data-component='haya-select'][data-options-placement='sheet']",
            {timeout: 5000}
          )

          await waitFor({timeout: 5000}, async () => {
            const metrics = await driver.executeScript(`
              const container = document.querySelector(${JSON.stringify(optionsContainerSelector)})
              if (!container) throw new Error("Missing mobile options container")

              const rect = container.getBoundingClientRect()
              return {
                bottom: Math.round(window.innerHeight - rect.bottom),
                height: rect.height,
                windowHeight: window.innerHeight
              }
            `)
            const maxHeight = metrics.windowHeight * 0.8

            if (metrics.height > maxHeight + 8) {
              throw new Error(`Expected sheet height at most 80vh, got: ${metrics.height} of ${metrics.windowHeight}`)
            }

            if (Math.abs(metrics.bottom) > 2) {
              throw new Error(`Expected sheet to be anchored to bottom, got bottom offset: ${metrics.bottom}`)
            }
          })

          await driver.executeScript("window.scrollTo(0, 500)")
          await waitFor({timeout: 5000}, async () => {
            const openOptions = await systemTest.all(optionsContainerSelector, {timeout: 0, useBaseSelector: false, visible: true})

            if (openOptions.length === 0) {
              throw new Error("Expected mobile sheet to stay open after page scroll")
            }
          })

          await driver.executeScript(`
            const scrollView = document.querySelector("[data-class='mobile-options-scroll-view']")
            if (!scrollView) throw new Error("Missing mobile options scroll view")
            scrollView.scrollTop = scrollView.scrollHeight
            scrollView.dispatchEvent(new Event("scroll", {bubbles: true}))
          `)

          await systemTest.interact(
            {selector: `${optionsContainerSelector} [data-class='search-text-input']`, useBaseSelector: false},
            "sendKeys",
            Key.chord(Key.CONTROL, "a"),
            Key.BACK_SPACE,
            "40"
          )

          await waitFor({timeout: 5000}, async () => {
            const texts = await helper.optionTexts()

            if (texts.length !== 1 || !texts[0].includes("Mobile Sheet Option 40")) {
              throw new Error(`Unexpected mobile sheet filtered options: ${texts.join(", ")}`)
            }
          })

          await waitFor({timeout: 5000}, async () => {
            const layout = await driver.executeScript(`
              const container = document.querySelector(${JSON.stringify(optionsContainerSelector)})
              const option = container && container.querySelector("[data-class='select-option']")
              const scrollView = container && container.querySelector("[data-class='mobile-options-scroll-view']")
              if (!container || !option || !scrollView) throw new Error("Missing mobile sheet layout elements")

              const containerStyle = window.getComputedStyle(container)
              const optionRect = option.getBoundingClientRect()
              const scrollViewRect = scrollView.getBoundingClientRect()

              return {
                borderTopWidth: containerStyle.borderTopWidth,
                containerHeight: container.getBoundingClientRect().height,
                distanceToScrollBottom: Math.round(scrollViewRect.bottom - optionRect.bottom),
                windowHeight: window.innerHeight
              }
            `)
            const maxHeight = layout.windowHeight * 0.8

            if (layout.containerHeight >= maxHeight - 8) {
              throw new Error(`Expected filtered sheet to shrink below max height, got: ${layout.containerHeight}`)
            }

            if (layout.borderTopWidth !== "0px") {
              throw new Error(`Expected no top border on mobile sheet, got: ${layout.borderTopWidth}`)
            }

            if (Math.abs(layout.distanceToScrollBottom) > 4) {
              throw new Error(`Expected filtered option to align to scroll bottom, got gap: ${layout.distanceToScrollBottom}`)
            }
          })

          await helper.selectOption({value: "mobile-sheet-40"})

          await waitFor({timeout: 5000}, async () => {
            const currentSelected = await systemTest.find(
              "[data-testid='hayaSelectMobileSheetRoot'] [data-class='current-selected']",
              {timeout: 0}
            )
            const text = (await currentSelected.getText()).trim()

            if (!text.includes("Mobile Sheet Option 40")) {
              throw new Error(`Expected selected mobile sheet option, got: ${text}`)
            }
          })
        } finally {
          await driver.manage().window().setRect(originalWindowRect)
        }
      }, {screen: "mobile-sheet-select"})
    })
  })

  it("repositions an open sheet after resizing out of mobile width", async () => {
    await timeout({errorMessage: "render test timed out: repositions an open sheet after resizing out of mobile width", timeout: 60000}, async () => {
      await runSystemTest(async (systemTest) => {
        const driver = systemTest.getDriver()
        const originalWindowRect = await driver.manage().window().getRect()
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectMobileSheetRoot"})

        try {
          await driver.manage().window().setRect({height: 844, width: 390})
          await systemTest.findByTestID("hayaSelectMobileSheetRoot", {timeout: 5000})
          await helper.open()

          await systemTest.find(
            "[data-testid='hayaSelectMobileSheetRoot'] [data-component='haya-select'][data-options-placement='sheet']",
            {timeout: 5000}
          )

          await driver.manage().window().setRect({height: 844, width: 1280})
          await waitFor({timeout: 5000}, async () => {
            const state = await driver.executeScript(`
              const root = document.querySelector("[data-testid='hayaSelectMobileSheetRoot'] [data-component='haya-select']")
              const bodyOverflow = document.body.style.overflow
              const documentOverflow = document.documentElement.style.overflow

              return {
                bodyOverflow,
                documentOverflow,
                optionsPlacement: root && root.getAttribute("data-options-placement")
              }
            `)

            if (!["above", "below"].includes(state.optionsPlacement)) {
              throw new Error(`Expected desktop placement after resize, got: ${state.optionsPlacement}`)
            }

            if (state.bodyOverflow || state.documentOverflow) {
              throw new Error(`Expected unlocked document scroll, got body=${state.bodyOverflow} document=${state.documentOverflow}`)
            }
          })

          await helper.close()
        } finally {
          await driver.manage().window().setRect(originalWindowRect)
        }
      }, {screen: "mobile-sheet-resize"})
    })
  })

  it("highlights selected options in multiple select", async () => {
    await timeout({errorMessage: "render test timed out: highlights selected options in multiple select", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "multiple-highlight"})
    })
  })

  it("clears selected options after deselecting all values", async () => {
    await timeout({errorMessage: "render test timed out: clears selected options after deselecting all values", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "multiple-clear"})
    })
  })

  it("keeps rounded corners after opening and closing", async () => {
    await timeout({errorMessage: "render test timed out: keeps rounded corners after opening and closing", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
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
      }, {screen: "rounded-corners-select"})
    })
  })

  it("supports options container style callbacks with placement context", async () => {
    await timeout({timeout: 90000}, async () => {
      await runSystemTest(async (systemTest) => {
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
        await waitFor({timeout: 5000}, async () => {
          const windowHeight = await systemTest.getDriver().executeScript("return window.innerHeight")

          if (windowHeight > 320) {
            throw new Error(`Expected resized window height to be at most 320, got: ${windowHeight}`)
          }
        })
        await aboveHelper.open()
        await waitFor({timeout: 5000}, async () => {
          const placementState = await getPlacementAndRadii(aboveHelper)

          if (placementState.optionsPlacement !== "above") {
            throw new Error(`${placementState.optionsPlacement} wasn't expected be above`)
          }

          if (placementState.topLeft === "0px" || placementState.topRight === "0px") {
            throw new Error(
              `Expected non-zero top radii for above placement, got left=${placementState.topLeft} right=${placementState.topRight}`
            )
          }
        })
        const abovePlacementAndRadii = await getPlacementAndRadii(aboveHelper)

        expect(abovePlacementAndRadii.optionsPlacement).toBe("above")
        expect(abovePlacementAndRadii.topLeft).not.toBe("0px")
        expect(abovePlacementAndRadii.topRight).not.toBe("0px")
        expect(abovePlacementAndRadii.bottomLeft).toBe("0px")
        expect(abovePlacementAndRadii.bottomRight).toBe("0px")
        await aboveHelper.close()
      }, {screen: "placement-callback"})
    })
  })

})
