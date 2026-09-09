/**
 * Module-level coordination so only one HayaSelect options container is open
 * at a time across all instances in the bundle. No provider is required, which
 * means published consumers get the behavior from the default select import.
 */

let openSelectId = null
const listeners = new Set()

/** @returns {void} */
function emitOpenSelectChange() {
  for (const listener of [...listeners]) {
    listener(openSelectId)
  }
}

export const selectCoordination = {
  /** @returns {string|null} */
  getOpenSelectId() {
    return openSelectId
  },

  /**
   * Marks a select as the open one, notifying any other open select to close.
   * @param {string} selectId
   * @returns {void}
   */
  openSelect(selectId) {
    if (openSelectId === selectId) return

    openSelectId = selectId
    emitOpenSelectChange()
  },

  /**
   * Clears the open select when the given select is the one currently open.
   * @param {string} selectId
   * @returns {void}
   */
  closeSelect(selectId) {
    if (openSelectId !== selectId) return

    openSelectId = null
    emitOpenSelectChange()
  },

  /**
   * Subscribe to open-select changes.
   * @param {function(string|null): void} listener
   * @returns {function(): void} Unsubscribe.
   */
  subscribe(listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }
}
