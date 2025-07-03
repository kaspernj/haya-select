class HayaSelectConfiguration {
  _translate = (msgID) => msgID

  getBodyPortal() {
    if (!this._bodyPortal) throw new Error("bodyPortal wasn't set")

    return this._bodyPortal
  }

  getTranslate() {
    return this._translate
  }

  setBodyPortal(newBodyPortal) {
    this._bodyPortal = newBodyPortal
  }

  setTranslate(callback) {
    this._translate = callback
  }
}

const configuration = new HayaSelectConfiguration()

export default configuration
