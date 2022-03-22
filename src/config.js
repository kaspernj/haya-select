class HayaSelectConfiguration {
  getBodyPortal() {
    if (!this._bodyPortal) throw new Error("bodyPortal wasn't set")

    return this._bodyPortal
  }

  setBodyPortal(newBodyPortal) {
    this._bodyPortal = newBodyPortal
  }
}

const configuration = new HayaSelectConfiguration()

export default configuration
