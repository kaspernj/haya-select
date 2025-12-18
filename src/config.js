// @ts-check

/**
 * @typedef {function(): {t: function(string) : string}} TranslateFunctionType
 */

const shared = {}

/**
 * @param {string} msgID
 * @returns {string}
 */
function t(msgID) {
  if (!shared._translateWarning) {
    shared._translateWarning = true
    console.log("HayaSelect: Translate method not set")
  }

  return msgID
}

function useTranslateFallback() {
  return {t}
}

class HayaSelectConfiguration {
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

if (!globalThis.hayaSelectConfig) {
  globalThis.hayaSelectConfig = new HayaSelectConfiguration()
}

export default globalThis.hayaSelectConfig
