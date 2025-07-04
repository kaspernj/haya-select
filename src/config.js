const shared = {}

const t = (msgID) => {
  if (!shared._translateWarning) {
    shared._translateWarning = true
    console.log("HayaSelect: Translate method not set")
  }

  return msgID
}

const useTranslateFallback = () => ({t})

class HayaSelectConfiguration {
  _useTranslate = useTranslateFallback

  getBodyPortal() {
    if (!this._bodyPortal) throw new Error("bodyPortal wasn't set")

    return this._bodyPortal
  }

  getUseTranslate() {
    return this._useTranslate
  }

  setBodyPortal(newBodyPortal) {
    this._bodyPortal = newBodyPortal
  }

  setUseTranslate(callback) {
    this._useTranslate = callback
  }
}

if (!globalThis.hayaSelectConfig) {
  globalThis.hayaSelectConfig = new HayaSelectConfiguration()
}

export default globalThis.hayaSelectConfig
