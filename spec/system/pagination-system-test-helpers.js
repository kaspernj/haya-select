import waitFor from "awaitery/build/wait-for.js"

export const setPaginationInputValue = async (systemTest, value) => {
  await waitFor({timeout: 5000}, async () => {
    const element = await systemTest.find("[data-class='pagination-input']", {useBaseSelector: false})
    const driver = systemTest.getDriver()
    await driver.executeScript(
      "arguments[0].focus(); arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', {bubbles: true})); arguments[0].dispatchEvent(new Event('change', {bubbles: true})); arguments[0].blur();",
      element,
      String(value)
    )
  })
}

export const paginationLabelText = async (systemTest) => {
  const labelElements = await systemTest.all("[data-class='pagination-input']", {timeout: 0, useBaseSelector: false})

  if (labelElements.length === 0) return null

  const value = await labelElements[0].getAttribute("value")

  return value ? value.trim() : ""
}

export const openPaginatedSelect = async (systemTest) => {
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
    await waitFor({timeout: 5000}, async () => {
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
  await waitFor({timeout: 5000}, async () => {
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

export const closePaginatedSelect = async (systemTest) => {
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
