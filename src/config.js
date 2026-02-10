// @ts-check

/**
 * @typedef {function(): {t: function(string, object=) : string}} TranslateFunctionType
 */

const shared = {}

/**
 * @param {string} msgID
 * @param {object} [options]
 * @returns {string}
 */
function t(msgID, options = {}) {
  if (!shared._translateWarning) {
    shared._translateWarning = true
    console.log("HayaSelect: Translate method not set")
  }

  if (typeof options.defaultValue == "string") {
    return options.defaultValue
  }

  return msgID
}

function useTranslateFallback() {
  return {t}
}

export default class HayaSelectConfiguration {
  /** @returns {HayaSelectConfiguration} */
  static current() {
    if (!globalThis.hayaSelectConfig) {
      globalThis.hayaSelectConfig = new HayaSelectConfiguration()
    }

    const hayaSelectConfig = /** @type {HayaSelectConfiguration} */ (globalThis.hayaSelectConfig)

    return hayaSelectConfig
  }

  /** @type {TranslateFunctionType} */
  _useTranslate = useTranslateFallback

  getBodyPortal() {
    if (!this._bodyPortal) throw new Error("bodyPortal wasn't set")

    return this._bodyPortal
  }

  /** @returns {TranslateFunctionType} */
  getUseTranslate() {
    return this._useTranslate
  }

  setBodyPortal(newBodyPortal) {
    this._bodyPortal = newBodyPortal
  }

  /**
   * @param {TranslateFunctionType} callback
   * @returns {void}
   */
  setUseTranslate(callback) {
    this._useTranslate = callback
  }
}

