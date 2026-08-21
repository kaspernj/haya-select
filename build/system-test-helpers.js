import waitFor from "awaitery/build/wait-for.js";
import { By } from "selenium-webdriver";
/** @typedef {{systemTest: object, testId: string}} HayaSelectSystemTestHelperOptions */
/** @typedef {{timeout?: number, useBaseSelector?: boolean}} HayaSelectOpenOptions */
/** @typedef {{optionText?: string, optionValue?: string | number, search?: boolean, timeout?: number, useBaseSelector?: boolean}} PickHayaSelectOptionOptions */
/** @typedef {{optionValue: string | number, timeout?: number}} ClickVisibleHayaSelectOptionOptions */
/** @typedef {{timeout?: number}} ExpectHayaSelectCurrentOptionsOptions */
/** @typedef {{timeout?: number}} ExpectHayaSelectOptionsClosedOptions */
/** @typedef {import("selenium-webdriver").WebElement} WebElement */
const DEFAULT_TIMEOUT = 5000;
/**
 * Selects an option in a HayaSelect instance.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {PickHayaSelectOptionOptions} options Text/value to choose and whether to type into the search field first.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 * @rejects {Error} When neither text nor value is supplied.
 */
export async function pickHayaSelectOption(systemTest, testId, { optionText, optionValue, search = false, timeout = DEFAULT_TIMEOUT, useBaseSelector = true }) {
    const helper = new HayaSelectSystemTestHelper({ systemTest, testId });
    const selectElement = await systemTest.find(helper.selectContainerSelector, { timeout, useBaseSelector });
    await selectElement.click();
    if (search) {
        if (!optionText) {
            throw new Error(`Expected optionText when searching ${testId}`);
        }
        const searchElement = await systemTest.find(helper.searchInputSelector, { timeout, useBaseSelector });
        await searchElement.sendKeys(optionText);
    }
    const optionsContainerSelector = await helper.optionsContainerSelector();
    if (typeof optionValue !== "undefined") {
        await clickVisibleSelectOptionByValue(systemTest, optionValue, timeout, optionsContainerSelector);
        return;
    }
    if (optionText) {
        await clickVisibleSelectOptionByText(systemTest, optionText, timeout, optionsContainerSelector);
        return;
    }
    throw new Error(`Expected optionValue or optionText for ${testId}`);
}
/**
 * Clicks an option in an already-open HayaSelect dropdown.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {ClickVisibleHayaSelectOptionOptions} options Option value to choose.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
export async function clickVisibleHayaSelectOption(systemTest, { optionValue, timeout = DEFAULT_TIMEOUT }) {
    await clickVisibleSelectOptionByValue(systemTest, optionValue, timeout);
}
/**
 * Opens a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select opens.
 */
export async function openHayaSelect(systemTest, testId, { timeout = DEFAULT_TIMEOUT, useBaseSelector = true } = {}) {
    const helper = new HayaSelectSystemTestHelper({ systemTest, testId });
    await helper.open({ timeout, useBaseSelector });
}
/**
 * Closes a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select closes.
 */
export async function closeHayaSelect(systemTest, testId, { timeout = DEFAULT_TIMEOUT, useBaseSelector = true } = {}) {
    const helper = new HayaSelectSystemTestHelper({ systemTest, testId });
    await helper.close({ timeout, useBaseSelector });
}
/**
 * Waits until a HayaSelect renders exactly the expected current-option labels.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {string[]} expectedTexts Current option text fragments in rendered order.
 * @param {ExpectHayaSelectCurrentOptionsOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after the current options match.
 */
export async function expectHayaSelectCurrentOptions(systemTest, testId, expectedTexts, { timeout = DEFAULT_TIMEOUT } = {}) {
    const selector = `${testIdSelector(testId)} [data-testid="haya-select/current-option"]`;
    await systemTest.getDriver().wait(async () => {
        const elements = await systemTest.getDriver().findElements(By.css(selector));
        /** @type {string[]} */
        const visibleTexts = [];
        for (const element of elements) {
            if (await element.isDisplayed()) {
                visibleTexts.push(await element.getText());
            }
        }
        if (visibleTexts.length !== expectedTexts.length) {
            return false;
        }
        return expectedTexts.every((expectedText, index) => visibleTexts[index]?.includes(expectedText));
    }, timeout, `Timed out waiting for ${testId} current options: ${expectedTexts.join(", ")}`);
}
/**
 * Waits until a HayaSelect and its portal-rendered options are closed.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after no visible options remain.
 */
export async function expectHayaSelectOptionsClosed(systemTest, testId, { timeout = DEFAULT_TIMEOUT } = {}) {
    const helper = new HayaSelectSystemTestHelper({ systemTest, testId });
    await helper.expectClosed({ timeout });
}
/**
 * System test helper for interacting with HayaSelect instances.
 */
export default class HayaSelectSystemTestHelper {
    /** @param {HayaSelectSystemTestHelperOptions} options */
    constructor(options) {
        if (!options) {
            throw new Error(`Expected options for HayaSelectSystemTestHelper, got: ${options}`);
        }
        const { systemTest, testId, ...restArgs } = options;
        const extraKeys = Object.keys(restArgs);
        if (extraKeys.length > 0) {
            throw new Error(`Unexpected options for HayaSelectSystemTestHelper: ${extraKeys.join(", ")}`);
        }
        this.systemTest = systemTest;
        this.testId = testId;
        this.rootSelector = testIdSelector(testId);
        this.componentSelector = `${this.rootSelector} [data-testid='haya-select']`;
        this.chevronContainerSelector = `${this.rootSelector} [data-testid='haya-select/chevron-container']`;
        this.selectContainerSelector = `${this.rootSelector} [data-testid='haya-select/select-container']`;
        this.searchInputSelector = `${this.rootSelector} [data-testid='haya-select/search-input']`;
        this.optionsContainerSelectorFallback = "[data-testid='haya-select/options-container']";
    }
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select opens.
     */
    async open({ timeout = DEFAULT_TIMEOUT, useBaseSelector = true } = {}) {
        await this.clickSelectContainer({ timeout, useBaseSelector });
        this._optionsContainerSelector = null;
        await waitFor({ timeout }, async () => {
            const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`);
            if (openedElements.length === 0) {
                throw new Error(`Expected HayaSelect to open: ${this.testId}`);
            }
        });
    }
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select closes.
     */
    async close({ timeout = DEFAULT_TIMEOUT, useBaseSelector = true } = {}) {
        await this.clickSelectContainer({ timeout, useBaseSelector });
        await waitFor({ timeout }, async () => {
            const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`);
            if (openedElements.length > 0) {
                throw new Error(`Expected HayaSelect to close: ${this.testId}`);
            }
        });
    }
    /**
     * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional timeout.
     * @returns {Promise<void>} Completes after no visible options remain.
     */
    async expectClosed({ timeout = DEFAULT_TIMEOUT } = {}) {
        await waitFor({ timeout }, async () => {
            const optionsContainerSelector = await this.optionsContainerSelector();
            const open = await this.isOpen();
            const visibleContainersCount = await this.visibleElementsCount(optionsContainerSelector);
            const visibleOptionsCount = await this.visibleElementsCount(`${optionsContainerSelector} [data-testid='haya-select/option']`);
            if (open || visibleContainersCount > 0 || visibleOptionsCount > 0) {
                throw new Error(`Expected ${this.testId} options to close, got open=${open}, visibleContainers=${visibleContainersCount}, visibleOptions=${visibleOptionsCount}`);
            }
        });
    }
    /** @returns {Promise<boolean>} */
    async isOpen() {
        const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`);
        if (openedElements.length > 0)
            return true;
        const searchInputs = await this.findVisibleElements(this.searchInputSelector);
        return searchInputs.length > 0;
    }
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select container click.
     */
    async clickSelectContainer({ timeout = DEFAULT_TIMEOUT, useBaseSelector = true } = {}) {
        const selectContainer = await this.systemTest.find(this.selectContainerSelector, { timeout, useBaseSelector });
        await selectContainer.click();
    }
    /**
     * @param {string} selector
     * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
     */
    async findElements(selector) {
        return await this.systemTest.getDriver().findElements(By.css(selector));
    }
    /**
     * @param {string} selector
     * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
     */
    async findVisibleElements(selector) {
        const elements = await this.findElements(selector);
        const visibleElements = [];
        for (const element of elements) {
            if (await element.isDisplayed()) {
                visibleElements.push(element);
            }
        }
        return visibleElements;
    }
    /**
     * Counts visible elements by CSS selector in browser layout state.
     * @param {string} selector CSS selector to count.
     * @returns {Promise<number>} Number of visible elements.
     */
    async visibleElementsCount(selector) {
        return Number(await this.systemTest.getDriver().executeScript(`
          return Array.from(document.querySelectorAll(arguments[0])).filter((element) => {
            const style = window.getComputedStyle(element)
            return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0
          }).length
        `, selector));
    }
    /** @returns {Promise<string>} */
    async optionsContainerSelector() {
        if (this._optionsContainerSelector)
            return this._optionsContainerSelector;
        const openedElements = await this.findElements(`${this.componentSelector}[data-opened='true']`);
        const componentElements = openedElements.length > 0 ? openedElements : await this.findVisibleElements(this.componentSelector);
        const id = componentElements.length > 0 ? await componentElements[0].getAttribute("data-id") : null;
        this._optionsContainerSelector = id ? `[data-testid='haya-select/options-container'][data-id="${cssAttributeValue(id)}"]` : this.optionsContainerSelectorFallback;
        return this._optionsContainerSelector;
    }
    /** @returns {Promise<string[]>} */
    async optionTexts() {
        const optionsContainerSelector = await this.optionsContainerSelector();
        const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`);
        return await Promise.all(options.map(async (option) => (await option.getText()).trim()));
    }
    /**
     * @param {{index?: number, text?: string, value?: string|number}} criteria
     * @returns {Promise<void>}
     */
    async selectOption({ index, text, value, ...restArgs } = {}) {
        if (arguments.length === 0) {
            throw new Error("Expected criteria for selectOption, got: undefined");
        }
        const extraKeys = Object.keys(restArgs);
        if (extraKeys.length > 0) {
            throw new Error(`Unexpected selectOption criteria: ${extraKeys.join(", ")}`);
        }
        if (typeof value != "undefined") {
            await waitFor({ timeout: 5000 }, async () => {
                const optionsContainerSelector = await this.optionsContainerSelector();
                const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option'][data-value="${cssAttributeValue(value)}"]`);
                const option = options[0];
                if (!option) {
                    throw new Error(`No option for value: ${value}`);
                }
                await option.click();
            });
            return;
        }
        if (typeof index == "number") {
            await waitFor({ timeout: 5000 }, async () => {
                const optionsContainerSelector = await this.optionsContainerSelector();
                const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`);
                const option = options[index];
                if (!option)
                    throw new Error(`No option at index: ${index}`);
                await option.click();
            });
            return;
        }
        if (text) {
            await waitFor({ timeout: 5000 }, async () => {
                const optionsContainerSelector = await this.optionsContainerSelector();
                const options = await this.findElements(`${optionsContainerSelector} [data-testid='haya-select/option']`);
                for (const option of options) {
                    const optionText = (await option.getText()).trim();
                    if (optionText === text) {
                        await option.click();
                        return;
                    }
                }
                throw new Error(`No option found with text: ${text}`);
            });
            return;
        }
        throw new Error("Expected value, text, or index when selecting an option");
    }
}
/**
 * Clicks a visible HayaSelect option by backend value.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string | number} optionValue Backend value stored in `data-value`.
 * @param {number} timeout Maximum wait in milliseconds.
 * @param {string} [optionsContainerSelector] Options container selector to scope the lookup.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
async function clickVisibleSelectOptionByValue(systemTest, optionValue, timeout, optionsContainerSelector = "") {
    const selector = `${optionsContainerSelector ? `${optionsContainerSelector} ` : ""}[data-testid="haya-select/option"][data-value="${cssAttributeValue(optionValue)}"]`;
    const element = await findVisibleElement(systemTest, selector, timeout);
    await element.click();
}
/**
 * Clicks a visible HayaSelect option by displayed text.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} expectedText Visible fragment rendered by the option.
 * @param {number} timeout Maximum wait in milliseconds.
 * @param {string} [optionsContainerSelector] Options container selector to scope the lookup.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
async function clickVisibleSelectOptionByText(systemTest, expectedText, timeout, optionsContainerSelector = "") {
    const element = /** @type {WebElement} */ (await systemTest.getDriver().wait(async () => {
        const selector = `${optionsContainerSelector ? `${optionsContainerSelector} ` : ""}[data-testid='haya-select/option']`;
        const optionElements = await systemTest.getDriver().findElements(By.css(selector));
        for (const optionElement of optionElements) {
            if (!(await optionElement.isDisplayed())) {
                continue;
            }
            const actualText = await optionElement.getText();
            if (actualText.includes(expectedText)) {
                return optionElement;
            }
        }
        return false;
    }, timeout, `Timed out waiting for visible select option text ${expectedText}`));
    await element.click();
}
/**
 * Finds a visible element by CSS selector.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} selector CSS query that can match one or more nodes.
 * @param {number} timeout Maximum wait in milliseconds.
 * @returns {Promise<WebElement>} First displayed match.
 */
async function findVisibleElement(systemTest, selector, timeout) {
    const element = await systemTest.getDriver().wait(async () => {
        const elements = await systemTest.getDriver().findElements(By.css(selector));
        for (const element of elements) {
            if (await element.isDisplayed()) {
                return element;
            }
        }
        return false;
    }, timeout, `Timed out waiting for visible selector ${selector}`);
    return /** @type {WebElement} */ (element);
}
/**
 * Builds a data-testid CSS selector.
 * @param {string} testId Raw value from the component's `testID` prop.
 * @returns {string} Attribute selector for the value.
 */
function testIdSelector(testId) {
    return `[data-testid="${cssAttributeValue(testId)}"]`;
}
/**
 * Escapes a value for use inside a double-quoted CSS attribute selector.
 * @param {string | number} value Raw attribute value to interpolate.
 * @returns {string} String safe for a double-quoted attribute selector.
 */
function cssAttributeValue(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtLXRlc3QtaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zeXN0ZW0tdGVzdC1oZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDRCQUE0QixDQUFBO0FBQ2hELE9BQU8sRUFBQyxFQUFFLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQTtBQUVyQyx3RkFBd0Y7QUFDeEYscUZBQXFGO0FBQ3JGLGlLQUFpSztBQUNqSyxzR0FBc0c7QUFDdEcsMEVBQTBFO0FBQzFFLHlFQUF5RTtBQUN6RSxvRUFBb0U7QUFFcEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFBO0FBRTVCOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsRUFBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBTyxHQUFHLGVBQWUsRUFBRSxlQUFlLEdBQUcsSUFBSSxFQUFDO0lBQ3pKLE1BQU0sTUFBTSxHQUFHLElBQUksMEJBQTBCLENBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQTtJQUNuRSxNQUFNLGFBQWEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUE7SUFDdkcsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUE7SUFFM0IsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBQ2pFLENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUE7UUFDbkcsTUFBTSxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQzFDLENBQUM7SUFFRCxNQUFNLHdCQUF3QixHQUFHLE1BQU0sTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUE7SUFFeEUsSUFBSSxPQUFPLFdBQVcsS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUN2QyxNQUFNLCtCQUErQixDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixDQUFDLENBQUE7UUFDakcsT0FBTTtJQUNSLENBQUM7SUFFRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2YsTUFBTSw4QkFBOEIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO1FBQy9GLE9BQU07SUFDUixDQUFDO0lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsTUFBTSxFQUFFLENBQUMsQ0FBQTtBQUNyRSxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxFQUFDLFdBQVcsRUFBRSxPQUFPLEdBQUcsZUFBZSxFQUFDO0lBQ3JHLE1BQU0sK0JBQStCLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUN6RSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxjQUFjLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFDLE9BQU8sR0FBRyxlQUFlLEVBQUUsZUFBZSxHQUFHLElBQUksRUFBQyxHQUFHLEVBQUU7SUFDL0csTUFBTSxNQUFNLEdBQUcsSUFBSSwwQkFBMEIsQ0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFBO0lBRW5FLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFBO0FBQy9DLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUMsT0FBTyxHQUFHLGVBQWUsRUFBRSxlQUFlLEdBQUcsSUFBSSxFQUFDLEdBQUcsRUFBRTtJQUNoSCxNQUFNLE1BQU0sR0FBRyxJQUFJLDBCQUEwQixDQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUE7SUFFbkUsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUE7QUFDaEQsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLDhCQUE4QixDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEVBQUMsT0FBTyxHQUFHLGVBQWUsRUFBQyxHQUFHLEVBQUU7SUFDdEgsTUFBTSxRQUFRLEdBQUcsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLDZDQUE2QyxDQUFBO0lBQ3ZGLE1BQU0sVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FDL0IsS0FBSyxJQUFJLEVBQUU7UUFDVCxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBQzVFLHVCQUF1QjtRQUN2QixNQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7UUFFdkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUMvQixJQUFJLE1BQU0sT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUM1QyxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakQsT0FBTyxLQUFLLENBQUE7UUFDZCxDQUFDO1FBRUQsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFBO0lBQ2xHLENBQUMsRUFDRCxPQUFPLEVBQ1AseUJBQXlCLE1BQU0scUJBQXFCLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDL0UsQ0FBQTtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsRUFBQyxPQUFPLEdBQUcsZUFBZSxFQUFDLEdBQUcsRUFBRTtJQUN0RyxNQUFNLE1BQU0sR0FBRyxJQUFJLDBCQUEwQixDQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUE7SUFFbkUsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQTtBQUN0QyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsT0FBTyxPQUFPLDBCQUEwQjtJQUM3Qyx5REFBeUQ7SUFDekQsWUFBWSxPQUFPO1FBQ2pCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDckYsQ0FBQztRQUVELE1BQU0sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsUUFBUSxFQUFDLEdBQUcsT0FBTyxDQUFBO1FBQ2pELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdkMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQy9GLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtRQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSw4QkFBOEIsQ0FBQTtRQUMzRSxJQUFJLENBQUMsd0JBQXdCLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxnREFBZ0QsQ0FBQTtRQUNwRyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSwrQ0FBK0MsQ0FBQTtRQUNsRyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSwyQ0FBMkMsQ0FBQTtRQUMxRixJQUFJLENBQUMsZ0NBQWdDLEdBQUcsK0NBQStDLENBQUE7SUFDekYsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEdBQUcsZUFBZSxFQUFFLGVBQWUsR0FBRyxJQUFJLEVBQUMsR0FBRyxFQUFFO1FBQ2pFLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUE7UUFDM0QsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQTtRQUVyQyxNQUFNLE9BQU8sQ0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsc0JBQXNCLENBQUMsQ0FBQTtZQUUvRixJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO1lBQ2hFLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxHQUFHLGVBQWUsRUFBRSxlQUFlLEdBQUcsSUFBSSxFQUFDLEdBQUcsRUFBRTtRQUNsRSxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFBO1FBRTNELE1BQU0sT0FBTyxDQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEMsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixzQkFBc0IsQ0FBQyxDQUFBO1lBRS9GLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7WUFDakUsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBQyxPQUFPLEdBQUcsZUFBZSxFQUFDLEdBQUcsRUFBRTtRQUNqRCxNQUFNLE9BQU8sQ0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xDLE1BQU0sd0JBQXdCLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQTtZQUN0RSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUNoQyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUE7WUFDeEYsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLHdCQUF3QixxQ0FBcUMsQ0FBQyxDQUFBO1lBRTdILElBQUksSUFBSSxJQUFJLHNCQUFzQixHQUFHLENBQUMsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxNQUFNLCtCQUErQixJQUFJLHVCQUF1QixzQkFBc0Isb0JBQW9CLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtZQUNuSyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixzQkFBc0IsQ0FBQyxDQUFBO1FBRS9GLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFFMUMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFFN0UsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtJQUNoQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQUMsT0FBTyxHQUFHLGVBQWUsRUFBRSxlQUFlLEdBQUcsSUFBSSxFQUFDLEdBQUcsRUFBRTtRQUNqRixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFBO1FBRTVHLE1BQU0sZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFBO0lBQy9CLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVE7UUFDekIsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUN6RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFFBQVE7UUFDaEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2xELE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQTtRQUUxQixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQy9CLElBQUksTUFBTSxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMvQixDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sZUFBZSxDQUFBO0lBQ3hCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVE7UUFDakMsT0FBTyxNQUFNLENBQ1gsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLGFBQWEsQ0FDN0M7Ozs7O1NBS0MsRUFDRCxRQUFRLENBQ1QsQ0FDRixDQUFBO0lBQ0gsQ0FBQztJQUVELGlDQUFpQztJQUNqQyxLQUFLLENBQUMsd0JBQXdCO1FBQzVCLElBQUksSUFBSSxDQUFDLHlCQUF5QjtZQUFFLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFBO1FBRXpFLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsc0JBQXNCLENBQUMsQ0FBQTtRQUMvRixNQUFNLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1FBQzdILE1BQU0sRUFBRSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0saUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7UUFFbkcsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsMERBQTBELGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQTtRQUVqSyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQTtJQUN2QyxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLEtBQUssQ0FBQyxXQUFXO1FBQ2YsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO1FBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLHdCQUF3QixxQ0FBcUMsQ0FBQyxDQUFBO1FBRXpHLE9BQU8sTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUMxRixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsUUFBUSxFQUFDLEdBQUcsRUFBRTtRQUN2RCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFBO1FBQ3ZFLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRXZDLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5RSxDQUFDO1FBRUQsSUFBSSxPQUFPLEtBQUssSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNoQyxNQUFNLE9BQU8sQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDeEMsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO2dCQUN0RSxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyx3QkFBd0IsbURBQW1ELGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDbkosTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUV6QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsS0FBSyxFQUFFLENBQUMsQ0FBQTtnQkFDbEQsQ0FBQztnQkFFRCxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtZQUN0QixDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBRUQsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLE9BQU8sQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDeEMsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO2dCQUN0RSxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyx3QkFBd0IscUNBQXFDLENBQUMsQ0FBQTtnQkFDekcsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUU3QixJQUFJLENBQUMsTUFBTTtvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixLQUFLLEVBQUUsQ0FBQyxDQUFBO2dCQUU1RCxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtZQUN0QixDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBRUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULE1BQU0sT0FBTyxDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN4QyxNQUFNLHdCQUF3QixHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUE7Z0JBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLHdCQUF3QixxQ0FBcUMsQ0FBQyxDQUFBO2dCQUV6RyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUM3QixNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7b0JBRWxELElBQUksVUFBVSxLQUFLLElBQUksRUFBRSxDQUFDO3dCQUN4QixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTt3QkFDcEIsT0FBTTtvQkFDUixDQUFDO2dCQUNILENBQUM7Z0JBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQTtZQUN2RCxDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFBO0lBQzVFLENBQUM7Q0FDRjtBQUVEOzs7Ozs7O0dBT0c7QUFDSCxLQUFLLFVBQVUsK0JBQStCLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEdBQUcsRUFBRTtJQUM1RyxNQUFNLFFBQVEsR0FBRyxHQUFHLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxHQUFHLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsa0RBQWtELGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUE7SUFDdEssTUFBTSxPQUFPLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ3ZFLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ3ZCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsS0FBSyxVQUFVLDhCQUE4QixDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixHQUFHLEVBQUU7SUFDNUcsTUFBTSxPQUFPLEdBQUcseUJBQXlCLENBQUMsQ0FDeEMsTUFBTSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUMvQixLQUFLLElBQUksRUFBRTtRQUNULE1BQU0sUUFBUSxHQUFHLEdBQUcsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQTtRQUN0SCxNQUFNLGNBQWMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBRWxGLEtBQUssTUFBTSxhQUFhLElBQUksY0FBYyxFQUFFLENBQUM7WUFDM0MsSUFBSSxDQUFDLENBQUMsTUFBTSxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxTQUFRO1lBQ1YsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQ2hELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLGFBQWEsQ0FBQTtZQUN0QixDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQyxFQUNELE9BQU8sRUFDUCxvREFBb0QsWUFBWSxFQUFFLENBQ25FLENBQ0YsQ0FBQTtJQUVELE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ3ZCLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxLQUFLLFVBQVUsa0JBQWtCLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPO0lBQzdELE1BQU0sT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FDL0MsS0FBSyxJQUFJLEVBQUU7UUFDVCxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBRTVFLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7WUFDL0IsSUFBSSxNQUFNLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLE9BQU8sQ0FBQTtZQUNoQixDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQyxFQUNELE9BQU8sRUFDUCwwQ0FBMEMsUUFBUSxFQUFFLENBQ3JELENBQUE7SUFFRCxPQUFPLHlCQUF5QixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDNUMsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxNQUFNO0lBQzVCLE9BQU8saUJBQWlCLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7QUFDdkQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGlCQUFpQixDQUFDLEtBQUs7SUFDOUIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3RFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgd2FpdEZvciBmcm9tIFwiYXdhaXRlcnkvYnVpbGQvd2FpdC1mb3IuanNcIlxuaW1wb3J0IHtCeX0gZnJvbSBcInNlbGVuaXVtLXdlYmRyaXZlclwiXG5cbi8qKiBAdHlwZWRlZiB7e3N5c3RlbVRlc3Q6IG9iamVjdCwgdGVzdElkOiBzdHJpbmd9fSBIYXlhU2VsZWN0U3lzdGVtVGVzdEhlbHBlck9wdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7e3RpbWVvdXQ/OiBudW1iZXIsIHVzZUJhc2VTZWxlY3Rvcj86IGJvb2xlYW59fSBIYXlhU2VsZWN0T3Blbk9wdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7e29wdGlvblRleHQ/OiBzdHJpbmcsIG9wdGlvblZhbHVlPzogc3RyaW5nIHwgbnVtYmVyLCBzZWFyY2g/OiBib29sZWFuLCB0aW1lb3V0PzogbnVtYmVyLCB1c2VCYXNlU2VsZWN0b3I/OiBib29sZWFufX0gUGlja0hheWFTZWxlY3RPcHRpb25PcHRpb25zICovXG4vKiogQHR5cGVkZWYge3tvcHRpb25WYWx1ZTogc3RyaW5nIHwgbnVtYmVyLCB0aW1lb3V0PzogbnVtYmVyfX0gQ2xpY2tWaXNpYmxlSGF5YVNlbGVjdE9wdGlvbk9wdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7e3RpbWVvdXQ/OiBudW1iZXJ9fSBFeHBlY3RIYXlhU2VsZWN0Q3VycmVudE9wdGlvbnNPcHRpb25zICovXG4vKiogQHR5cGVkZWYge3t0aW1lb3V0PzogbnVtYmVyfX0gRXhwZWN0SGF5YVNlbGVjdE9wdGlvbnNDbG9zZWRPcHRpb25zICovXG4vKiogQHR5cGVkZWYge2ltcG9ydChcInNlbGVuaXVtLXdlYmRyaXZlclwiKS5XZWJFbGVtZW50fSBXZWJFbGVtZW50ICovXG5cbmNvbnN0IERFRkFVTFRfVElNRU9VVCA9IDUwMDBcblxuLyoqXG4gKiBTZWxlY3RzIGFuIG9wdGlvbiBpbiBhIEhheWFTZWxlY3QgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge29iamVjdH0gc3lzdGVtVGVzdCBCcm93c2VyIHNlc3Npb24gdXNlZCBieSB0aGUgcnVubmluZyBzcGVjLlxuICogQHBhcmFtIHtzdHJpbmd9IHRlc3RJZCBXcmFwcGVyIGBkYXRhLXRlc3RpZGAgYXJvdW5kIHRoZSBzZWxlY3QuXG4gKiBAcGFyYW0ge1BpY2tIYXlhU2VsZWN0T3B0aW9uT3B0aW9uc30gb3B0aW9ucyBUZXh0L3ZhbHVlIHRvIGNob29zZSBhbmQgd2hldGhlciB0byB0eXBlIGludG8gdGhlIHNlYXJjaCBmaWVsZCBmaXJzdC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgdGhlIG1hdGNoaW5nIHZpc2libGUgb3B0aW9uIGlzIGNsaWNrZWQuXG4gKiBAcmVqZWN0cyB7RXJyb3J9IFdoZW4gbmVpdGhlciB0ZXh0IG5vciB2YWx1ZSBpcyBzdXBwbGllZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBpY2tIYXlhU2VsZWN0T3B0aW9uKHN5c3RlbVRlc3QsIHRlc3RJZCwge29wdGlvblRleHQsIG9wdGlvblZhbHVlLCBzZWFyY2ggPSBmYWxzZSwgdGltZW91dCA9IERFRkFVTFRfVElNRU9VVCwgdXNlQmFzZVNlbGVjdG9yID0gdHJ1ZX0pIHtcbiAgY29uc3QgaGVscGVyID0gbmV3IEhheWFTZWxlY3RTeXN0ZW1UZXN0SGVscGVyKHtzeXN0ZW1UZXN0LCB0ZXN0SWR9KVxuICBjb25zdCBzZWxlY3RFbGVtZW50ID0gYXdhaXQgc3lzdGVtVGVzdC5maW5kKGhlbHBlci5zZWxlY3RDb250YWluZXJTZWxlY3Rvciwge3RpbWVvdXQsIHVzZUJhc2VTZWxlY3Rvcn0pXG4gIGF3YWl0IHNlbGVjdEVsZW1lbnQuY2xpY2soKVxuXG4gIGlmIChzZWFyY2gpIHtcbiAgICBpZiAoIW9wdGlvblRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgb3B0aW9uVGV4dCB3aGVuIHNlYXJjaGluZyAke3Rlc3RJZH1gKVxuICAgIH1cblxuICAgIGNvbnN0IHNlYXJjaEVsZW1lbnQgPSBhd2FpdCBzeXN0ZW1UZXN0LmZpbmQoaGVscGVyLnNlYXJjaElucHV0U2VsZWN0b3IsIHt0aW1lb3V0LCB1c2VCYXNlU2VsZWN0b3J9KVxuICAgIGF3YWl0IHNlYXJjaEVsZW1lbnQuc2VuZEtleXMob3B0aW9uVGV4dClcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnNDb250YWluZXJTZWxlY3RvciA9IGF3YWl0IGhlbHBlci5vcHRpb25zQ29udGFpbmVyU2VsZWN0b3IoKVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9uVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBhd2FpdCBjbGlja1Zpc2libGVTZWxlY3RPcHRpb25CeVZhbHVlKHN5c3RlbVRlc3QsIG9wdGlvblZhbHVlLCB0aW1lb3V0LCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAob3B0aW9uVGV4dCkge1xuICAgIGF3YWl0IGNsaWNrVmlzaWJsZVNlbGVjdE9wdGlvbkJ5VGV4dChzeXN0ZW1UZXN0LCBvcHRpb25UZXh0LCB0aW1lb3V0LCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IpXG4gICAgcmV0dXJuXG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG9wdGlvblZhbHVlIG9yIG9wdGlvblRleHQgZm9yICR7dGVzdElkfWApXG59XG5cbi8qKlxuICogQ2xpY2tzIGFuIG9wdGlvbiBpbiBhbiBhbHJlYWR5LW9wZW4gSGF5YVNlbGVjdCBkcm9wZG93bi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBzeXN0ZW1UZXN0IEJyb3dzZXIgc2Vzc2lvbiB1c2VkIGJ5IHRoZSBydW5uaW5nIHNwZWMuXG4gKiBAcGFyYW0ge0NsaWNrVmlzaWJsZUhheWFTZWxlY3RPcHRpb25PcHRpb25zfSBvcHRpb25zIE9wdGlvbiB2YWx1ZSB0byBjaG9vc2UuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQ29tcGxldGVzIGFmdGVyIHRoZSBtYXRjaGluZyB2aXNpYmxlIG9wdGlvbiBpcyBjbGlja2VkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xpY2tWaXNpYmxlSGF5YVNlbGVjdE9wdGlvbihzeXN0ZW1UZXN0LCB7b3B0aW9uVmFsdWUsIHRpbWVvdXQgPSBERUZBVUxUX1RJTUVPVVR9KSB7XG4gIGF3YWl0IGNsaWNrVmlzaWJsZVNlbGVjdE9wdGlvbkJ5VmFsdWUoc3lzdGVtVGVzdCwgb3B0aW9uVmFsdWUsIHRpbWVvdXQpXG59XG5cbi8qKlxuICogT3BlbnMgYSBIYXlhU2VsZWN0IGluc3RhbmNlIGJ5IGNsaWNraW5nIGl0cyBzZWxlY3QgY29udGFpbmVyLlxuICogQHBhcmFtIHtvYmplY3R9IHN5c3RlbVRlc3QgQnJvd3NlciBzZXNzaW9uIHVzZWQgYnkgdGhlIHJ1bm5pbmcgc3BlYy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXN0SWQgV3JhcHBlciBgZGF0YS10ZXN0aWRgIGFyb3VuZCB0aGUgc2VsZWN0LlxuICogQHBhcmFtIHtIYXlhU2VsZWN0T3Blbk9wdGlvbnN9IFtvcHRpb25zXSBPcHRpb25hbCBzZWxlY3RvciBzY29wZSBhbmQgdGltZW91dC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgdGhlIHNlbGVjdCBvcGVucy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wZW5IYXlhU2VsZWN0KHN5c3RlbVRlc3QsIHRlc3RJZCwge3RpbWVvdXQgPSBERUZBVUxUX1RJTUVPVVQsIHVzZUJhc2VTZWxlY3RvciA9IHRydWV9ID0ge30pIHtcbiAgY29uc3QgaGVscGVyID0gbmV3IEhheWFTZWxlY3RTeXN0ZW1UZXN0SGVscGVyKHtzeXN0ZW1UZXN0LCB0ZXN0SWR9KVxuXG4gIGF3YWl0IGhlbHBlci5vcGVuKHt0aW1lb3V0LCB1c2VCYXNlU2VsZWN0b3J9KVxufVxuXG4vKipcbiAqIENsb3NlcyBhIEhheWFTZWxlY3QgaW5zdGFuY2UgYnkgY2xpY2tpbmcgaXRzIHNlbGVjdCBjb250YWluZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gc3lzdGVtVGVzdCBCcm93c2VyIHNlc3Npb24gdXNlZCBieSB0aGUgcnVubmluZyBzcGVjLlxuICogQHBhcmFtIHtzdHJpbmd9IHRlc3RJZCBXcmFwcGVyIGBkYXRhLXRlc3RpZGAgYXJvdW5kIHRoZSBzZWxlY3QuXG4gKiBAcGFyYW0ge0hheWFTZWxlY3RPcGVuT3B0aW9uc30gW29wdGlvbnNdIE9wdGlvbmFsIHNlbGVjdG9yIHNjb3BlIGFuZCB0aW1lb3V0LlxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IENvbXBsZXRlcyBhZnRlciB0aGUgc2VsZWN0IGNsb3Nlcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlSGF5YVNlbGVjdChzeXN0ZW1UZXN0LCB0ZXN0SWQsIHt0aW1lb3V0ID0gREVGQVVMVF9USU1FT1VULCB1c2VCYXNlU2VsZWN0b3IgPSB0cnVlfSA9IHt9KSB7XG4gIGNvbnN0IGhlbHBlciA9IG5ldyBIYXlhU2VsZWN0U3lzdGVtVGVzdEhlbHBlcih7c3lzdGVtVGVzdCwgdGVzdElkfSlcblxuICBhd2FpdCBoZWxwZXIuY2xvc2Uoe3RpbWVvdXQsIHVzZUJhc2VTZWxlY3Rvcn0pXG59XG5cbi8qKlxuICogV2FpdHMgdW50aWwgYSBIYXlhU2VsZWN0IHJlbmRlcnMgZXhhY3RseSB0aGUgZXhwZWN0ZWQgY3VycmVudC1vcHRpb24gbGFiZWxzLlxuICogQHBhcmFtIHtvYmplY3R9IHN5c3RlbVRlc3QgQnJvd3NlciBzZXNzaW9uIHVzZWQgYnkgdGhlIHJ1bm5pbmcgc3BlYy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXN0SWQgV3JhcHBlciBgZGF0YS10ZXN0aWRgIGFyb3VuZCB0aGUgc2VsZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gZXhwZWN0ZWRUZXh0cyBDdXJyZW50IG9wdGlvbiB0ZXh0IGZyYWdtZW50cyBpbiByZW5kZXJlZCBvcmRlci5cbiAqIEBwYXJhbSB7RXhwZWN0SGF5YVNlbGVjdEN1cnJlbnRPcHRpb25zT3B0aW9uc30gW29wdGlvbnNdIE9wdGlvbmFsIFNlbGVuaXVtIHRpbWVvdXQgb3ZlcnJpZGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQ29tcGxldGVzIGFmdGVyIHRoZSBjdXJyZW50IG9wdGlvbnMgbWF0Y2guXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBlY3RIYXlhU2VsZWN0Q3VycmVudE9wdGlvbnMoc3lzdGVtVGVzdCwgdGVzdElkLCBleHBlY3RlZFRleHRzLCB7dGltZW91dCA9IERFRkFVTFRfVElNRU9VVH0gPSB7fSkge1xuICBjb25zdCBzZWxlY3RvciA9IGAke3Rlc3RJZFNlbGVjdG9yKHRlc3RJZCl9IFtkYXRhLXRlc3RpZD1cImhheWEtc2VsZWN0L2N1cnJlbnQtb3B0aW9uXCJdYFxuICBhd2FpdCBzeXN0ZW1UZXN0LmdldERyaXZlcigpLndhaXQoXG4gICAgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCBzeXN0ZW1UZXN0LmdldERyaXZlcigpLmZpbmRFbGVtZW50cyhCeS5jc3Moc2VsZWN0b3IpKVxuICAgICAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgICAgIGNvbnN0IHZpc2libGVUZXh0cyA9IFtdXG5cbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICBpZiAoYXdhaXQgZWxlbWVudC5pc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgICAgdmlzaWJsZVRleHRzLnB1c2goYXdhaXQgZWxlbWVudC5nZXRUZXh0KCkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHZpc2libGVUZXh0cy5sZW5ndGggIT09IGV4cGVjdGVkVGV4dHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwZWN0ZWRUZXh0cy5ldmVyeSgoZXhwZWN0ZWRUZXh0LCBpbmRleCkgPT4gdmlzaWJsZVRleHRzW2luZGV4XT8uaW5jbHVkZXMoZXhwZWN0ZWRUZXh0KSlcbiAgICB9LFxuICAgIHRpbWVvdXQsXG4gICAgYFRpbWVkIG91dCB3YWl0aW5nIGZvciAke3Rlc3RJZH0gY3VycmVudCBvcHRpb25zOiAke2V4cGVjdGVkVGV4dHMuam9pbihcIiwgXCIpfWBcbiAgKVxufVxuXG4vKipcbiAqIFdhaXRzIHVudGlsIGEgSGF5YVNlbGVjdCBhbmQgaXRzIHBvcnRhbC1yZW5kZXJlZCBvcHRpb25zIGFyZSBjbG9zZWQuXG4gKiBAcGFyYW0ge29iamVjdH0gc3lzdGVtVGVzdCBCcm93c2VyIHNlc3Npb24gdXNlZCBieSB0aGUgcnVubmluZyBzcGVjLlxuICogQHBhcmFtIHtzdHJpbmd9IHRlc3RJZCBXcmFwcGVyIGBkYXRhLXRlc3RpZGAgYXJvdW5kIHRoZSBzZWxlY3QuXG4gKiBAcGFyYW0ge0V4cGVjdEhheWFTZWxlY3RPcHRpb25zQ2xvc2VkT3B0aW9uc30gW29wdGlvbnNdIE9wdGlvbmFsIFNlbGVuaXVtIHRpbWVvdXQgb3ZlcnJpZGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQ29tcGxldGVzIGFmdGVyIG5vIHZpc2libGUgb3B0aW9ucyByZW1haW4uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBlY3RIYXlhU2VsZWN0T3B0aW9uc0Nsb3NlZChzeXN0ZW1UZXN0LCB0ZXN0SWQsIHt0aW1lb3V0ID0gREVGQVVMVF9USU1FT1VUfSA9IHt9KSB7XG4gIGNvbnN0IGhlbHBlciA9IG5ldyBIYXlhU2VsZWN0U3lzdGVtVGVzdEhlbHBlcih7c3lzdGVtVGVzdCwgdGVzdElkfSlcblxuICBhd2FpdCBoZWxwZXIuZXhwZWN0Q2xvc2VkKHt0aW1lb3V0fSlcbn1cblxuLyoqXG4gKiBTeXN0ZW0gdGVzdCBoZWxwZXIgZm9yIGludGVyYWN0aW5nIHdpdGggSGF5YVNlbGVjdCBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhheWFTZWxlY3RTeXN0ZW1UZXN0SGVscGVyIHtcbiAgLyoqIEBwYXJhbSB7SGF5YVNlbGVjdFN5c3RlbVRlc3RIZWxwZXJPcHRpb25zfSBvcHRpb25zICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgb3B0aW9ucyBmb3IgSGF5YVNlbGVjdFN5c3RlbVRlc3RIZWxwZXIsIGdvdDogJHtvcHRpb25zfWApXG4gICAgfVxuXG4gICAgY29uc3Qge3N5c3RlbVRlc3QsIHRlc3RJZCwgLi4ucmVzdEFyZ3N9ID0gb3B0aW9uc1xuICAgIGNvbnN0IGV4dHJhS2V5cyA9IE9iamVjdC5rZXlzKHJlc3RBcmdzKVxuXG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgb3B0aW9ucyBmb3IgSGF5YVNlbGVjdFN5c3RlbVRlc3RIZWxwZXI6ICR7ZXh0cmFLZXlzLmpvaW4oXCIsIFwiKX1gKVxuICAgIH1cblxuICAgIHRoaXMuc3lzdGVtVGVzdCA9IHN5c3RlbVRlc3RcbiAgICB0aGlzLnRlc3RJZCA9IHRlc3RJZFxuICAgIHRoaXMucm9vdFNlbGVjdG9yID0gdGVzdElkU2VsZWN0b3IodGVzdElkKVxuICAgIHRoaXMuY29tcG9uZW50U2VsZWN0b3IgPSBgJHt0aGlzLnJvb3RTZWxlY3Rvcn0gW2RhdGEtdGVzdGlkPSdoYXlhLXNlbGVjdCddYFxuICAgIHRoaXMuY2hldnJvbkNvbnRhaW5lclNlbGVjdG9yID0gYCR7dGhpcy5yb290U2VsZWN0b3J9IFtkYXRhLXRlc3RpZD0naGF5YS1zZWxlY3QvY2hldnJvbi1jb250YWluZXInXWBcbiAgICB0aGlzLnNlbGVjdENvbnRhaW5lclNlbGVjdG9yID0gYCR7dGhpcy5yb290U2VsZWN0b3J9IFtkYXRhLXRlc3RpZD0naGF5YS1zZWxlY3Qvc2VsZWN0LWNvbnRhaW5lciddYFxuICAgIHRoaXMuc2VhcmNoSW5wdXRTZWxlY3RvciA9IGAke3RoaXMucm9vdFNlbGVjdG9yfSBbZGF0YS10ZXN0aWQ9J2hheWEtc2VsZWN0L3NlYXJjaC1pbnB1dCddYFxuICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yRmFsbGJhY2sgPSBcIltkYXRhLXRlc3RpZD0naGF5YS1zZWxlY3Qvb3B0aW9ucy1jb250YWluZXInXVwiXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtIYXlhU2VsZWN0T3Blbk9wdGlvbnN9IFtvcHRpb25zXSBPcHRpb25hbCBzZWxlY3RvciBzY29wZSBhbmQgdGltZW91dC5cbiAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IENvbXBsZXRlcyBhZnRlciB0aGUgc2VsZWN0IG9wZW5zLlxuICAgKi9cbiAgYXN5bmMgb3Blbih7dGltZW91dCA9IERFRkFVTFRfVElNRU9VVCwgdXNlQmFzZVNlbGVjdG9yID0gdHJ1ZX0gPSB7fSkge1xuICAgIGF3YWl0IHRoaXMuY2xpY2tTZWxlY3RDb250YWluZXIoe3RpbWVvdXQsIHVzZUJhc2VTZWxlY3Rvcn0pXG4gICAgdGhpcy5fb3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yID0gbnVsbFxuXG4gICAgYXdhaXQgd2FpdEZvcih7dGltZW91dH0sIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG9wZW5lZEVsZW1lbnRzID0gYXdhaXQgdGhpcy5maW5kRWxlbWVudHMoYCR7dGhpcy5jb21wb25lbnRTZWxlY3Rvcn1bZGF0YS1vcGVuZWQ9J3RydWUnXWApXG5cbiAgICAgIGlmIChvcGVuZWRFbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBIYXlhU2VsZWN0IHRvIG9wZW46ICR7dGhpcy50ZXN0SWR9YClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGF5YVNlbGVjdE9wZW5PcHRpb25zfSBbb3B0aW9uc10gT3B0aW9uYWwgc2VsZWN0b3Igc2NvcGUgYW5kIHRpbWVvdXQuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgdGhlIHNlbGVjdCBjbG9zZXMuXG4gICAqL1xuICBhc3luYyBjbG9zZSh7dGltZW91dCA9IERFRkFVTFRfVElNRU9VVCwgdXNlQmFzZVNlbGVjdG9yID0gdHJ1ZX0gPSB7fSkge1xuICAgIGF3YWl0IHRoaXMuY2xpY2tTZWxlY3RDb250YWluZXIoe3RpbWVvdXQsIHVzZUJhc2VTZWxlY3Rvcn0pXG5cbiAgICBhd2FpdCB3YWl0Rm9yKHt0aW1lb3V0fSwgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgb3BlbmVkRWxlbWVudHMgPSBhd2FpdCB0aGlzLmZpbmRFbGVtZW50cyhgJHt0aGlzLmNvbXBvbmVudFNlbGVjdG9yfVtkYXRhLW9wZW5lZD0ndHJ1ZSddYClcblxuICAgICAgaWYgKG9wZW5lZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBIYXlhU2VsZWN0IHRvIGNsb3NlOiAke3RoaXMudGVzdElkfWApXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0V4cGVjdEhheWFTZWxlY3RPcHRpb25zQ2xvc2VkT3B0aW9uc30gW29wdGlvbnNdIE9wdGlvbmFsIHRpbWVvdXQuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgbm8gdmlzaWJsZSBvcHRpb25zIHJlbWFpbi5cbiAgICovXG4gIGFzeW5jIGV4cGVjdENsb3NlZCh7dGltZW91dCA9IERFRkFVTFRfVElNRU9VVH0gPSB7fSkge1xuICAgIGF3YWl0IHdhaXRGb3Ioe3RpbWVvdXR9LCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPSBhd2FpdCB0aGlzLm9wdGlvbnNDb250YWluZXJTZWxlY3RvcigpXG4gICAgICBjb25zdCBvcGVuID0gYXdhaXQgdGhpcy5pc09wZW4oKVxuICAgICAgY29uc3QgdmlzaWJsZUNvbnRhaW5lcnNDb3VudCA9IGF3YWl0IHRoaXMudmlzaWJsZUVsZW1lbnRzQ291bnQob3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yKVxuICAgICAgY29uc3QgdmlzaWJsZU9wdGlvbnNDb3VudCA9IGF3YWl0IHRoaXMudmlzaWJsZUVsZW1lbnRzQ291bnQoYCR7b3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yfSBbZGF0YS10ZXN0aWQ9J2hheWEtc2VsZWN0L29wdGlvbiddYClcblxuICAgICAgaWYgKG9wZW4gfHwgdmlzaWJsZUNvbnRhaW5lcnNDb3VudCA+IDAgfHwgdmlzaWJsZU9wdGlvbnNDb3VudCA+IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAke3RoaXMudGVzdElkfSBvcHRpb25zIHRvIGNsb3NlLCBnb3Qgb3Blbj0ke29wZW59LCB2aXNpYmxlQ29udGFpbmVycz0ke3Zpc2libGVDb250YWluZXJzQ291bnR9LCB2aXNpYmxlT3B0aW9ucz0ke3Zpc2libGVPcHRpb25zQ291bnR9YClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fSAqL1xuICBhc3luYyBpc09wZW4oKSB7XG4gICAgY29uc3Qgb3BlbmVkRWxlbWVudHMgPSBhd2FpdCB0aGlzLmZpbmRFbGVtZW50cyhgJHt0aGlzLmNvbXBvbmVudFNlbGVjdG9yfVtkYXRhLW9wZW5lZD0ndHJ1ZSddYClcblxuICAgIGlmIChvcGVuZWRFbGVtZW50cy5sZW5ndGggPiAwKSByZXR1cm4gdHJ1ZVxuXG4gICAgY29uc3Qgc2VhcmNoSW5wdXRzID0gYXdhaXQgdGhpcy5maW5kVmlzaWJsZUVsZW1lbnRzKHRoaXMuc2VhcmNoSW5wdXRTZWxlY3RvcilcblxuICAgIHJldHVybiBzZWFyY2hJbnB1dHMubGVuZ3RoID4gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGF5YVNlbGVjdE9wZW5PcHRpb25zfSBbb3B0aW9uc10gT3B0aW9uYWwgc2VsZWN0b3Igc2NvcGUgYW5kIHRpbWVvdXQuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgdGhlIHNlbGVjdCBjb250YWluZXIgY2xpY2suXG4gICAqL1xuICBhc3luYyBjbGlja1NlbGVjdENvbnRhaW5lcih7dGltZW91dCA9IERFRkFVTFRfVElNRU9VVCwgdXNlQmFzZVNlbGVjdG9yID0gdHJ1ZX0gPSB7fSkge1xuICAgIGNvbnN0IHNlbGVjdENvbnRhaW5lciA9IGF3YWl0IHRoaXMuc3lzdGVtVGVzdC5maW5kKHRoaXMuc2VsZWN0Q29udGFpbmVyU2VsZWN0b3IsIHt0aW1lb3V0LCB1c2VCYXNlU2VsZWN0b3J9KVxuXG4gICAgYXdhaXQgc2VsZWN0Q29udGFpbmVyLmNsaWNrKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3JcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk8aW1wb3J0KFwic2VsZW5pdW0td2ViZHJpdmVyXCIpLldlYkVsZW1lbnQ+Pn1cbiAgICovXG4gIGFzeW5jIGZpbmRFbGVtZW50cyhzZWxlY3Rvcikge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnN5c3RlbVRlc3QuZ2V0RHJpdmVyKCkuZmluZEVsZW1lbnRzKEJ5LmNzcyhzZWxlY3RvcikpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PGltcG9ydChcInNlbGVuaXVtLXdlYmRyaXZlclwiKS5XZWJFbGVtZW50Pj59XG4gICAqL1xuICBhc3luYyBmaW5kVmlzaWJsZUVsZW1lbnRzKHNlbGVjdG9yKSB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmZpbmRFbGVtZW50cyhzZWxlY3RvcilcbiAgICBjb25zdCB2aXNpYmxlRWxlbWVudHMgPSBbXVxuXG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBpZiAoYXdhaXQgZWxlbWVudC5pc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgIHZpc2libGVFbGVtZW50cy5wdXNoKGVsZW1lbnQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZpc2libGVFbGVtZW50c1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50cyB2aXNpYmxlIGVsZW1lbnRzIGJ5IENTUyBzZWxlY3RvciBpbiBicm93c2VyIGxheW91dCBzdGF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIENTUyBzZWxlY3RvciB0byBjb3VudC5cbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn0gTnVtYmVyIG9mIHZpc2libGUgZWxlbWVudHMuXG4gICAqL1xuICBhc3luYyB2aXNpYmxlRWxlbWVudHNDb3VudChzZWxlY3Rvcikge1xuICAgIHJldHVybiBOdW1iZXIoXG4gICAgICBhd2FpdCB0aGlzLnN5c3RlbVRlc3QuZ2V0RHJpdmVyKCkuZXhlY3V0ZVNjcmlwdChcbiAgICAgICAgYFxuICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJndW1lbnRzWzBdKSkuZmlsdGVyKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm4gc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIgJiYgc3R5bGUudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIiAmJiBlbGVtZW50LmdldENsaWVudFJlY3RzKCkubGVuZ3RoID4gMFxuICAgICAgICAgIH0pLmxlbmd0aFxuICAgICAgICBgLFxuICAgICAgICBzZWxlY3RvclxuICAgICAgKVxuICAgIClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fSAqL1xuICBhc3luYyBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IoKSB7XG4gICAgaWYgKHRoaXMuX29wdGlvbnNDb250YWluZXJTZWxlY3RvcikgcmV0dXJuIHRoaXMuX29wdGlvbnNDb250YWluZXJTZWxlY3RvclxuXG4gICAgY29uc3Qgb3BlbmVkRWxlbWVudHMgPSBhd2FpdCB0aGlzLmZpbmRFbGVtZW50cyhgJHt0aGlzLmNvbXBvbmVudFNlbGVjdG9yfVtkYXRhLW9wZW5lZD0ndHJ1ZSddYClcbiAgICBjb25zdCBjb21wb25lbnRFbGVtZW50cyA9IG9wZW5lZEVsZW1lbnRzLmxlbmd0aCA+IDAgPyBvcGVuZWRFbGVtZW50cyA6IGF3YWl0IHRoaXMuZmluZFZpc2libGVFbGVtZW50cyh0aGlzLmNvbXBvbmVudFNlbGVjdG9yKVxuICAgIGNvbnN0IGlkID0gY29tcG9uZW50RWxlbWVudHMubGVuZ3RoID4gMCA/IGF3YWl0IGNvbXBvbmVudEVsZW1lbnRzWzBdLmdldEF0dHJpYnV0ZShcImRhdGEtaWRcIikgOiBudWxsXG5cbiAgICB0aGlzLl9vcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPSBpZCA/IGBbZGF0YS10ZXN0aWQ9J2hheWEtc2VsZWN0L29wdGlvbnMtY29udGFpbmVyJ11bZGF0YS1pZD1cIiR7Y3NzQXR0cmlidXRlVmFsdWUoaWQpfVwiXWAgOiB0aGlzLm9wdGlvbnNDb250YWluZXJTZWxlY3RvckZhbGxiYWNrXG5cbiAgICByZXR1cm4gdGhpcy5fb3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yXG4gIH1cblxuICAvKiogQHJldHVybnMge1Byb21pc2U8c3RyaW5nW10+fSAqL1xuICBhc3luYyBvcHRpb25UZXh0cygpIHtcbiAgICBjb25zdCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPSBhd2FpdCB0aGlzLm9wdGlvbnNDb250YWluZXJTZWxlY3RvcigpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZmluZEVsZW1lbnRzKGAke29wdGlvbnNDb250YWluZXJTZWxlY3Rvcn0gW2RhdGEtdGVzdGlkPSdoYXlhLXNlbGVjdC9vcHRpb24nXWApXG5cbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwob3B0aW9ucy5tYXAoYXN5bmMgKG9wdGlvbikgPT4gKGF3YWl0IG9wdGlvbi5nZXRUZXh0KCkpLnRyaW0oKSkpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7aW5kZXg/OiBudW1iZXIsIHRleHQ/OiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nfG51bWJlcn19IGNyaXRlcmlhXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2VsZWN0T3B0aW9uKHtpbmRleCwgdGV4dCwgdmFsdWUsIC4uLnJlc3RBcmdzfSA9IHt9KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIGNyaXRlcmlhIGZvciBzZWxlY3RPcHRpb24sIGdvdDogdW5kZWZpbmVkXCIpXG4gICAgfVxuXG4gICAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMocmVzdEFyZ3MpXG5cbiAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBzZWxlY3RPcHRpb24gY3JpdGVyaWE6ICR7ZXh0cmFLZXlzLmpvaW4oXCIsIFwiKX1gKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgYXdhaXQgd2FpdEZvcih7dGltZW91dDogNTAwMH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yID0gYXdhaXQgdGhpcy5vcHRpb25zQ29udGFpbmVyU2VsZWN0b3IoKVxuICAgICAgICBjb25zdCBvcHRpb25zID0gYXdhaXQgdGhpcy5maW5kRWxlbWVudHMoYCR7b3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yfSBbZGF0YS10ZXN0aWQ9J2hheWEtc2VsZWN0L29wdGlvbiddW2RhdGEtdmFsdWU9XCIke2Nzc0F0dHJpYnV0ZVZhbHVlKHZhbHVlKX1cIl1gKVxuICAgICAgICBjb25zdCBvcHRpb24gPSBvcHRpb25zWzBdXG5cbiAgICAgICAgaWYgKCFvcHRpb24pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG9wdGlvbiBmb3IgdmFsdWU6ICR7dmFsdWV9YClcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG9wdGlvbi5jbGljaygpXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpbmRleCA9PSBcIm51bWJlclwiKSB7XG4gICAgICBhd2FpdCB3YWl0Rm9yKHt0aW1lb3V0OiA1MDAwfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPSBhd2FpdCB0aGlzLm9wdGlvbnNDb250YWluZXJTZWxlY3RvcigpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCB0aGlzLmZpbmRFbGVtZW50cyhgJHtvcHRpb25zQ29udGFpbmVyU2VsZWN0b3J9IFtkYXRhLXRlc3RpZD0naGF5YS1zZWxlY3Qvb3B0aW9uJ11gKVxuICAgICAgICBjb25zdCBvcHRpb24gPSBvcHRpb25zW2luZGV4XVxuXG4gICAgICAgIGlmICghb3B0aW9uKSB0aHJvdyBuZXcgRXJyb3IoYE5vIG9wdGlvbiBhdCBpbmRleDogJHtpbmRleH1gKVxuXG4gICAgICAgIGF3YWl0IG9wdGlvbi5jbGljaygpXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIGF3YWl0IHdhaXRGb3Ioe3RpbWVvdXQ6IDUwMDB9LCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnNDb250YWluZXJTZWxlY3RvciA9IGF3YWl0IHRoaXMub3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yKClcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZmluZEVsZW1lbnRzKGAke29wdGlvbnNDb250YWluZXJTZWxlY3Rvcn0gW2RhdGEtdGVzdGlkPSdoYXlhLXNlbGVjdC9vcHRpb24nXWApXG5cbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICAgIGNvbnN0IG9wdGlvblRleHQgPSAoYXdhaXQgb3B0aW9uLmdldFRleHQoKSkudHJpbSgpXG5cbiAgICAgICAgICBpZiAob3B0aW9uVGV4dCA9PT0gdGV4dCkge1xuICAgICAgICAgICAgYXdhaXQgb3B0aW9uLmNsaWNrKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gb3B0aW9uIGZvdW5kIHdpdGggdGV4dDogJHt0ZXh0fWApXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgdmFsdWUsIHRleHQsIG9yIGluZGV4IHdoZW4gc2VsZWN0aW5nIGFuIG9wdGlvblwiKVxuICB9XG59XG5cbi8qKlxuICogQ2xpY2tzIGEgdmlzaWJsZSBIYXlhU2VsZWN0IG9wdGlvbiBieSBiYWNrZW5kIHZhbHVlLlxuICogQHBhcmFtIHtvYmplY3R9IHN5c3RlbVRlc3QgQnJvd3NlciBzZXNzaW9uIHVzZWQgYnkgdGhlIHJ1bm5pbmcgc3BlYy5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSBvcHRpb25WYWx1ZSBCYWNrZW5kIHZhbHVlIHN0b3JlZCBpbiBgZGF0YS12YWx1ZWAuXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dCBNYXhpbXVtIHdhaXQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zQ29udGFpbmVyU2VsZWN0b3JdIE9wdGlvbnMgY29udGFpbmVyIHNlbGVjdG9yIHRvIHNjb3BlIHRoZSBsb29rdXAuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gQ29tcGxldGVzIGFmdGVyIHRoZSBtYXRjaGluZyB2aXNpYmxlIG9wdGlvbiBpcyBjbGlja2VkLlxuICovXG5hc3luYyBmdW5jdGlvbiBjbGlja1Zpc2libGVTZWxlY3RPcHRpb25CeVZhbHVlKHN5c3RlbVRlc3QsIG9wdGlvblZhbHVlLCB0aW1lb3V0LCBvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPSBcIlwiKSB7XG4gIGNvbnN0IHNlbGVjdG9yID0gYCR7b3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yID8gYCR7b3B0aW9uc0NvbnRhaW5lclNlbGVjdG9yfSBgIDogXCJcIn1bZGF0YS10ZXN0aWQ9XCJoYXlhLXNlbGVjdC9vcHRpb25cIl1bZGF0YS12YWx1ZT1cIiR7Y3NzQXR0cmlidXRlVmFsdWUob3B0aW9uVmFsdWUpfVwiXWBcbiAgY29uc3QgZWxlbWVudCA9IGF3YWl0IGZpbmRWaXNpYmxlRWxlbWVudChzeXN0ZW1UZXN0LCBzZWxlY3RvciwgdGltZW91dClcbiAgYXdhaXQgZWxlbWVudC5jbGljaygpXG59XG5cbi8qKlxuICogQ2xpY2tzIGEgdmlzaWJsZSBIYXlhU2VsZWN0IG9wdGlvbiBieSBkaXNwbGF5ZWQgdGV4dC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBzeXN0ZW1UZXN0IEJyb3dzZXIgc2Vzc2lvbiB1c2VkIGJ5IHRoZSBydW5uaW5nIHNwZWMuXG4gKiBAcGFyYW0ge3N0cmluZ30gZXhwZWN0ZWRUZXh0IFZpc2libGUgZnJhZ21lbnQgcmVuZGVyZWQgYnkgdGhlIG9wdGlvbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0IE1heGltdW0gd2FpdCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnNDb250YWluZXJTZWxlY3Rvcl0gT3B0aW9ucyBjb250YWluZXIgc2VsZWN0b3IgdG8gc2NvcGUgdGhlIGxvb2t1cC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBDb21wbGV0ZXMgYWZ0ZXIgdGhlIG1hdGNoaW5nIHZpc2libGUgb3B0aW9uIGlzIGNsaWNrZWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNsaWNrVmlzaWJsZVNlbGVjdE9wdGlvbkJ5VGV4dChzeXN0ZW1UZXN0LCBleHBlY3RlZFRleHQsIHRpbWVvdXQsIG9wdGlvbnNDb250YWluZXJTZWxlY3RvciA9IFwiXCIpIHtcbiAgY29uc3QgZWxlbWVudCA9IC8qKiBAdHlwZSB7V2ViRWxlbWVudH0gKi8gKFxuICAgIGF3YWl0IHN5c3RlbVRlc3QuZ2V0RHJpdmVyKCkud2FpdChcbiAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBgJHtvcHRpb25zQ29udGFpbmVyU2VsZWN0b3IgPyBgJHtvcHRpb25zQ29udGFpbmVyU2VsZWN0b3J9IGAgOiBcIlwifVtkYXRhLXRlc3RpZD0naGF5YS1zZWxlY3Qvb3B0aW9uJ11gXG4gICAgICAgIGNvbnN0IG9wdGlvbkVsZW1lbnRzID0gYXdhaXQgc3lzdGVtVGVzdC5nZXREcml2ZXIoKS5maW5kRWxlbWVudHMoQnkuY3NzKHNlbGVjdG9yKSlcblxuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbkVsZW1lbnQgb2Ygb3B0aW9uRWxlbWVudHMpIHtcbiAgICAgICAgICBpZiAoIShhd2FpdCBvcHRpb25FbGVtZW50LmlzRGlzcGxheWVkKCkpKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGFjdHVhbFRleHQgPSBhd2FpdCBvcHRpb25FbGVtZW50LmdldFRleHQoKVxuICAgICAgICAgIGlmIChhY3R1YWxUZXh0LmluY2x1ZGVzKGV4cGVjdGVkVGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25FbGVtZW50XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9LFxuICAgICAgdGltZW91dCxcbiAgICAgIGBUaW1lZCBvdXQgd2FpdGluZyBmb3IgdmlzaWJsZSBzZWxlY3Qgb3B0aW9uIHRleHQgJHtleHBlY3RlZFRleHR9YFxuICAgIClcbiAgKVxuXG4gIGF3YWl0IGVsZW1lbnQuY2xpY2soKVxufVxuXG4vKipcbiAqIEZpbmRzIGEgdmlzaWJsZSBlbGVtZW50IGJ5IENTUyBzZWxlY3Rvci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBzeXN0ZW1UZXN0IEJyb3dzZXIgc2Vzc2lvbiB1c2VkIGJ5IHRoZSBydW5uaW5nIHNwZWMuXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQ1NTIHF1ZXJ5IHRoYXQgY2FuIG1hdGNoIG9uZSBvciBtb3JlIG5vZGVzLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXQgTWF4aW11bSB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEByZXR1cm5zIHtQcm9taXNlPFdlYkVsZW1lbnQ+fSBGaXJzdCBkaXNwbGF5ZWQgbWF0Y2guXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRWaXNpYmxlRWxlbWVudChzeXN0ZW1UZXN0LCBzZWxlY3RvciwgdGltZW91dCkge1xuICBjb25zdCBlbGVtZW50ID0gYXdhaXQgc3lzdGVtVGVzdC5nZXREcml2ZXIoKS53YWl0KFxuICAgIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gYXdhaXQgc3lzdGVtVGVzdC5nZXREcml2ZXIoKS5maW5kRWxlbWVudHMoQnkuY3NzKHNlbGVjdG9yKSlcblxuICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICAgIGlmIChhd2FpdCBlbGVtZW50LmlzRGlzcGxheWVkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG4gICAgdGltZW91dCxcbiAgICBgVGltZWQgb3V0IHdhaXRpbmcgZm9yIHZpc2libGUgc2VsZWN0b3IgJHtzZWxlY3Rvcn1gXG4gIClcblxuICByZXR1cm4gLyoqIEB0eXBlIHtXZWJFbGVtZW50fSAqLyAoZWxlbWVudClcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBkYXRhLXRlc3RpZCBDU1Mgc2VsZWN0b3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGVzdElkIFJhdyB2YWx1ZSBmcm9tIHRoZSBjb21wb25lbnQncyBgdGVzdElEYCBwcm9wLlxuICogQHJldHVybnMge3N0cmluZ30gQXR0cmlidXRlIHNlbGVjdG9yIGZvciB0aGUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHRlc3RJZFNlbGVjdG9yKHRlc3RJZCkge1xuICByZXR1cm4gYFtkYXRhLXRlc3RpZD1cIiR7Y3NzQXR0cmlidXRlVmFsdWUodGVzdElkKX1cIl1gXG59XG5cbi8qKlxuICogRXNjYXBlcyBhIHZhbHVlIGZvciB1c2UgaW5zaWRlIGEgZG91YmxlLXF1b3RlZCBDU1MgYXR0cmlidXRlIHNlbGVjdG9yLlxuICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHZhbHVlIFJhdyBhdHRyaWJ1dGUgdmFsdWUgdG8gaW50ZXJwb2xhdGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBTdHJpbmcgc2FmZSBmb3IgYSBkb3VibGUtcXVvdGVkIGF0dHJpYnV0ZSBzZWxlY3Rvci5cbiAqL1xuZnVuY3Rpb24gY3NzQXR0cmlidXRlVmFsdWUodmFsdWUpIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZUFsbChcIlxcXFxcIiwgXCJcXFxcXFxcXFwiKS5yZXBsYWNlQWxsKCdcIicsICdcXFxcXCInKVxufVxuIl19