/**
 * Selects an option in a HayaSelect instance.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {PickHayaSelectOptionOptions} options Text/value to choose and whether to type into the search field first.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 * @rejects {Error} When neither text nor value is supplied.
 */
export function pickHayaSelectOption(systemTest: object, testId: string, { optionText, optionValue, search, timeout, useBaseSelector }: PickHayaSelectOptionOptions): Promise<void>;
/**
 * Clicks an option in an already-open HayaSelect dropdown.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {ClickVisibleHayaSelectOptionOptions} options Option value to choose.
 * @returns {Promise<void>} Completes after the matching visible option is clicked.
 */
export function clickVisibleHayaSelectOption(systemTest: object, { optionValue, timeout }: ClickVisibleHayaSelectOptionOptions): Promise<void>;
/**
 * Opens a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select opens.
 */
export function openHayaSelect(systemTest: object, testId: string, { timeout, useBaseSelector }?: HayaSelectOpenOptions): Promise<void>;
/**
 * Closes a HayaSelect instance by clicking its select container.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
 * @returns {Promise<void>} Completes after the select closes.
 */
export function closeHayaSelect(systemTest: object, testId: string, { timeout, useBaseSelector }?: HayaSelectOpenOptions): Promise<void>;
/**
 * Waits until a HayaSelect renders exactly the expected current-option labels.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {string[]} expectedTexts Current option text fragments in rendered order.
 * @param {ExpectHayaSelectCurrentOptionsOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after the current options match.
 */
export function expectHayaSelectCurrentOptions(systemTest: object, testId: string, expectedTexts: string[], { timeout }?: ExpectHayaSelectCurrentOptionsOptions): Promise<void>;
/**
 * Waits until a HayaSelect and its portal-rendered options are closed.
 * @param {object} systemTest Browser session used by the running spec.
 * @param {string} testId Wrapper `data-testid` around the select.
 * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional Selenium timeout override.
 * @returns {Promise<void>} Completes after no visible options remain.
 */
export function expectHayaSelectOptionsClosed(systemTest: object, testId: string, { timeout }?: ExpectHayaSelectOptionsClosedOptions): Promise<void>;
/**
 * System test helper for interacting with HayaSelect instances.
 */
export default class HayaSelectSystemTestHelper {
    /** @param {HayaSelectSystemTestHelperOptions} options */
    constructor(options: HayaSelectSystemTestHelperOptions);
    systemTest: any;
    testId: string;
    rootSelector: string;
    componentSelector: string;
    chevronContainerSelector: string;
    selectContainerSelector: string;
    searchInputSelector: string;
    optionsContainerSelectorFallback: string;
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select opens.
     */
    open({ timeout, useBaseSelector }?: HayaSelectOpenOptions): Promise<void>;
    _optionsContainerSelector: string | null | undefined;
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select closes.
     */
    close({ timeout, useBaseSelector }?: HayaSelectOpenOptions): Promise<void>;
    /**
     * @param {ExpectHayaSelectOptionsClosedOptions} [options] Optional timeout.
     * @returns {Promise<void>} Completes after no visible options remain.
     */
    expectClosed({ timeout }?: ExpectHayaSelectOptionsClosedOptions): Promise<void>;
    /** @returns {Promise<boolean>} */
    isOpen(): Promise<boolean>;
    /**
     * @param {HayaSelectOpenOptions} [options] Optional selector scope and timeout.
     * @returns {Promise<void>} Completes after the select container click.
     */
    clickSelectContainer({ timeout, useBaseSelector }?: HayaSelectOpenOptions): Promise<void>;
    /**
     * @param {string} selector
     * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
     */
    findElements(selector: string): Promise<Array<any>>;
    /**
     * @param {string} selector
     * @returns {Promise<Array<import("selenium-webdriver").WebElement>>}
     */
    findVisibleElements(selector: string): Promise<Array<any>>;
    /**
     * Counts visible elements by CSS selector in browser layout state.
     * @param {string} selector CSS selector to count.
     * @returns {Promise<number>} Number of visible elements.
     */
    visibleElementsCount(selector: string): Promise<number>;
    /** @returns {Promise<string>} */
    optionsContainerSelector(): Promise<string>;
    /** @returns {Promise<string[]>} */
    optionTexts(): Promise<string[]>;
    /**
     * @param {{index?: number, text?: string, value?: string|number}} criteria
     * @returns {Promise<void>}
     */
    selectOption({ index, text, value, ...restArgs }?: {
        index?: number;
        text?: string;
        value?: string | number;
    }, ...args: any[]): Promise<void>;
}
export type HayaSelectSystemTestHelperOptions = {
    systemTest: object;
    testId: string;
};
export type HayaSelectOpenOptions = {
    timeout?: number;
    useBaseSelector?: boolean;
};
export type PickHayaSelectOptionOptions = {
    optionText?: string;
    optionValue?: string | number;
    search?: boolean;
    timeout?: number;
    useBaseSelector?: boolean;
};
export type ClickVisibleHayaSelectOptionOptions = {
    optionValue: string | number;
    timeout?: number;
};
export type ExpectHayaSelectCurrentOptionsOptions = {
    timeout?: number;
};
export type ExpectHayaSelectOptionsClosedOptions = {
    timeout?: number;
};
export type WebElement = any;
//# sourceMappingURL=system-test-helpers.d.ts.map