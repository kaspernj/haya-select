declare const _default: React.NamedExoticComponent<HayaSelectProps>;
export default _default;
export type HayaSelectToggleOption = {
    icon: string;
    label: string;
    value: string;
};
export type HayaSelectOption = {
    value: string | number;
    text?: import("react").ReactNode;
    content?: (() => import("react").ReactNode) | undefined;
    currentContent?: (() => import("react").ReactNode) | undefined;
    disabled?: boolean | undefined;
    html?: string | undefined;
    /**
     * Additional option props are allowed; HayaSelect only uses the keys above.
     */
    right?: import("react").ReactNode;
};
export type HayaSelectOptionsResult = {
    options: Array<HayaSelectOption>;
    totalCount?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
};
export type HayaSelectProps = {
    attribute?: string | undefined;
    className?: string | undefined;
    closeOnChange?: boolean | undefined;
    defaultToggled?: object;
    defaultValue?: string | number | undefined;
    defaultValues?: (string | number)[] | undefined;
    defaultValuesFromOptions?: HayaSelectOption[] | undefined;
    debug?: boolean | undefined;
    id?: import("react").ReactNode;
    model?: object;
    mobileOptionsMode?: "auto" | "always" | "never" | undefined;
    multiple?: boolean | undefined;
    name?: string | undefined;
    noOptionsText?: (() => import("react").ReactNode) | undefined;
    onBlur?: ((arg0?: import("react").SyntheticEvent | undefined) => void) | undefined;
    onChange?: ((arg0?: import("react").SyntheticEvent | undefined) => void) | undefined;
    onChangeValue?: ((arg0?: Array<string | number> | undefined) => void) | undefined;
    onFocus?: ((arg0?: import("react").SyntheticEvent | undefined) => void) | undefined;
    onOptionsClosed?: ((arg0: {
        options: any[];
    }) => void) | undefined;
    onOptionsLoaded?: ((arg0: {
        options: any[];
    }) => void) | undefined;
    optionContent?: ((arg0: object) => import("react").ReactNode) | undefined;
    options: Array<HayaSelectOption> | (() => (Array<HayaSelectOption> | HayaSelectOptionsResult));
    optionsAbsolute?: boolean | undefined;
    optionsPortal?: boolean | undefined;
    optionsWidth?: number | undefined;
    placeholder?: import("react").ReactNode;
    selectedBackgroundColor?: string | undefined;
    selectedHoverBackgroundColor?: string | undefined;
    search?: boolean | undefined;
    searchTextInputProps?: import("react-native").TextInputProps | undefined;
    styles?: object;
    toggled?: object;
    toggleOptions?: HayaSelectToggleOption[] | undefined;
    transparent?: boolean | undefined;
    values?: (string | number)[] | undefined;
};
export type HayaSelectState = {
    currentOptions: Array<HayaSelectOption>;
    selectContainerLayout: HayaSelectLayout | null;
    endOfSelectLayout: HayaSelectLayout | null;
    height: number | null;
    loadedOptions: Array<HayaSelectOption> | undefined;
    loadOptionsAppliedRequestId: number;
    loadOptionsRequestId: number;
    page: number;
    pageInputFocused: boolean;
    pageInputValue: string;
    pageSize: number | null;
    opened: boolean;
    optionsContainerLayout: HayaSelectLayout | null;
    optionsPlacement: "above" | "below" | "sheet" | undefined;
    optionsTop: number | undefined;
    optionsVisibility: "hidden" | "visible" | undefined;
    optionsWidth: number | undefined | null;
    scrollLeft: number | null;
    scrollTop: number | null;
    totalCount: number | null;
    toggled: Record<string | number, string>;
};
export type HayaSelectLayout = {
    top?: number | undefined;
    left?: number | undefined;
    x?: number | undefined;
    y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
};
export type HayaSelectOptionRenderContext = {
    icon: string | undefined;
    mode: "current" | "option";
    option: HayaSelectOption;
    selected: boolean;
    toggleOption: HayaSelectToggleOption | undefined;
    toggleValue: string | undefined;
    toggled: Record<string | number, string>;
};
export type HayaSelectOnChangePayload = {
    event: import("react").SyntheticEvent;
    options: Array<HayaSelectOption>;
    toggles: Record<string | number, string>;
};
export type HayaSelectStylingContext = {
    opened: boolean;
    optionsPlacement: "above" | "below" | "sheet" | undefined;
    state: HayaSelectState;
    style: Record<string, any>;
};
import React from "react";
//# sourceMappingURL=index.d.ts.map