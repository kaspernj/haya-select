import waitFor from "awaitery/build/wait-for.js"

export const setPaginationInputValue = async (systemTest, value) => {
  await waitFor({timeout: 5000}, async () => {
    const element = await systemTest.find("[data-testid='haya-select/pagination-input']", {useBaseSelector: false})
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].focus(); arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', {bubbles: true})); arguments[0].dispatchEvent(new Event('change', {bubbles: true})); arguments[0].blur();",
      element,
      String(value)
    )
  })
}

export const paginationLabelText = async (systemTest) => {
  const labelElements = await systemTest.all("[data-testid='haya-select/pagination-input']", {timeout: 0, useBaseSelector: false})

  if (labelElements.length === 0) return null

  const value = await labelElements[0].getAttribute("value")

  return value ? value.trim() : ""
}

export const openPaginatedSelect = async (systemTest) => {
  const selectContainer = await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/select-container']")
  const driver = systemTest.getDriver()
  const searchInputs = await systemTest.all(
    "[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/search-input']",
    {timeout: 0, visible: true}
  )

  if (searchInputs.length > 0) {
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
      selectContainer
    )
    await systemTest.click(selectContainer)
    await waitFor({timeout: 5000}, async () => {
      const searchInputsAfterClick = await systemTest.all(
        "[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/search-input']",
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
  await waitFor({timeout: 5000}, async () => {
    const searchInputsAfterClick = await systemTest.all(
      "[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/search-input']",
      {timeout: 0, visible: true}
    )

    if (searchInputsAfterClick.length === 0) {
      throw new Error("Search input not visible yet")
    }
  })

  await waitFor({timeout: 5000}, async () => {
    const paginationElements = await systemTest.all("[data-testid='haya-select/options-pagination']", {timeout: 0, useBaseSelector: false})

    if (paginationElements.length === 0) {
      throw new Error("Pagination not visible yet")
    }
  })

  await paginationLabelText(systemTest)
}

export const closePaginatedSelect = async (systemTest) => {
  const inputs = await systemTest.all(
    "[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/search-input']",
    {timeout: 0, visible: true}
  )

  if (inputs.length > 0) {
    const selectContainer = await systemTest.find("[data-testid='hayaSelectPaginationRoot'] [data-testid='haya-select/select-container']")
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'})",
      selectContainer
    )
    await systemTest.click(selectContainer)
  }
}

export const waitForPaginationLabel = async (systemTest, expectedText) => {
  const expectedPage = Number(expectedText.match(/Page (\d+) of/)?.[1])
  await waitFor({timeout: 5000}, async () => {
    const labelText = await paginationLabelText(systemTest)

    if (labelText === expectedText) return

    if (Number.isFinite(expectedPage) && labelText === String(expectedPage)) return
    if (Number.isFinite(expectedPage) && Number(labelText) === expectedPage) return

    if (!Number.isFinite(expectedPage) && labelText === expectedText) return

    if (labelText !== expectedText) {
      throw new Error(`Unexpected pagination label: ${labelText}`)
    }
  })
}

export const findPaginationPageButton = async (systemTest, pageNumber) => {
  let matchingButton

  await waitFor({timeout: 5000}, async () => {
    const pageButtons = await systemTest.all("[data-testid='haya-select/pagination-page']", {useBaseSelector: false})

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

export const clickPaginationSelector = async (systemTest, selector) => {
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

export const assertPaginationOutsideScroll = async (systemTest, {optionsContainerSelector, scrollViewTestID}) => {
  const driver = systemTest.getDriver()

  await waitFor({timeout: 5000}, async () => {
    const metrics = await driver.executeScript(`
      const container = document.querySelector(arguments[0])
      if (!container) throw new Error("Missing options container")

      const scrollView = container.querySelector(\`[data-testid="\${arguments[1]}"]\`)
      const pagination = container.querySelector("[data-testid='haya-select/options-pagination']")
      if (!scrollView) throw new Error("Missing options scroll view")
      if (!pagination) throw new Error("Missing pagination controls")

      scrollView.scrollTop = scrollView.scrollHeight
      scrollView.dispatchEvent(new Event("scroll", {bubbles: true}))

      const containerRect = container.getBoundingClientRect()
      const paginationRect = pagination.getBoundingClientRect()
      const centerX = Math.round(paginationRect.left + (paginationRect.width / 2))
      const centerY = Math.round(paginationRect.top + (paginationRect.height / 2))
      const elementAtPoint = document.elementFromPoint(centerX, centerY)

      return {
        elementAtPointInsidePagination: pagination === elementAtPoint || pagination.contains(elementAtPoint),
        paginationBottom: paginationRect.bottom,
        paginationHeight: paginationRect.height,
        paginationInScrollView: scrollView.contains(pagination),
        paginationTop: paginationRect.top,
        containerBottom: containerRect.bottom,
        containerTop: containerRect.top,
        scrollTop: scrollView.scrollTop
      }
    `, optionsContainerSelector, scrollViewTestID)

    if (metrics.paginationInScrollView) {
      throw new Error("Expected pagination outside the scrollable options list")
    }

    if (metrics.scrollTop <= 0) {
      throw new Error("Expected options list to scroll")
    }

    if (metrics.paginationHeight <= 0 || metrics.paginationTop < metrics.containerTop - 2 || metrics.paginationBottom > metrics.containerBottom + 2) {
      throw new Error(`Expected pagination visible inside options container: ${JSON.stringify(metrics)}`)
    }

    if (!metrics.elementAtPointInsidePagination) {
      throw new Error(`Expected pagination to remain reachable after scrolling: ${JSON.stringify(metrics)}`)
    }
  })
}
