export default class HayaSelectConfiguration {
    /** @returns {HayaSelectConfiguration} */
    static current(): HayaSelectConfiguration;
    /** @type {TranslateFunctionType} */
    _useTranslate: TranslateFunctionType;
    getBodyPortal(): any;
    /** @returns {TranslateFunctionType} */
    getUseTranslate(): TranslateFunctionType;
    setBodyPortal(newBodyPortal: any): void;
    _bodyPortal: any;
    /**
     * @param {TranslateFunctionType} callback
     * @returns {void}
     */
    setUseTranslate(callback: TranslateFunctionType): void;
}
export type TranslateFunctionType = () => {
    t: (arg0: string, arg1: object | undefined) => string;
};
//# sourceMappingURL=config.d.ts.map