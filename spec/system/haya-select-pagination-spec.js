import "velocious/build/src/testing/test.js"
import timeout from "awaitery/build/timeout.js"
import waitFor from "awaitery/build/wait-for.js"
import {
  assertPaginationOutsideScroll,
  clickPaginationSelector,
  closePaginatedSelect,
  findPaginationPageButton,
  openPaginatedSelect,
  setPaginationInputValue,
  waitForPaginationLabel
} from "./pagination-system-test-helpers.js"
import {runSystemTest, setupSystemTestLifecycle} from "./system-test-lifecycle.js"

import HayaSelectSystemTestHelper from "../../src/system-test-helpers.js"

setupSystemTestLifecycle()

describe("HayaSelect pagination", () => {
  afterEach(async () => {
    await timeout({errorMessage: "afterEach: timed out closing paginated select", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        await closePaginatedSelect(systemTest)
      }, {screen: "pagination-change-page"})
    })
  })

  it("changes page when clicking a page number", async () => {
    await timeout({errorMessage: "pagination test timed out: changes page when clicking a page number", timeout: 60000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 5000})
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
      }, {screen: "pagination-manual-entry"})
    })
  })

  it("accepts manual page entry from the pagination label", async () => {
    await timeout({errorMessage: "pagination test timed out: accepts manual page entry from the pagination label", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 5000})
        await openPaginatedSelect(systemTest)

        await setPaginationInputValue(systemTest, "4")

        await waitForPaginationLabel(systemTest, "Page 4 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 4 Item 16")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })
      }, {screen: "pagination-next-prev"})
    })
  })

  it("supports next and previous pagination buttons", async () => {
    await timeout({errorMessage: "pagination test timed out: supports next and previous pagination buttons", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 5000})
        await openPaginatedSelect(systemTest)
        await waitForPaginationLabel(systemTest, "Page 1 of 5")

        await clickPaginationSelector(systemTest, "[data-testid='haya-select-pagination-next']")
        await waitForPaginationLabel(systemTest, "Page 2 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 2 Item 6")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })

        await clickPaginationSelector(systemTest, "[data-testid='haya-select-pagination-prev']")
        await waitForPaginationLabel(systemTest, "Page 1 of 5")
        await waitFor({timeout: 5000}, async () => {
          const texts = await helper.optionTexts()

          if (!texts[0]?.startsWith("Page 1 Item 1")) {
            throw new Error(`Unexpected first option text: ${texts[0]}`)
          }
        })
      }, {screen: "pagination-select"})
    })
  })

  it("keeps pagination outside the scrolled desktop options list", async () => {
    await timeout({errorMessage: "pagination test timed out: keeps pagination outside the scrolled desktop options list", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 5000})
        await openPaginatedSelect(systemTest)
        await waitForPaginationLabel(systemTest, "Page 1 of 2")

        await assertPaginationOutsideScroll(systemTest, {
          optionsContainerSelector: await helper.optionsContainerSelector(),
          scrollViewTestID: "haya-select-options-scroll-view"
        })
      }, {screen: "pagination-long-page"})
    })
  })

  it("keeps pagination outside the scrolled mobile sheet options list", async () => {
    await timeout({errorMessage: "pagination test timed out: keeps pagination outside the scrolled mobile sheet options list", timeout: 30000}, async () => {
      await runSystemTest(async (systemTest) => {
        const driver = systemTest.getDriver()
        const originalWindowRect = await driver.manage().window().getRect()
        const helper = new HayaSelectSystemTestHelper({systemTest, testId: "hayaSelectPaginationRoot"})

        try {
          await driver.manage().window().setRect({height: 844, width: 390})
          await systemTest.findByTestID("hayaSelectPaginationRoot", {timeout: 5000})

          const selectContainer = await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select-select-container']")

          await systemTest.click(selectContainer)
          await waitForPaginationLabel(systemTest, "Page 1 of 2")

          await assertPaginationOutsideScroll(systemTest, {
            optionsContainerSelector: await helper.optionsContainerSelector(),
            scrollViewTestID: "haya-select-mobile-options-scroll-view"
          })
        } finally {
          await driver.manage().window().setRect(originalWindowRect)
        }
      }, {screen: "pagination-long-page"})
    })
  })
})
