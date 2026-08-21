// @ts-check
/**
 * @typedef {function(): {t: function(string, object=) : string}} TranslateFunctionType
 */
const shared = {};
/**
 * @param {string} msgID
 * @param {object} [options]
 * @returns {string}
 */
function t(msgID, options = {}) {
    if (!shared._translateWarning) {
        shared._translateWarning = true;
        console.log("HayaSelect: Translate method not set");
    }
    if (typeof options.defaultValue == "string") {
        return options.defaultValue;
    }
    return msgID;
}
function useTranslateFallback() {
    return { t };
}
export default class HayaSelectConfiguration {
    /** @returns {HayaSelectConfiguration} */
    static current() {
        if (!globalThis.hayaSelectConfig) {
            globalThis.hayaSelectConfig = new HayaSelectConfiguration();
        }
        const hayaSelectConfig = /** @type {HayaSelectConfiguration} */ (globalThis.hayaSelectConfig);
        return hayaSelectConfig;
    }
    /** @type {TranslateFunctionType} */
    _useTranslate = useTranslateFallback;
    getBodyPortal() {
        if (!this._bodyPortal)
            throw new Error("bodyPortal wasn't set");
        return this._bodyPortal;
    }
    /** @returns {TranslateFunctionType} */
    getUseTranslate() {
        return this._useTranslate;
    }
    setBodyPortal(newBodyPortal) {
        this._bodyPortal = newBodyPortal;
    }
    /**
     * @param {TranslateFunctionType} callback
     * @returns {void}
     */
    setUseTranslate(callback) {
        this._useTranslate = callback;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZO0FBRVo7O0dBRUc7QUFFSCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFFakI7Ozs7R0FJRztBQUNILFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLEdBQUcsRUFBRTtJQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDOUIsTUFBTSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQTtRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUE7SUFDckQsQ0FBQztJQUVELElBQUksT0FBTyxPQUFPLENBQUMsWUFBWSxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQzVDLE9BQU8sT0FBTyxDQUFDLFlBQVksQ0FBQTtJQUM3QixDQUFDO0lBRUQsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDO0FBRUQsU0FBUyxvQkFBb0I7SUFDM0IsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFBO0FBQ1osQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLE9BQU8sdUJBQXVCO0lBQzFDLHlDQUF5QztJQUN6QyxNQUFNLENBQUMsT0FBTztRQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqQyxVQUFVLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSx1QkFBdUIsRUFBRSxDQUFBO1FBQzdELENBQUM7UUFFRCxNQUFNLGdCQUFnQixHQUFHLHNDQUFzQyxDQUFDLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFFN0YsT0FBTyxnQkFBZ0IsQ0FBQTtJQUN6QixDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQTtJQUVwQyxhQUFhO1FBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO1FBRS9ELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQTtJQUN6QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUE7SUFDM0IsQ0FBQztJQUVELGFBQWEsQ0FBQyxhQUFhO1FBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFBO0lBQ2xDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxlQUFlLENBQUMsUUFBUTtRQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQTtJQUMvQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtY2hlY2tcblxuLyoqXG4gKiBAdHlwZWRlZiB7ZnVuY3Rpb24oKToge3Q6IGZ1bmN0aW9uKHN0cmluZywgb2JqZWN0PSkgOiBzdHJpbmd9fSBUcmFuc2xhdGVGdW5jdGlvblR5cGVcbiAqL1xuXG5jb25zdCBzaGFyZWQgPSB7fVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtc2dJRFxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdChtc2dJRCwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmICghc2hhcmVkLl90cmFuc2xhdGVXYXJuaW5nKSB7XG4gICAgc2hhcmVkLl90cmFuc2xhdGVXYXJuaW5nID0gdHJ1ZVxuICAgIGNvbnNvbGUubG9nKFwiSGF5YVNlbGVjdDogVHJhbnNsYXRlIG1ldGhvZCBub3Qgc2V0XCIpXG4gIH1cblxuICBpZiAodHlwZW9mIG9wdGlvbnMuZGVmYXVsdFZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5kZWZhdWx0VmFsdWVcbiAgfVxuXG4gIHJldHVybiBtc2dJRFxufVxuXG5mdW5jdGlvbiB1c2VUcmFuc2xhdGVGYWxsYmFjaygpIHtcbiAgcmV0dXJuIHt0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIYXlhU2VsZWN0Q29uZmlndXJhdGlvbiB7XG4gIC8qKiBAcmV0dXJucyB7SGF5YVNlbGVjdENvbmZpZ3VyYXRpb259ICovXG4gIHN0YXRpYyBjdXJyZW50KCkge1xuICAgIGlmICghZ2xvYmFsVGhpcy5oYXlhU2VsZWN0Q29uZmlnKSB7XG4gICAgICBnbG9iYWxUaGlzLmhheWFTZWxlY3RDb25maWcgPSBuZXcgSGF5YVNlbGVjdENvbmZpZ3VyYXRpb24oKVxuICAgIH1cblxuICAgIGNvbnN0IGhheWFTZWxlY3RDb25maWcgPSAvKiogQHR5cGUge0hheWFTZWxlY3RDb25maWd1cmF0aW9ufSAqLyAoZ2xvYmFsVGhpcy5oYXlhU2VsZWN0Q29uZmlnKVxuXG4gICAgcmV0dXJuIGhheWFTZWxlY3RDb25maWdcbiAgfVxuXG4gIC8qKiBAdHlwZSB7VHJhbnNsYXRlRnVuY3Rpb25UeXBlfSAqL1xuICBfdXNlVHJhbnNsYXRlID0gdXNlVHJhbnNsYXRlRmFsbGJhY2tcblxuICBnZXRCb2R5UG9ydGFsKCkge1xuICAgIGlmICghdGhpcy5fYm9keVBvcnRhbCkgdGhyb3cgbmV3IEVycm9yKFwiYm9keVBvcnRhbCB3YXNuJ3Qgc2V0XCIpXG5cbiAgICByZXR1cm4gdGhpcy5fYm9keVBvcnRhbFxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtUcmFuc2xhdGVGdW5jdGlvblR5cGV9ICovXG4gIGdldFVzZVRyYW5zbGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlVHJhbnNsYXRlXG4gIH1cblxuICBzZXRCb2R5UG9ydGFsKG5ld0JvZHlQb3J0YWwpIHtcbiAgICB0aGlzLl9ib2R5UG9ydGFsID0gbmV3Qm9keVBvcnRhbFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNsYXRlRnVuY3Rpb25UeXBlfSBjYWxsYmFja1xuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIHNldFVzZVRyYW5zbGF0ZShjYWxsYmFjaykge1xuICAgIHRoaXMuX3VzZVRyYW5zbGF0ZSA9IGNhbGxiYWNrXG4gIH1cbn1cblxuIl19