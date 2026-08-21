import { anythingDifferent } from "set-state-compare/build/diff-utils";
import Config from "../config.js";
import { dig, digg } from "diggerize";
import { Animated, Dimensions, Easing, PanResponder, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import React, { createRef, memo, useEffect } from "react";
import { shapeComponent, ShapeComponent } from "set-state-compare/build/shape-component.js";
import debounce from "debounce";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import idForComponent from "@kaspernj/api-maker/build/inputs/id-for-component";
import nameForComponent from "@kaspernj/api-maker/build/inputs/name-for-component";
import Text from "@kaspernj/api-maker/build/utils/text";
import Option from "./option";
import OptionGroup from "./option-group";
import PaginationPageButton from "./pagination-page-button";
import PropTypes from "prop-types";
import propTypesExact from "prop-types-exact";
import RenderHtml from "react-native-render-html";
import { Portal } from "conjointment";
import useEventListener from "ya-use-event-listener";
import usePressOutside from "outside-eye/build/use-press-outside";
const styles = {};
const MOBILE_OPTIONS_MAX_WIDTH = 768;
/**
 * @typedef {object} HayaSelectToggleOption
 * @property {string} icon
 * @property {string} label
 * @property {string} value
 */
/**
 * @typedef {object} HayaSelectOption
 * @property {string|number} value
 * @property {import("react").ReactNode} [text]
 * @property {function(): import("react").ReactNode} [content]
 * @property {function(): import("react").ReactNode} [currentContent]
 * @property {boolean} [disabled]
 * @property {string} [html]
 * @property {import("react").ReactNode} [right]
 *
 * Additional option props are allowed; HayaSelect only uses the keys above.
 */
/**
 * @typedef {object} HayaSelectOptionsResult
 * @property {Array<HayaSelectOption>} options
 * @property {number} [totalCount]
 * @property {number} [page]
 * @property {number} [pageSize]
 */
/**
 * @typedef {object} HayaSelectProps
 * @property {string} [attribute]
 * @property {string} [className]
 * @property {boolean} [closeOnChange]
 * @property {object} [defaultToggled]
 * @property {string|number} [defaultValue]
 * @property {Array<string|number>} [defaultValues]
 * @property {Array<HayaSelectOption>} [defaultValuesFromOptions]
 * @property {boolean} [debug]
 * @property {import("react").ReactNode} [id]
 * @property {object} [model]
 * @property {"auto"|"always"|"never"} [mobileOptionsMode]
 * @property {boolean} [multiple]
 * @property {string} [name]
 * @property {function(): import("react").ReactNode} [noOptionsText]
 * @property {function(import("react").SyntheticEvent=): void} [onBlur]
 * @property {function(import("react").SyntheticEvent=): void} [onChange]
 * @property {function(Array<string|number>=): void} [onChangeValue]
 * @property {function(import("react").SyntheticEvent=): void} [onFocus]
 * @property {function({options: Array}): void} [onOptionsClosed]
 * @property {function({options: Array}): void} [onOptionsLoaded]
 * @property {function(object): import("react").ReactNode} [optionContent]
 * @property {Array<HayaSelectOption>|function(): (Array<HayaSelectOption>|HayaSelectOptionsResult)} options
 * @property {boolean} [optionsAbsolute]
 * @property {boolean} [optionsPortal]
 * @property {number} [optionsWidth]
 * @property {import("react").ReactNode} [placeholder]
 * @property {string} [selectedBackgroundColor]
 * @property {string} [selectedHoverBackgroundColor]
 * @property {boolean} [search]
 * @property {import("react-native").TextInputProps} [searchTextInputProps]
 * @property {object} [styles]
 * @property {object} [toggled]
 * @property {Array<HayaSelectToggleOption>} [toggleOptions]
 * @property {boolean} [transparent]
 * @property {Array<string|number>} [values]
 */
/**
 * @typedef {object} HayaSelectState
 * @property {Array<HayaSelectOption>} currentOptions
 * @property {HayaSelectLayout|null} selectContainerLayout
 * @property {HayaSelectLayout|null} endOfSelectLayout
 * @property {number|null} height
 * @property {Array<HayaSelectOption>|undefined} loadedOptions
 * @property {number} loadOptionsAppliedRequestId
 * @property {number} loadOptionsRequestId
 * @property {number} page
 * @property {boolean} pageInputFocused
 * @property {string} pageInputValue
 * @property {number|null} pageSize
 * @property {boolean} opened
 * @property {HayaSelectLayout|null} optionsContainerLayout
 * @property {"above"|"below"|"sheet"|undefined} optionsPlacement
 * @property {number|undefined} optionsTop
 * @property {"hidden"|"visible"|undefined} optionsVisibility
 * @property {number|undefined|null} optionsWidth
 * @property {number|null} scrollLeft
 * @property {number|null} scrollTop
 * @property {number|null} totalCount
 * @property {Record<string|number, string>} toggled
 */
/**
 * @typedef {object} HayaSelectLayout
 * @property {number} [top]
 * @property {number} [left]
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [width]
 * @property {number} [height]
 */
/**
 * Normalizes React Native and React Native Web layout keys.
 * @param {HayaSelectLayout|null|undefined} layout Native layout.
 * @returns {HayaSelectLayout} Normalized layout.
 */
function normalizeLayout(layout) {
    const normalizedLayout = Object.assign({}, layout);
    if (typeof normalizedLayout.left != "number" && typeof normalizedLayout.x == "number") {
        normalizedLayout.left = normalizedLayout.x;
    }
    if (typeof normalizedLayout.top != "number" && typeof normalizedLayout.y == "number") {
        normalizedLayout.top = normalizedLayout.y;
    }
    return normalizedLayout;
}
/**
 * Checks whether a layout has usable absolute-ish position.
 * @param {HayaSelectLayout|null|undefined} layout Layout to inspect.
 * @returns {boolean} True when top and left can be used.
 */
function layoutHasPosition(layout) {
    return Number.isFinite(layout?.left) && Number.isFinite(layout?.top);
}
/** @returns {boolean} True for native iOS and iOS/iPadOS Safari on web. */
function isIOSLikePlatform() {
    if (Platform.OS == "ios")
        return true;
    if (Platform.OS != "web" || typeof navigator == "undefined")
        return false;
    const platform = navigator.platform || "";
    const userAgent = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(platform) ||
        /iPad|iPhone|iPod/.test(userAgent) ||
        (platform == "MacIntel" && navigator.maxTouchPoints > 1);
}
/**
 * @typedef {object} HayaSelectOptionRenderContext
 * @property {string|undefined} icon
 * @property {"current"|"option"} mode
 * @property {HayaSelectOption} option
 * @property {boolean} selected
 * @property {HayaSelectToggleOption|undefined} toggleOption
 * @property {string|undefined} toggleValue
 * @property {Record<string|number, string>} toggled
 */
/**
 * @typedef {object} HayaSelectOnChangePayload
 * @property {import("react").SyntheticEvent} event
 * @property {Array<HayaSelectOption>} options
 * @property {Record<string|number, string>} toggles
 */
/**
 * @typedef {object} HayaSelectStylingContext
 * @property {boolean} opened
 * @property {"above"|"below"|"sheet"|undefined} optionsPlacement
 * @property {HayaSelectState} state
 * @property {Record<string, any>} style
 */
/**
 * @param {ShapeComponent<HayaSelectProps, HayaSelectState>} component
 * @returns {string}
 */
const nameForComponentWithMultiple = (component) => {
    let name = nameForComponent(component);
    const currentOptions = component.getCurrentOptions();
    const values = component.getValues();
    const hasMultipleValues = Array.isArray(values) && values.length > 0;
    if (component.props.multiple && name && (currentOptions.length > 0 || hasMultipleValues)) {
        name += "[]";
    }
    return name;
};
/** @augments {ShapeComponent<HayaSelectProps, HayaSelectState>} */
class HayaSelect extends ShapeComponent {
    static defaultProps = {
        closeOnChange: false,
        debug: false,
        mobileOptionsMode: "auto",
        multiple: false,
        noOptionsText: null,
        onBlur: null,
        onFocus: null,
        optionsAbsolute: true,
        optionsPortal: true,
        optionsWidth: null,
        search: false,
        searchTextInputProps: undefined,
        transparent: false
    };
    static propTypes = propTypesExact({
        attribute: PropTypes.string,
        className: PropTypes.string,
        closeOnChange: PropTypes.bool.isRequired,
        defaultToggled: PropTypes.object,
        defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        defaultValues: PropTypes.array,
        defaultValuesFromOptions: PropTypes.array,
        debug: PropTypes.bool.isRequired,
        id: PropTypes.node,
        model: PropTypes.object,
        mobileOptionsMode: PropTypes.oneOf(["auto", "always", "never"]),
        multiple: PropTypes.bool.isRequired,
        name: PropTypes.string,
        noOptionsText: PropTypes.func,
        onBlur: PropTypes.func,
        onChange: PropTypes.func,
        onChangeValue: PropTypes.func,
        onFocus: PropTypes.func,
        onOptionsClosed: PropTypes.func,
        onOptionsLoaded: PropTypes.func,
        optionContent: PropTypes.func,
        options: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.shape({
                content: PropTypes.func,
                currentContent: PropTypes.func,
                disabled: PropTypes.bool,
                html: PropTypes.string,
                right: PropTypes.node,
                text: PropTypes.node,
                value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
            })),
            PropTypes.func
        ]).isRequired,
        optionsAbsolute: PropTypes.bool.isRequired,
        optionsPortal: PropTypes.bool.isRequired,
        optionsWidth: PropTypes.number,
        placeholder: PropTypes.node,
        selectedBackgroundColor: PropTypes.string,
        selectedHoverBackgroundColor: PropTypes.string,
        search: PropTypes.bool.isRequired,
        searchTextInputProps: PropTypes.object,
        styles: PropTypes.object,
        toggled: PropTypes.object,
        toggleOptions: PropTypes.arrayOf(PropTypes.shape({
            icon: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            value: PropTypes.string.isRequired
        })),
        transparent: PropTypes.bool.isRequired,
        values: PropTypes.array
    });
    callOptionsPositionAboveIfOutsideScreen = false;
    bodyScrollLocked = false;
    endOfSelectRef = createRef();
    latestLoadOptionsRequestId = 0;
    mobileOptionsBackdropOpacity = new Animated.Value(0);
    optionsContainerRef = createRef();
    pageInputRef = createRef();
    previousBodyOverflow = undefined;
    previousDocumentOverflow = undefined;
    mobileOptionsContainerProgress = new Animated.Value(0);
    mobileOptionsContainerScale = this.mobileOptionsContainerProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1]
    });
    mobileOptionsContainerTranslateY = this.mobileOptionsContainerProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0]
    });
    mobileOptionsContainerTransform = [
        { translateY: this.mobileOptionsContainerTranslateY },
        { scale: this.mobileOptionsContainerScale }
    ];
    mobileOptionsClosing = false;
    optionGroupStylingFor = (stylingName, style = {}, caches = []) => this.tt.stylingFor(stylingName, style, caches);
    searchTextValue = "";
    searchTextInputRef = createRef();
    selectContainerRef = createRef();
    t = Config.current().getUseTranslate()().t;
    windowWidth = Dimensions.get("window").width;
    windowHeight = Dimensions.get("window").height;
    /** @type {HayaSelectState} */
    state = {
        currentOptions: this.defaultCurrentOptions(),
        selectContainerLayout: null,
        endOfSelectLayout: null,
        height: null,
        loadedOptions: this.defaultLoadedOptions(),
        loadOptionsAppliedRequestId: 0,
        loadOptionsRequestId: 0,
        page: 1,
        pageInputFocused: false,
        pageInputValue: "1",
        pageSize: null,
        opened: false,
        optionsContainerLayout: null,
        optionsPlacement: undefined,
        optionsTop: undefined,
        optionsVisibility: undefined,
        optionsWidth: undefined,
        scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
        scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null,
        totalCount: null,
        toggled: this.defaultToggled()
    };
    /** @returns {boolean} */
    isDebugEnabled = () => Boolean(this.p.debug);
    /**
     * @param {string} functionName
     * @param {Record<string, any>} [details]
     * @returns {void}
     */
    debugLog = (functionName, details = undefined) => {
        if (!this.isDebugEnabled())
            return;
        const baseDetails = {
            id: this.p.id,
            name: this.p.name
        };
        const mergedDetails = details ? Object.assign({}, baseDetails, details) : baseDetails;
        if (mergedDetails && Object.keys(mergedDetails).length > 0) {
            console.log(`[HayaSelect] ${functionName}`, mergedDetails);
        }
        else {
            console.log(`[HayaSelect] ${functionName}`);
        }
    };
    setup() {
        const { t } = Config.current().getUseTranslate()();
        this.t = t;
        if (Array.isArray(this.props.values)) {
            for (const value of this.props.values) {
                if (typeof value == "undefined") {
                    throw new Error("HayaSelect: Undefined given as value");
                }
            }
        }
        const windowTarget = Platform.OS == "web" && typeof window != "undefined" ? window : null;
        useEventListener(Dimensions, "change", this.tt.onDimensionsChange);
        usePressOutside(this.tt.optionsContainerRef, this.tt.onPressOutsideOptions);
        useEventListener(windowTarget, "resize", this.tt.onAnythingResizedDebounced);
        useEventListener(windowTarget, "scroll", this.tt.onAnythingScrolledDebounced);
        if (this.isDebugEnabled())
            this.debugLog("setup", {
                hasControlledValues: "values" in this.props,
                hasControlledToggled: "toggled" in this.props,
                closeOnChange: this.p.closeOnChange,
                multiple: this.p.multiple,
                optionsType: Array.isArray(this.props.options) ? "array" : typeof this.props.options
            });
        useEffect(() => {
            if (this.tt.callOptionsPositionAboveIfOutsideScreen && this.s.optionsContainerLayout) {
                this.callOptionsPositionAboveIfOutsideScreen = false;
                this.setOptionsPositionAboveIfOutsideScreen();
            }
        }, [this.tt.callOptionsPositionAboveIfOutsideScreen, this.s.optionsContainerLayout]);
        useEffect(() => {
            const currentOptionIds = this.s.currentOptions?.map((currentOption) => currentOption.value);
            if (Array.isArray(this.props.values) && anythingDifferent(currentOptionIds, this.props.values) && typeof this.props.options == "function") {
                this.setCurrentFromGivenValues();
            }
        }, [this.props.values]);
    }
    translate(msgID, options) {
        if (msgID.startsWith(".")) {
            return this.t(`haya_select${msgID}`, options);
        }
        else {
            return this.t(msgID, options);
        }
    }
    /** @returns {Array<HayaSelectOption>} */
    defaultCurrentOptions() {
        const { defaultValue, defaultValues, values } = this.props;
        const { options } = this.p;
        if (!Array.isArray(options))
            return [];
        const controlledValues = Array.isArray(values) ? values : [];
        return options.filter(({ value }) => (defaultValue && value == defaultValue) ||
            (defaultValues && defaultValues.includes(value)) ||
            controlledValues.includes(value));
    }
    /** @returns {Array<HayaSelectOption>|undefined} */
    defaultLoadedOptions() {
        const { options } = this.p;
        if (typeof options == "function") {
            return undefined;
        }
        else if (Array.isArray(options)) {
            return options;
        }
        throw new Error(`Unknown type of options: ${typeof options}`);
    }
    /** @returns {number} */
    getActivePage = () => this.s.page || 1;
    /** @returns {boolean} */
    isMobileOptionsSheet() {
        if (this.p.mobileOptionsMode == "always")
            return true;
        if (this.p.mobileOptionsMode == "never")
            return false;
        return Dimensions.get("window").width <= MOBILE_OPTIONS_MAX_WIDTH;
    }
    /**
     * @param {Array<HayaSelectOption>|HayaSelectOptionsResult} result
     * @returns {HayaSelectOptionsResult}
     */
    parseOptionsResult(result) {
        if (Array.isArray(result))
            return { options: result };
        if (result && Array.isArray(result.options)) {
            return {
                options: result.options,
                totalCount: result.totalCount,
                page: result.page,
                pageSize: result.pageSize
            };
        }
        throw new Error(`Unknown options result: ${JSON.stringify(result)}`);
    }
    /**
     * @param {object} params
     * @param {Array<HayaSelectOption>} params.options
     * @param {number} [params.page]
     * @param {number} [params.pageSize]
     * @param {number} [params.totalCount]
     * @returns {number|null}
     */
    resolvePageSize({ options, page, pageSize, totalCount }) {
        if (Number.isFinite(pageSize) && pageSize > 0)
            return pageSize;
        if (Number.isFinite(this.s.pageSize) && this.s.pageSize > 0 && page != 1) {
            return this.s.pageSize;
        }
        if (Number.isFinite(totalCount) && Array.isArray(options) && options.length > 0) {
            return options.length;
        }
        return Number.isFinite(this.s.pageSize) && this.s.pageSize > 0 ? this.s.pageSize : null;
    }
    /** @returns {Record<string|number, string>} */
    defaultToggled() {
        return ("toggled" in this.props) ? this.p.toggled : this.props.defaultToggled || {};
    }
    /** @returns {string} */
    portalName() {
        return nameForComponentWithMultiple(this) || `haya-select-${String(idForComponent(this))}`;
    }
    /** @returns {Record<string|number, string>} */
    getToggled = () => ("toggled" in this.props) ? this.p.toggled : this.s.toggled;
    /** @returns {Array<string|number>} */
    getValues = () => ("values" in this.props)
        ? (Array.isArray(this.p.values) ? this.p.values : [])
        : (Array.isArray(this.s.currentOptions) ? this.s.currentOptions : []).map((currentOption) => currentOption.value);
    /** @returns {Array<HayaSelectOption|{value: string|number}>} */
    getCurrentOptions = () => {
        if ("values" in this.props && typeof this.props.values != "undefined") {
            if (Array.isArray(this.p.values) && this.p.values.length === 0)
                return [];
            if (Array.isArray(this.props.options) && Array.isArray(this.p.values)) {
                /** @type {Array<HayaSelectOption>} */
                const result = [];
                for (const value of this.p.values) {
                    const option = this.p.options.find((option) => option.value == value);
                    if (option)
                        result.push(option);
                }
                return result;
            }
            else if (this.s.loadedOptions && Array.isArray(this.p.values)) {
                /** @type {Array<HayaSelectOption>} */
                const result = [];
                for (const value of this.p.values) {
                    const option = this.s.loadedOptions.find((option) => option.value == value) ||
                        this.s.currentOptions.find((option) => option.value == value);
                    if (option)
                        result.push(option);
                }
                return result;
            }
            else if (typeof this.props.options == "function") {
                // Options haven't been loaded yet.
            }
            else if (Array.isArray(this.p.values)) {
                return this.p.values.map((value) => ({ value }));
            }
        }
        return this.s.currentOptions;
    };
    /** @returns {Array<string|number>} */
    getCurrentOptionValues() {
        if ("values" in this.props) {
            return Array.isArray(this.p.values) ? this.p.values : [];
        }
        const currentOptions = this.getCurrentOptions();
        if (!currentOptions)
            return [];
        return currentOptions
            .map((option) => option?.value)
            .filter((value) => typeof value != "undefined");
    }
    componentDidMount() {
        const { attribute, defaultValue, defaultValues, defaultValuesFromOptions, model, options } = this.props;
        if (this.isDebugEnabled())
            this.debugLog("componentDidMount", {
                hasAttributeModel: Boolean(attribute && model),
                hasDefaultValues: Boolean(defaultValue || defaultValues || defaultValuesFromOptions),
                optionsType: typeof options
            });
        if (((defaultValue || defaultValues || defaultValuesFromOptions) || (attribute && model)) && typeof options == "function") {
            this.loadDefaultValuesFromOptionsCallback();
        }
    }
    componentDidUpdate() {
        const newState = {};
        if ("toggled" in this.props) {
            const newToggled = this.p.toggled;
            if (anythingDifferent(this.state.toggled, newToggled)) {
                newState.toggled = newToggled;
            }
        }
        if (Object.keys(newState).length > 0) {
            if (this.isDebugEnabled())
                this.debugLog("componentDidUpdate", { syncingKeys: Object.keys(newState) });
            this.s.toggled = newState.toggled;
        }
        this.syncOptionsPlacementWithMode();
    }
    /** @returns {void} */
    componentWillUnmount() {
        this.mobileOptionsBackdropOpacity.stopAnimation();
        this.mobileOptionsContainerProgress.stopAnimation();
        this.unlockBodyScroll();
    }
    /** @returns {import("react").ReactNode} */
    render() {
        const { endOfSelectRef } = this.tt;
        const { transparent } = this.p;
        const { className, placeholder, toggleOptions } = this.props;
        const values = Array.isArray(this.props.values) ? this.props.values : [];
        const { opened, optionsPlacement } = this.s;
        const currentOptions = this.getCurrentOptions();
        const id = idForComponent(this);
        const mobileOptionsSheet = this.isMobileOptionsSheet();
        const selectContainerStyleActual = { ...this.stylingFor("selectContainer", {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: transparent ? undefined : "#fff",
                borderColor: transparent ? undefined : "#999",
                borderRadius: transparent ? undefined : 4,
                borderWidth: transparent ? undefined : 1,
                color: "#000",
                cursor: Platform.OS == "web" ? "pointer" : undefined,
                paddingTop: 5,
                paddingBottom: 5,
                paddingLeft: 5
            }, [transparent]) };
        if (opened && !mobileOptionsSheet) {
            // Prevent select from changing size once the content is replaced with search text once opened
            selectContainerStyleActual.height = this.s.height;
            const baseBorderRadius = selectContainerStyleActual.borderRadius;
            if (optionsPlacement == "above") {
                selectContainerStyleActual.borderTopLeftRadius = 0;
                selectContainerStyleActual.borderTopRightRadius = 0;
                selectContainerStyleActual.borderBottomRightRadius = baseBorderRadius;
                selectContainerStyleActual.borderBottomLeftRadius = baseBorderRadius;
                delete selectContainerStyleActual.borderRadius;
            }
            else if (optionsPlacement == "below") {
                selectContainerStyleActual.borderTopLeftRadius = baseBorderRadius;
                selectContainerStyleActual.borderTopRightRadius = baseBorderRadius;
                selectContainerStyleActual.borderBottomRightRadius = 0;
                selectContainerStyleActual.borderBottomLeftRadius = 0;
                delete selectContainerStyleActual.borderRadius;
            }
        }
        return (React.createElement(View, { dataSet: this.cache("rootViewDataSet", {
                appliedRequestId: this.s.loadOptionsAppliedRequestId,
                class: className,
                component: "haya-select",
                id,
                opened,
                optionsPlacement,
                requestId: this.s.loadOptionsRequestId,
                toggles: Boolean(toggleOptions)
            }, [this.s.loadOptionsAppliedRequestId, className, id, opened, optionsPlacement, this.s.loadOptionsRequestId, Boolean(toggleOptions)]), style: this.stylingFor("main"), testID: "haya-select" },
            React.createElement(Pressable, { onLayout: this.tt.onSelectContainerLayout, onPress: this.tt.onSelectClicked, ref: this.tt.selectContainerRef, style: selectContainerStyleActual, testID: "haya-select/select-container" },
                React.createElement(View, { style: this.stylingFor("currentSelected", this.currentSelectedStyle ||= { flex: 1, flexWrap: "wrap", overflow: "hidden" }), testID: "haya-select/current-selected" },
                    opened && !mobileOptionsSheet &&
                        this.searchTextInput(),
                    (!opened || mobileOptionsSheet) &&
                        React.createElement(React.Fragment, null,
                            currentOptions.length == 0 &&
                                React.createElement(Text, { numberOfLines: 1, style: this.stylingFor("nothingSelected", this.nothingSelectedStyle ||= { color: "grey" }) }, placeholder || this.translate(".nothing_selected")),
                            currentOptions.length == 0 && Platform.OS == "web" &&
                                React.createElement(React.Fragment, null,
                                    values.length > 0 &&
                                        (this.p.multiple ? values : [values[0]]).map((value) => (React.createElement("input", { id: idForComponent(this), key: `current-value-${value}`, name: nameForComponentWithMultiple(this), type: "hidden", value: value }))),
                                    values.length == 0 &&
                                        React.createElement("input", { id: idForComponent(this), name: nameForComponentWithMultiple(this), type: "hidden", value: "" })),
                            currentOptions.map((currentOption) => React.createElement(View, { key: currentOption.key || `current-value-${currentOption.value}`, style: this.stylingFor("currentOption", { marginRight: 6 }), testID: "haya-select/current-option" },
                                currentOption.type == "group" &&
                                    React.createElement(View, { style: this.stylingFor("currentOptionGroup", this.currentOptionGroupStyle ||= { fontWeight: "bold" }) },
                                        React.createElement(Text, { style: this.stylingFor("currentOptionGroupText") }, currentOption.text)),
                                currentOption.type != "group" &&
                                    React.createElement(React.Fragment, null,
                                        Platform.OS == "web" && nameForComponentWithMultiple(this) &&
                                            React.createElement("input", { id: idForComponent(this), name: nameForComponentWithMultiple(this), type: "hidden", value: digg(currentOption, "value") }),
                                        this.presentOption(currentOption, "current")))))),
                React.createElement(View, { style: this.stylingFor("chevronContainer", this.chevronContainerStyle ||= {
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        marginLeft: "auto",
                        marginRight: 8
                    }), testID: "haya-select/chevron-container" },
                    React.createElement(FontAwesomeIcon, { name: opened ? "chevron-up" : "chevron-down", style: this.stylingFor("chevron", this.chevronStyle ||= { fontSize: 12 }) }))),
            React.createElement(View, { onLayout: this.tt.onEndOfSelectLayout, ref: endOfSelectRef, testID: "haya-select/end-of-select" }),
            opened && this.p.optionsPortal &&
                React.createElement(Portal, { name: this.portalName() }, this.optionsContainer()),
            opened && !this.p.optionsPortal &&
                React.createElement(View, null, this.optionsContainer())));
    }
    /**
     * @param {{mobileOptionsSheet?: boolean}} [params]
     * @returns {import("react").ReactNode}
     */
    searchTextInput({ mobileOptionsSheet = false } = {}) {
        const iosLikeMobileSheet = mobileOptionsSheet && isIOSLikePlatform();
        return (React.createElement(TextInput, { defaultValue: this.searchTextValue, onChangeText: this.tt.onChangeSearchText, placeholder: this.translate(".search_dot_dot_dot"), ref: this.tt.searchTextInputRef, style: this.stylingFor("searchTextInput", styles[`searchTextInput-${iosLikeMobileSheet}`] ||= {
                width: "100%",
                borderWidth: 0,
                fontSize: iosLikeMobileSheet ? 16 : undefined,
                outline: Platform.OS == "web" ? "none" : undefined,
                padding: 0
            }, [iosLikeMobileSheet]), testID: "haya-select/search-input", ...this.p.searchTextInputProps }));
    }
    /** @returns {Array<string|number>|string|number|undefined} */
    defaultValues() {
        const { attribute, defaultValue, defaultValues, defaultValuesFromOptions, model } = this.props;
        if (defaultValuesFromOptions)
            return defaultValuesFromOptions;
        if (defaultValue)
            return defaultValue;
        if (defaultValues)
            return defaultValues;
        if (attribute && model) {
            if (!(attribute in model))
                throw new Error(`No such attribute on ${model.modelClassData().name}: ${attribute}`);
            return model[attribute]();
        }
    }
    /** @returns {boolean} */
    isActive() {
        if (this.tt.endOfSelectRef.current) {
            return true;
        }
        return false;
    }
    /** @returns {Promise<void>} */
    async loadDefaultValuesFromOptionsCallback() {
        const defaultValues = this.defaultValues();
        if (!defaultValues)
            return;
        if (this.isDebugEnabled())
            this.debugLog("loadDefaultValuesFromOptionsCallback", { defaultValues });
        const result = await this.props.options({
            searchValue: this.getSearchText(),
            page: this.getActivePage(),
            values: defaultValues
        });
        const { options } = this.parseOptionsResult(result);
        if (this.isDebugEnabled())
            this.debugLog("loadDefaultValuesFromOptionsCallback.result", { loadedOptionsCount: options?.length || 0 });
        this.s.currentOptions = this.state.currentOptions.concat(options);
    }
    /**
     * @param {{page?: number}} [params]
     * @returns {Promise<void>}
     */
    loadOptions = async ({ page } = {}) => {
        const { options } = this.p;
        const searchValue = this.getSearchText();
        const requestId = ++this.latestLoadOptionsRequestId;
        this.s.loadOptionsRequestId = requestId;
        if (this.isDebugEnabled())
            this.debugLog("loadOptions", {
                page,
                requestId,
                searchValue,
                optionsType: Array.isArray(options) ? "array" : typeof options
            });
        if (Array.isArray(options)) {
            return this.loadOptionsFromArray(options, searchValue, requestId);
        }
        const requestedPage = Number.isFinite(page) ? page : this.getActivePage();
        const result = await options({ searchValue, page: requestedPage });
        const { options: loadedOptions, page: resultPage, pageSize, totalCount } = this.parseOptionsResult(result);
        if (requestId != this.latestLoadOptionsRequestId) {
            if (this.isDebugEnabled())
                this.debugLog("loadOptions.ignored_stale_result", {
                    requestId,
                    latestLoadOptionsRequestId: this.latestLoadOptionsRequestId,
                    requestedPage,
                    searchValue
                });
            return;
        }
        const resolvedPage = Number.isFinite(resultPage) ? resultPage : requestedPage;
        const resolvedPageSize = this.resolvePageSize({ options: loadedOptions, page: resolvedPage, pageSize, totalCount });
        const totalPages = Number.isFinite(totalCount) && Number.isFinite(resolvedPageSize) && resolvedPageSize > 0
            ? Math.ceil(totalCount / resolvedPageSize)
            : null;
        this.setState({
            loadedOptions,
            loadOptionsAppliedRequestId: requestId,
            page: resolvedPage,
            pageInputValue: String(resolvedPage),
            pageSize: Number.isFinite(totalCount) ? resolvedPageSize : null,
            totalCount: Number.isFinite(totalCount) ? totalCount : null
        }, () => this.props.onOptionsLoaded?.({ options: loadedOptions }));
        if (this.isDebugEnabled())
            this.debugLog("loadOptions.result", {
                loadedOptionsCount: loadedOptions?.length || 0,
                resolvedPage,
                resolvedPageSize,
                totalCount: Number.isFinite(totalCount) ? totalCount : null
            });
    };
    /**
     * @param {{key: string, loadedOption: HayaSelectOption}}
     * @returns {import("react").ReactNode}
     */
    hayaSelectOption({ key, loadedOption }) {
        if (loadedOption.type == "group") {
            return React.createElement(OptionGroup, { key: key, option: loadedOption, stylingFor: this.tt.optionGroupStylingFor });
        }
        return (React.createElement(Option, { currentOptionValues: this.getCurrentOptionValues(), icon: this.iconForOption(loadedOption), key: key, option: loadedOption, onOptionClicked: this.tt.onOptionClicked, optionsPlacement: this.s.optionsPlacement, presentOption: this.tt.presentOption, selectedBackgroundColor: this.props.selectedBackgroundColor, selectedHoverBackgroundColor: this.props.selectedHoverBackgroundColor }));
    }
    /**
     * @param {Array<HayaSelectOption>} options
     * @param {string} [searchValue]
     * @param {number} [requestId]
     * @returns {void}
     */
    loadOptionsFromArray(options, searchValue, requestId = this.latestLoadOptionsRequestId) {
        const lowerSearchValue = searchValue?.toLowerCase();
        const loadedOptions = options.filter(({ text }) => !lowerSearchValue || text?.toLowerCase()?.includes(lowerSearchValue));
        if (this.isDebugEnabled())
            this.debugLog("loadOptionsFromArray", {
                requestId,
                totalOptionsCount: options.length,
                searchValue,
                loadedOptionsCount: loadedOptions.length
            });
        this.s.loadedOptions = loadedOptions;
        this.s.loadOptionsAppliedRequestId = requestId;
        this.s.page = 1;
        this.s.pageInputValue = "1";
        this.s.pageSize = null;
        this.s.totalCount = null;
    }
    /**
     * @param {{window: {width: number, height: number}}} event
     * @returns {void}
     */
    onDimensionsChange = ({ window }) => {
        this.windowWidth = window.width;
        this.windowHeight = window.height;
        if (this.s.opened) {
            this.syncOptionsPlacementWithMode();
        }
    };
    /**
     * @param {{nativeEvent?: {layout?: HayaSelectLayout}}} e
     * @returns {void}
     */
    onSelectContainerLayout = (e) => {
        this.s.selectContainerLayout = normalizeLayout(digg(e, "nativeEvent", "layout"));
        this.measureNativeLayout(this.tt.selectContainerRef, "selectContainerLayout");
    };
    /**
     * @param {{nativeEvent?: {layout?: HayaSelectLayout}}} e
     * @returns {void}
     */
    onEndOfSelectLayout = (e) => {
        const endOfSelectLayout = normalizeLayout(digg(e, "nativeEvent", "layout"));
        const newState = { endOfSelectLayout };
        if (this.s.opened && endOfSelectLayout?.width) {
            newState.optionsWidth = endOfSelectLayout.width;
        }
        this.setState(newState, () => {
            this.measureNativeLayout(this.tt.endOfSelectRef, "endOfSelectLayout");
            if (this.s.opened && this.s.optionsContainerLayout) {
                this.setOptionsPositionAboveIfOutsideScreen();
            }
        });
    };
    /**
     * @param {{nativeEvent?: {layout?: HayaSelectLayout}}} e
     * @returns {void}
     */
    onOptionsContainerLayout = (e) => {
        this.s.optionsContainerLayout = normalizeLayout(digg(e, "nativeEvent", "layout"));
    };
    /** @returns {void} */
    measureNativeSelectLayouts() {
        this.measureNativeLayout(this.tt.selectContainerRef, "selectContainerLayout");
        this.measureNativeLayout(this.tt.endOfSelectRef, "endOfSelectLayout");
    }
    /**
     * Measures a native view in window coordinates for portal positioning.
     * @param {import("react").RefObject<object>} ref View ref.
     * @param {"selectContainerLayout"|"endOfSelectLayout"} stateKey State layout key.
     * @returns {void}
     */
    measureNativeLayout(ref, stateKey) {
        if (Platform.OS == "web")
            return;
        const element = ref.current;
        if (!element || typeof element.measureInWindow != "function")
            return;
        element.measureInWindow((left, top, width, height) => {
            const measuredLayout = { height, left, top, width };
            if (!layoutHasPosition(measuredLayout))
                return;
            /** @type {Partial<HayaSelectState>} */
            const newState = {
                [stateKey]: measuredLayout
            };
            if (stateKey == "endOfSelectLayout" && this.s.opened && width) {
                newState.optionsWidth = width;
            }
            if (!anythingDifferent(this.s[stateKey], measuredLayout)) {
                return;
            }
            this.setState(newState, () => {
                if (this.s.opened && this.s.optionsContainerLayout) {
                    this.setOptionsPositionAboveIfOutsideScreen();
                }
            });
        });
    }
    /**
     * @param {import("react").SyntheticEvent} e
     * @returns {void}
     */
    onSelectClicked = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { opened } = this.s;
        if (this.isDebugEnabled())
            this.debugLog("onSelectClicked", { opened });
        if (opened) {
            this.closeOptions();
        }
        else {
            this.openOptions();
        }
    };
    onSearchTextInputChangedDebounced = debounce(this.tt.loadOptions, 200);
    /**
     * @param {{options?: Array<HayaSelectOption>}} [params]
     * @returns {void}
     */
    closeOptions({ options } = {}) {
        const closedOptions = options || this.getCurrentOptions();
        if (this.isDebugEnabled())
            this.debugLog("closeOptions", { closedOptionsCount: closedOptions?.length || 0 });
        if (this.s.opened && this.s.optionsPlacement == "sheet") {
            this.closeMobileOptionsWithAnimation({ closedOptions });
            return;
        }
        this.finishCloseOptions({ closedOptions });
    }
    /**
     * @param {{closedOptions: Array<HayaSelectOption>}} params Close payload.
     * @returns {void}
     */
    closeMobileOptionsWithAnimation({ closedOptions }) {
        if (this.mobileOptionsClosing)
            return;
        this.mobileOptionsClosing = true;
        this.mobileOptionsBackdropOpacity.stopAnimation();
        this.mobileOptionsContainerProgress.stopAnimation();
        Animated.parallel([
            Animated.timing(this.mobileOptionsBackdropOpacity, {
                duration: 90,
                easing: Easing.out(Easing.cubic),
                toValue: 0,
                useNativeDriver: true
            }),
            Animated.timing(this.mobileOptionsContainerProgress, {
                duration: 110,
                easing: Easing.in(Easing.cubic),
                toValue: 0,
                useNativeDriver: true
            })
        ]).start(() => {
            this.mobileOptionsClosing = false;
            this.finishCloseOptions({ closedOptions });
        });
    }
    /**
     * @param {{closedOptions: Array<HayaSelectOption>}} params Close payload.
     * @returns {void}
     */
    finishCloseOptions({ closedOptions }) {
        this.callOptionsPositionAboveIfOutsideScreen = false;
        this.unlockBodyScroll();
        this.setState({
            height: null,
            loadedOptions: undefined,
            opened: false,
            optionsContainerLayout: null,
            optionsVisibility: "hidden",
            page: 1,
            pageInputFocused: false,
            pageInputValue: "1",
            pageSize: null,
            totalCount: null
        }, () => {
            if (this.isDebugEnabled())
                this.debugLog("closeOptions.done", { opened: this.s.opened, optionsVisibility: this.s.optionsVisibility });
        });
        if (this.props.onOptionsClosed) {
            this.props.onOptionsClosed({ options: closedOptions });
        }
        if (this.p.onBlur)
            this.p.onBlur();
    }
    /** @returns {void} */
    prepareMobileOptionsAnimation() {
        this.mobileOptionsClosing = false;
        this.mobileOptionsBackdropOpacity.stopAnimation();
        this.mobileOptionsContainerProgress.stopAnimation();
        this.mobileOptionsBackdropOpacity.setValue(0);
        this.mobileOptionsContainerProgress.setValue(0);
    }
    /** @returns {void} */
    startMobileOptionsOpenAnimation() {
        Animated.parallel([
            Animated.timing(this.mobileOptionsBackdropOpacity, {
                duration: 90,
                easing: Easing.out(Easing.cubic),
                toValue: 1,
                useNativeDriver: true
            }),
            Animated.timing(this.mobileOptionsContainerProgress, {
                duration: 130,
                easing: Easing.out(Easing.back(1.05)),
                toValue: 1,
                useNativeDriver: true
            })
        ]).start();
    }
    /** @returns {string} */
    getSearchText = () => this.searchTextValue || "";
    /** @returns {void} */
    resetSearchTextInput = () => {
        this.searchTextValue = "";
        const input = this.tt.searchTextInputRef.current;
        if (input?.clear) {
            input.clear();
        }
        else if (input?.setNativeProps) {
            input.setNativeProps({ text: "" });
        }
        else if (input) {
            try {
                input.value = "";
            }
            catch (error) {
                // Ignore if the ref doesn't support direct value assignment.
            }
        }
    };
    /**
     * @param {string} searchText
     * @returns {void}
     */
    onChangeSearchText = (searchText) => {
        if (this.isDebugEnabled())
            this.debugLog("onChangeSearchText", { searchText, currentPage: this.s.page });
        this.searchTextValue = searchText;
        if (this.s.page != 1) {
            this.setState({ page: 1, pageInputValue: "1" }, this.tt.onSearchTextInputChangedDebounced);
        }
        else {
            this.tt.onSearchTextInputChangedDebounced();
        }
    };
    /** @returns {void} */
    openOptions() {
        const mobileOptionsSheet = this.isMobileOptionsSheet();
        if (this.isDebugEnabled())
            this.debugLog("openOptions", {
                currentOptionsCount: this.getCurrentOptions()?.length || 0,
                mobileOptionsSheet,
                searchEnabled: this.p.search
            });
        this.searchTextValue = "";
        this.callOptionsPositionAboveIfOutsideScreen = !mobileOptionsSheet;
        if (mobileOptionsSheet) {
            this.prepareMobileOptionsAnimation();
        }
        this.setState({
            height: mobileOptionsSheet ? null : this.s.selectContainerLayout?.height,
            opened: true,
            optionsPlacement: mobileOptionsSheet ? "sheet" : "below",
            optionsVisibility: mobileOptionsSheet ? "visible" : "hidden",
            optionsWidth: mobileOptionsSheet ? undefined : this.s.endOfSelectLayout?.width,
            page: 1,
            pageInputFocused: false,
            pageInputValue: "1",
            scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
            scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null
        }, () => {
            if (mobileOptionsSheet) {
                this.lockBodyScroll();
                this.startMobileOptionsOpenAnimation();
            }
            else {
                this.measureNativeSelectLayouts();
                this.focusTextInput();
            }
            this.resetSearchTextInput();
            this.loadOptions({ page: 1 });
        });
        if (this.p.onFocus)
            this.p.onFocus();
    }
    /** @returns {void} */
    focusTextInput = () => digg(this.tt.searchTextInputRef, "current")?.focus();
    /** @returns {void} */
    lockBodyScroll() {
        if (Platform.OS != "web" || typeof document == "undefined" || this.bodyScrollLocked)
            return;
        this.previousBodyOverflow = document.body?.style.overflow;
        this.previousDocumentOverflow = document.documentElement?.style.overflow;
        if (document.body)
            document.body.style.overflow = "hidden";
        if (document.documentElement)
            document.documentElement.style.overflow = "hidden";
        this.bodyScrollLocked = true;
    }
    /** @returns {void} */
    unlockBodyScroll() {
        if (Platform.OS != "web" || typeof document == "undefined" || !this.bodyScrollLocked)
            return;
        if (document.body)
            document.body.style.overflow = this.previousBodyOverflow || "";
        if (document.documentElement)
            document.documentElement.style.overflow = this.previousDocumentOverflow || "";
        this.previousBodyOverflow = undefined;
        this.previousDocumentOverflow = undefined;
        this.bodyScrollLocked = false;
    }
    /** @returns {void} */
    setOptionsPosition() {
        if (!this.isActive()) {
            return; // Debounce after un-mount handeling.
        }
        if (this.isMobileOptionsSheet()) {
            this.setOptionsPositionSheet();
            return;
        }
        this.unlockBodyScroll();
        if (this.isDebugEnabled())
            this.debugLog("setOptionsPosition");
        this.callOptionsPositionAboveIfOutsideScreen = true;
        this.setOptionsPositionBelow();
    }
    /** @returns {void} */
    syncOptionsPlacementWithMode() {
        if (!this.s.opened)
            return;
        if (this.isMobileOptionsSheet()) {
            if (this.s.optionsPlacement != "sheet")
                this.setOptionsPositionSheet();
            return;
        }
        if (this.s.optionsPlacement == "sheet") {
            this.setOptionsPositionBelow();
            return;
        }
        this.unlockBodyScroll();
        this.measureNativeSelectLayouts();
    }
    /** @returns {void} */
    setOptionsPositionAboveIfOutsideScreen() {
        if (!this.s.opened)
            return;
        if (this.isMobileOptionsSheet()) {
            this.setOptionsPositionSheet();
            return;
        }
        const { windowHeight } = this.tt;
        const { optionsContainerLayout, selectContainerLayout } = this.s;
        const endOfSelectLayout = this.s.endOfSelectLayout;
        const optionsTop = Platform.OS == "web"
            ? endOfSelectLayout?.top
            : typeof selectContainerLayout?.top == "number" && typeof selectContainerLayout?.height == "number"
                ? selectContainerLayout.top + selectContainerLayout.height + 1
                : undefined;
        if (!Number.isFinite(optionsTop)) {
            if (this.isDebugEnabled())
                this.debugLog("setOptionsPositionAboveIfOutsideScreen", { placement: "below", reason: "missing-options-top" });
            this.measureNativeSelectLayouts();
            return;
        }
        const optionsTotalBottomPosition = optionsContainerLayout.height + optionsTop;
        const windowHeightWithScroll = windowHeight + (this.s.scrollTop || 0);
        if (windowHeightWithScroll < optionsTotalBottomPosition) {
            if (this.isDebugEnabled())
                this.debugLog("setOptionsPositionAboveIfOutsideScreen", { placement: "above" });
            this.setOptionsPositionAbove();
        }
        else {
            if (this.isDebugEnabled())
                this.debugLog("setOptionsPositionAboveIfOutsideScreen", { placement: "below" });
            this.s.optionsVisibility = "visible";
        }
    }
    /** @returns {void} */
    setOptionsPositionSheet() {
        if (!this.s.opened)
            return;
        const switchingToSheet = this.s.optionsPlacement != "sheet";
        if (switchingToSheet) {
            this.prepareMobileOptionsAnimation();
        }
        this.lockBodyScroll();
        this.setState({
            height: null,
            opened: true,
            optionsPlacement: "sheet",
            optionsVisibility: "visible",
            optionsWidth: undefined
        }, () => {
            if (switchingToSheet)
                this.startMobileOptionsOpenAnimation();
        });
    }
    /** @returns {void} */
    setOptionsPositionAbove() {
        if (!this.s.opened)
            return;
        const { endOfSelectLayout } = this.s;
        if (this.isDebugEnabled())
            this.debugLog("setOptionsPositionAbove");
        this.unlockBodyScroll();
        this.setState({
            opened: true,
            optionsPlacement: "above",
            optionsVisibility: "visible",
            optionsWidth: endOfSelectLayout?.width
        }, () => this.focusTextInput());
    }
    /** @returns {void} */
    setOptionsPositionBelow() {
        if (!this.s.opened)
            return;
        if (this.isDebugEnabled())
            this.debugLog("setOptionsPositionBelow");
        this.unlockBodyScroll();
        this.setState({
            opened: true,
            optionsPlacement: "below",
            optionsVisibility: "hidden",
            optionsWidth: this.s.endOfSelectLayout?.width
        }, () => this.focusTextInput());
    }
    /** @returns {void} */
    onAnythingResized = () => {
        if (this.isDebugEnabled())
            this.debugLog("onAnythingResized", { opened: this.s.opened });
        if (this.s.opened) {
            this.setOptionsPosition();
        }
    };
    onAnythingResizedDebounced = debounce(this.tt.onAnythingResized, 25);
    /** @returns {void} */
    onAnythingScrolled = () => {
        if (this.isDebugEnabled())
            this.debugLog("onAnythingScrolled", { opened: this.s.opened });
        if (this.s.opened) {
            this.s.scrollLeft = Platform.OS == "web" ? document.documentElement.scrollLeft : null;
            this.s.scrollTop = Platform.OS == "web" ? document.documentElement.scrollTop : null;
            if (this.isMobileOptionsSheet())
                return;
            this.setOptionsPosition();
        }
    };
    onAnythingScrolledDebounced = debounce(this.tt.onAnythingScrolled, 25);
    /** @returns {void} */
    onPressOutsideOptions = () => {
        if (this.isDebugEnabled())
            this.debugLog("onPressOutsideOptions", { opened: this.s.opened });
        // If options are open and a click is made outside of the options container
        if (this.s.opened) {
            this.closeOptions();
        }
    };
    /**
     * @param {import("react").SyntheticEvent} event Responder event.
     * @returns {void}
     */
    onMobileOptionsBackdropRelease = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        this.closeOptions();
    };
    mobileOptionsBackdropPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => false,
        onPanResponderRelease: this.tt.onMobileOptionsBackdropRelease,
        onPanResponderTerminate: this.tt.onMobileOptionsBackdropRelease
    });
    /** @returns {number|null} */
    paginationTotalPages() {
        const { totalCount } = this.s;
        if (!Number.isFinite(totalCount) || totalCount <= 0)
            return null;
        const pageSize = this.resolvePageSize({
            options: this.s.loadedOptions || [],
            page: this.getActivePage(),
            pageSize: this.s.pageSize,
            totalCount
        });
        if (!Number.isFinite(pageSize) || pageSize <= 0)
            return null;
        return Math.ceil(totalCount / pageSize);
    }
    /**
     * @param {number} totalPages
     * @returns {Array<{key: string, type: "page"|"ellipsis", value?: number}>}
     */
    paginationPageItems(totalPages) {
        const currentPage = this.getActivePage();
        const items = [];
        const addPage = (page) => items.push({ key: `page-${page}`, type: "page", value: page });
        const addEllipsis = (key) => items.push({ key, type: "ellipsis" });
        if (totalPages <= 7) {
            for (let page = 1; page <= totalPages; page += 1) {
                addPage(page);
            }
            return items;
        }
        addPage(1);
        const windowSize = 2;
        let start = Math.max(2, currentPage - windowSize);
        let end = Math.min(totalPages - 1, currentPage + windowSize);
        if (currentPage <= 3) {
            start = 2;
            end = Math.min(totalPages - 1, 5);
        }
        else if (currentPage >= totalPages - 2) {
            end = totalPages - 1;
            start = Math.max(2, totalPages - 4);
        }
        if (start > 2)
            addEllipsis("ellipsis-start");
        for (let page = start; page <= end; page += 1) {
            addPage(page);
        }
        if (end < totalPages - 1)
            addEllipsis("ellipsis-end");
        addPage(totalPages);
        return items;
    }
    /**
     * @param {number} totalPages
     * @returns {string}
     */
    paginationDisplayValue(totalPages) {
        const activePage = this.getActivePage();
        const fallbackText = `Page ${activePage} of ${totalPages}`;
        return this.translate(".pagination_page_of_pages", {
            defaultValue: fallbackText,
            page: activePage,
            totalPages
        }) || fallbackText;
    }
    /**
     * @param {number} totalPages
     * @returns {string}
     */
    paginationInputValue(totalPages) {
        if (this.s.pageInputFocused)
            return this.s.pageInputValue;
        return this.paginationDisplayValue(totalPages);
    }
    /** @param {number} page */
    setPaginationPage = (page) => {
        const totalPages = this.paginationTotalPages();
        if (this.isDebugEnabled())
            this.debugLog("setPaginationPage", { requestedPage: page, totalPages });
        if (!totalPages)
            return;
        const nextPage = Math.min(Math.max(Math.floor(page), 1), totalPages);
        if (nextPage == this.getActivePage()) {
            this.s.pageInputValue = String(this.getActivePage());
            return;
        }
        this.setState({ page: nextPage, pageInputValue: String(nextPage) }, () => this.tt.loadOptions({ page: nextPage }));
    };
    /** @param {import("react").SyntheticEvent} event */
    onPaginationPrevPressed = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        this.setPaginationPage(this.getActivePage() - 1);
    };
    /** @param {import("react").SyntheticEvent} event */
    onPaginationNextPressed = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        this.setPaginationPage(this.getActivePage() + 1);
    };
    /** @returns {void} */
    onPaginationInputFocus = () => {
        this.s.pageInputFocused = true;
        this.s.pageInputValue = String(this.getActivePage());
    };
    /** @param {string} value */
    onPaginationInputChange = (value) => {
        this.s.pageInputValue = value;
    };
    /** @param {import("react").SyntheticEvent} event */
    onPaginationInputBlur = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        const totalPages = this.paginationTotalPages();
        const rawValue = event?.target?.value ?? this.s.pageInputValue;
        const parsedValue = rawValue ? Number(String(rawValue).match(/\d+/)?.[0]) : NaN;
        const nextPage = Number.isFinite(parsedValue) ? parsedValue : Number(this.s.pageInputValue);
        if (totalPages && Number.isFinite(nextPage)) {
            this.setState({ pageInputFocused: false }, () => this.setPaginationPage(nextPage));
            return;
        }
        this.setState({
            pageInputFocused: false,
            pageInputValue: String(this.getActivePage())
        });
    };
    /** @param {import("react").SyntheticEvent} event */
    onPaginationInputSubmit = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        const totalPages = this.paginationTotalPages();
        if (!totalPages) {
            this.s.pageInputFocused = false;
            this.s.pageInputValue = String(this.getActivePage());
            return;
        }
        const nextPage = Number(this.s.pageInputValue);
        if (!Number.isFinite(nextPage)) {
            this.s.pageInputFocused = false;
            this.s.pageInputValue = String(this.getActivePage());
            return;
        }
        this.setState({ pageInputFocused: false }, () => this.setPaginationPage(nextPage));
    };
    /** @param {import("react").SyntheticEvent} event */
    onPaginationInputKeyDown = (event) => {
        if (event?.key !== "Enter")
            return;
        this.tt.onPaginationInputSubmit(event);
    };
    /** @returns {import("react").ReactNode|null} */
    paginationControls() {
        const totalPages = this.paginationTotalPages();
        if (!totalPages || totalPages <= 1)
            return null;
        const currentPage = this.getActivePage();
        const prevDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= totalPages;
        return (React.createElement(View, { style: styles.paginationContainer ||= {
                borderTopColor: "#e2e8f0",
                borderTopWidth: 1,
                padding: 8
            }, testID: "haya-select/options-pagination" },
            React.createElement(View, { style: styles.paginationHeader ||= { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, testID: "haya-select/pagination-header" },
                React.createElement(Pressable, { disabled: prevDisabled, onPress: this.tt.onPaginationPrevPressed, style: styles[`paginationNavButton-${prevDisabled}`] ||= {
                        alignItems: "center",
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                        borderRadius: 8,
                        borderWidth: 1,
                        height: 30,
                        justifyContent: "center",
                        opacity: prevDisabled ? 0.4 : 1,
                        width: 30
                    }, testID: "haya-select/pagination-prev" },
                    React.createElement(FontAwesomeIcon, { name: "chevron-left", style: styles.paginationNavIcon ||= { color: "#334155", fontSize: 12 } })),
                React.createElement(View, { dataSet: this.cache("paginationLabelDataSet", {
                        page: currentPage
                    }, [currentPage]), style: styles.paginationLabelButton ||= {
                        alignItems: "center",
                        backgroundColor: "#f1f5f9",
                        borderColor: "#cbd5e1",
                        borderRadius: 14,
                        borderWidth: 1,
                        justifyContent: "center",
                        minWidth: 140,
                        paddingHorizontal: 10,
                        paddingVertical: 6
                    }, testID: "haya-select/pagination-label" },
                    React.createElement(TextInput, { keyboardType: "number-pad", onBlur: this.tt.onPaginationInputBlur, onChangeText: this.tt.onPaginationInputChange, onFocus: this.tt.onPaginationInputFocus, onPressIn: this.tt.onPaginationInputFocus, onKeyDown: this.tt.onPaginationInputKeyDown, onSubmitEditing: this.tt.onPaginationInputSubmit, ref: this.tt.pageInputRef, selectTextOnFocus: true, style: styles.paginationInputStyle ||= {
                            borderWidth: 0,
                            color: "#0f172a",
                            fontSize: 12,
                            outline: Platform.OS == "web" ? "none" : undefined,
                            padding: 0,
                            textAlign: "center",
                            width: 120
                        }, testID: "haya-select/pagination-input", value: this.paginationInputValue(totalPages) })),
                React.createElement(Pressable, { disabled: nextDisabled, onPress: this.tt.onPaginationNextPressed, style: styles[`paginationNavButton-${nextDisabled}`] ||= {
                        alignItems: "center",
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                        borderRadius: 8,
                        borderWidth: 1,
                        height: 30,
                        justifyContent: "center",
                        opacity: nextDisabled ? 0.4 : 1,
                        width: 30
                    }, testID: "haya-select/pagination-next" },
                    React.createElement(FontAwesomeIcon, { name: "chevron-right", style: styles.paginationNavIcon ||= { color: "#334155", fontSize: 12 } }))),
            React.createElement(View, { style: styles.paginationPages ||= {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: 8
                }, testID: "haya-select/pagination-pages" }, this.paginationPageItems(totalPages).map((item) => {
                if (item.type == "ellipsis") {
                    return (React.createElement(View, { key: item.key, style: styles.paginationEllipsis ||= { paddingHorizontal: 6 }, testID: "haya-select/pagination-ellipsis" },
                        React.createElement(Text, { style: styles.paginationEllipsisText ||= {
                                color: "#64748b",
                                fontSize: 12,
                                fontWeight: 600
                            } }, "...")));
                }
                return (React.createElement(PaginationPageButton, { active: item.value == currentPage, key: item.key, onPageSelected: this.tt.setPaginationPage, page: item.value }));
            }))));
    }
    /**
     * @param {{loadedOptions: Array<HayaSelectOption>|undefined}} args Options to render.
     * @returns {import("react").ReactNode}
     */
    optionsListContent({ loadedOptions }) {
        return (React.createElement(React.Fragment, null,
            loadedOptions?.map((loadedOption) => this.hayaSelectOption({
                key: loadedOption.key || `loaded-option-${loadedOption.value}`,
                loadedOption
            })),
            loadedOptions?.length === 0 &&
                React.createElement(View, { style: this.stylingFor("noOptionsContainer", this.noOptionsContainerStyle ||= {
                        paddingBottom: 10,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 10
                    }), testID: "haya-select/no-options-container" },
                    React.createElement(Text, null, this.p.noOptionsText ? this.p.noOptionsText() : this.translate(".no_options_found")))));
    }
    /**
     * @param {{id: string|number, optionsListContent: import("react").ReactNode, paginationControls: import("react").ReactNode|null}} args Mobile sheet content.
     * @returns {import("react").ReactNode}
     */
    mobileOptionsContainer({ id, optionsListContent, paginationControls }) {
        const sheetMaxHeight = Math.round(Dimensions.get("window").height * 0.8);
        let sheetStyle = this.stylingFor("optionsContainer", {
            position: "absolute",
            zIndex: 100000,
            elevation: 100000,
            left: 10,
            right: 10,
            bottom: 0,
            maxHeight: sheetMaxHeight,
            shadowColor: "#0f172a",
            shadowOffset: { height: -12, width: 0 },
            shadowOpacity: 0.48,
            shadowRadius: 34,
            boxShadow: Platform.OS == "web"
                ? "0 -28px 72px rgba(15, 23, 42, 0.56), 0 -8px 24px rgba(15, 23, 42, 0.38), 0 0 0 1px rgba(15, 23, 42, 0.12)"
                : undefined,
            backgroundColor: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            opacity: this.mobileOptionsContainerProgress,
            overflow: "hidden",
            transform: this.mobileOptionsContainerTransform,
            visibility: this.s.optionsVisibility
        }, [sheetMaxHeight, this.s.optionsVisibility]);
        if ("height" in sheetStyle) {
            sheetStyle = Object.assign({}, sheetStyle);
            delete sheetStyle.height;
        }
        return (React.createElement(View, { style: this.stylingFor("mobileOptionsOverlay", styles.mobileOptionsOverlay ||= {
                position: Platform.OS == "web" ? "fixed" : "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 99999,
                elevation: 99999
            }), testID: "haya-select/mobile-options-overlay" },
            React.createElement(Animated.View, { style: this.stylingFor("mobileOptionsBackdrop", this.mobileOptionsBackdropStyle ||= {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.32)",
                    opacity: this.mobileOptionsBackdropOpacity
                }), testID: "haya-select/mobile-options-backdrop", ...this.tt.mobileOptionsBackdropPanResponder.panHandlers }),
            React.createElement(Animated.View, { dataSet: this.cache("mobileOptionsContainerDataSet", { id, role: "dialog", optionsPlacement: "sheet", optionsVisibility: this.s.optionsVisibility || "hidden" }, [id, this.s.optionsVisibility]), onLayout: this.tt.onOptionsContainerLayout, ref: this.tt.optionsContainerRef, style: sheetStyle, testID: "haya-select/options-container" },
                React.createElement(ScrollView, { contentContainerStyle: this.stylingFor("mobileOptionsScrollContent", styles.mobileOptionsScrollContent ||= {
                        flexGrow: 1,
                        justifyContent: "flex-end"
                    }), keyboardShouldPersistTaps: "handled", nestedScrollEnabled: true, style: this.stylingFor("mobileOptionsScrollView", styles.mobileOptionsScrollView ||= { flexGrow: 0, flexShrink: 1, minHeight: 0 }), testID: "haya-select/mobile-options-scroll-view" }, optionsListContent),
                paginationControls,
                React.createElement(View, { style: this.stylingFor("mobileOptionsSearchContainer", styles.mobileOptionsSearchContainer ||= {
                        borderTopColor: "#cbd5e1",
                        borderTopWidth: 1,
                        paddingBottom: 14,
                        paddingLeft: 14,
                        paddingRight: 14,
                        paddingTop: 10
                    }), testID: "haya-select/mobile-options-search-container" }, this.searchTextInput({ mobileOptionsSheet: true })))));
    }
    /** @returns {import("react").ReactNode|null} */
    optionsContainer() {
        const { selectContainerLayout, loadedOptions, endOfSelectLayout, optionsContainerLayout, optionsPlacement, optionsVisibility } = this.s;
        let left, top;
        const id = idForComponent(this);
        const desktopOptionsPlacement = optionsPlacement == "sheet" ? "below" : optionsPlacement;
        const optionsListContent = this.optionsListContent({ loadedOptions });
        const paginationControls = this.paginationControls();
        if (this.isMobileOptionsSheet()) {
            return this.mobileOptionsContainer({ id, optionsListContent, paginationControls });
        }
        let style = {
            position: "absolute",
            zIndex: 99999,
            elevation: 99999,
            visibility: optionsVisibility,
            width: this.p.optionsWidth || this.s.optionsWidth,
            backgroundColor: "#fff",
            borderColor: "#999",
            borderWidth: 1,
            maxHeight: 300,
            overflow: "hidden"
        };
        if (!this.p.optionsPortal) {
            style.top = 0;
            style.left = 0;
        }
        else if (!this.p.optionsAbsolute) {
            style.left = 0;
            style.bottom = 0;
        }
        else if (desktopOptionsPlacement == "below") {
            if (Platform.OS == "web") {
                // onLayout top value is sometimes negative so use browser JS to get it instead
                top = digg(this.tt.endOfSelectRef.current.getBoundingClientRect(), "top") + document.documentElement.scrollTop + 1;
                // onLayout left values doesn't always update when changed
                left = digg(this.tt.endOfSelectRef.current.getBoundingClientRect(), "left") + document.documentElement.scrollLeft;
            }
            else {
                left = selectContainerLayout?.left;
                top = typeof selectContainerLayout?.top == "number" && typeof selectContainerLayout?.height == "number"
                    ? selectContainerLayout.top + selectContainerLayout.height + 1
                    : undefined;
            }
            if (Number.isFinite(left) && Number.isFinite(top)) {
                style.left = left;
                style.top = Platform.OS == "web" ? top - 2 : top;
            }
            else {
                style.left = 0;
                style.top = 0;
                style.visibility = "hidden";
            }
        }
        else if (desktopOptionsPlacement == "above") {
            if (Platform.OS == "web") {
                // onLayout top value is sometimes negative so use browser JS to get it instead
                top = digg(this.tt.selectContainerRef.current.getBoundingClientRect(), "top") + document.documentElement.scrollTop;
                // onLayout left values doesn't always update when changed
                left = digg(this.tt.selectContainerRef.current.getBoundingClientRect(), "left") + document.documentElement.scrollLeft;
            }
            else {
                left = selectContainerLayout?.left;
                top = selectContainerLayout?.top;
            }
            if (Number.isFinite(left) && Number.isFinite(top)) {
                style.left = left;
                style.top = top - optionsContainerLayout.height + 1;
            }
            else {
                style.left = 0;
                style.top = 0;
                style.visibility = "hidden";
            }
        }
        else {
            throw new Error(`Unkonwn options placement: ${desktopOptionsPlacement}`);
        }
        if (Platform.OS != "web") {
            style.opacity = optionsVisibility == "hidden" ? 0 : 1;
            style.overflow = "hidden";
        }
        style = this.stylingFor("optionsContainer", style, [left, top, style.visibility, style.width]);
        return (React.createElement(View, { dataSet: this.cache("optionsContainerDataSet", { id, role: "dialog", optionsVisibility: optionsVisibility || "hidden" }, [id, optionsVisibility]), onLayout: this.tt.onOptionsContainerLayout, ref: this.tt.optionsContainerRef, style: style, testID: "haya-select/options-container" },
            React.createElement(ScrollView, { keyboardShouldPersistTaps: "handled", nestedScrollEnabled: true, style: styles[`optionsScrollView-${style.maxHeight || 300}`] ||= {
                    flexGrow: 0,
                    flexShrink: 1,
                    maxHeight: style.maxHeight || 300,
                    minHeight: 0
                }, testID: "haya-select/options-scroll-view" }, optionsListContent),
            paginationControls));
    }
    /**
     * @param {import("react").SyntheticEvent} event
     * @param {HayaSelectOption} loadedOption
     * @returns {void}
     */
    onOptionClicked = (event, loadedOption) => {
        event.preventDefault();
        event.stopPropagation();
        const { onChange, toggleOptions } = this.props;
        const { multiple } = this.p;
        const currentOptions = this.getCurrentOptions();
        const toggled = this.getToggled();
        const newState = {};
        const existingOption = currentOptions.find((currentOption) => currentOption.value == loadedOption.value);
        const newToggled = { ...toggled };
        let newCurrentOptions;
        let action;
        if (existingOption) {
            if (toggleOptions) {
                const currentToggle = toggled[loadedOption.value];
                const currentIndex = toggleOptions.findIndex((element) => element.value == currentToggle);
                if (currentIndex >= (toggleOptions.length - 1)) {
                    // No next toggled - remove toggled and option
                    delete newToggled[loadedOption.value];
                    action = "remove-option-after-last-toggle";
                    newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value);
                }
                else {
                    // Already toggled - set to next toggle
                    newToggled[loadedOption.value] = digg(toggleOptions, currentIndex + 1, "value");
                    action = "cycle-toggle";
                }
                newState.toggled = newToggled;
            }
            else {
                // Remove from current options
                action = "remove-option";
                newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value);
            }
        }
        else {
            // Don't do anything if the clicked option is disabled
            if (loadedOption.disabled) {
                if (this.isDebugEnabled())
                    this.debugLog("onOptionClicked", {
                        action: "ignore-disabled-option",
                        optionValue: loadedOption.value
                    });
                return;
            }
            if (toggleOptions) {
                // Set fresh toggle
                newToggled[loadedOption.value] = toggleOptions[0].value;
                newState.toggled = newToggled;
            }
            if (multiple || toggleOptions) {
                action = "add-option";
                newCurrentOptions = currentOptions.concat([loadedOption]);
            }
            else {
                action = "replace-single-option";
                newCurrentOptions = [loadedOption];
            }
        }
        if ("values" in this.props && this.props.values !== undefined) {
            // currentOptions are controlled and a useMemo callback is handeling setting current options.
        }
        else if (newCurrentOptions) {
            newState.currentOptions = newCurrentOptions;
        }
        const options = newCurrentOptions || currentOptions;
        if (this.isDebugEnabled())
            this.debugLog("onOptionClicked", {
                action: action || "toggle-only",
                multiple,
                optionValue: loadedOption.value,
                optionsCountBefore: currentOptions.length,
                optionsCountAfter: options.length
            });
        if (!multiple || this.p.closeOnChange)
            this.closeOptions({ options });
        if (onChange) {
            /** @type {HayaSelectOnChangePayload} */
            onChange({
                event,
                options,
                toggles: newToggled
            });
        }
        if (this.props.onChangeValue) {
            let optionValue;
            if (multiple) {
                optionValue = options.map((option) => option.value);
            }
            else {
                optionValue = dig(options, 0, "value");
            }
            this.p.onChangeValue(optionValue);
        }
        if ("toggled" in newState) {
            this.s.toggled = newState.toggled;
        }
        if ("currentOptions" in newState) {
            this.s.currentOptions = newState.currentOptions;
        }
    };
    /**
     * @param {string} stylingName
     * @param {Record<string, any>} [style]
     * @param {Array<any>} [caches]
     * @returns {Record<string, any>}
     */
    stylingFor(stylingName, style = {}, caches = []) {
        let customStyling = dig(this, "props", "styles", stylingName);
        const baseStyle = { ...style };
        if (typeof customStyling == "function") {
            /** @type {HayaSelectStylingContext} */
            customStyling = customStyling({
                opened: this.s.opened,
                optionsPlacement: this.s.optionsPlacement,
                state: this.state,
                style: baseStyle
            });
        }
        if (customStyling) {
            return Object.assign({}, baseStyle, customStyling);
        }
        return this.cache(`stylingFor-${stylingName}`, style, caches);
    }
    /**
     * @param {HayaSelectOption} option
     * @returns {string|undefined}
     */
    iconForOption(option) {
        const { toggleOptions } = this.props || {};
        const toggled = this.getToggled();
        if (toggleOptions && (option.value in toggled)) {
            const toggledValue = toggled[option.value];
            const toggledOption = toggleOptions.find((element) => element.value == toggledValue);
            if (!toggledOption) {
                throw new Error(`Couldn't find a toggle option for value: ${toggledValue}`);
            }
            return toggledOption.icon;
        }
    }
    /**
     * @param {HayaSelectOption} option
     * @param {"current"|"option"} mode
     * @returns {import("react").ReactNode}
     */
    presentOption = (option, mode) => {
        const { optionContent, toggleOptions } = this.props || {};
        const toggled = this.getToggled();
        const icon = this.iconForOption(option);
        const toggleValue = toggled[option.value];
        const toggleOption = toggleOptions?.find((toggleOptionI) => toggleOptionI.value == toggleValue);
        const selected = this.getCurrentOptionValues().some((value) => value == option.value);
        let style;
        let contentNode;
        if (mode == "current") {
            style = this.stylingFor("currentOptionPresentationText", { flex: 1, whiteSpace: "nowrap" });
        }
        else {
            style = this.stylingFor("optionPresentationText", { flex: 1, whiteSpace: "nowrap" });
        }
        return (React.createElement(View, { dataSet: this.cache("presentOptionViewDataSet", {
                text: option.text,
                toggleIcon: toggleOption?.icon,
                toggleValue: toggleOption?.value,
                value: option.value
            }, [option.text, option.value, toggleOption?.icon, toggleOption?.value]), style: this.cache("optionPresentationStyle", { flexDirection: "row", alignItems: "center" }), testID: "haya-select/option-presentation" },
            toggleOptions && !(option.value in toggled) &&
                React.createElement(View, { style: this.cache("toggleIconPlaceholderStyle", { width: 20 }), testID: "haya-select/toggle-icon-placeholder" }),
            toggleOptions && (option.value in toggled) &&
                React.createElement(View, { style: this.cache("toggleIconContainerStyle", { alignItems: "center", justifyContent: "center", width: 20 }) },
                    React.createElement(FontAwesomeIcon, { name: icon, testID: "haya-select/toggle-icon" })),
            (() => {
                if (optionContent) {
                    /** @type {HayaSelectOptionRenderContext} */
                    contentNode = optionContent({ icon, mode, option, selected, toggleOption, toggleValue, toggled });
                }
                else if (mode == "current" && option.currentContent) {
                    contentNode = option.currentContent();
                }
                else if (option.content) {
                    contentNode = option.content();
                }
                else if ("html" in option && Platform.OS != "web") {
                    contentNode = React.createElement(RenderHtml, { source: { html: digg(option, "html") } });
                }
                else if ("html" in option && Platform.OS == "web") {
                    contentNode = React.createElement("div", { dangerouslySetInnerHTML: { __html: digg(option, "html") } });
                }
                else {
                    contentNode = (React.createElement(Text, { style: style, testID: "haya-select/option-presentation-text" }, option.text));
                }
                return (React.createElement(React.Fragment, null,
                    React.createElement(View, { style: this.cache("optionPresentationContentStyle", { flex: 1 }) }, contentNode),
                    option.right &&
                        React.createElement(View, { style: this.cache("optionPresentationRightStyle", { alignItems: "center", justifyContent: "center", marginLeft: 8 }) }, option.right)));
            })()));
    };
    /** @returns {Promise<void>} */
    async setCurrentFromGivenValues() {
        const { options, values } = this.p;
        if (Array.isArray(values) && values.length === 0) {
            if (this.s.currentOptions?.length) {
                this.s.currentOptions = [];
            }
            return;
        }
        const result = await options({ page: this.getActivePage(), values });
        const { options: currentOptions } = this.parseOptionsResult(result);
        const currentValues = currentOptions?.map((currentOption) => currentOption.value);
        const stateValues = this.s.currentOptions?.map((currentOption) => currentOption.value);
        if (anythingDifferent(currentValues, stateValues)) {
            this.s.currentOptions = currentOptions;
        }
    }
}
const HayaSelectShapeComponent = shapeComponent(HayaSelect);
export default memo(HayaSelectShapeComponent);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VsZWN0L2luZGV4LmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQTtBQUNwRSxPQUFPLE1BQU0sTUFBTSxjQUFjLENBQUE7QUFDakMsT0FBTyxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsTUFBTSxXQUFXLENBQUE7QUFDbkMsT0FBTyxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLE1BQU0sY0FBYyxDQUFBO0FBQ3pILE9BQU8sS0FBSyxFQUFFLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxPQUFPLENBQUE7QUFDdkQsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUMsTUFBTSw0Q0FBNEMsQ0FBQTtBQUN6RixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUE7QUFDL0IsT0FBTyxlQUFlLE1BQU0sdUNBQXVDLENBQUE7QUFDbkUsT0FBTyxjQUFjLE1BQU0sbURBQW1ELENBQUE7QUFDOUUsT0FBTyxnQkFBZ0IsTUFBTSxxREFBcUQsQ0FBQTtBQUNsRixPQUFPLElBQUksTUFBTSxzQ0FBc0MsQ0FBQTtBQUN2RCxPQUFPLE1BQU0sTUFBTSxVQUFVLENBQUE7QUFDN0IsT0FBTyxXQUFXLE1BQU0sZ0JBQWdCLENBQUE7QUFDeEMsT0FBTyxvQkFBb0IsTUFBTSwwQkFBMEIsQ0FBQTtBQUMzRCxPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUE7QUFDbEMsT0FBTyxjQUFjLE1BQU0sa0JBQWtCLENBQUE7QUFDN0MsT0FBTyxVQUFVLE1BQU0sMEJBQTBCLENBQUE7QUFDakQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGNBQWMsQ0FBQTtBQUNuQyxPQUFPLGdCQUFn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QUFDLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQTtZQUM1QixDQUFDO1lBRUQsT0FBTTtRQUNSLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQTtRQUNsRSxNQUFNLEVBQUMsT0FBTyxFQUFFLGNBQWMsRUFBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNqRSxNQUFNLGFBQWEsR0FBRyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDakYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFdEYsSUFBSSxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7UUFDeEMsQ0FBQztJQUNILENBQUM7O0FBR0gsTUFBTSx3QkFBd0IsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUE7QUFFM0QsZUFBZSxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7YW55dGhpbmdEaWZmZXJlbnR9IGZyb20gXCJzZXQtc3RhdGUtY29tcGFyZS9idWlsZC9kaWZmLXV0aWxzXCJcbmltcG9ydCBDb25maWcgZnJvbSBcIi4uL2NvbmZpZy5qc1wiXG5pbXBvcnQge2RpZywgZGlnZ30gZnJvbSBcImRpZ2dlcml6ZVwiXG5pbXBvcnQge0FuaW1hdGVkLCBEaW1lbnNpb25zLCBFYXNpbmcsIFBhblJlc3BvbmRlciwgUGxhdGZvcm0sIFByZXNzYWJsZSwgU2Nyb2xsVmlldywgVGV4dElucHV0LCBWaWV3fSBmcm9tIFwicmVhY3QtbmF0aXZlXCJcbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZiwgbWVtbywgdXNlRWZmZWN0fSBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IHtzaGFwZUNvbXBvbmVudCwgU2hhcGVDb21wb25lbnR9IGZyb20gXCJzZXQtc3RhdGUtY29tcGFyZS9idWlsZC9zaGFwZS1jb21wb25lbnQuanNcIlxuaW1wb3J0IGRlYm91bmNlIGZyb20gXCJkZWJvdW5jZVwiXG5pbXBvcnQgRm9udEF3ZXNvbWVJY29uIGZyb20gXCJyZWFjdC1uYXRpdmUtdmVjdG9yLWljb25zL0ZvbnRBd2Vzb21lXCJcbmltcG9ydCBpZEZvckNvbXBvbmVudCBmcm9tIFwiQGthc3Blcm5qL2FwaS1tYWtlci9idWlsZC9pbnB1dHMvaWQtZm9yLWNvbXBvbmVudFwiXG5pbXBvcnQgbmFtZUZvckNvbXBvbmVudCBmcm9tIFwiQGthc3Blcm5qL2FwaS1tYWtlci9idWlsZC9pbnB1dHMvbmFtZS1mb3ItY29tcG9uZW50XCJcbmltcG9ydCBUZXh0IGZyb20gXCJAa2FzcGVybmovYXBpLW1ha2VyL2J1aWxkL3V0aWxzL3RleHRcIlxuaW1wb3J0IE9wdGlvbiBmcm9tIFwiLi9vcHRpb25cIlxuaW1wb3J0IE9wdGlvbkdyb3VwIGZyb20gXCIuL29wdGlvbi1ncm91cFwiXG5pbXBvcnQgUGFnaW5hdGlvblBhZ2VCdXR0b24gZnJvbSBcIi4vcGFnaW5hdGlvbi1wYWdlLWJ1dHRvblwiXG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCJcbmltcG9ydCBwcm9wVHlwZXNFeGFjdCBmcm9tIFwicHJvcC10eXBlcy1leGFjdFwiXG5pbXBvcnQgUmVuZGVySHRtbCBmcm9tIFwicmVhY3QtbmF0aXZlLXJlbmRlci1odG1sXCJcbmltcG9ydCB7UG9ydGFsfSBmcm9tIFwiY29uam9pbnRtZW50XCJcbmltcG9ydCB1c2VFdmVudExpc3RlbmVyIGZyb20gXCJ5YS11c2UtZXZlbnQtbGlzdGVuZXJcIlxuaW1wb3J0IHVzZVByZXNzT3V0c2lkZSBmcm9tIFwib3V0c2lkZS1leWUvYnVpbGQvdXNlLXByZXNzLW91dHNpZGVcIlxuXG5jb25zdCBzdHlsZXMgPSB7fVxuY29uc3QgTU9CSUxFX09QVElPTlNfTUFYX1dJRFRIID0gNzY4XG5cbi8qKlxuICogQHR5cGVkZWYge29iamVjdH0gSGF5YVNlbGVjdFRvZ2dsZU9wdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGljb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBIYXlhU2VsZWN0T3B0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ3xudW1iZXJ9IHZhbHVlXG4gKiBAcHJvcGVydHkge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW3RleHRdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKCk6IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW2NvbnRlbnRdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKCk6IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW2N1cnJlbnRDb250ZW50XVxuICogQHByb3BlcnR5IHtib29sZWFufSBbZGlzYWJsZWRdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2h0bWxdXG4gKiBAcHJvcGVydHkge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW3JpZ2h0XVxuICpcbiAqIEFkZGl0aW9uYWwgb3B0aW9uIHByb3BzIGFyZSBhbGxvd2VkOyBIYXlhU2VsZWN0IG9ubHkgdXNlcyB0aGUga2V5cyBhYm92ZS5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IEhheWFTZWxlY3RPcHRpb25zUmVzdWx0XG4gKiBAcHJvcGVydHkge0FycmF5PEhheWFTZWxlY3RPcHRpb24+fSBvcHRpb25zXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3RvdGFsQ291bnRdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3BhZ2VdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3BhZ2VTaXplXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge29iamVjdH0gSGF5YVNlbGVjdFByb3BzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2F0dHJpYnV0ZV1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY2xhc3NOYW1lXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbY2xvc2VPbkNoYW5nZV1cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbZGVmYXVsdFRvZ2dsZWRdXG4gKiBAcHJvcGVydHkge3N0cmluZ3xudW1iZXJ9IFtkZWZhdWx0VmFsdWVdXG4gKiBAcHJvcGVydHkge0FycmF5PHN0cmluZ3xudW1iZXI+fSBbZGVmYXVsdFZhbHVlc11cbiAqIEBwcm9wZXJ0eSB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj59IFtkZWZhdWx0VmFsdWVzRnJvbU9wdGlvbnNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtkZWJ1Z11cbiAqIEBwcm9wZXJ0eSB7aW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlfSBbaWRdXG4gKiBAcHJvcGVydHkge29iamVjdH0gW21vZGVsXVxuICogQHByb3BlcnR5IHtcImF1dG9cInxcImFsd2F5c1wifFwibmV2ZXJcIn0gW21vYmlsZU9wdGlvbnNNb2RlXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbbXVsdGlwbGVdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWVdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKCk6IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW25vT3B0aW9uc1RleHRdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50PSk6IHZvaWR9IFtvbkJsdXJdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50PSk6IHZvaWR9IFtvbkNoYW5nZV1cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oQXJyYXk8c3RyaW5nfG51bWJlcj49KTogdm9pZH0gW29uQ2hhbmdlVmFsdWVdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50PSk6IHZvaWR9IFtvbkZvY3VzXVxuICogQHByb3BlcnR5IHtmdW5jdGlvbih7b3B0aW9uczogQXJyYXl9KTogdm9pZH0gW29uT3B0aW9uc0Nsb3NlZF1cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oe29wdGlvbnM6IEFycmF5fSk6IHZvaWR9IFtvbk9wdGlvbnNMb2FkZWRdXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKG9iamVjdCk6IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gW29wdGlvbkNvbnRlbnRdXG4gKiBAcHJvcGVydHkge0FycmF5PEhheWFTZWxlY3RPcHRpb24+fGZ1bmN0aW9uKCk6IChBcnJheTxIYXlhU2VsZWN0T3B0aW9uPnxIYXlhU2VsZWN0T3B0aW9uc1Jlc3VsdCl9IG9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW29wdGlvbnNBYnNvbHV0ZV1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW29wdGlvbnNQb3J0YWxdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wdGlvbnNXaWR0aF1cbiAqIEBwcm9wZXJ0eSB7aW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlfSBbcGxhY2Vob2xkZXJdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NlbGVjdGVkQmFja2dyb3VuZENvbG9yXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzZWxlY3RlZEhvdmVyQmFja2dyb3VuZENvbG9yXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbc2VhcmNoXVxuICogQHByb3BlcnR5IHtpbXBvcnQoXCJyZWFjdC1uYXRpdmVcIikuVGV4dElucHV0UHJvcHN9IFtzZWFyY2hUZXh0SW5wdXRQcm9wc11cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbc3R5bGVzXVxuICogQHByb3BlcnR5IHtvYmplY3R9IFt0b2dnbGVkXVxuICogQHByb3BlcnR5IHtBcnJheTxIYXlhU2VsZWN0VG9nZ2xlT3B0aW9uPn0gW3RvZ2dsZU9wdGlvbnNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFt0cmFuc3BhcmVudF1cbiAqIEBwcm9wZXJ0eSB7QXJyYXk8c3RyaW5nfG51bWJlcj59IFt2YWx1ZXNdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBIYXlhU2VsZWN0U3RhdGVcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj59IGN1cnJlbnRPcHRpb25zXG4gKiBAcHJvcGVydHkge0hheWFTZWxlY3RMYXlvdXR8bnVsbH0gc2VsZWN0Q29udGFpbmVyTGF5b3V0XG4gKiBAcHJvcGVydHkge0hheWFTZWxlY3RMYXlvdXR8bnVsbH0gZW5kT2ZTZWxlY3RMYXlvdXRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfG51bGx9IGhlaWdodFxuICogQHByb3BlcnR5IHtBcnJheTxIYXlhU2VsZWN0T3B0aW9uPnx1bmRlZmluZWR9IGxvYWRlZE9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2FkT3B0aW9uc0FwcGxpZWRSZXF1ZXN0SWRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2FkT3B0aW9uc1JlcXVlc3RJZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHBhZ2VcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gcGFnZUlucHV0Rm9jdXNlZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHBhZ2VJbnB1dFZhbHVlXG4gKiBAcHJvcGVydHkge251bWJlcnxudWxsfSBwYWdlU2l6ZVxuICogQHByb3BlcnR5IHtib29sZWFufSBvcGVuZWRcbiAqIEBwcm9wZXJ0eSB7SGF5YVNlbGVjdExheW91dHxudWxsfSBvcHRpb25zQ29udGFpbmVyTGF5b3V0XG4gKiBAcHJvcGVydHkge1wiYWJvdmVcInxcImJlbG93XCJ8XCJzaGVldFwifHVuZGVmaW5lZH0gb3B0aW9uc1BsYWNlbWVudFxuICogQHByb3BlcnR5IHtudW1iZXJ8dW5kZWZpbmVkfSBvcHRpb25zVG9wXG4gKiBAcHJvcGVydHkge1wiaGlkZGVuXCJ8XCJ2aXNpYmxlXCJ8dW5kZWZpbmVkfSBvcHRpb25zVmlzaWJpbGl0eVxuICogQHByb3BlcnR5IHtudW1iZXJ8dW5kZWZpbmVkfG51bGx9IG9wdGlvbnNXaWR0aFxuICogQHByb3BlcnR5IHtudW1iZXJ8bnVsbH0gc2Nyb2xsTGVmdFxuICogQHByb3BlcnR5IHtudW1iZXJ8bnVsbH0gc2Nyb2xsVG9wXG4gKiBAcHJvcGVydHkge251bWJlcnxudWxsfSB0b3RhbENvdW50XG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmd8bnVtYmVyLCBzdHJpbmc+fSB0b2dnbGVkXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBIYXlhU2VsZWN0TGF5b3V0XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3RvcF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGVmdF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbeF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbeV1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbd2lkdGhdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2hlaWdodF1cbiAqL1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgUmVhY3QgTmF0aXZlIGFuZCBSZWFjdCBOYXRpdmUgV2ViIGxheW91dCBrZXlzLlxuICogQHBhcmFtIHtIYXlhU2VsZWN0TGF5b3V0fG51bGx8dW5kZWZpbmVkfSBsYXlvdXQgTmF0aXZlIGxheW91dC5cbiAqIEByZXR1cm5zIHtIYXlhU2VsZWN0TGF5b3V0fSBOb3JtYWxpemVkIGxheW91dC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplTGF5b3V0KGxheW91dCkge1xuICBjb25zdCBub3JtYWxpemVkTGF5b3V0ID0gT2JqZWN0LmFzc2lnbih7fSwgbGF5b3V0KVxuXG4gIGlmICh0eXBlb2Ygbm9ybWFsaXplZExheW91dC5sZWZ0ICE9IFwibnVtYmVyXCIgJiYgdHlwZW9mIG5vcm1hbGl6ZWRMYXlvdXQueCA9PSBcIm51bWJlclwiKSB7XG4gICAgbm9ybWFsaXplZExheW91dC5sZWZ0ID0gbm9ybWFsaXplZExheW91dC54XG4gIH1cblxuICBpZiAodHlwZW9mIG5vcm1hbGl6ZWRMYXlvdXQudG9wICE9IFwibnVtYmVyXCIgJiYgdHlwZW9mIG5vcm1hbGl6ZWRMYXlvdXQueSA9PSBcIm51bWJlclwiKSB7XG4gICAgbm9ybWFsaXplZExheW91dC50b3AgPSBub3JtYWxpemVkTGF5b3V0LnlcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVkTGF5b3V0XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBsYXlvdXQgaGFzIHVzYWJsZSBhYnNvbHV0ZS1pc2ggcG9zaXRpb24uXG4gKiBAcGFyYW0ge0hheWFTZWxlY3RMYXlvdXR8bnVsbHx1bmRlZmluZWR9IGxheW91dCBMYXlvdXQgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIHdoZW4gdG9wIGFuZCBsZWZ0IGNhbiBiZSB1c2VkLlxuICovXG5mdW5jdGlvbiBsYXlvdXRIYXNQb3NpdGlvbihsYXlvdXQpIHtcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShsYXlvdXQ/LmxlZnQpICYmIE51bWJlci5pc0Zpbml0ZShsYXlvdXQ/LnRvcClcbn1cblxuLyoqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGZvciBuYXRpdmUgaU9TIGFuZCBpT1MvaVBhZE9TIFNhZmFyaSBvbiB3ZWIuICovXG5mdW5jdGlvbiBpc0lPU0xpa2VQbGF0Zm9ybSgpIHtcbiAgaWYgKFBsYXRmb3JtLk9TID09IFwiaW9zXCIpIHJldHVybiB0cnVlXG4gIGlmIChQbGF0Zm9ybS5PUyAhPSBcIndlYlwiIHx8IHR5cGVvZiBuYXZpZ2F0b3IgPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIGZhbHNlXG5cbiAgY29uc3QgcGxhdGZvcm0gPSBuYXZpZ2F0b3IucGxhdGZvcm0gfHwgXCJcIlxuICBjb25zdCB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IFwiXCJcblxuICByZXR1cm4gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QocGxhdGZvcm0pIHx8XG4gICAgL2lQYWR8aVBob25lfGlQb2QvLnRlc3QodXNlckFnZW50KSB8fFxuICAgIChwbGF0Zm9ybSA9PSBcIk1hY0ludGVsXCIgJiYgbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSlcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBIYXlhU2VsZWN0T3B0aW9uUmVuZGVyQ29udGV4dFxuICogQHByb3BlcnR5IHtzdHJpbmd8dW5kZWZpbmVkfSBpY29uXG4gKiBAcHJvcGVydHkge1wiY3VycmVudFwifFwib3B0aW9uXCJ9IG1vZGVcbiAqIEBwcm9wZXJ0eSB7SGF5YVNlbGVjdE9wdGlvbn0gb3B0aW9uXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHNlbGVjdGVkXG4gKiBAcHJvcGVydHkge0hheWFTZWxlY3RUb2dnbGVPcHRpb258dW5kZWZpbmVkfSB0b2dnbGVPcHRpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfHVuZGVmaW5lZH0gdG9nZ2xlVmFsdWVcbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZ3xudW1iZXIsIHN0cmluZz59IHRvZ2dsZWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IEhheWFTZWxlY3RPbkNoYW5nZVBheWxvYWRcbiAqIEBwcm9wZXJ0eSB7aW1wb3J0KFwicmVhY3RcIikuU3ludGhldGljRXZlbnR9IGV2ZW50XG4gKiBAcHJvcGVydHkge0FycmF5PEhheWFTZWxlY3RPcHRpb24+fSBvcHRpb25zXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmd8bnVtYmVyLCBzdHJpbmc+fSB0b2dnbGVzXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBIYXlhU2VsZWN0U3R5bGluZ0NvbnRleHRcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gb3BlbmVkXG4gKiBAcHJvcGVydHkge1wiYWJvdmVcInxcImJlbG93XCJ8XCJzaGVldFwifHVuZGVmaW5lZH0gb3B0aW9uc1BsYWNlbWVudFxuICogQHByb3BlcnR5IHtIYXlhU2VsZWN0U3RhdGV9IHN0YXRlXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIGFueT59IHN0eWxlXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1NoYXBlQ29tcG9uZW50PEhheWFTZWxlY3RQcm9wcywgSGF5YVNlbGVjdFN0YXRlPn0gY29tcG9uZW50XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5jb25zdCBuYW1lRm9yQ29tcG9uZW50V2l0aE11bHRpcGxlID0gKGNvbXBvbmVudCkgPT4ge1xuICBsZXQgbmFtZSA9IG5hbWVGb3JDb21wb25lbnQoY29tcG9uZW50KVxuXG4gIGNvbnN0IGN1cnJlbnRPcHRpb25zID0gY29tcG9uZW50LmdldEN1cnJlbnRPcHRpb25zKClcbiAgY29uc3QgdmFsdWVzID0gY29tcG9uZW50LmdldFZhbHVlcygpXG5cbiAgY29uc3QgaGFzTXVsdGlwbGVWYWx1ZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlcykgJiYgdmFsdWVzLmxlbmd0aCA+IDBcblxuICBpZiAoY29tcG9uZW50LnByb3BzLm11bHRpcGxlICYmIG5hbWUgJiYgKGN1cnJlbnRPcHRpb25zLmxlbmd0aCA+IDAgfHwgaGFzTXVsdGlwbGVWYWx1ZXMpKSB7XG4gICAgbmFtZSArPSBcIltdXCJcbiAgfVxuXG4gIHJldHVybiBuYW1lXG59XG5cbi8qKiBAYXVnbWVudHMge1NoYXBlQ29tcG9uZW50PEhheWFTZWxlY3RQcm9wcywgSGF5YVNlbGVjdFN0YXRlPn0gKi9cbmNsYXNzIEhheWFTZWxlY3QgZXh0ZW5kcyBTaGFwZUNvbXBvbmVudCB7XG4gIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgY2xvc2VPbkNoYW5nZTogZmFsc2UsXG4gICAgZGVidWc6IGZhbHNlLFxuICAgIG1vYmlsZU9wdGlvbnNNb2RlOiBcImF1dG9cIixcbiAgICBtdWx0aXBsZTogZmFsc2UsXG4gICAgbm9PcHRpb25zVGV4dDogbnVsbCxcbiAgICBvbkJsdXI6IG51bGwsXG4gICAgb25Gb2N1czogbnVsbCxcbiAgICBvcHRpb25zQWJzb2x1dGU6IHRydWUsXG4gICAgb3B0aW9uc1BvcnRhbDogdHJ1ZSxcbiAgICBvcHRpb25zV2lkdGg6IG51bGwsXG4gICAgc2VhcmNoOiBmYWxzZSxcbiAgICBzZWFyY2hUZXh0SW5wdXRQcm9wczogdW5kZWZpbmVkLFxuICAgIHRyYW5zcGFyZW50OiBmYWxzZVxuICB9XG5cbiAgc3RhdGljIHByb3BUeXBlcyA9IHByb3BUeXBlc0V4YWN0KHtcbiAgICBhdHRyaWJ1dGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGNsb3NlT25DaGFuZ2U6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgZGVmYXVsdFRvZ2dsZWQ6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgZGVmYXVsdFZhbHVlOiBQcm9wVHlwZXMub25lT2ZUeXBlKFtQcm9wVHlwZXMubnVtYmVyLCBQcm9wVHlwZXMuc3RyaW5nXSksXG4gICAgZGVmYXVsdFZhbHVlczogUHJvcFR5cGVzLmFycmF5LFxuICAgIGRlZmF1bHRWYWx1ZXNGcm9tT3B0aW9uczogUHJvcFR5cGVzLmFycmF5LFxuICAgIGRlYnVnOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIGlkOiBQcm9wVHlwZXMubm9kZSxcbiAgICBtb2RlbDogUHJvcFR5cGVzLm9iamVjdCxcbiAgICBtb2JpbGVPcHRpb25zTW9kZTogUHJvcFR5cGVzLm9uZU9mKFtcImF1dG9cIiwgXCJhbHdheXNcIiwgXCJuZXZlclwiXSksXG4gICAgbXVsdGlwbGU6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgbmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBub09wdGlvbnNUZXh0OiBQcm9wVHlwZXMuZnVuYyxcbiAgICBvbkJsdXI6IFByb3BUeXBlcy5mdW5jLFxuICAgIG9uQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICBvbkNoYW5nZVZhbHVlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICBvbkZvY3VzOiBQcm9wVHlwZXMuZnVuYyxcbiAgICBvbk9wdGlvbnNDbG9zZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgIG9uT3B0aW9uc0xvYWRlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgb3B0aW9uQ29udGVudDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgb3B0aW9uczogUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgICBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICBjb250ZW50OiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgY3VycmVudENvbnRlbnQ6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBkaXNhYmxlZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIGh0bWw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIHJpZ2h0OiBQcm9wVHlwZXMubm9kZSxcbiAgICAgICAgdGV4dDogUHJvcFR5cGVzLm5vZGUsXG4gICAgICAgIHZhbHVlOiBQcm9wVHlwZXMub25lT2ZUeXBlKFtQcm9wVHlwZXMubnVtYmVyLCBQcm9wVHlwZXMuc3RyaW5nXSkuaXNSZXF1aXJlZFxuICAgICAgfSkpLFxuICAgICAgUHJvcFR5cGVzLmZ1bmNcbiAgICBdKS5pc1JlcXVpcmVkLFxuICAgIG9wdGlvbnNBYnNvbHV0ZTogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICBvcHRpb25zUG9ydGFsOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIG9wdGlvbnNXaWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICBwbGFjZWhvbGRlcjogUHJvcFR5cGVzLm5vZGUsXG4gICAgc2VsZWN0ZWRCYWNrZ3JvdW5kQ29sb3I6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgc2VsZWN0ZWRIb3ZlckJhY2tncm91bmRDb2xvcjogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBzZWFyY2g6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgc2VhcmNoVGV4dElucHV0UHJvcHM6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgc3R5bGVzOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIHRvZ2dsZWQ6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgdG9nZ2xlT3B0aW9uczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgIGljb246IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICB2YWx1ZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkXG4gICAgfSkpLFxuICAgIHRyYW5zcGFyZW50OiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIHZhbHVlczogUHJvcFR5cGVzLmFycmF5XG4gIH0pXG5cbiAgY2FsbE9wdGlvbnNQb3NpdGlvbkFib3ZlSWZPdXRzaWRlU2NyZWVuID0gZmFsc2VcbiAgYm9keVNjcm9sbExvY2tlZCA9IGZhbHNlXG4gIGVuZE9mU2VsZWN0UmVmID0gY3JlYXRlUmVmKClcbiAgbGF0ZXN0TG9hZE9wdGlvbnNSZXF1ZXN0SWQgPSAwXG4gIG1vYmlsZU9wdGlvbnNCYWNrZHJvcE9wYWNpdHkgPSBuZXcgQW5pbWF0ZWQuVmFsdWUoMClcbiAgb3B0aW9uc0NvbnRhaW5lclJlZiA9IGNyZWF0ZVJlZigpXG4gIHBhZ2VJbnB1dFJlZiA9IGNyZWF0ZVJlZigpXG4gIHByZXZpb3VzQm9keU92ZXJmbG93ID0gdW5kZWZpbmVkXG4gIHByZXZpb3VzRG9jdW1lbnRPdmVyZmxvdyA9IHVuZGVmaW5lZFxuICBtb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3MgPSBuZXcgQW5pbWF0ZWQuVmFsdWUoMClcbiAgbW9iaWxlT3B0aW9uc0NvbnRhaW5lclNjYWxlID0gdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3MuaW50ZXJwb2xhdGUoe1xuICAgIGlucHV0UmFuZ2U6IFswLCAxXSxcbiAgICBvdXRwdXRSYW5nZTogWzAuOTYsIDFdXG4gIH0pXG4gIG1vYmlsZU9wdGlvbnNDb250YWluZXJUcmFuc2xhdGVZID0gdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3MuaW50ZXJwb2xhdGUoe1xuICAgIGlucHV0UmFuZ2U6IFswLCAxXSxcbiAgICBvdXRwdXRSYW5nZTogWzIwLCAwXVxuICB9KVxuICBtb2JpbGVPcHRpb25zQ29udGFpbmVyVHJhbnNmb3JtID0gW1xuICAgIHt0cmFuc2xhdGVZOiB0aGlzLm1vYmlsZU9wdGlvbnNDb250YWluZXJUcmFuc2xhdGVZfSxcbiAgICB7c2NhbGU6IHRoaXMubW9iaWxlT3B0aW9uc0NvbnRhaW5lclNjYWxlfVxuICBdXG4gIG1vYmlsZU9wdGlvbnNDbG9zaW5nID0gZmFsc2VcbiAgb3B0aW9uR3JvdXBTdHlsaW5nRm9yID0gKHN0eWxpbmdOYW1lLCBzdHlsZSA9IHt9LCBjYWNoZXMgPSBbXSkgPT4gdGhpcy50dC5zdHlsaW5nRm9yKHN0eWxpbmdOYW1lLCBzdHlsZSwgY2FjaGVzKVxuICBzZWFyY2hUZXh0VmFsdWUgPSBcIlwiXG4gIHNlYXJjaFRleHRJbnB1dFJlZiA9IGNyZWF0ZVJlZigpXG4gIHNlbGVjdENvbnRhaW5lclJlZiA9IGNyZWF0ZVJlZigpXG4gIHQgPSBDb25maWcuY3VycmVudCgpLmdldFVzZVRyYW5zbGF0ZSgpKCkudFxuICB3aW5kb3dXaWR0aCA9IERpbWVuc2lvbnMuZ2V0KFwid2luZG93XCIpLndpZHRoXG4gIHdpbmRvd0hlaWdodCA9IERpbWVuc2lvbnMuZ2V0KFwid2luZG93XCIpLmhlaWdodFxuICAvKiogQHR5cGUge0hheWFTZWxlY3RTdGF0ZX0gKi9cbiAgc3RhdGUgPSB7XG4gICAgY3VycmVudE9wdGlvbnM6IHRoaXMuZGVmYXVsdEN1cnJlbnRPcHRpb25zKCksXG4gICAgc2VsZWN0Q29udGFpbmVyTGF5b3V0OiBudWxsLFxuICAgIGVuZE9mU2VsZWN0TGF5b3V0OiBudWxsLFxuICAgIGhlaWdodDogbnVsbCxcbiAgICBsb2FkZWRPcHRpb25zOiB0aGlzLmRlZmF1bHRMb2FkZWRPcHRpb25zKCksXG4gICAgbG9hZE9wdGlvbnNBcHBsaWVkUmVxdWVzdElkOiAwLFxuICAgIGxvYWRPcHRpb25zUmVxdWVzdElkOiAwLFxuICAgIHBhZ2U6IDEsXG4gICAgcGFnZUlucHV0Rm9jdXNlZDogZmFsc2UsXG4gICAgcGFnZUlucHV0VmFsdWU6IFwiMVwiLFxuICAgIHBhZ2VTaXplOiBudWxsLFxuICAgIG9wZW5lZDogZmFsc2UsXG4gICAgb3B0aW9uc0NvbnRhaW5lckxheW91dDogbnVsbCxcbiAgICBvcHRpb25zUGxhY2VtZW50OiB1bmRlZmluZWQsXG4gICAgb3B0aW9uc1RvcDogdW5kZWZpbmVkLFxuICAgIG9wdGlvbnNWaXNpYmlsaXR5OiB1bmRlZmluZWQsXG4gICAgb3B0aW9uc1dpZHRoOiB1bmRlZmluZWQsXG4gICAgc2Nyb2xsTGVmdDogUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IDogbnVsbCxcbiAgICBzY3JvbGxUb3A6IFBsYXRmb3JtLk9TID09IFwid2ViXCIgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIDogbnVsbCxcbiAgICB0b3RhbENvdW50OiBudWxsLFxuICAgIHRvZ2dsZWQ6IHRoaXMuZGVmYXVsdFRvZ2dsZWQoKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtib29sZWFufSAqL1xuICBpc0RlYnVnRW5hYmxlZCA9ICgpID0+IEJvb2xlYW4odGhpcy5wLmRlYnVnKVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW2RldGFpbHNdXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgZGVidWdMb2cgPSAoZnVuY3Rpb25OYW1lLCBkZXRhaWxzID0gdW5kZWZpbmVkKSA9PiB7XG4gICAgaWYgKCF0aGlzLmlzRGVidWdFbmFibGVkKCkpIHJldHVyblxuXG4gICAgY29uc3QgYmFzZURldGFpbHMgPSB7XG4gICAgICBpZDogdGhpcy5wLmlkLFxuICAgICAgbmFtZTogdGhpcy5wLm5hbWVcbiAgICB9XG5cbiAgICBjb25zdCBtZXJnZWREZXRhaWxzID0gZGV0YWlscyA/IE9iamVjdC5hc3NpZ24oe30sIGJhc2VEZXRhaWxzLCBkZXRhaWxzKSA6IGJhc2VEZXRhaWxzXG5cbiAgICBpZiAobWVyZ2VkRGV0YWlscyAmJiBPYmplY3Qua2V5cyhtZXJnZWREZXRhaWxzKS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0hheWFTZWxlY3RdICR7ZnVuY3Rpb25OYW1lfWAsIG1lcmdlZERldGFpbHMpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbSGF5YVNlbGVjdF0gJHtmdW5jdGlvbk5hbWV9YClcbiAgICB9XG4gIH1cblxuICBzZXR1cCgpIHtcbiAgICBjb25zdCB7dH0gPSBDb25maWcuY3VycmVudCgpLmdldFVzZVRyYW5zbGF0ZSgpKClcblxuICAgIHRoaXMudCA9IHRcblxuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMucHJvcHMudmFsdWVzKSkge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiB0aGlzLnByb3BzLnZhbHVlcykge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIYXlhU2VsZWN0OiBVbmRlZmluZWQgZ2l2ZW4gYXMgdmFsdWVcIilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHdpbmRvd1RhcmdldCA9IFBsYXRmb3JtLk9TID09IFwid2ViXCIgJiYgdHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogbnVsbFxuXG4gICAgdXNlRXZlbnRMaXN0ZW5lcihEaW1lbnNpb25zLCBcImNoYW5nZVwiLCB0aGlzLnR0Lm9uRGltZW5zaW9uc0NoYW5nZSlcbiAgICB1c2VQcmVzc091dHNpZGUodGhpcy50dC5vcHRpb25zQ29udGFpbmVyUmVmLCB0aGlzLnR0Lm9uUHJlc3NPdXRzaWRlT3B0aW9ucylcbiAgICB1c2VFdmVudExpc3RlbmVyKHdpbmRvd1RhcmdldCwgXCJyZXNpemVcIiwgdGhpcy50dC5vbkFueXRoaW5nUmVzaXplZERlYm91bmNlZClcbiAgICB1c2VFdmVudExpc3RlbmVyKHdpbmRvd1RhcmdldCwgXCJzY3JvbGxcIiwgdGhpcy50dC5vbkFueXRoaW5nU2Nyb2xsZWREZWJvdW5jZWQpXG5cbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwic2V0dXBcIiwge1xuICAgICAgaGFzQ29udHJvbGxlZFZhbHVlczogXCJ2YWx1ZXNcIiBpbiB0aGlzLnByb3BzLFxuICAgICAgaGFzQ29udHJvbGxlZFRvZ2dsZWQ6IFwidG9nZ2xlZFwiIGluIHRoaXMucHJvcHMsXG4gICAgICBjbG9zZU9uQ2hhbmdlOiB0aGlzLnAuY2xvc2VPbkNoYW5nZSxcbiAgICAgIG11bHRpcGxlOiB0aGlzLnAubXVsdGlwbGUsXG4gICAgICBvcHRpb25zVHlwZTogQXJyYXkuaXNBcnJheSh0aGlzLnByb3BzLm9wdGlvbnMpID8gXCJhcnJheVwiIDogdHlwZW9mIHRoaXMucHJvcHMub3B0aW9uc1xuICAgIH0pXG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudHQuY2FsbE9wdGlvbnNQb3NpdGlvbkFib3ZlSWZPdXRzaWRlU2NyZWVuICYmIHRoaXMucy5vcHRpb25zQ29udGFpbmVyTGF5b3V0KSB7XG4gICAgICAgIHRoaXMuY2FsbE9wdGlvbnNQb3NpdGlvbkFib3ZlSWZPdXRzaWRlU2NyZWVuID0gZmFsc2VcbiAgICAgICAgdGhpcy5zZXRPcHRpb25zUG9zaXRpb25BYm92ZUlmT3V0c2lkZVNjcmVlbigpXG4gICAgICB9XG4gICAgfSwgW3RoaXMudHQuY2FsbE9wdGlvbnNQb3NpdGlvbkFib3ZlSWZPdXRzaWRlU2NyZWVuLCB0aGlzLnMub3B0aW9uc0NvbnRhaW5lckxheW91dF0pXG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudE9wdGlvbklkcyA9IHRoaXMucy5jdXJyZW50T3B0aW9ucz8ubWFwKChjdXJyZW50T3B0aW9uKSA9PiBjdXJyZW50T3B0aW9uLnZhbHVlKVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLnByb3BzLnZhbHVlcykgJiYgYW55dGhpbmdEaWZmZXJlbnQoY3VycmVudE9wdGlvbklkcywgdGhpcy5wcm9wcy52YWx1ZXMpICYmIHR5cGVvZiB0aGlzLnByb3BzLm9wdGlvbnMgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXMuc2V0Q3VycmVudEZyb21HaXZlblZhbHVlcygpXG4gICAgICB9XG4gICAgfSwgW3RoaXMucHJvcHMudmFsdWVzXSlcbiAgfVxuXG4gIHRyYW5zbGF0ZShtc2dJRCwgb3B0aW9ucykge1xuICAgIGlmIChtc2dJRC5zdGFydHNXaXRoKFwiLlwiKSkge1xuICAgICAgcmV0dXJuIHRoaXMudChgaGF5YV9zZWxlY3Qke21zZ0lEfWAsIG9wdGlvbnMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnQobXNnSUQsIG9wdGlvbnMpXG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtBcnJheTxIYXlhU2VsZWN0T3B0aW9uPn0gKi9cbiAgZGVmYXVsdEN1cnJlbnRPcHRpb25zKCkge1xuICAgIGNvbnN0IHtkZWZhdWx0VmFsdWUsIGRlZmF1bHRWYWx1ZXMsIHZhbHVlc30gPSB0aGlzLnByb3BzXG4gICAgY29uc3Qge29wdGlvbnN9ID0gdGhpcy5wXG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucykpIHJldHVybiBbXVxuICAgIGNvbnN0IGNvbnRyb2xsZWRWYWx1ZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlcykgPyB2YWx1ZXMgOiBbXVxuXG4gICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyKCh7dmFsdWV9KSA9PlxuICAgICAgKGRlZmF1bHRWYWx1ZSAmJiB2YWx1ZSA9PSBkZWZhdWx0VmFsdWUpIHx8XG4gICAgICAgIChkZWZhdWx0VmFsdWVzICYmIGRlZmF1bHRWYWx1ZXMuaW5jbHVkZXModmFsdWUpKSB8fFxuICAgICAgICBjb250cm9sbGVkVmFsdWVzLmluY2x1ZGVzKHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj58dW5kZWZpbmVkfSAqL1xuICBkZWZhdWx0TG9hZGVkT3B0aW9ucygpIHtcbiAgICBjb25zdCB7b3B0aW9uc30gPSB0aGlzLnBcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIHJldHVybiBvcHRpb25zXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHR5cGUgb2Ygb3B0aW9uczogJHt0eXBlb2Ygb3B0aW9uc31gKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtudW1iZXJ9ICovXG4gIGdldEFjdGl2ZVBhZ2UgPSAoKSA9PiB0aGlzLnMucGFnZSB8fCAxXG5cbiAgLyoqIEByZXR1cm5zIHtib29sZWFufSAqL1xuICBpc01vYmlsZU9wdGlvbnNTaGVldCgpIHtcbiAgICBpZiAodGhpcy5wLm1vYmlsZU9wdGlvbnNNb2RlID09IFwiYWx3YXlzXCIpIHJldHVybiB0cnVlXG4gICAgaWYgKHRoaXMucC5tb2JpbGVPcHRpb25zTW9kZSA9PSBcIm5ldmVyXCIpIHJldHVybiBmYWxzZVxuXG4gICAgcmV0dXJuIERpbWVuc2lvbnMuZ2V0KFwid2luZG93XCIpLndpZHRoIDw9IE1PQklMRV9PUFRJT05TX01BWF9XSURUSFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj58SGF5YVNlbGVjdE9wdGlvbnNSZXN1bHR9IHJlc3VsdFxuICAgKiBAcmV0dXJucyB7SGF5YVNlbGVjdE9wdGlvbnNSZXN1bHR9XG4gICAqL1xuICBwYXJzZU9wdGlvbnNSZXN1bHQocmVzdWx0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0KSkgcmV0dXJuIHtvcHRpb25zOiByZXN1bHR9XG5cbiAgICBpZiAocmVzdWx0ICYmIEFycmF5LmlzQXJyYXkocmVzdWx0Lm9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcHRpb25zOiByZXN1bHQub3B0aW9ucyxcbiAgICAgICAgdG90YWxDb3VudDogcmVzdWx0LnRvdGFsQ291bnQsXG4gICAgICAgIHBhZ2U6IHJlc3VsdC5wYWdlLFxuICAgICAgICBwYWdlU2l6ZTogcmVzdWx0LnBhZ2VTaXplXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIG9wdGlvbnMgcmVzdWx0OiAke0pTT04uc3RyaW5naWZ5KHJlc3VsdCl9YClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAqIEBwYXJhbSB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj59IHBhcmFtcy5vcHRpb25zXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcGFyYW1zLnBhZ2VdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcGFyYW1zLnBhZ2VTaXplXVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3BhcmFtcy50b3RhbENvdW50XVxuICAgKiBAcmV0dXJucyB7bnVtYmVyfG51bGx9XG4gICAqL1xuICByZXNvbHZlUGFnZVNpemUoe29wdGlvbnMsIHBhZ2UsIHBhZ2VTaXplLCB0b3RhbENvdW50fSkge1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFnZVNpemUpICYmIHBhZ2VTaXplID4gMCkgcmV0dXJuIHBhZ2VTaXplXG5cbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHRoaXMucy5wYWdlU2l6ZSkgJiYgdGhpcy5zLnBhZ2VTaXplID4gMCAmJiBwYWdlICE9IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLnMucGFnZVNpemVcbiAgICB9XG5cbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHRvdGFsQ291bnQpICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucykgJiYgb3B0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5sZW5ndGhcbiAgICB9XG5cbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHRoaXMucy5wYWdlU2l6ZSkgJiYgdGhpcy5zLnBhZ2VTaXplID4gMCA/IHRoaXMucy5wYWdlU2l6ZSA6IG51bGxcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZ3xudW1iZXIsIHN0cmluZz59ICovXG4gIGRlZmF1bHRUb2dnbGVkKCkge1xuICAgIHJldHVybiAoXCJ0b2dnbGVkXCIgaW4gdGhpcy5wcm9wcykgPyB0aGlzLnAudG9nZ2xlZCA6IHRoaXMucHJvcHMuZGVmYXVsdFRvZ2dsZWQgfHwge31cbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7c3RyaW5nfSAqL1xuICBwb3J0YWxOYW1lKCkge1xuICAgIHJldHVybiBuYW1lRm9yQ29tcG9uZW50V2l0aE11bHRpcGxlKHRoaXMpIHx8IGBoYXlhLXNlbGVjdC0ke1N0cmluZyhpZEZvckNvbXBvbmVudCh0aGlzKSl9YFxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nfG51bWJlciwgc3RyaW5nPn0gKi9cbiAgZ2V0VG9nZ2xlZCA9ICgpID0+IChcInRvZ2dsZWRcIiBpbiB0aGlzLnByb3BzKSA/IHRoaXMucC50b2dnbGVkIDogdGhpcy5zLnRvZ2dsZWRcblxuICAvKiogQHJldHVybnMge0FycmF5PHN0cmluZ3xudW1iZXI+fSAqL1xuICBnZXRWYWx1ZXMgPSAoKSA9PiAoXCJ2YWx1ZXNcIiBpbiB0aGlzLnByb3BzKVxuICAgID8gKEFycmF5LmlzQXJyYXkodGhpcy5wLnZhbHVlcykgPyB0aGlzLnAudmFsdWVzIDogW10pXG4gICAgOiAoQXJyYXkuaXNBcnJheSh0aGlzLnMuY3VycmVudE9wdGlvbnMpID8gdGhpcy5zLmN1cnJlbnRPcHRpb25zIDogW10pLm1hcCgoY3VycmVudE9wdGlvbikgPT4gY3VycmVudE9wdGlvbi52YWx1ZSlcblxuICAvKiogQHJldHVybnMge0FycmF5PEhheWFTZWxlY3RPcHRpb258e3ZhbHVlOiBzdHJpbmd8bnVtYmVyfT59ICovXG4gIGdldEN1cnJlbnRPcHRpb25zID0gKCkgPT4ge1xuICAgIGlmIChcInZhbHVlc1wiIGluIHRoaXMucHJvcHMgJiYgdHlwZW9mIHRoaXMucHJvcHMudmFsdWVzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMucC52YWx1ZXMpICYmIHRoaXMucC52YWx1ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gW11cblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5wcm9wcy5vcHRpb25zKSAmJiBBcnJheS5pc0FycmF5KHRoaXMucC52YWx1ZXMpKSB7XG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXk8SGF5YVNlbGVjdE9wdGlvbj59ICovXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdXG5cbiAgICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiB0aGlzLnAudmFsdWVzKSB7XG4gICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5wLm9wdGlvbnMuZmluZCgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT0gdmFsdWUpXG5cbiAgICAgICAgICBpZiAob3B0aW9uKSByZXN1bHQucHVzaChvcHRpb24pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9IGVsc2UgaWYgKHRoaXMucy5sb2FkZWRPcHRpb25zICYmIEFycmF5LmlzQXJyYXkodGhpcy5wLnZhbHVlcykpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheTxIYXlhU2VsZWN0T3B0aW9uPn0gKi9cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW11cblxuICAgICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHRoaXMucC52YWx1ZXMpIHtcbiAgICAgICAgICBjb25zdCBvcHRpb24gPVxuICAgICAgICAgICAgdGhpcy5zLmxvYWRlZE9wdGlvbnMuZmluZCgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT0gdmFsdWUpIHx8XG4gICAgICAgICAgICB0aGlzLnMuY3VycmVudE9wdGlvbnMuZmluZCgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT0gdmFsdWUpXG5cbiAgICAgICAgICBpZiAob3B0aW9uKSByZXN1bHQucHVzaChvcHRpb24pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnByb3BzLm9wdGlvbnMgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIE9wdGlvbnMgaGF2ZW4ndCBiZWVuIGxvYWRlZCB5ZXQuXG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5wLnZhbHVlcykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucC52YWx1ZXMubWFwKCh2YWx1ZSkgPT4gKHt2YWx1ZX0pKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnMuY3VycmVudE9wdGlvbnNcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nfG51bWJlcj59ICovXG4gIGdldEN1cnJlbnRPcHRpb25WYWx1ZXMoKSB7XG4gICAgaWYgKFwidmFsdWVzXCIgaW4gdGhpcy5wcm9wcykge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGhpcy5wLnZhbHVlcykgPyB0aGlzLnAudmFsdWVzIDogW11cbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50T3B0aW9ucyA9IHRoaXMuZ2V0Q3VycmVudE9wdGlvbnMoKVxuXG4gICAgaWYgKCFjdXJyZW50T3B0aW9ucykgcmV0dXJuIFtdXG5cbiAgICByZXR1cm4gY3VycmVudE9wdGlvbnNcbiAgICAgIC5tYXAoKG9wdGlvbikgPT4gb3B0aW9uPy52YWx1ZSlcbiAgICAgIC5maWx0ZXIoKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgIT0gXCJ1bmRlZmluZWRcIilcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGUsIGRlZmF1bHRWYWx1ZSwgZGVmYXVsdFZhbHVlcywgZGVmYXVsdFZhbHVlc0Zyb21PcHRpb25zLCBtb2RlbCwgb3B0aW9uc30gPSB0aGlzLnByb3BzXG5cbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwiY29tcG9uZW50RGlkTW91bnRcIiwge1xuICAgICAgaGFzQXR0cmlidXRlTW9kZWw6IEJvb2xlYW4oYXR0cmlidXRlICYmIG1vZGVsKSxcbiAgICAgIGhhc0RlZmF1bHRWYWx1ZXM6IEJvb2xlYW4oZGVmYXVsdFZhbHVlIHx8IGRlZmF1bHRWYWx1ZXMgfHwgZGVmYXVsdFZhbHVlc0Zyb21PcHRpb25zKSxcbiAgICAgIG9wdGlvbnNUeXBlOiB0eXBlb2Ygb3B0aW9uc1xuICAgIH0pXG5cbiAgICBpZiAoKChkZWZhdWx0VmFsdWUgfHwgZGVmYXVsdFZhbHVlcyB8fCBkZWZhdWx0VmFsdWVzRnJvbU9wdGlvbnMpIHx8IChhdHRyaWJ1dGUgJiYgbW9kZWwpKSAmJiB0eXBlb2Ygb3B0aW9ucyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMubG9hZERlZmF1bHRWYWx1ZXNGcm9tT3B0aW9uc0NhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgY29uc3QgbmV3U3RhdGUgPSB7fVxuXG4gICAgaWYgKFwidG9nZ2xlZFwiIGluIHRoaXMucHJvcHMpIHtcbiAgICAgIGNvbnN0IG5ld1RvZ2dsZWQgPSB0aGlzLnAudG9nZ2xlZFxuXG4gICAgICBpZiAoYW55dGhpbmdEaWZmZXJlbnQodGhpcy5zdGF0ZS50b2dnbGVkLCBuZXdUb2dnbGVkKSkge1xuICAgICAgICBuZXdTdGF0ZS50b2dnbGVkID0gbmV3VG9nZ2xlZFxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3Qua2V5cyhuZXdTdGF0ZSkubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcImNvbXBvbmVudERpZFVwZGF0ZVwiLCB7c3luY2luZ0tleXM6IE9iamVjdC5rZXlzKG5ld1N0YXRlKX0pXG4gICAgICB0aGlzLnMudG9nZ2xlZCA9IG5ld1N0YXRlLnRvZ2dsZWRcbiAgICB9XG5cbiAgICB0aGlzLnN5bmNPcHRpb25zUGxhY2VtZW50V2l0aE1vZGUoKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLm1vYmlsZU9wdGlvbnNCYWNrZHJvcE9wYWNpdHkuc3RvcEFuaW1hdGlvbigpXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3Muc3RvcEFuaW1hdGlvbigpXG4gICAgdGhpcy51bmxvY2tCb2R5U2Nyb2xsKClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7aW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlfSAqL1xuICByZW5kZXIoKSB7XG4gICAgY29uc3Qge2VuZE9mU2VsZWN0UmVmfSA9IHRoaXMudHRcbiAgICBjb25zdCB7dHJhbnNwYXJlbnR9ID0gdGhpcy5wXG4gICAgY29uc3Qge2NsYXNzTmFtZSwgcGxhY2Vob2xkZXIsIHRvZ2dsZU9wdGlvbnN9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHZhbHVlcyA9IEFycmF5LmlzQXJyYXkodGhpcy5wcm9wcy52YWx1ZXMpID8gdGhpcy5wcm9wcy52YWx1ZXMgOiBbXVxuICAgIGNvbnN0IHtvcGVuZWQsIG9wdGlvbnNQbGFjZW1lbnR9ID0gdGhpcy5zXG4gICAgY29uc3QgY3VycmVudE9wdGlvbnMgPSB0aGlzLmdldEN1cnJlbnRPcHRpb25zKClcbiAgICBjb25zdCBpZCA9IGlkRm9yQ29tcG9uZW50KHRoaXMpXG4gICAgY29uc3QgbW9iaWxlT3B0aW9uc1NoZWV0ID0gdGhpcy5pc01vYmlsZU9wdGlvbnNTaGVldCgpXG5cbiAgICBjb25zdCBzZWxlY3RDb250YWluZXJTdHlsZUFjdHVhbCA9IHsuLi50aGlzLnN0eWxpbmdGb3IoXCJzZWxlY3RDb250YWluZXJcIiwge1xuICAgICAgZmxleERpcmVjdGlvbjogXCJyb3dcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRyYW5zcGFyZW50ID8gdW5kZWZpbmVkIDogXCIjZmZmXCIsXG4gICAgICBib3JkZXJDb2xvcjogdHJhbnNwYXJlbnQgPyB1bmRlZmluZWQgOiBcIiM5OTlcIixcbiAgICAgIGJvcmRlclJhZGl1czogdHJhbnNwYXJlbnQgPyB1bmRlZmluZWQgOiA0LFxuICAgICAgYm9yZGVyV2lkdGg6IHRyYW5zcGFyZW50ID8gdW5kZWZpbmVkIDogMSxcbiAgICAgIGNvbG9yOiBcIiMwMDBcIixcbiAgICAgIGN1cnNvcjogUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiA/IFwicG9pbnRlclwiIDogdW5kZWZpbmVkLFxuICAgICAgcGFkZGluZ1RvcDogNSxcbiAgICAgIHBhZGRpbmdCb3R0b206IDUsXG4gICAgICBwYWRkaW5nTGVmdDogNVxuICAgIH0sIFt0cmFuc3BhcmVudF0pfVxuXG4gICAgaWYgKG9wZW5lZCAmJiAhbW9iaWxlT3B0aW9uc1NoZWV0KSB7XG4gICAgICAvLyBQcmV2ZW50IHNlbGVjdCBmcm9tIGNoYW5naW5nIHNpemUgb25jZSB0aGUgY29udGVudCBpcyByZXBsYWNlZCB3aXRoIHNlYXJjaCB0ZXh0IG9uY2Ugb3BlbmVkXG4gICAgICBzZWxlY3RDb250YWluZXJTdHlsZUFjdHVhbC5oZWlnaHQgPSB0aGlzLnMuaGVpZ2h0XG5cbiAgICAgIGNvbnN0IGJhc2VCb3JkZXJSYWRpdXMgPSBzZWxlY3RDb250YWluZXJTdHlsZUFjdHVhbC5ib3JkZXJSYWRpdXNcblxuICAgICAgaWYgKG9wdGlvbnNQbGFjZW1lbnQgPT0gXCJhYm92ZVwiKSB7XG4gICAgICAgIHNlbGVjdENvbnRhaW5lclN0eWxlQWN0dWFsLmJvcmRlclRvcExlZnRSYWRpdXMgPSAwXG4gICAgICAgIHNlbGVjdENvbnRhaW5lclN0eWxlQWN0dWFsLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gMFxuICAgICAgICBzZWxlY3RDb250YWluZXJTdHlsZUFjdHVhbC5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IGJhc2VCb3JkZXJSYWRpdXNcbiAgICAgICAgc2VsZWN0Q29udGFpbmVyU3R5bGVBY3R1YWwuYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IGJhc2VCb3JkZXJSYWRpdXNcblxuICAgICAgICBkZWxldGUgc2VsZWN0Q29udGFpbmVyU3R5bGVBY3R1YWwuYm9yZGVyUmFkaXVzXG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnNQbGFjZW1lbnQgPT0gXCJiZWxvd1wiKSB7XG4gICAgICAgIHNlbGVjdENvbnRhaW5lclN0eWxlQWN0dWFsLmJvcmRlclRvcExlZnRSYWRpdXMgPSBiYXNlQm9yZGVyUmFkaXVzXG4gICAgICAgIHNlbGVjdENvbnRhaW5lclN0eWxlQWN0dWFsLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gYmFzZUJvcmRlclJhZGl1c1xuICAgICAgICBzZWxlY3RDb250YWluZXJTdHlsZUFjdHVhbC5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IDBcbiAgICAgICAgc2VsZWN0Q29udGFpbmVyU3R5bGVBY3R1YWwuYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IDBcblxuICAgICAgICBkZWxldGUgc2VsZWN0Q29udGFpbmVyU3R5bGVBY3R1YWwuYm9yZGVyUmFkaXVzXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxWaWV3XG4gICAgICAgIGRhdGFTZXQ9e3RoaXMuY2FjaGUoXCJyb290Vmlld0RhdGFTZXRcIiwge1xuICAgICAgICAgIGFwcGxpZWRSZXF1ZXN0SWQ6IHRoaXMucy5sb2FkT3B0aW9uc0FwcGxpZWRSZXF1ZXN0SWQsXG4gICAgICAgICAgY2xhc3M6IGNsYXNzTmFtZSxcbiAgICAgICAgICBjb21wb25lbnQ6IFwiaGF5YS1zZWxlY3RcIixcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBvcGVuZWQsXG4gICAgICAgICAgb3B0aW9uc1BsYWNlbWVudCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IHRoaXMucy5sb2FkT3B0aW9uc1JlcXVlc3RJZCxcbiAgICAgICAgICB0b2dnbGVzOiBCb29sZWFuKHRvZ2dsZU9wdGlvbnMpXG4gICAgICAgIH0sIFt0aGlzLnMubG9hZE9wdGlvbnNBcHBsaWVkUmVxdWVzdElkLCBjbGFzc05hbWUsIGlkLCBvcGVuZWQsIG9wdGlvbnNQbGFjZW1lbnQsIHRoaXMucy5sb2FkT3B0aW9uc1JlcXVlc3RJZCwgQm9vbGVhbih0b2dnbGVPcHRpb25zKV0pfVxuICAgICAgICBzdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwibWFpblwiKX1cbiAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3RcIlxuICAgICAgPlxuICAgICAgICA8UHJlc3NhYmxlXG4gICAgICAgICAgb25MYXlvdXQ9e3RoaXMudHQub25TZWxlY3RDb250YWluZXJMYXlvdXR9XG4gICAgICAgICAgb25QcmVzcz17dGhpcy50dC5vblNlbGVjdENsaWNrZWR9XG4gICAgICAgICAgcmVmPXt0aGlzLnR0LnNlbGVjdENvbnRhaW5lclJlZn1cbiAgICAgICAgICBzdHlsZT17c2VsZWN0Q29udGFpbmVyU3R5bGVBY3R1YWx9XG4gICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3Qvc2VsZWN0LWNvbnRhaW5lclwiXG4gICAgICAgID5cbiAgICAgICAgICA8Vmlld1xuICAgICAgICAgICAgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcImN1cnJlbnRTZWxlY3RlZFwiLCB0aGlzLmN1cnJlbnRTZWxlY3RlZFN0eWxlIHx8PSB7ZmxleDogMSwgZmxleFdyYXA6IFwid3JhcFwiLCBvdmVyZmxvdzogXCJoaWRkZW5cIn0pfVxuICAgICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvY3VycmVudC1zZWxlY3RlZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge29wZW5lZCAmJiAhbW9iaWxlT3B0aW9uc1NoZWV0ICYmXG4gICAgICAgICAgICAgIHRoaXMuc2VhcmNoVGV4dElucHV0KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHsoIW9wZW5lZCB8fCBtb2JpbGVPcHRpb25zU2hlZXQpICYmXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAge2N1cnJlbnRPcHRpb25zLmxlbmd0aCA9PSAwICYmXG4gICAgICAgICAgICAgICAgICA8VGV4dCBudW1iZXJPZkxpbmVzPXsxfSBzdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwibm90aGluZ1NlbGVjdGVkXCIsIHRoaXMubm90aGluZ1NlbGVjdGVkU3R5bGUgfHw9IHtjb2xvcjogXCJncmV5XCJ9KX0+XG4gICAgICAgICAgICAgICAgICAgIHtwbGFjZWhvbGRlciB8fCB0aGlzLnRyYW5zbGF0ZShcIi5ub3RoaW5nX3NlbGVjdGVkXCIpfVxuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB7Y3VycmVudE9wdGlvbnMubGVuZ3RoID09IDAgJiYgUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiAmJlxuICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgKHRoaXMucC5tdWx0aXBsZSA/IHZhbHVlcyA6IFt2YWx1ZXNbMF1dKS5tYXAoKHZhbHVlKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9e2lkRm9yQ29tcG9uZW50KHRoaXMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2BjdXJyZW50LXZhbHVlLSR7dmFsdWV9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17bmFtZUZvckNvbXBvbmVudFdpdGhNdWx0aXBsZSh0aGlzKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImhpZGRlblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB7dmFsdWVzLmxlbmd0aCA9PSAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD17aWRGb3JDb21wb25lbnQodGhpcyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lPXtuYW1lRm9yQ29tcG9uZW50V2l0aE11bHRpcGxlKHRoaXMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImhpZGRlblwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT1cIlwiXG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHtjdXJyZW50T3B0aW9ucy5tYXAoKGN1cnJlbnRPcHRpb24pID0+XG4gICAgICAgICAgICAgICAgICA8Vmlld1xuICAgICAgICAgICAgICAgICAgICBrZXk9e2N1cnJlbnRPcHRpb24ua2V5IHx8IGBjdXJyZW50LXZhbHVlLSR7Y3VycmVudE9wdGlvbi52YWx1ZX1gfVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwiY3VycmVudE9wdGlvblwiLCB7bWFyZ2luUmlnaHQ6IDZ9KX1cbiAgICAgICAgICAgICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvY3VycmVudC1vcHRpb25cIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7Y3VycmVudE9wdGlvbi50eXBlID09IFwiZ3JvdXBcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgIDxWaWV3IHN0eWxlPXt0aGlzLnN0eWxpbmdGb3IoXCJjdXJyZW50T3B0aW9uR3JvdXBcIiwgdGhpcy5jdXJyZW50T3B0aW9uR3JvdXBTdHlsZSB8fD0ge2ZvbnRXZWlnaHQ6IFwiYm9sZFwifSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcImN1cnJlbnRPcHRpb25Hcm91cFRleHRcIil9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y3VycmVudE9wdGlvbi50ZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB7Y3VycmVudE9wdGlvbi50eXBlICE9IFwiZ3JvdXBcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICB7UGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiAmJiBuYW1lRm9yQ29tcG9uZW50V2l0aE11bHRpcGxlKHRoaXMpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPXtpZEZvckNvbXBvbmVudCh0aGlzKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPXtuYW1lRm9yQ29tcG9uZW50V2l0aE11bHRpcGxlKHRoaXMpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtkaWdnKGN1cnJlbnRPcHRpb24sIFwidmFsdWVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5wcmVzZW50T3B0aW9uKGN1cnJlbnRPcHRpb24sIFwiY3VycmVudFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgPC9WaWV3PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgfVxuICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgICA8Vmlld1xuICAgICAgICAgICAgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcImNoZXZyb25Db250YWluZXJcIiwgdGhpcy5jaGV2cm9uQ29udGFpbmVyU3R5bGUgfHw9IHtcbiAgICAgICAgICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICAgICAgICAgIG1hcmdpbkxlZnQ6IFwiYXV0b1wiLFxuICAgICAgICAgICAgICBtYXJnaW5SaWdodDogOFxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9jaGV2cm9uLWNvbnRhaW5lclwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEZvbnRBd2Vzb21lSWNvbiBuYW1lPXtvcGVuZWQgPyBcImNoZXZyb24tdXBcIiA6IFwiY2hldnJvbi1kb3duXCJ9IHN0eWxlPXt0aGlzLnN0eWxpbmdGb3IoXCJjaGV2cm9uXCIsIHRoaXMuY2hldnJvblN0eWxlIHx8PSB7Zm9udFNpemU6IDEyfSl9IC8+XG4gICAgICAgICAgPC9WaWV3PlxuICAgICAgICA8L1ByZXNzYWJsZT5cbiAgICAgICAgPFZpZXdcbiAgICAgICAgICBvbkxheW91dD17dGhpcy50dC5vbkVuZE9mU2VsZWN0TGF5b3V0fVxuICAgICAgICAgIHJlZj17ZW5kT2ZTZWxlY3RSZWZ9XG4gICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvZW5kLW9mLXNlbGVjdFwiXG4gICAgICAgIC8+XG4gICAgICAgIHtvcGVuZWQgJiYgdGhpcy5wLm9wdGlvbnNQb3J0YWwgJiZcbiAgICAgICAgICA8UG9ydGFsIG5hbWU9e3RoaXMucG9ydGFsTmFtZSgpfT5cbiAgICAgICAgICAgIHt0aGlzLm9wdGlvbnNDb250YWluZXIoKX1cbiAgICAgICAgICA8L1BvcnRhbD5cbiAgICAgICAgfVxuICAgICAgICB7b3BlbmVkICYmICF0aGlzLnAub3B0aW9uc1BvcnRhbCAmJlxuICAgICAgICAgIDxWaWV3PlxuICAgICAgICAgICAge3RoaXMub3B0aW9uc0NvbnRhaW5lcigpfVxuICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgfVxuICAgICAgPC9WaWV3PlxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3ttb2JpbGVPcHRpb25zU2hlZXQ/OiBib29sZWFufX0gW3BhcmFtc11cbiAgICogQHJldHVybnMge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX1cbiAgICovXG4gIHNlYXJjaFRleHRJbnB1dCh7bW9iaWxlT3B0aW9uc1NoZWV0ID0gZmFsc2V9ID0ge30pIHtcbiAgICBjb25zdCBpb3NMaWtlTW9iaWxlU2hlZXQgPSBtb2JpbGVPcHRpb25zU2hlZXQgJiYgaXNJT1NMaWtlUGxhdGZvcm0oKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxUZXh0SW5wdXRcbiAgICAgICAgZGVmYXVsdFZhbHVlPXt0aGlzLnNlYXJjaFRleHRWYWx1ZX1cbiAgICAgICAgb25DaGFuZ2VUZXh0PXt0aGlzLnR0Lm9uQ2hhbmdlU2VhcmNoVGV4dH1cbiAgICAgICAgcGxhY2Vob2xkZXI9e3RoaXMudHJhbnNsYXRlKFwiLnNlYXJjaF9kb3RfZG90X2RvdFwiKX1cbiAgICAgICAgcmVmPXt0aGlzLnR0LnNlYXJjaFRleHRJbnB1dFJlZn1cbiAgICAgICAgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcInNlYXJjaFRleHRJbnB1dFwiLCBzdHlsZXNbYHNlYXJjaFRleHRJbnB1dC0ke2lvc0xpa2VNb2JpbGVTaGVldH1gXSB8fD0ge1xuICAgICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgICAgICBib3JkZXJXaWR0aDogMCxcbiAgICAgICAgICBmb250U2l6ZTogaW9zTGlrZU1vYmlsZVNoZWV0ID8gMTYgOiB1bmRlZmluZWQsXG4gICAgICAgICAgb3V0bGluZTogUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiA/IFwibm9uZVwiIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHBhZGRpbmc6IDBcbiAgICAgICAgfSwgW2lvc0xpa2VNb2JpbGVTaGVldF0pfVxuICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9zZWFyY2gtaW5wdXRcIlxuICAgICAgICB7Li4udGhpcy5wLnNlYXJjaFRleHRJbnB1dFByb3BzfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICAvKiogQHJldHVybnMge0FycmF5PHN0cmluZ3xudW1iZXI+fHN0cmluZ3xudW1iZXJ8dW5kZWZpbmVkfSAqL1xuICBkZWZhdWx0VmFsdWVzICgpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlLCBkZWZhdWx0VmFsdWUsIGRlZmF1bHRWYWx1ZXMsIGRlZmF1bHRWYWx1ZXNGcm9tT3B0aW9ucywgbW9kZWx9ID0gdGhpcy5wcm9wc1xuXG4gICAgaWYgKGRlZmF1bHRWYWx1ZXNGcm9tT3B0aW9ucykgcmV0dXJuIGRlZmF1bHRWYWx1ZXNGcm9tT3B0aW9uc1xuICAgIGlmIChkZWZhdWx0VmFsdWUpIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgICBpZiAoZGVmYXVsdFZhbHVlcykgcmV0dXJuIGRlZmF1bHRWYWx1ZXNcblxuICAgIGlmIChhdHRyaWJ1dGUgJiYgbW9kZWwpIHtcbiAgICAgIGlmICghKGF0dHJpYnV0ZSBpbiBtb2RlbCkpIHRocm93IG5ldyBFcnJvcihgTm8gc3VjaCBhdHRyaWJ1dGUgb24gJHttb2RlbC5tb2RlbENsYXNzRGF0YSgpLm5hbWV9OiAke2F0dHJpYnV0ZX1gKVxuXG4gICAgICByZXR1cm4gbW9kZWxbYXR0cmlidXRlXSgpXG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtib29sZWFufSAqL1xuICBpc0FjdGl2ZSgpIHtcbiAgICBpZiAodGhpcy50dC5lbmRPZlNlbGVjdFJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSAqL1xuICBhc3luYyBsb2FkRGVmYXVsdFZhbHVlc0Zyb21PcHRpb25zQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMuZGVmYXVsdFZhbHVlcygpXG5cbiAgICBpZiAoIWRlZmF1bHRWYWx1ZXMpIHJldHVyblxuXG4gICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcImxvYWREZWZhdWx0VmFsdWVzRnJvbU9wdGlvbnNDYWxsYmFja1wiLCB7ZGVmYXVsdFZhbHVlc30pXG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnByb3BzLm9wdGlvbnMoe1xuICAgICAgc2VhcmNoVmFsdWU6IHRoaXMuZ2V0U2VhcmNoVGV4dCgpLFxuICAgICAgcGFnZTogdGhpcy5nZXRBY3RpdmVQYWdlKCksXG4gICAgICB2YWx1ZXM6IGRlZmF1bHRWYWx1ZXNcbiAgICB9KVxuXG4gICAgY29uc3Qge29wdGlvbnN9ID0gdGhpcy5wYXJzZU9wdGlvbnNSZXN1bHQocmVzdWx0KVxuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJsb2FkRGVmYXVsdFZhbHVlc0Zyb21PcHRpb25zQ2FsbGJhY2sucmVzdWx0XCIsIHtsb2FkZWRPcHRpb25zQ291bnQ6IG9wdGlvbnM/Lmxlbmd0aCB8fCAwfSlcblxuICAgIHRoaXMucy5jdXJyZW50T3B0aW9ucyA9IHRoaXMuc3RhdGUuY3VycmVudE9wdGlvbnMuY29uY2F0KG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7cGFnZT86IG51bWJlcn19IFtwYXJhbXNdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgbG9hZE9wdGlvbnMgPSBhc3luYyAoe3BhZ2V9ID0ge30pID0+IHtcbiAgICBjb25zdCB7b3B0aW9uc30gPSB0aGlzLnBcbiAgICBjb25zdCBzZWFyY2hWYWx1ZSA9IHRoaXMuZ2V0U2VhcmNoVGV4dCgpXG4gICAgY29uc3QgcmVxdWVzdElkID0gKyt0aGlzLmxhdGVzdExvYWRPcHRpb25zUmVxdWVzdElkXG4gICAgdGhpcy5zLmxvYWRPcHRpb25zUmVxdWVzdElkID0gcmVxdWVzdElkXG4gICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcImxvYWRPcHRpb25zXCIsIHtcbiAgICAgIHBhZ2UsXG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBzZWFyY2hWYWx1ZSxcbiAgICAgIG9wdGlvbnNUeXBlOiBBcnJheS5pc0FycmF5KG9wdGlvbnMpID8gXCJhcnJheVwiIDogdHlwZW9mIG9wdGlvbnNcbiAgICB9KVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvYWRPcHRpb25zRnJvbUFycmF5KG9wdGlvbnMsIHNlYXJjaFZhbHVlLCByZXF1ZXN0SWQpXG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWVzdGVkUGFnZSA9IE51bWJlci5pc0Zpbml0ZShwYWdlKSA/IHBhZ2UgOiB0aGlzLmdldEFjdGl2ZVBhZ2UoKVxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGlvbnMoe3NlYXJjaFZhbHVlLCBwYWdlOiByZXF1ZXN0ZWRQYWdlfSlcbiAgICBjb25zdCB7b3B0aW9uczogbG9hZGVkT3B0aW9ucywgcGFnZTogcmVzdWx0UGFnZSwgcGFnZVNpemUsIHRvdGFsQ291bnR9ID0gdGhpcy5wYXJzZU9wdGlvbnNSZXN1bHQocmVzdWx0KVxuXG4gICAgaWYgKHJlcXVlc3RJZCAhPSB0aGlzLmxhdGVzdExvYWRPcHRpb25zUmVxdWVzdElkKSB7XG4gICAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwibG9hZE9wdGlvbnMuaWdub3JlZF9zdGFsZV9yZXN1bHRcIiwge1xuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgIGxhdGVzdExvYWRPcHRpb25zUmVxdWVzdElkOiB0aGlzLmxhdGVzdExvYWRPcHRpb25zUmVxdWVzdElkLFxuICAgICAgICByZXF1ZXN0ZWRQYWdlLFxuICAgICAgICBzZWFyY2hWYWx1ZVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgcmVzb2x2ZWRQYWdlID0gTnVtYmVyLmlzRmluaXRlKHJlc3VsdFBhZ2UpID8gcmVzdWx0UGFnZSA6IHJlcXVlc3RlZFBhZ2VcbiAgICBjb25zdCByZXNvbHZlZFBhZ2VTaXplID0gdGhpcy5yZXNvbHZlUGFnZVNpemUoe29wdGlvbnM6IGxvYWRlZE9wdGlvbnMsIHBhZ2U6IHJlc29sdmVkUGFnZSwgcGFnZVNpemUsIHRvdGFsQ291bnR9KVxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBOdW1iZXIuaXNGaW5pdGUodG90YWxDb3VudCkgJiYgTnVtYmVyLmlzRmluaXRlKHJlc29sdmVkUGFnZVNpemUpICYmIHJlc29sdmVkUGFnZVNpemUgPiAwXG4gICAgICA/IE1hdGguY2VpbCh0b3RhbENvdW50IC8gcmVzb2x2ZWRQYWdlU2l6ZSlcbiAgICAgIDogbnVsbFxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBsb2FkZWRPcHRpb25zLFxuICAgICAgbG9hZE9wdGlvbnNBcHBsaWVkUmVxdWVzdElkOiByZXF1ZXN0SWQsXG4gICAgICBwYWdlOiByZXNvbHZlZFBhZ2UsXG4gICAgICBwYWdlSW5wdXRWYWx1ZTogU3RyaW5nKHJlc29sdmVkUGFnZSksXG4gICAgICBwYWdlU2l6ZTogTnVtYmVyLmlzRmluaXRlKHRvdGFsQ291bnQpID8gcmVzb2x2ZWRQYWdlU2l6ZSA6IG51bGwsXG4gICAgICB0b3RhbENvdW50OiBOdW1iZXIuaXNGaW5pdGUodG90YWxDb3VudCkgPyB0b3RhbENvdW50IDogbnVsbFxuICAgIH0sICgpID0+IHRoaXMucHJvcHMub25PcHRpb25zTG9hZGVkPy4oe29wdGlvbnM6IGxvYWRlZE9wdGlvbnN9KSlcblxuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJsb2FkT3B0aW9ucy5yZXN1bHRcIiwge1xuICAgICAgbG9hZGVkT3B0aW9uc0NvdW50OiBsb2FkZWRPcHRpb25zPy5sZW5ndGggfHwgMCxcbiAgICAgIHJlc29sdmVkUGFnZSxcbiAgICAgIHJlc29sdmVkUGFnZVNpemUsXG4gICAgICB0b3RhbENvdW50OiBOdW1iZXIuaXNGaW5pdGUodG90YWxDb3VudCkgPyB0b3RhbENvdW50IDogbnVsbFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7a2V5OiBzdHJpbmcsIGxvYWRlZE9wdGlvbjogSGF5YVNlbGVjdE9wdGlvbn19XG4gICAqIEByZXR1cm5zIHtpbXBvcnQoXCJyZWFjdFwiKS5SZWFjdE5vZGV9XG4gICAqL1xuICBoYXlhU2VsZWN0T3B0aW9uKHtrZXksIGxvYWRlZE9wdGlvbn0pIHtcbiAgICBpZiAobG9hZGVkT3B0aW9uLnR5cGUgPT0gXCJncm91cFwiKSB7XG4gICAgICByZXR1cm4gPE9wdGlvbkdyb3VwIGtleT17a2V5fSBvcHRpb249e2xvYWRlZE9wdGlvbn0gc3R5bGluZ0Zvcj17dGhpcy50dC5vcHRpb25Hcm91cFN0eWxpbmdGb3J9IC8+XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxPcHRpb25cbiAgICAgICAgY3VycmVudE9wdGlvblZhbHVlcz17dGhpcy5nZXRDdXJyZW50T3B0aW9uVmFsdWVzKCl9XG4gICAgICAgIGljb249e3RoaXMuaWNvbkZvck9wdGlvbihsb2FkZWRPcHRpb24pfVxuICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgb3B0aW9uPXtsb2FkZWRPcHRpb259XG4gICAgICAgIG9uT3B0aW9uQ2xpY2tlZD17dGhpcy50dC5vbk9wdGlvbkNsaWNrZWR9XG4gICAgICAgIG9wdGlvbnNQbGFjZW1lbnQ9e3RoaXMucy5vcHRpb25zUGxhY2VtZW50fVxuICAgICAgICBwcmVzZW50T3B0aW9uPXt0aGlzLnR0LnByZXNlbnRPcHRpb259XG4gICAgICAgIHNlbGVjdGVkQmFja2dyb3VuZENvbG9yPXt0aGlzLnByb3BzLnNlbGVjdGVkQmFja2dyb3VuZENvbG9yfVxuICAgICAgICBzZWxlY3RlZEhvdmVyQmFja2dyb3VuZENvbG9yPXt0aGlzLnByb3BzLnNlbGVjdGVkSG92ZXJCYWNrZ3JvdW5kQ29sb3J9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PEhheWFTZWxlY3RPcHRpb24+fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbc2VhcmNoVmFsdWVdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcmVxdWVzdElkXVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGxvYWRPcHRpb25zRnJvbUFycmF5KG9wdGlvbnMsIHNlYXJjaFZhbHVlLCByZXF1ZXN0SWQgPSB0aGlzLmxhdGVzdExvYWRPcHRpb25zUmVxdWVzdElkKSB7XG4gICAgY29uc3QgbG93ZXJTZWFyY2hWYWx1ZSA9IHNlYXJjaFZhbHVlPy50b0xvd2VyQ2FzZSgpXG4gICAgY29uc3QgbG9hZGVkT3B0aW9ucyA9IG9wdGlvbnMuZmlsdGVyKCh7dGV4dH0pID0+ICFsb3dlclNlYXJjaFZhbHVlIHx8IHRleHQ/LnRvTG93ZXJDYXNlKCk/LmluY2x1ZGVzKGxvd2VyU2VhcmNoVmFsdWUpKVxuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJsb2FkT3B0aW9uc0Zyb21BcnJheVwiLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB0b3RhbE9wdGlvbnNDb3VudDogb3B0aW9ucy5sZW5ndGgsXG4gICAgICBzZWFyY2hWYWx1ZSxcbiAgICAgIGxvYWRlZE9wdGlvbnNDb3VudDogbG9hZGVkT3B0aW9ucy5sZW5ndGhcbiAgICB9KVxuXG4gICAgdGhpcy5zLmxvYWRlZE9wdGlvbnMgPSBsb2FkZWRPcHRpb25zXG4gICAgdGhpcy5zLmxvYWRPcHRpb25zQXBwbGllZFJlcXVlc3RJZCA9IHJlcXVlc3RJZFxuICAgIHRoaXMucy5wYWdlID0gMVxuICAgIHRoaXMucy5wYWdlSW5wdXRWYWx1ZSA9IFwiMVwiXG4gICAgdGhpcy5zLnBhZ2VTaXplID0gbnVsbFxuICAgIHRoaXMucy50b3RhbENvdW50ID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7e3dpbmRvdzoge3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX19IGV2ZW50XG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25EaW1lbnNpb25zQ2hhbmdlID0gKHt3aW5kb3d9KSA9PiB7XG4gICAgdGhpcy53aW5kb3dXaWR0aCA9IHdpbmRvdy53aWR0aFxuICAgIHRoaXMud2luZG93SGVpZ2h0ID0gd2luZG93LmhlaWdodFxuXG4gICAgaWYgKHRoaXMucy5vcGVuZWQpIHtcbiAgICAgIHRoaXMuc3luY09wdGlvbnNQbGFjZW1lbnRXaXRoTW9kZSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7e25hdGl2ZUV2ZW50Pzoge2xheW91dD86IEhheWFTZWxlY3RMYXlvdXR9fX0gZVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIG9uU2VsZWN0Q29udGFpbmVyTGF5b3V0ID0gKGUpID0+IHtcbiAgICB0aGlzLnMuc2VsZWN0Q29udGFpbmVyTGF5b3V0ID0gbm9ybWFsaXplTGF5b3V0KGRpZ2coZSwgXCJuYXRpdmVFdmVudFwiLCBcImxheW91dFwiKSlcbiAgICB0aGlzLm1lYXN1cmVOYXRpdmVMYXlvdXQodGhpcy50dC5zZWxlY3RDb250YWluZXJSZWYsIFwic2VsZWN0Q29udGFpbmVyTGF5b3V0XCIpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7bmF0aXZlRXZlbnQ/OiB7bGF5b3V0PzogSGF5YVNlbGVjdExheW91dH19fSBlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25FbmRPZlNlbGVjdExheW91dCA9IChlKSA9PiB7XG4gICAgY29uc3QgZW5kT2ZTZWxlY3RMYXlvdXQgPSBub3JtYWxpemVMYXlvdXQoZGlnZyhlLCBcIm5hdGl2ZUV2ZW50XCIsIFwibGF5b3V0XCIpKVxuICAgIGNvbnN0IG5ld1N0YXRlID0ge2VuZE9mU2VsZWN0TGF5b3V0fVxuXG4gICAgaWYgKHRoaXMucy5vcGVuZWQgJiYgZW5kT2ZTZWxlY3RMYXlvdXQ/LndpZHRoKSB7XG4gICAgICBuZXdTdGF0ZS5vcHRpb25zV2lkdGggPSBlbmRPZlNlbGVjdExheW91dC53aWR0aFxuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUsICgpID0+IHtcbiAgICAgIHRoaXMubWVhc3VyZU5hdGl2ZUxheW91dCh0aGlzLnR0LmVuZE9mU2VsZWN0UmVmLCBcImVuZE9mU2VsZWN0TGF5b3V0XCIpXG5cbiAgICAgIGlmICh0aGlzLnMub3BlbmVkICYmIHRoaXMucy5vcHRpb25zQ29udGFpbmVyTGF5b3V0KSB7XG4gICAgICAgIHRoaXMuc2V0T3B0aW9uc1Bvc2l0aW9uQWJvdmVJZk91dHNpZGVTY3JlZW4oKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7bmF0aXZlRXZlbnQ/OiB7bGF5b3V0PzogSGF5YVNlbGVjdExheW91dH19fSBlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25PcHRpb25zQ29udGFpbmVyTGF5b3V0ID0gKGUpID0+IHtcbiAgICB0aGlzLnMub3B0aW9uc0NvbnRhaW5lckxheW91dCA9IG5vcm1hbGl6ZUxheW91dChkaWdnKGUsIFwibmF0aXZlRXZlbnRcIiwgXCJsYXlvdXRcIikpXG4gIH1cblxuICAvKiogQHJldHVybnMge3ZvaWR9ICovXG4gIG1lYXN1cmVOYXRpdmVTZWxlY3RMYXlvdXRzKCkge1xuICAgIHRoaXMubWVhc3VyZU5hdGl2ZUxheW91dCh0aGlzLnR0LnNlbGVjdENvbnRhaW5lclJlZiwgXCJzZWxlY3RDb250YWluZXJMYXlvdXRcIilcbiAgICB0aGlzLm1lYXN1cmVOYXRpdmVMYXlvdXQodGhpcy50dC5lbmRPZlNlbGVjdFJlZiwgXCJlbmRPZlNlbGVjdExheW91dFwiKVxuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmVzIGEgbmF0aXZlIHZpZXcgaW4gd2luZG93IGNvb3JkaW5hdGVzIGZvciBwb3J0YWwgcG9zaXRpb25pbmcuXG4gICAqIEBwYXJhbSB7aW1wb3J0KFwicmVhY3RcIikuUmVmT2JqZWN0PG9iamVjdD59IHJlZiBWaWV3IHJlZi5cbiAgICogQHBhcmFtIHtcInNlbGVjdENvbnRhaW5lckxheW91dFwifFwiZW5kT2ZTZWxlY3RMYXlvdXRcIn0gc3RhdGVLZXkgU3RhdGUgbGF5b3V0IGtleS5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBtZWFzdXJlTmF0aXZlTGF5b3V0KHJlZiwgc3RhdGVLZXkpIHtcbiAgICBpZiAoUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIikgcmV0dXJuXG5cbiAgICBjb25zdCBlbGVtZW50ID0gcmVmLmN1cnJlbnRcbiAgICBpZiAoIWVsZW1lbnQgfHwgdHlwZW9mIGVsZW1lbnQubWVhc3VyZUluV2luZG93ICE9IFwiZnVuY3Rpb25cIikgcmV0dXJuXG5cbiAgICBlbGVtZW50Lm1lYXN1cmVJbldpbmRvdygobGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgICBjb25zdCBtZWFzdXJlZExheW91dCA9IHtoZWlnaHQsIGxlZnQsIHRvcCwgd2lkdGh9XG5cbiAgICAgIGlmICghbGF5b3V0SGFzUG9zaXRpb24obWVhc3VyZWRMYXlvdXQpKSByZXR1cm5cblxuICAgICAgLyoqIEB0eXBlIHtQYXJ0aWFsPEhheWFTZWxlY3RTdGF0ZT59ICovXG4gICAgICBjb25zdCBuZXdTdGF0ZSA9IHtcbiAgICAgICAgW3N0YXRlS2V5XTogbWVhc3VyZWRMYXlvdXRcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXRlS2V5ID09IFwiZW5kT2ZTZWxlY3RMYXlvdXRcIiAmJiB0aGlzLnMub3BlbmVkICYmIHdpZHRoKSB7XG4gICAgICAgIG5ld1N0YXRlLm9wdGlvbnNXaWR0aCA9IHdpZHRoXG4gICAgICB9XG5cbiAgICAgIGlmICghYW55dGhpbmdEaWZmZXJlbnQodGhpcy5zW3N0YXRlS2V5XSwgbWVhc3VyZWRMYXlvdXQpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnMub3BlbmVkICYmIHRoaXMucy5vcHRpb25zQ29udGFpbmVyTGF5b3V0KSB7XG4gICAgICAgICAgdGhpcy5zZXRPcHRpb25zUG9zaXRpb25BYm92ZUlmT3V0c2lkZVNjcmVlbigpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2ltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50fSBlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25TZWxlY3RDbGlja2VkID0gKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBjb25zdCB7b3BlbmVkfSA9IHRoaXMuc1xuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJvblNlbGVjdENsaWNrZWRcIiwge29wZW5lZH0pXG5cbiAgICBpZiAob3BlbmVkKSB7XG4gICAgICB0aGlzLmNsb3NlT3B0aW9ucygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3Blbk9wdGlvbnMoKVxuICAgIH1cbiAgfVxuXG4gIG9uU2VhcmNoVGV4dElucHV0Q2hhbmdlZERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMudHQubG9hZE9wdGlvbnMsIDIwMClcblxuICAvKipcbiAgICogQHBhcmFtIHt7b3B0aW9ucz86IEFycmF5PEhheWFTZWxlY3RPcHRpb24+fX0gW3BhcmFtc11cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBjbG9zZU9wdGlvbnMoe29wdGlvbnN9ID0ge30pIHtcbiAgICBjb25zdCBjbG9zZWRPcHRpb25zID0gb3B0aW9ucyB8fCB0aGlzLmdldEN1cnJlbnRPcHRpb25zKClcbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwiY2xvc2VPcHRpb25zXCIsIHtjbG9zZWRPcHRpb25zQ291bnQ6IGNsb3NlZE9wdGlvbnM/Lmxlbmd0aCB8fCAwfSlcblxuICAgIGlmICh0aGlzLnMub3BlbmVkICYmIHRoaXMucy5vcHRpb25zUGxhY2VtZW50ID09IFwic2hlZXRcIikge1xuICAgICAgdGhpcy5jbG9zZU1vYmlsZU9wdGlvbnNXaXRoQW5pbWF0aW9uKHtjbG9zZWRPcHRpb25zfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuZmluaXNoQ2xvc2VPcHRpb25zKHtjbG9zZWRPcHRpb25zfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3tjbG9zZWRPcHRpb25zOiBBcnJheTxIYXlhU2VsZWN0T3B0aW9uPn19IHBhcmFtcyBDbG9zZSBwYXlsb2FkLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGNsb3NlTW9iaWxlT3B0aW9uc1dpdGhBbmltYXRpb24oe2Nsb3NlZE9wdGlvbnN9KSB7XG4gICAgaWYgKHRoaXMubW9iaWxlT3B0aW9uc0Nsb3NpbmcpIHJldHVyblxuXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQ2xvc2luZyA9IHRydWVcbiAgICB0aGlzLm1vYmlsZU9wdGlvbnNCYWNrZHJvcE9wYWNpdHkuc3RvcEFuaW1hdGlvbigpXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3Muc3RvcEFuaW1hdGlvbigpXG5cbiAgICBBbmltYXRlZC5wYXJhbGxlbChbXG4gICAgICBBbmltYXRlZC50aW1pbmcodGhpcy5tb2JpbGVPcHRpb25zQmFja2Ryb3BPcGFjaXR5LCB7XG4gICAgICAgIGR1cmF0aW9uOiA5MCxcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcub3V0KEVhc2luZy5jdWJpYyksXG4gICAgICAgIHRvVmFsdWU6IDAsXG4gICAgICAgIHVzZU5hdGl2ZURyaXZlcjogdHJ1ZVxuICAgICAgfSksXG4gICAgICBBbmltYXRlZC50aW1pbmcodGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3MsIHtcbiAgICAgICAgZHVyYXRpb246IDExMCxcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcuaW4oRWFzaW5nLmN1YmljKSxcbiAgICAgICAgdG9WYWx1ZTogMCxcbiAgICAgICAgdXNlTmF0aXZlRHJpdmVyOiB0cnVlXG4gICAgICB9KVxuICAgIF0pLnN0YXJ0KCgpID0+IHtcbiAgICAgIHRoaXMubW9iaWxlT3B0aW9uc0Nsb3NpbmcgPSBmYWxzZVxuICAgICAgdGhpcy5maW5pc2hDbG9zZU9wdGlvbnMoe2Nsb3NlZE9wdGlvbnN9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7Y2xvc2VkT3B0aW9uczogQXJyYXk8SGF5YVNlbGVjdE9wdGlvbj59fSBwYXJhbXMgQ2xvc2UgcGF5bG9hZC5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBmaW5pc2hDbG9zZU9wdGlvbnMoe2Nsb3NlZE9wdGlvbnN9KSB7XG4gICAgdGhpcy5jYWxsT3B0aW9uc1Bvc2l0aW9uQWJvdmVJZk91dHNpZGVTY3JlZW4gPSBmYWxzZVxuICAgIHRoaXMudW5sb2NrQm9keVNjcm9sbCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKFxuICAgICAge1xuICAgICAgICBoZWlnaHQ6IG51bGwsXG4gICAgICAgIGxvYWRlZE9wdGlvbnM6IHVuZGVmaW5lZCxcbiAgICAgICAgb3BlbmVkOiBmYWxzZSxcbiAgICAgICAgb3B0aW9uc0NvbnRhaW5lckxheW91dDogbnVsbCxcbiAgICAgICAgb3B0aW9uc1Zpc2liaWxpdHk6IFwiaGlkZGVuXCIsXG4gICAgICAgIHBhZ2U6IDEsXG4gICAgICAgIHBhZ2VJbnB1dEZvY3VzZWQ6IGZhbHNlLFxuICAgICAgICBwYWdlSW5wdXRWYWx1ZTogXCIxXCIsXG4gICAgICAgIHBhZ2VTaXplOiBudWxsLFxuICAgICAgICB0b3RhbENvdW50OiBudWxsXG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwiY2xvc2VPcHRpb25zLmRvbmVcIiwge29wZW5lZDogdGhpcy5zLm9wZW5lZCwgb3B0aW9uc1Zpc2liaWxpdHk6IHRoaXMucy5vcHRpb25zVmlzaWJpbGl0eX0pXG4gICAgICB9XG4gICAgKVxuXG4gICAgaWYgKHRoaXMucHJvcHMub25PcHRpb25zQ2xvc2VkKSB7XG4gICAgICB0aGlzLnByb3BzLm9uT3B0aW9uc0Nsb3NlZCh7b3B0aW9uczogY2xvc2VkT3B0aW9uc30pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMucC5vbkJsdXIpIHRoaXMucC5vbkJsdXIoKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBwcmVwYXJlTW9iaWxlT3B0aW9uc0FuaW1hdGlvbigpIHtcbiAgICB0aGlzLm1vYmlsZU9wdGlvbnNDbG9zaW5nID0gZmFsc2VcbiAgICB0aGlzLm1vYmlsZU9wdGlvbnNCYWNrZHJvcE9wYWNpdHkuc3RvcEFuaW1hdGlvbigpXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3Muc3RvcEFuaW1hdGlvbigpXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQmFja2Ryb3BPcGFjaXR5LnNldFZhbHVlKDApXG4gICAgdGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3Muc2V0VmFsdWUoMClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgc3RhcnRNb2JpbGVPcHRpb25zT3BlbkFuaW1hdGlvbigpIHtcbiAgICBBbmltYXRlZC5wYXJhbGxlbChbXG4gICAgICBBbmltYXRlZC50aW1pbmcodGhpcy5tb2JpbGVPcHRpb25zQmFja2Ryb3BPcGFjaXR5LCB7XG4gICAgICAgIGR1cmF0aW9uOiA5MCxcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcub3V0KEVhc2luZy5jdWJpYyksXG4gICAgICAgIHRvVmFsdWU6IDEsXG4gICAgICAgIHVzZU5hdGl2ZURyaXZlcjogdHJ1ZVxuICAgICAgfSksXG4gICAgICBBbmltYXRlZC50aW1pbmcodGhpcy5tb2JpbGVPcHRpb25zQ29udGFpbmVyUHJvZ3Jlc3MsIHtcbiAgICAgICAgZHVyYXRpb246IDEzMCxcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcub3V0KEVhc2luZy5iYWNrKDEuMDUpKSxcbiAgICAgICAgdG9WYWx1ZTogMSxcbiAgICAgICAgdXNlTmF0aXZlRHJpdmVyOiB0cnVlXG4gICAgICB9KVxuICAgIF0pLnN0YXJ0KClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7c3RyaW5nfSAqL1xuICBnZXRTZWFyY2hUZXh0ID0gKCkgPT4gdGhpcy5zZWFyY2hUZXh0VmFsdWUgfHwgXCJcIlxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgcmVzZXRTZWFyY2hUZXh0SW5wdXQgPSAoKSA9PiB7XG4gICAgdGhpcy5zZWFyY2hUZXh0VmFsdWUgPSBcIlwiXG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLnR0LnNlYXJjaFRleHRJbnB1dFJlZi5jdXJyZW50XG5cbiAgICBpZiAoaW5wdXQ/LmNsZWFyKSB7XG4gICAgICBpbnB1dC5jbGVhcigpXG4gICAgfSBlbHNlIGlmIChpbnB1dD8uc2V0TmF0aXZlUHJvcHMpIHtcbiAgICAgIGlucHV0LnNldE5hdGl2ZVByb3BzKHt0ZXh0OiBcIlwifSlcbiAgICB9IGVsc2UgaWYgKGlucHV0KSB7XG4gICAgICB0cnkge1xuICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIElnbm9yZSBpZiB0aGUgcmVmIGRvZXNuJ3Qgc3VwcG9ydCBkaXJlY3QgdmFsdWUgYXNzaWdubWVudC5cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRleHRcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBvbkNoYW5nZVNlYXJjaFRleHQgPSAoc2VhcmNoVGV4dCkgPT4ge1xuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJvbkNoYW5nZVNlYXJjaFRleHRcIiwge3NlYXJjaFRleHQsIGN1cnJlbnRQYWdlOiB0aGlzLnMucGFnZX0pXG4gICAgdGhpcy5zZWFyY2hUZXh0VmFsdWUgPSBzZWFyY2hUZXh0XG5cbiAgICBpZiAodGhpcy5zLnBhZ2UgIT0gMSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7cGFnZTogMSwgcGFnZUlucHV0VmFsdWU6IFwiMVwifSwgdGhpcy50dC5vblNlYXJjaFRleHRJbnB1dENoYW5nZWREZWJvdW5jZWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHQub25TZWFyY2hUZXh0SW5wdXRDaGFuZ2VkRGVib3VuY2VkKClcbiAgICB9XG4gIH1cblxuICAvKiogQHJldHVybnMge3ZvaWR9ICovXG4gIG9wZW5PcHRpb25zKCkge1xuICAgIGNvbnN0IG1vYmlsZU9wdGlvbnNTaGVldCA9IHRoaXMuaXNNb2JpbGVPcHRpb25zU2hlZXQoKVxuXG4gICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcIm9wZW5PcHRpb25zXCIsIHtcbiAgICAgIGN1cnJlbnRPcHRpb25zQ291bnQ6IHRoaXMuZ2V0Q3VycmVudE9wdGlvbnMoKT8ubGVuZ3RoIHx8IDAsXG4gICAgICBtb2JpbGVPcHRpb25zU2hlZXQsXG4gICAgICBzZWFyY2hFbmFibGVkOiB0aGlzLnAuc2VhcmNoXG4gICAgfSlcbiAgICB0aGlzLnNlYXJjaFRleHRWYWx1ZSA9IFwiXCJcbiAgICB0aGlzLmNhbGxPcHRpb25zUG9zaXRpb25BYm92ZUlmT3V0c2lkZVNjcmVlbiA9ICFtb2JpbGVPcHRpb25zU2hlZXRcblxuICAgIGlmIChtb2JpbGVPcHRpb25zU2hlZXQpIHtcbiAgICAgIHRoaXMucHJlcGFyZU1vYmlsZU9wdGlvbnNBbmltYXRpb24oKVxuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoXG4gICAgICB7XG4gICAgICAgIGhlaWdodDogbW9iaWxlT3B0aW9uc1NoZWV0ID8gbnVsbCA6IHRoaXMucy5zZWxlY3RDb250YWluZXJMYXlvdXQ/LmhlaWdodCxcbiAgICAgICAgb3BlbmVkOiB0cnVlLFxuICAgICAgICBvcHRpb25zUGxhY2VtZW50OiBtb2JpbGVPcHRpb25zU2hlZXQgPyBcInNoZWV0XCIgOiBcImJlbG93XCIsXG4gICAgICAgIG9wdGlvbnNWaXNpYmlsaXR5OiBtb2JpbGVPcHRpb25zU2hlZXQgPyBcInZpc2libGVcIiA6IFwiaGlkZGVuXCIsXG4gICAgICAgIG9wdGlvbnNXaWR0aDogbW9iaWxlT3B0aW9uc1NoZWV0ID8gdW5kZWZpbmVkIDogdGhpcy5zLmVuZE9mU2VsZWN0TGF5b3V0Py53aWR0aCxcbiAgICAgICAgcGFnZTogMSxcbiAgICAgICAgcGFnZUlucHV0Rm9jdXNlZDogZmFsc2UsXG4gICAgICAgIHBhZ2VJbnB1dFZhbHVlOiBcIjFcIixcbiAgICAgICAgc2Nyb2xsTGVmdDogUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IDogbnVsbCxcbiAgICAgICAgc2Nyb2xsVG9wOiBQbGF0Zm9ybS5PUyA9PSBcIndlYlwiID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCA6IG51bGxcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGlmIChtb2JpbGVPcHRpb25zU2hlZXQpIHtcbiAgICAgICAgICB0aGlzLmxvY2tCb2R5U2Nyb2xsKClcbiAgICAgICAgICB0aGlzLnN0YXJ0TW9iaWxlT3B0aW9uc09wZW5BbmltYXRpb24oKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubWVhc3VyZU5hdGl2ZVNlbGVjdExheW91dHMoKVxuICAgICAgICAgIHRoaXMuZm9jdXNUZXh0SW5wdXQoKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFNlYXJjaFRleHRJbnB1dCgpXG4gICAgICAgIHRoaXMubG9hZE9wdGlvbnMoe3BhZ2U6IDF9KVxuICAgICAgfVxuICAgIClcblxuICAgIGlmICh0aGlzLnAub25Gb2N1cykgdGhpcy5wLm9uRm9jdXMoKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBmb2N1c1RleHRJbnB1dCA9ICgpID0+IGRpZ2codGhpcy50dC5zZWFyY2hUZXh0SW5wdXRSZWYsIFwiY3VycmVudFwiKT8uZm9jdXMoKVxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgbG9ja0JvZHlTY3JvbGwoKSB7XG4gICAgaWYgKFBsYXRmb3JtLk9TICE9IFwid2ViXCIgfHwgdHlwZW9mIGRvY3VtZW50ID09IFwidW5kZWZpbmVkXCIgfHwgdGhpcy5ib2R5U2Nyb2xsTG9ja2VkKSByZXR1cm5cblxuICAgIHRoaXMucHJldmlvdXNCb2R5T3ZlcmZsb3cgPSBkb2N1bWVudC5ib2R5Py5zdHlsZS5vdmVyZmxvd1xuICAgIHRoaXMucHJldmlvdXNEb2N1bWVudE92ZXJmbG93ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Py5zdHlsZS5vdmVyZmxvd1xuXG4gICAgaWYgKGRvY3VtZW50LmJvZHkpIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiXG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIlxuXG4gICAgdGhpcy5ib2R5U2Nyb2xsTG9ja2VkID0gdHJ1ZVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICB1bmxvY2tCb2R5U2Nyb2xsKCkge1xuICAgIGlmIChQbGF0Zm9ybS5PUyAhPSBcIndlYlwiIHx8IHR5cGVvZiBkb2N1bWVudCA9PSBcInVuZGVmaW5lZFwiIHx8ICF0aGlzLmJvZHlTY3JvbGxMb2NrZWQpIHJldHVyblxuXG4gICAgaWYgKGRvY3VtZW50LmJvZHkpIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSB0aGlzLnByZXZpb3VzQm9keU92ZXJmbG93IHx8IFwiXCJcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSB0aGlzLnByZXZpb3VzRG9jdW1lbnRPdmVyZmxvdyB8fCBcIlwiXG5cbiAgICB0aGlzLnByZXZpb3VzQm9keU92ZXJmbG93ID0gdW5kZWZpbmVkXG4gICAgdGhpcy5wcmV2aW91c0RvY3VtZW50T3ZlcmZsb3cgPSB1bmRlZmluZWRcbiAgICB0aGlzLmJvZHlTY3JvbGxMb2NrZWQgPSBmYWxzZVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBzZXRPcHRpb25zUG9zaXRpb24oKSB7XG4gICAgaWYgKCF0aGlzLmlzQWN0aXZlKCkpIHtcbiAgICAgIHJldHVybiAvLyBEZWJvdW5jZSBhZnRlciB1bi1tb3VudCBoYW5kZWxpbmcuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNNb2JpbGVPcHRpb25zU2hlZXQoKSkge1xuICAgICAgdGhpcy5zZXRPcHRpb25zUG9zaXRpb25TaGVldCgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnVubG9ja0JvZHlTY3JvbGwoKVxuXG4gICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcInNldE9wdGlvbnNQb3NpdGlvblwiKVxuICAgIHRoaXMuY2FsbE9wdGlvbnNQb3NpdGlvbkFib3ZlSWZPdXRzaWRlU2NyZWVuID0gdHJ1ZVxuICAgIHRoaXMuc2V0T3B0aW9uc1Bvc2l0aW9uQmVsb3coKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBzeW5jT3B0aW9uc1BsYWNlbWVudFdpdGhNb2RlKCkge1xuICAgIGlmICghdGhpcy5zLm9wZW5lZCkgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5pc01vYmlsZU9wdGlvbnNTaGVldCgpKSB7XG4gICAgICBpZiAodGhpcy5zLm9wdGlvbnNQbGFjZW1lbnQgIT0gXCJzaGVldFwiKSB0aGlzLnNldE9wdGlvbnNQb3NpdGlvblNoZWV0KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0aGlzLnMub3B0aW9uc1BsYWNlbWVudCA9PSBcInNoZWV0XCIpIHtcbiAgICAgIHRoaXMuc2V0T3B0aW9uc1Bvc2l0aW9uQmVsb3coKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy51bmxvY2tCb2R5U2Nyb2xsKClcbiAgICB0aGlzLm1lYXN1cmVOYXRpdmVTZWxlY3RMYXlvdXRzKClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgc2V0T3B0aW9uc1Bvc2l0aW9uQWJvdmVJZk91dHNpZGVTY3JlZW4oKSB7XG4gICAgaWYgKCF0aGlzLnMub3BlbmVkKSByZXR1cm5cbiAgICBpZiAodGhpcy5pc01vYmlsZU9wdGlvbnNTaGVldCgpKSB7XG4gICAgICB0aGlzLnNldE9wdGlvbnNQb3NpdGlvblNoZWV0KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHt3aW5kb3dIZWlnaHR9ID0gdGhpcy50dFxuICAgIGNvbnN0IHtvcHRpb25zQ29udGFpbmVyTGF5b3V0LCBzZWxlY3RDb250YWluZXJMYXlvdXR9ID0gdGhpcy5zXG4gICAgY29uc3QgZW5kT2ZTZWxlY3RMYXlvdXQgPSB0aGlzLnMuZW5kT2ZTZWxlY3RMYXlvdXRcblxuICAgIGNvbnN0IG9wdGlvbnNUb3AgPSBQbGF0Zm9ybS5PUyA9PSBcIndlYlwiXG4gICAgICA/IGVuZE9mU2VsZWN0TGF5b3V0Py50b3BcbiAgICAgIDogdHlwZW9mIHNlbGVjdENvbnRhaW5lckxheW91dD8udG9wID09IFwibnVtYmVyXCIgJiYgdHlwZW9mIHNlbGVjdENvbnRhaW5lckxheW91dD8uaGVpZ2h0ID09IFwibnVtYmVyXCJcbiAgICAgICAgPyBzZWxlY3RDb250YWluZXJMYXlvdXQudG9wICsgc2VsZWN0Q29udGFpbmVyTGF5b3V0LmhlaWdodCArIDFcbiAgICAgICAgOiB1bmRlZmluZWRcblxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG9wdGlvbnNUb3ApKSB7XG4gICAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwic2V0T3B0aW9uc1Bvc2l0aW9uQWJvdmVJZk91dHNpZGVTY3JlZW5cIiwge3BsYWNlbWVudDogXCJiZWxvd1wiLCByZWFzb246IFwibWlzc2luZy1vcHRpb25zLXRvcFwifSlcbiAgICAgIHRoaXMubWVhc3VyZU5hdGl2ZVNlbGVjdExheW91dHMoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3Qgb3B0aW9uc1RvdGFsQm90dG9tUG9zaXRpb24gPSBvcHRpb25zQ29udGFpbmVyTGF5b3V0LmhlaWdodCArIG9wdGlvbnNUb3BcbiAgICBjb25zdCB3aW5kb3dIZWlnaHRXaXRoU2Nyb2xsID0gd2luZG93SGVpZ2h0ICsgKHRoaXMucy5zY3JvbGxUb3AgfHwgMClcblxuICAgIGlmICh3aW5kb3dIZWlnaHRXaXRoU2Nyb2xsIDwgb3B0aW9uc1RvdGFsQm90dG9tUG9zaXRpb24pIHtcbiAgICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJzZXRPcHRpb25zUG9zaXRpb25BYm92ZUlmT3V0c2lkZVNjcmVlblwiLCB7cGxhY2VtZW50OiBcImFib3ZlXCJ9KVxuICAgICAgdGhpcy5zZXRPcHRpb25zUG9zaXRpb25BYm92ZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJzZXRPcHRpb25zUG9zaXRpb25BYm92ZUlmT3V0c2lkZVNjcmVlblwiLCB7cGxhY2VtZW50OiBcImJlbG93XCJ9KVxuICAgICAgdGhpcy5zLm9wdGlvbnNWaXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCJcbiAgICB9XG4gIH1cblxuICAvKiogQHJldHVybnMge3ZvaWR9ICovXG4gIHNldE9wdGlvbnNQb3NpdGlvblNoZWV0KCkge1xuICAgIGlmICghdGhpcy5zLm9wZW5lZCkgcmV0dXJuXG5cbiAgICBjb25zdCBzd2l0Y2hpbmdUb1NoZWV0ID0gdGhpcy5zLm9wdGlvbnNQbGFjZW1lbnQgIT0gXCJzaGVldFwiXG5cbiAgICBpZiAoc3dpdGNoaW5nVG9TaGVldCkge1xuICAgICAgdGhpcy5wcmVwYXJlTW9iaWxlT3B0aW9uc0FuaW1hdGlvbigpXG4gICAgfVxuXG4gICAgdGhpcy5sb2NrQm9keVNjcm9sbCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGhlaWdodDogbnVsbCxcbiAgICAgIG9wZW5lZDogdHJ1ZSxcbiAgICAgIG9wdGlvbnNQbGFjZW1lbnQ6IFwic2hlZXRcIixcbiAgICAgIG9wdGlvbnNWaXNpYmlsaXR5OiBcInZpc2libGVcIixcbiAgICAgIG9wdGlvbnNXaWR0aDogdW5kZWZpbmVkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKHN3aXRjaGluZ1RvU2hlZXQpIHRoaXMuc3RhcnRNb2JpbGVPcHRpb25zT3BlbkFuaW1hdGlvbigpXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgc2V0T3B0aW9uc1Bvc2l0aW9uQWJvdmUoKSB7XG4gICAgaWYgKCF0aGlzLnMub3BlbmVkKSByZXR1cm5cblxuICAgIGNvbnN0IHtlbmRPZlNlbGVjdExheW91dH0gPSB0aGlzLnNcbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwic2V0T3B0aW9uc1Bvc2l0aW9uQWJvdmVcIilcbiAgICB0aGlzLnVubG9ja0JvZHlTY3JvbGwoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZShcbiAgICAgIHtcbiAgICAgICAgb3BlbmVkOiB0cnVlLFxuICAgICAgICBvcHRpb25zUGxhY2VtZW50OiBcImFib3ZlXCIsXG4gICAgICAgIG9wdGlvbnNWaXNpYmlsaXR5OiBcInZpc2libGVcIixcbiAgICAgICAgb3B0aW9uc1dpZHRoOiBlbmRPZlNlbGVjdExheW91dD8ud2lkdGhcbiAgICAgIH0sXG4gICAgICAoKSA9PiB0aGlzLmZvY3VzVGV4dElucHV0KClcbiAgICApXG4gIH1cblxuICAvKiogQHJldHVybnMge3ZvaWR9ICovXG4gIHNldE9wdGlvbnNQb3NpdGlvbkJlbG93KCkge1xuICAgIGlmICghdGhpcy5zLm9wZW5lZCkgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwic2V0T3B0aW9uc1Bvc2l0aW9uQmVsb3dcIilcbiAgICB0aGlzLnVubG9ja0JvZHlTY3JvbGwoKVxuICAgIHRoaXMuc2V0U3RhdGUoXG4gICAgICB7XG4gICAgICAgIG9wZW5lZDogdHJ1ZSxcbiAgICAgICAgb3B0aW9uc1BsYWNlbWVudDogXCJiZWxvd1wiLFxuICAgICAgICBvcHRpb25zVmlzaWJpbGl0eTogXCJoaWRkZW5cIixcbiAgICAgICAgb3B0aW9uc1dpZHRoOiB0aGlzLnMuZW5kT2ZTZWxlY3RMYXlvdXQ/LndpZHRoXG4gICAgICB9LFxuICAgICAgKCkgPT4gdGhpcy5mb2N1c1RleHRJbnB1dCgpXG4gICAgKVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBvbkFueXRoaW5nUmVzaXplZCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwib25Bbnl0aGluZ1Jlc2l6ZWRcIiwge29wZW5lZDogdGhpcy5zLm9wZW5lZH0pXG4gICAgaWYgKHRoaXMucy5vcGVuZWQpIHtcbiAgICAgIHRoaXMuc2V0T3B0aW9uc1Bvc2l0aW9uKClcbiAgICB9XG4gIH1cblxuICBvbkFueXRoaW5nUmVzaXplZERlYm91bmNlZCA9IGRlYm91bmNlKHRoaXMudHQub25Bbnl0aGluZ1Jlc2l6ZWQsIDI1KVxuXG4gIC8qKiBAcmV0dXJucyB7dm9pZH0gKi9cbiAgb25Bbnl0aGluZ1Njcm9sbGVkID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJvbkFueXRoaW5nU2Nyb2xsZWRcIiwge29wZW5lZDogdGhpcy5zLm9wZW5lZH0pXG4gICAgaWYgKHRoaXMucy5vcGVuZWQpIHtcbiAgICAgIHRoaXMucy5zY3JvbGxMZWZ0ID0gUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIiA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IDogbnVsbFxuICAgICAgdGhpcy5zLnNjcm9sbFRvcCA9IFBsYXRmb3JtLk9TID09IFwid2ViXCIgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIDogbnVsbFxuICAgICAgaWYgKHRoaXMuaXNNb2JpbGVPcHRpb25zU2hlZXQoKSkgcmV0dXJuXG5cbiAgICAgIHRoaXMuc2V0T3B0aW9uc1Bvc2l0aW9uKClcbiAgICB9XG4gIH1cblxuICBvbkFueXRoaW5nU2Nyb2xsZWREZWJvdW5jZWQgPSBkZWJvdW5jZSh0aGlzLnR0Lm9uQW55dGhpbmdTY3JvbGxlZCwgMjUpXG5cbiAgLyoqIEByZXR1cm5zIHt2b2lkfSAqL1xuICBvblByZXNzT3V0c2lkZU9wdGlvbnMgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuaXNEZWJ1Z0VuYWJsZWQoKSkgdGhpcy5kZWJ1Z0xvZyhcIm9uUHJlc3NPdXRzaWRlT3B0aW9uc1wiLCB7b3BlbmVkOiB0aGlzLnMub3BlbmVkfSlcbiAgICAvLyBJZiBvcHRpb25zIGFyZSBvcGVuIGFuZCBhIGNsaWNrIGlzIG1hZGUgb3V0c2lkZSBvZiB0aGUgb3B0aW9ucyBjb250YWluZXJcbiAgICBpZiAodGhpcy5zLm9wZW5lZCkge1xuICAgICAgdGhpcy5jbG9zZU9wdGlvbnMoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2ltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50fSBldmVudCBSZXNwb25kZXIgZXZlbnQuXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25Nb2JpbGVPcHRpb25zQmFja2Ryb3BSZWxlYXNlID0gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQ/LigpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uPy4oKVxuXG4gICAgdGhpcy5jbG9zZU9wdGlvbnMoKVxuICB9XG5cbiAgbW9iaWxlT3B0aW9uc0JhY2tkcm9wUGFuUmVzcG9uZGVyID0gUGFuUmVzcG9uZGVyLmNyZWF0ZSh7XG4gICAgb25TdGFydFNob3VsZFNldFBhblJlc3BvbmRlcjogKCkgPT4gdHJ1ZSxcbiAgICBvbk1vdmVTaG91bGRTZXRQYW5SZXNwb25kZXI6ICgpID0+IGZhbHNlLFxuICAgIG9uUGFuUmVzcG9uZGVyUmVsZWFzZTogdGhpcy50dC5vbk1vYmlsZU9wdGlvbnNCYWNrZHJvcFJlbGVhc2UsXG4gICAgb25QYW5SZXNwb25kZXJUZXJtaW5hdGU6IHRoaXMudHQub25Nb2JpbGVPcHRpb25zQmFja2Ryb3BSZWxlYXNlXG4gIH0pXG5cbiAgLyoqIEByZXR1cm5zIHtudW1iZXJ8bnVsbH0gKi9cbiAgcGFnaW5hdGlvblRvdGFsUGFnZXMoKSB7XG4gICAgY29uc3Qge3RvdGFsQ291bnR9ID0gdGhpcy5zXG5cbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZSh0b3RhbENvdW50KSB8fCB0b3RhbENvdW50IDw9IDApIHJldHVybiBudWxsXG5cbiAgICBjb25zdCBwYWdlU2l6ZSA9IHRoaXMucmVzb2x2ZVBhZ2VTaXplKHtcbiAgICAgIG9wdGlvbnM6IHRoaXMucy5sb2FkZWRPcHRpb25zIHx8IFtdLFxuICAgICAgcGFnZTogdGhpcy5nZXRBY3RpdmVQYWdlKCksXG4gICAgICBwYWdlU2l6ZTogdGhpcy5zLnBhZ2VTaXplLFxuICAgICAgdG90YWxDb3VudFxuICAgIH0pXG5cbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShwYWdlU2l6ZSkgfHwgcGFnZVNpemUgPD0gMCkgcmV0dXJuIG51bGxcblxuICAgIHJldHVybiBNYXRoLmNlaWwodG90YWxDb3VudCAvIHBhZ2VTaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0b3RhbFBhZ2VzXG4gICAqIEByZXR1cm5zIHtBcnJheTx7a2V5OiBzdHJpbmcsIHR5cGU6IFwicGFnZVwifFwiZWxsaXBzaXNcIiwgdmFsdWU/OiBudW1iZXJ9Pn1cbiAgICovXG4gIHBhZ2luYXRpb25QYWdlSXRlbXModG90YWxQYWdlcykge1xuICAgIGNvbnN0IGN1cnJlbnRQYWdlID0gdGhpcy5nZXRBY3RpdmVQYWdlKClcbiAgICBjb25zdCBpdGVtcyA9IFtdXG4gICAgY29uc3QgYWRkUGFnZSA9IChwYWdlKSA9PiBpdGVtcy5wdXNoKHtrZXk6IGBwYWdlLSR7cGFnZX1gLCB0eXBlOiBcInBhZ2VcIiwgdmFsdWU6IHBhZ2V9KVxuICAgIGNvbnN0IGFkZEVsbGlwc2lzID0gKGtleSkgPT4gaXRlbXMucHVzaCh7a2V5LCB0eXBlOiBcImVsbGlwc2lzXCJ9KVxuXG4gICAgaWYgKHRvdGFsUGFnZXMgPD0gNykge1xuICAgICAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gdG90YWxQYWdlczsgcGFnZSArPSAxKSB7XG4gICAgICAgIGFkZFBhZ2UocGFnZSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGl0ZW1zXG4gICAgfVxuXG4gICAgYWRkUGFnZSgxKVxuXG4gICAgY29uc3Qgd2luZG93U2l6ZSA9IDJcbiAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgyLCBjdXJyZW50UGFnZSAtIHdpbmRvd1NpemUpXG4gICAgbGV0IGVuZCA9IE1hdGgubWluKHRvdGFsUGFnZXMgLSAxLCBjdXJyZW50UGFnZSArIHdpbmRvd1NpemUpXG5cbiAgICBpZiAoY3VycmVudFBhZ2UgPD0gMykge1xuICAgICAgc3RhcnQgPSAyXG4gICAgICBlbmQgPSBNYXRoLm1pbih0b3RhbFBhZ2VzIC0gMSwgNSlcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRQYWdlID49IHRvdGFsUGFnZXMgLSAyKSB7XG4gICAgICBlbmQgPSB0b3RhbFBhZ2VzIC0gMVxuICAgICAgc3RhcnQgPSBNYXRoLm1heCgyLCB0b3RhbFBhZ2VzIC0gNClcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiAyKSBhZGRFbGxpcHNpcyhcImVsbGlwc2lzLXN0YXJ0XCIpXG5cbiAgICBmb3IgKGxldCBwYWdlID0gc3RhcnQ7IHBhZ2UgPD0gZW5kOyBwYWdlICs9IDEpIHtcbiAgICAgIGFkZFBhZ2UocGFnZSlcbiAgICB9XG5cbiAgICBpZiAoZW5kIDwgdG90YWxQYWdlcyAtIDEpIGFkZEVsbGlwc2lzKFwiZWxsaXBzaXMtZW5kXCIpXG5cbiAgICBhZGRQYWdlKHRvdGFsUGFnZXMpXG5cbiAgICByZXR1cm4gaXRlbXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdG90YWxQYWdlc1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgcGFnaW5hdGlvbkRpc3BsYXlWYWx1ZSh0b3RhbFBhZ2VzKSB7XG4gICAgY29uc3QgYWN0aXZlUGFnZSA9IHRoaXMuZ2V0QWN0aXZlUGFnZSgpXG4gICAgY29uc3QgZmFsbGJhY2tUZXh0ID0gYFBhZ2UgJHthY3RpdmVQYWdlfSBvZiAke3RvdGFsUGFnZXN9YFxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNsYXRlKFwiLnBhZ2luYXRpb25fcGFnZV9vZl9wYWdlc1wiLCB7XG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbGxiYWNrVGV4dCxcbiAgICAgIHBhZ2U6IGFjdGl2ZVBhZ2UsXG4gICAgICB0b3RhbFBhZ2VzXG4gICAgfSkgfHwgZmFsbGJhY2tUZXh0XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsUGFnZXNcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIHBhZ2luYXRpb25JbnB1dFZhbHVlKHRvdGFsUGFnZXMpIHtcbiAgICBpZiAodGhpcy5zLnBhZ2VJbnB1dEZvY3VzZWQpIHJldHVybiB0aGlzLnMucGFnZUlucHV0VmFsdWVcblxuICAgIHJldHVybiB0aGlzLnBhZ2luYXRpb25EaXNwbGF5VmFsdWUodG90YWxQYWdlcylcbiAgfVxuXG4gIC8qKiBAcGFyYW0ge251bWJlcn0gcGFnZSAqL1xuICBzZXRQYWdpbmF0aW9uUGFnZSA9IChwYWdlKSA9PiB7XG4gICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMucGFnaW5hdGlvblRvdGFsUGFnZXMoKVxuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJzZXRQYWdpbmF0aW9uUGFnZVwiLCB7cmVxdWVzdGVkUGFnZTogcGFnZSwgdG90YWxQYWdlc30pXG5cbiAgICBpZiAoIXRvdGFsUGFnZXMpIHJldHVyblxuXG4gICAgY29uc3QgbmV4dFBhZ2UgPSBNYXRoLm1pbihNYXRoLm1heChNYXRoLmZsb29yKHBhZ2UpLCAxKSwgdG90YWxQYWdlcylcblxuICAgIGlmIChuZXh0UGFnZSA9PSB0aGlzLmdldEFjdGl2ZVBhZ2UoKSkge1xuICAgICAgdGhpcy5zLnBhZ2VJbnB1dFZhbHVlID0gU3RyaW5nKHRoaXMuZ2V0QWN0aXZlUGFnZSgpKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZShcbiAgICAgIHtwYWdlOiBuZXh0UGFnZSwgcGFnZUlucHV0VmFsdWU6IFN0cmluZyhuZXh0UGFnZSl9LFxuICAgICAgKCkgPT4gdGhpcy50dC5sb2FkT3B0aW9ucyh7cGFnZTogbmV4dFBhZ2V9KVxuICAgIClcbiAgfVxuXG4gIC8qKiBAcGFyYW0ge2ltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50fSBldmVudCAqL1xuICBvblBhZ2luYXRpb25QcmV2UHJlc3NlZCA9IChldmVudCkgPT4ge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0Py4oKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8uKClcblxuICAgIHRoaXMuc2V0UGFnaW5hdGlvblBhZ2UodGhpcy5nZXRBY3RpdmVQYWdlKCkgLSAxKVxuICB9XG5cbiAgLyoqIEBwYXJhbSB7aW1wb3J0KFwicmVhY3RcIikuU3ludGhldGljRXZlbnR9IGV2ZW50ICovXG4gIG9uUGFnaW5hdGlvbk5leHRQcmVzc2VkID0gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQ/LigpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uPy4oKVxuXG4gICAgdGhpcy5zZXRQYWdpbmF0aW9uUGFnZSh0aGlzLmdldEFjdGl2ZVBhZ2UoKSArIDEpXG4gIH1cblxuICAvKiogQHJldHVybnMge3ZvaWR9ICovXG4gIG9uUGFnaW5hdGlvbklucHV0Rm9jdXMgPSAoKSA9PiB7XG4gICAgdGhpcy5zLnBhZ2VJbnB1dEZvY3VzZWQgPSB0cnVlXG4gICAgdGhpcy5zLnBhZ2VJbnB1dFZhbHVlID0gU3RyaW5nKHRoaXMuZ2V0QWN0aXZlUGFnZSgpKVxuICB9XG5cbiAgLyoqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAqL1xuICBvblBhZ2luYXRpb25JbnB1dENoYW5nZSA9ICh2YWx1ZSkgPT4ge1xuICAgIHRoaXMucy5wYWdlSW5wdXRWYWx1ZSA9IHZhbHVlXG4gIH1cblxuICAvKiogQHBhcmFtIHtpbXBvcnQoXCJyZWFjdFwiKS5TeW50aGV0aWNFdmVudH0gZXZlbnQgKi9cbiAgb25QYWdpbmF0aW9uSW5wdXRCbHVyID0gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQ/LigpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uPy4oKVxuXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMucGFnaW5hdGlvblRvdGFsUGFnZXMoKVxuICAgIGNvbnN0IHJhd1ZhbHVlID0gZXZlbnQ/LnRhcmdldD8udmFsdWUgPz8gdGhpcy5zLnBhZ2VJbnB1dFZhbHVlXG4gICAgY29uc3QgcGFyc2VkVmFsdWUgPSByYXdWYWx1ZSA/IE51bWJlcihTdHJpbmcocmF3VmFsdWUpLm1hdGNoKC9cXGQrLyk/LlswXSkgOiBOYU5cbiAgICBjb25zdCBuZXh0UGFnZSA9IE51bWJlci5pc0Zpbml0ZShwYXJzZWRWYWx1ZSkgPyBwYXJzZWRWYWx1ZSA6IE51bWJlcih0aGlzLnMucGFnZUlucHV0VmFsdWUpXG5cbiAgICBpZiAodG90YWxQYWdlcyAmJiBOdW1iZXIuaXNGaW5pdGUobmV4dFBhZ2UpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtwYWdlSW5wdXRGb2N1c2VkOiBmYWxzZX0sICgpID0+IHRoaXMuc2V0UGFnaW5hdGlvblBhZ2UobmV4dFBhZ2UpKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwYWdlSW5wdXRGb2N1c2VkOiBmYWxzZSxcbiAgICAgIHBhZ2VJbnB1dFZhbHVlOiBTdHJpbmcodGhpcy5nZXRBY3RpdmVQYWdlKCkpXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBAcGFyYW0ge2ltcG9ydChcInJlYWN0XCIpLlN5bnRoZXRpY0V2ZW50fSBldmVudCAqL1xuICBvblBhZ2luYXRpb25JbnB1dFN1Ym1pdCA9IChldmVudCkgPT4ge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0Py4oKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8uKClcblxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLnBhZ2luYXRpb25Ub3RhbFBhZ2VzKClcblxuICAgIGlmICghdG90YWxQYWdlcykge1xuICAgICAgdGhpcy5zLnBhZ2VJbnB1dEZvY3VzZWQgPSBmYWxzZVxuICAgICAgdGhpcy5zLnBhZ2VJbnB1dFZhbHVlID0gU3RyaW5nKHRoaXMuZ2V0QWN0aXZlUGFnZSgpKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgbmV4dFBhZ2UgPSBOdW1iZXIodGhpcy5zLnBhZ2VJbnB1dFZhbHVlKVxuXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmV4dFBhZ2UpKSB7XG4gICAgICB0aGlzLnMucGFnZUlucHV0Rm9jdXNlZCA9IGZhbHNlXG4gICAgICB0aGlzLnMucGFnZUlucHV0VmFsdWUgPSBTdHJpbmcodGhpcy5nZXRBY3RpdmVQYWdlKCkpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtwYWdlSW5wdXRGb2N1c2VkOiBmYWxzZX0sICgpID0+IHRoaXMuc2V0UGFnaW5hdGlvblBhZ2UobmV4dFBhZ2UpKVxuICB9XG5cbiAgLyoqIEBwYXJhbSB7aW1wb3J0KFwicmVhY3RcIikuU3ludGhldGljRXZlbnR9IGV2ZW50ICovXG4gIG9uUGFnaW5hdGlvbklucHV0S2V5RG93biA9IChldmVudCkgPT4ge1xuICAgIGlmIChldmVudD8ua2V5ICE9PSBcIkVudGVyXCIpIHJldHVyblxuXG4gICAgdGhpcy50dC5vblBhZ2luYXRpb25JbnB1dFN1Ym1pdChldmVudClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7aW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlfG51bGx9ICovXG4gIHBhZ2luYXRpb25Db250cm9scygpIHtcbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gdGhpcy5wYWdpbmF0aW9uVG90YWxQYWdlcygpXG5cbiAgICBpZiAoIXRvdGFsUGFnZXMgfHwgdG90YWxQYWdlcyA8PSAxKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgY3VycmVudFBhZ2UgPSB0aGlzLmdldEFjdGl2ZVBhZ2UoKVxuICAgIGNvbnN0IHByZXZEaXNhYmxlZCA9IGN1cnJlbnRQYWdlIDw9IDFcbiAgICBjb25zdCBuZXh0RGlzYWJsZWQgPSBjdXJyZW50UGFnZSA+PSB0b3RhbFBhZ2VzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPFZpZXdcbiAgICAgICAgc3R5bGU9e3N0eWxlcy5wYWdpbmF0aW9uQ29udGFpbmVyIHx8PSB7XG4gICAgICAgICAgYm9yZGVyVG9wQ29sb3I6IFwiI2UyZThmMFwiLFxuICAgICAgICAgIGJvcmRlclRvcFdpZHRoOiAxLFxuICAgICAgICAgIHBhZGRpbmc6IDhcbiAgICAgICAgfX1cbiAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3Qvb3B0aW9ucy1wYWdpbmF0aW9uXCJcbiAgICAgID5cbiAgICAgICAgPFZpZXdcbiAgICAgICAgICBzdHlsZT17c3R5bGVzLnBhZ2luYXRpb25IZWFkZXIgfHw9IHtmbGV4RGlyZWN0aW9uOiBcInJvd1wiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBqdXN0aWZ5Q29udGVudDogXCJzcGFjZS1iZXR3ZWVuXCJ9fVxuICAgICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L3BhZ2luYXRpb24taGVhZGVyXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxQcmVzc2FibGVcbiAgICAgICAgICAgIGRpc2FibGVkPXtwcmV2RGlzYWJsZWR9XG4gICAgICAgICAgICBvblByZXNzPXt0aGlzLnR0Lm9uUGFnaW5hdGlvblByZXZQcmVzc2VkfVxuICAgICAgICAgICAgc3R5bGU9e3N0eWxlc1tgcGFnaW5hdGlvbk5hdkJ1dHRvbi0ke3ByZXZEaXNhYmxlZH1gXSB8fD0ge1xuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2Y4ZmFmY1wiLFxuICAgICAgICAgICAgICBib3JkZXJDb2xvcjogXCIjY2JkNWUxXCIsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgICAgICAgICAgIGhlaWdodDogMzAsXG4gICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICBvcGFjaXR5OiBwcmV2RGlzYWJsZWQgPyAwLjQgOiAxLFxuICAgICAgICAgICAgICB3aWR0aDogMzBcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9wYWdpbmF0aW9uLXByZXZcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxGb250QXdlc29tZUljb25cbiAgICAgICAgICAgICAgbmFtZT1cImNoZXZyb24tbGVmdFwiXG4gICAgICAgICAgICAgIHN0eWxlPXtzdHlsZXMucGFnaW5hdGlvbk5hdkljb24gfHw9IHtjb2xvcjogXCIjMzM0MTU1XCIsIGZvbnRTaXplOiAxMn19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAgICAgIDxWaWV3XG4gICAgICAgICAgICBkYXRhU2V0PXt0aGlzLmNhY2hlKFwicGFnaW5hdGlvbkxhYmVsRGF0YVNldFwiLCB7XG4gICAgICAgICAgICAgIHBhZ2U6IGN1cnJlbnRQYWdlXG4gICAgICAgICAgICB9LCBbY3VycmVudFBhZ2VdKX1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZXMucGFnaW5hdGlvbkxhYmVsQnV0dG9uIHx8PSB7XG4gICAgICAgICAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjFmNWY5XCIsXG4gICAgICAgICAgICAgIGJvcmRlckNvbG9yOiBcIiNjYmQ1ZTFcIixcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAxNCxcbiAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICBtaW5XaWR0aDogMTQwLFxuICAgICAgICAgICAgICBwYWRkaW5nSG9yaXpvbnRhbDogMTAsXG4gICAgICAgICAgICAgIHBhZGRpbmdWZXJ0aWNhbDogNlxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L3BhZ2luYXRpb24tbGFiZWxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxUZXh0SW5wdXRcbiAgICAgICAgICAgICAga2V5Ym9hcmRUeXBlPVwibnVtYmVyLXBhZFwiXG4gICAgICAgICAgICAgIG9uQmx1cj17dGhpcy50dC5vblBhZ2luYXRpb25JbnB1dEJsdXJ9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlVGV4dD17dGhpcy50dC5vblBhZ2luYXRpb25JbnB1dENoYW5nZX1cbiAgICAgICAgICAgICAgb25Gb2N1cz17dGhpcy50dC5vblBhZ2luYXRpb25JbnB1dEZvY3VzfVxuICAgICAgICAgICAgICBvblByZXNzSW49e3RoaXMudHQub25QYWdpbmF0aW9uSW5wdXRGb2N1c31cbiAgICAgICAgICAgICAgb25LZXlEb3duPXt0aGlzLnR0Lm9uUGFnaW5hdGlvbklucHV0S2V5RG93bn1cbiAgICAgICAgICAgICAgb25TdWJtaXRFZGl0aW5nPXt0aGlzLnR0Lm9uUGFnaW5hdGlvbklucHV0U3VibWl0fVxuICAgICAgICAgICAgICByZWY9e3RoaXMudHQucGFnZUlucHV0UmVmfVxuICAgICAgICAgICAgICBzZWxlY3RUZXh0T25Gb2N1c1xuICAgICAgICAgICAgICBzdHlsZT17c3R5bGVzLnBhZ2luYXRpb25JbnB1dFN0eWxlIHx8PSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgY29sb3I6IFwiIzBmMTcyYVwiLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAxMixcbiAgICAgICAgICAgICAgICBvdXRsaW5lOiBQbGF0Zm9ybS5PUyA9PSBcIndlYlwiID8gXCJub25lXCIgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEyMFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9wYWdpbmF0aW9uLWlucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3RoaXMucGFnaW5hdGlvbklucHV0VmFsdWUodG90YWxQYWdlcyl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgICA8UHJlc3NhYmxlXG4gICAgICAgICAgICBkaXNhYmxlZD17bmV4dERpc2FibGVkfVxuICAgICAgICAgICAgb25QcmVzcz17dGhpcy50dC5vblBhZ2luYXRpb25OZXh0UHJlc3NlZH1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZXNbYHBhZ2luYXRpb25OYXZCdXR0b24tJHtuZXh0RGlzYWJsZWR9YF0gfHw9IHtcbiAgICAgICAgICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmOGZhZmNcIixcbiAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6IFwiI2NiZDVlMVwiLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDMwLFxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgb3BhY2l0eTogbmV4dERpc2FibGVkID8gMC40IDogMSxcbiAgICAgICAgICAgICAgd2lkdGg6IDMwXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvcGFnaW5hdGlvbi1uZXh0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Rm9udEF3ZXNvbWVJY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uLXJpZ2h0XCJcbiAgICAgICAgICAgICAgc3R5bGU9e3N0eWxlcy5wYWdpbmF0aW9uTmF2SWNvbiB8fD0ge2NvbG9yOiBcIiMzMzQxNTVcIiwgZm9udFNpemU6IDEyfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9QcmVzc2FibGU+XG4gICAgICAgIDwvVmlldz5cbiAgICAgICAgPFZpZXdcbiAgICAgICAgICBzdHlsZT17c3R5bGVzLnBhZ2luYXRpb25QYWdlcyB8fD0ge1xuICAgICAgICAgICAgZmxleERpcmVjdGlvbjogXCJyb3dcIixcbiAgICAgICAgICAgIGZsZXhXcmFwOiBcIndyYXBcIixcbiAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICAgICAgbWFyZ2luVG9wOiA4XG4gICAgICAgICAgfX1cbiAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9wYWdpbmF0aW9uLXBhZ2VzXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt0aGlzLnBhZ2luYXRpb25QYWdlSXRlbXModG90YWxQYWdlcykubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS50eXBlID09IFwiZWxsaXBzaXNcIikge1xuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxWaWV3XG4gICAgICAgICAgICAgICAgICBrZXk9e2l0ZW0ua2V5fVxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3N0eWxlcy5wYWdpbmF0aW9uRWxsaXBzaXMgfHw9IHtwYWRkaW5nSG9yaXpvbnRhbDogNn19XG4gICAgICAgICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9wYWdpbmF0aW9uLWVsbGlwc2lzXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8VGV4dFxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17c3R5bGVzLnBhZ2luYXRpb25FbGxpcHNpc1RleHQgfHw9IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjNjQ3NDhiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDYwMFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAuLi5cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8L1ZpZXc+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPFBhZ2luYXRpb25QYWdlQnV0dG9uXG4gICAgICAgICAgICAgICAgYWN0aXZlPXtpdGVtLnZhbHVlID09IGN1cnJlbnRQYWdlfVxuICAgICAgICAgICAgICAgIGtleT17aXRlbS5rZXl9XG4gICAgICAgICAgICAgICAgb25QYWdlU2VsZWN0ZWQ9e3RoaXMudHQuc2V0UGFnaW5hdGlvblBhZ2V9XG4gICAgICAgICAgICAgICAgcGFnZT17aXRlbS52YWx1ZX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9WaWV3PlxuICAgICAgPC9WaWV3PlxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3tsb2FkZWRPcHRpb25zOiBBcnJheTxIYXlhU2VsZWN0T3B0aW9uPnx1bmRlZmluZWR9fSBhcmdzIE9wdGlvbnMgdG8gcmVuZGVyLlxuICAgKiBAcmV0dXJucyB7aW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlfVxuICAgKi9cbiAgb3B0aW9uc0xpc3RDb250ZW50KHtsb2FkZWRPcHRpb25zfSkge1xuICAgIHJldHVybiAoXG4gICAgICA8PlxuICAgICAgICB7bG9hZGVkT3B0aW9ucz8ubWFwKChsb2FkZWRPcHRpb24pID0+XG4gICAgICAgICAgdGhpcy5oYXlhU2VsZWN0T3B0aW9uKHtcbiAgICAgICAgICAgIGtleTogbG9hZGVkT3B0aW9uLmtleSB8fCBgbG9hZGVkLW9wdGlvbi0ke2xvYWRlZE9wdGlvbi52YWx1ZX1gLFxuICAgICAgICAgICAgbG9hZGVkT3B0aW9uXG4gICAgICAgICAgfSlcbiAgICAgICAgKX1cbiAgICAgICAge2xvYWRlZE9wdGlvbnM/Lmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgIDxWaWV3XG4gICAgICAgICAgICBzdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwibm9PcHRpb25zQ29udGFpbmVyXCIsIHRoaXMubm9PcHRpb25zQ29udGFpbmVyU3R5bGUgfHw9IHtcbiAgICAgICAgICAgICAgcGFkZGluZ0JvdHRvbTogMTAsXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiA4LFxuICAgICAgICAgICAgICBwYWRkaW5nUmlnaHQ6IDgsXG4gICAgICAgICAgICAgIHBhZGRpbmdUb3A6IDEwXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L25vLW9wdGlvbnMtY29udGFpbmVyXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAge3RoaXMucC5ub09wdGlvbnNUZXh0ID8gdGhpcy5wLm5vT3B0aW9uc1RleHQoKSA6IHRoaXMudHJhbnNsYXRlKFwiLm5vX29wdGlvbnNfZm91bmRcIil9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9WaWV3PlxuICAgICAgICB9XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7aWQ6IHN0cmluZ3xudW1iZXIsIG9wdGlvbnNMaXN0Q29udGVudDogaW1wb3J0KFwicmVhY3RcIikuUmVhY3ROb2RlLCBwYWdpbmF0aW9uQ29udHJvbHM6IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZXxudWxsfX0gYXJncyBNb2JpbGUgc2hlZXQgY29udGVudC5cbiAgICogQHJldHVybnMge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX1cbiAgICovXG4gIG1vYmlsZU9wdGlvbnNDb250YWluZXIoe2lkLCBvcHRpb25zTGlzdENvbnRlbnQsIHBhZ2luYXRpb25Db250cm9sc30pIHtcbiAgICBjb25zdCBzaGVldE1heEhlaWdodCA9IE1hdGgucm91bmQoRGltZW5zaW9ucy5nZXQoXCJ3aW5kb3dcIikuaGVpZ2h0ICogMC44KVxuICAgIGxldCBzaGVldFN0eWxlID0gdGhpcy5zdHlsaW5nRm9yKFwib3B0aW9uc0NvbnRhaW5lclwiLCB7XG4gICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuICAgICAgekluZGV4OiAxMDAwMDAsXG4gICAgICBlbGV2YXRpb246IDEwMDAwMCxcbiAgICAgIGxlZnQ6IDEwLFxuICAgICAgcmlnaHQ6IDEwLFxuICAgICAgYm90dG9tOiAwLFxuICAgICAgbWF4SGVpZ2h0OiBzaGVldE1heEhlaWdodCxcbiAgICAgIHNoYWRvd0NvbG9yOiBcIiMwZjE3MmFcIixcbiAgICAgIHNoYWRvd09mZnNldDoge2hlaWdodDogLTEyLCB3aWR0aDogMH0sXG4gICAgICBzaGFkb3dPcGFjaXR5OiAwLjQ4LFxuICAgICAgc2hhZG93UmFkaXVzOiAzNCxcbiAgICAgIGJveFNoYWRvdzogUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIlxuICAgICAgICA/IFwiMCAtMjhweCA3MnB4IHJnYmEoMTUsIDIzLCA0MiwgMC41NiksIDAgLThweCAyNHB4IHJnYmEoMTUsIDIzLCA0MiwgMC4zOCksIDAgMCAwIDFweCByZ2JhKDE1LCAyMywgNDIsIDAuMTIpXCJcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZlwiLFxuICAgICAgYm9yZGVyVG9wTGVmdFJhZGl1czogMTgsXG4gICAgICBib3JkZXJUb3BSaWdodFJhZGl1czogMTgsXG4gICAgICBvcGFjaXR5OiB0aGlzLm1vYmlsZU9wdGlvbnNDb250YWluZXJQcm9ncmVzcyxcbiAgICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgICAgdHJhbnNmb3JtOiB0aGlzLm1vYmlsZU9wdGlvbnNDb250YWluZXJUcmFuc2Zvcm0sXG4gICAgICB2aXNpYmlsaXR5OiB0aGlzLnMub3B0aW9uc1Zpc2liaWxpdHlcbiAgICB9LCBbc2hlZXRNYXhIZWlnaHQsIHRoaXMucy5vcHRpb25zVmlzaWJpbGl0eV0pXG5cbiAgICBpZiAoXCJoZWlnaHRcIiBpbiBzaGVldFN0eWxlKSB7XG4gICAgICBzaGVldFN0eWxlID0gT2JqZWN0LmFzc2lnbih7fSwgc2hlZXRTdHlsZSlcbiAgICAgIGRlbGV0ZSBzaGVldFN0eWxlLmhlaWdodFxuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8Vmlld1xuICAgICAgICBzdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwibW9iaWxlT3B0aW9uc092ZXJsYXlcIiwgc3R5bGVzLm1vYmlsZU9wdGlvbnNPdmVybGF5IHx8PSB7XG4gICAgICAgICAgcG9zaXRpb246IFBsYXRmb3JtLk9TID09IFwid2ViXCIgPyBcImZpeGVkXCIgOiBcImFic29sdXRlXCIsXG4gICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgIHpJbmRleDogOTk5OTksXG4gICAgICAgICAgZWxldmF0aW9uOiA5OTk5OVxuICAgICAgICB9KX1cbiAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvbW9iaWxlLW9wdGlvbnMtb3ZlcmxheVwiXG4gICAgICA+XG4gICAgICAgIDxBbmltYXRlZC5WaWV3XG4gICAgICAgICAgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcIm1vYmlsZU9wdGlvbnNCYWNrZHJvcFwiLCB0aGlzLm1vYmlsZU9wdGlvbnNCYWNrZHJvcFN0eWxlIHx8PSB7XG4gICAgICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcInJnYmEoMTUsIDIzLCA0MiwgMC4zMilcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IHRoaXMubW9iaWxlT3B0aW9uc0JhY2tkcm9wT3BhY2l0eVxuICAgICAgICAgIH0pfVxuICAgICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L21vYmlsZS1vcHRpb25zLWJhY2tkcm9wXCJcbiAgICAgICAgICB7Li4udGhpcy50dC5tb2JpbGVPcHRpb25zQmFja2Ryb3BQYW5SZXNwb25kZXIucGFuSGFuZGxlcnN9XG4gICAgICAgIC8+XG4gICAgICAgIDxBbmltYXRlZC5WaWV3XG4gICAgICAgICAgZGF0YVNldD17dGhpcy5jYWNoZShcbiAgICAgICAgICAgIFwibW9iaWxlT3B0aW9uc0NvbnRhaW5lckRhdGFTZXRcIixcbiAgICAgICAgICAgIHtpZCwgcm9sZTogXCJkaWFsb2dcIiwgb3B0aW9uc1BsYWNlbWVudDogXCJzaGVldFwiLCBvcHRpb25zVmlzaWJpbGl0eTogdGhpcy5zLm9wdGlvbnNWaXNpYmlsaXR5IHx8IFwiaGlkZGVuXCJ9LFxuICAgICAgICAgICAgW2lkLCB0aGlzLnMub3B0aW9uc1Zpc2liaWxpdHldXG4gICAgICAgICAgKX1cbiAgICAgICAgICBvbkxheW91dD17dGhpcy50dC5vbk9wdGlvbnNDb250YWluZXJMYXlvdXR9XG4gICAgICAgICAgcmVmPXt0aGlzLnR0Lm9wdGlvbnNDb250YWluZXJSZWZ9XG4gICAgICAgICAgc3R5bGU9e3NoZWV0U3R5bGV9XG4gICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3Qvb3B0aW9ucy1jb250YWluZXJcIlxuICAgICAgICA+XG4gICAgICAgICAgPFNjcm9sbFZpZXdcbiAgICAgICAgICAgIGNvbnRlbnRDb250YWluZXJTdHlsZT17dGhpcy5zdHlsaW5nRm9yKFwibW9iaWxlT3B0aW9uc1Njcm9sbENvbnRlbnRcIiwgc3R5bGVzLm1vYmlsZU9wdGlvbnNTY3JvbGxDb250ZW50IHx8PSB7XG4gICAgICAgICAgICAgIGZsZXhHcm93OiAxLFxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogXCJmbGV4LWVuZFwiXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIGtleWJvYXJkU2hvdWxkUGVyc2lzdFRhcHM9XCJoYW5kbGVkXCJcbiAgICAgICAgICAgIG5lc3RlZFNjcm9sbEVuYWJsZWRcbiAgICAgICAgICAgIHN0eWxlPXt0aGlzLnN0eWxpbmdGb3IoXCJtb2JpbGVPcHRpb25zU2Nyb2xsVmlld1wiLCBzdHlsZXMubW9iaWxlT3B0aW9uc1Njcm9sbFZpZXcgfHw9IHtmbGV4R3JvdzogMCwgZmxleFNocmluazogMSwgbWluSGVpZ2h0OiAwfSl9XG4gICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9tb2JpbGUtb3B0aW9ucy1zY3JvbGwtdmlld1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge29wdGlvbnNMaXN0Q29udGVudH1cbiAgICAgICAgICA8L1Njcm9sbFZpZXc+XG4gICAgICAgICAge3BhZ2luYXRpb25Db250cm9sc31cbiAgICAgICAgICA8Vmlld1xuICAgICAgICAgICAgc3R5bGU9e3RoaXMuc3R5bGluZ0ZvcihcIm1vYmlsZU9wdGlvbnNTZWFyY2hDb250YWluZXJcIiwgc3R5bGVzLm1vYmlsZU9wdGlvbnNTZWFyY2hDb250YWluZXIgfHw9IHtcbiAgICAgICAgICAgICAgYm9yZGVyVG9wQ29sb3I6IFwiI2NiZDVlMVwiLFxuICAgICAgICAgICAgICBib3JkZXJUb3BXaWR0aDogMSxcbiAgICAgICAgICAgICAgcGFkZGluZ0JvdHRvbTogMTQsXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiAxNCxcbiAgICAgICAgICAgICAgcGFkZGluZ1JpZ2h0OiAxNCxcbiAgICAgICAgICAgICAgcGFkZGluZ1RvcDogMTBcbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3QvbW9iaWxlLW9wdGlvbnMtc2VhcmNoLWNvbnRhaW5lclwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3RoaXMuc2VhcmNoVGV4dElucHV0KHttb2JpbGVPcHRpb25zU2hlZXQ6IHRydWV9KX1cbiAgICAgICAgICA8L1ZpZXc+XG4gICAgICAgIDwvQW5pbWF0ZWQuVmlldz5cbiAgICAgIDwvVmlldz5cbiAgICApXG4gIH1cblxuICAvKiogQHJldHVybnMge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZXxudWxsfSAqL1xuICBvcHRpb25zQ29udGFpbmVyKCkge1xuICAgIGNvbnN0IHtzZWxlY3RDb250YWluZXJMYXlvdXQsIGxvYWRlZE9wdGlvbnMsIGVuZE9mU2VsZWN0TGF5b3V0LCBvcHRpb25zQ29udGFpbmVyTGF5b3V0LCBvcHRpb25zUGxhY2VtZW50LCBvcHRpb25zVmlzaWJpbGl0eX0gPSB0aGlzLnNcbiAgICBsZXQgbGVmdCwgdG9wXG4gICAgY29uc3QgaWQgPSBpZEZvckNvbXBvbmVudCh0aGlzKVxuICAgIGNvbnN0IGRlc2t0b3BPcHRpb25zUGxhY2VtZW50ID0gb3B0aW9uc1BsYWNlbWVudCA9PSBcInNoZWV0XCIgPyBcImJlbG93XCIgOiBvcHRpb25zUGxhY2VtZW50XG4gICAgY29uc3Qgb3B0aW9uc0xpc3RDb250ZW50ID0gdGhpcy5vcHRpb25zTGlzdENvbnRlbnQoe2xvYWRlZE9wdGlvbnN9KVxuICAgIGNvbnN0IHBhZ2luYXRpb25Db250cm9scyA9IHRoaXMucGFnaW5hdGlvbkNvbnRyb2xzKClcblxuICAgIGlmICh0aGlzLmlzTW9iaWxlT3B0aW9uc1NoZWV0KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vYmlsZU9wdGlvbnNDb250YWluZXIoe2lkLCBvcHRpb25zTGlzdENvbnRlbnQsIHBhZ2luYXRpb25Db250cm9sc30pXG4gICAgfVxuXG4gICAgbGV0IHN0eWxlID0ge1xuICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbiAgICAgIHpJbmRleDogOTk5OTksXG4gICAgICBlbGV2YXRpb246IDk5OTk5LFxuICAgICAgdmlzaWJpbGl0eTogb3B0aW9uc1Zpc2liaWxpdHksXG4gICAgICB3aWR0aDogdGhpcy5wLm9wdGlvbnNXaWR0aCB8fCB0aGlzLnMub3B0aW9uc1dpZHRoLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmZcIixcbiAgICAgIGJvcmRlckNvbG9yOiBcIiM5OTlcIixcbiAgICAgIGJvcmRlcldpZHRoOiAxLFxuICAgICAgbWF4SGVpZ2h0OiAzMDAsXG4gICAgICBvdmVyZmxvdzogXCJoaWRkZW5cIlxuICAgIH1cblxuICAgIGlmICghdGhpcy5wLm9wdGlvbnNQb3J0YWwpIHtcbiAgICAgIHN0eWxlLnRvcCA9IDBcbiAgICAgIHN0eWxlLmxlZnQgPSAwXG4gICAgfSBlbHNlIGlmICghdGhpcy5wLm9wdGlvbnNBYnNvbHV0ZSkge1xuICAgICAgc3R5bGUubGVmdCA9IDBcbiAgICAgIHN0eWxlLmJvdHRvbSA9IDBcbiAgICB9IGVsc2UgaWYgKGRlc2t0b3BPcHRpb25zUGxhY2VtZW50ID09IFwiYmVsb3dcIikge1xuICAgICAgaWYgKFBsYXRmb3JtLk9TID09IFwid2ViXCIpIHtcbiAgICAgICAgLy8gb25MYXlvdXQgdG9wIHZhbHVlIGlzIHNvbWV0aW1lcyBuZWdhdGl2ZSBzbyB1c2UgYnJvd3NlciBKUyB0byBnZXQgaXQgaW5zdGVhZFxuICAgICAgICB0b3AgPSBkaWdnKHRoaXMudHQuZW5kT2ZTZWxlY3RSZWYuY3VycmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgXCJ0b3BcIikgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wICsgMVxuXG4gICAgICAgIC8vIG9uTGF5b3V0IGxlZnQgdmFsdWVzIGRvZXNuJ3QgYWx3YXlzIHVwZGF0ZSB3aGVuIGNoYW5nZWRcbiAgICAgICAgbGVmdCA9IGRpZ2codGhpcy50dC5lbmRPZlNlbGVjdFJlZi5jdXJyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBcImxlZnRcIikgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGVmdCA9IHNlbGVjdENvbnRhaW5lckxheW91dD8ubGVmdFxuICAgICAgICB0b3AgPSB0eXBlb2Ygc2VsZWN0Q29udGFpbmVyTGF5b3V0Py50b3AgPT0gXCJudW1iZXJcIiAmJiB0eXBlb2Ygc2VsZWN0Q29udGFpbmVyTGF5b3V0Py5oZWlnaHQgPT0gXCJudW1iZXJcIlxuICAgICAgICAgID8gc2VsZWN0Q29udGFpbmVyTGF5b3V0LnRvcCArIHNlbGVjdENvbnRhaW5lckxheW91dC5oZWlnaHQgKyAxXG4gICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShsZWZ0KSAmJiBOdW1iZXIuaXNGaW5pdGUodG9wKSkge1xuICAgICAgICBzdHlsZS5sZWZ0ID0gbGVmdFxuICAgICAgICBzdHlsZS50b3AgPSBQbGF0Zm9ybS5PUyA9PSBcIndlYlwiID8gdG9wIC0gMiA6IHRvcFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUubGVmdCA9IDBcbiAgICAgICAgc3R5bGUudG9wID0gMFxuICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIlxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGVza3RvcE9wdGlvbnNQbGFjZW1lbnQgPT0gXCJhYm92ZVwiKSB7XG4gICAgICBpZiAoUGxhdGZvcm0uT1MgPT0gXCJ3ZWJcIikge1xuICAgICAgICAvLyBvbkxheW91dCB0b3AgdmFsdWUgaXMgc29tZXRpbWVzIG5lZ2F0aXZlIHNvIHVzZSBicm93c2VyIEpTIHRvIGdldCBpdCBpbnN0ZWFkXG4gICAgICAgIHRvcCA9IGRpZ2codGhpcy50dC5zZWxlY3RDb250YWluZXJSZWYuY3VycmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgXCJ0b3BcIikgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG5cbiAgICAgICAgLy8gb25MYXlvdXQgbGVmdCB2YWx1ZXMgZG9lc24ndCBhbHdheXMgdXBkYXRlIHdoZW4gY2hhbmdlZFxuICAgICAgICBsZWZ0ID0gZGlnZyh0aGlzLnR0LnNlbGVjdENvbnRhaW5lclJlZi5jdXJyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBcImxlZnRcIikgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGVmdCA9IHNlbGVjdENvbnRhaW5lckxheW91dD8ubGVmdFxuICAgICAgICB0b3AgPSBzZWxlY3RDb250YWluZXJMYXlvdXQ/LnRvcFxuICAgICAgfVxuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxlZnQpICYmIE51bWJlci5pc0Zpbml0ZSh0b3ApKSB7XG4gICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0XG4gICAgICAgIHN0eWxlLnRvcCA9IHRvcCAtIG9wdGlvbnNDb250YWluZXJMYXlvdXQuaGVpZ2h0ICsgMVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUubGVmdCA9IDBcbiAgICAgICAgc3R5bGUudG9wID0gMFxuICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIlxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua29ud24gb3B0aW9ucyBwbGFjZW1lbnQ6ICR7ZGVza3RvcE9wdGlvbnNQbGFjZW1lbnR9YClcbiAgICB9XG5cbiAgICBpZiAoUGxhdGZvcm0uT1MgIT0gXCJ3ZWJcIikge1xuICAgICAgc3R5bGUub3BhY2l0eSA9IG9wdGlvbnNWaXNpYmlsaXR5ID09IFwiaGlkZGVuXCIgPyAwIDogMVxuICAgICAgc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiXG4gICAgfVxuXG4gICAgc3R5bGUgPSB0aGlzLnN0eWxpbmdGb3IoXCJvcHRpb25zQ29udGFpbmVyXCIsIHN0eWxlLCBbbGVmdCwgdG9wLCBzdHlsZS52aXNpYmlsaXR5LCBzdHlsZS53aWR0aF0pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPFZpZXdcbiAgICAgICAgZGF0YVNldD17dGhpcy5jYWNoZShcbiAgICAgICAgICBcIm9wdGlvbnNDb250YWluZXJEYXRhU2V0XCIsXG4gICAgICAgICAge2lkLCByb2xlOiBcImRpYWxvZ1wiLCBvcHRpb25zVmlzaWJpbGl0eTogb3B0aW9uc1Zpc2liaWxpdHkgfHwgXCJoaWRkZW5cIn0sXG4gICAgICAgICAgW2lkLCBvcHRpb25zVmlzaWJpbGl0eV1cbiAgICAgICAgKX1cbiAgICAgICAgb25MYXlvdXQ9e3RoaXMudHQub25PcHRpb25zQ29udGFpbmVyTGF5b3V0fVxuICAgICAgICByZWY9e3RoaXMudHQub3B0aW9uc0NvbnRhaW5lclJlZn1cbiAgICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9vcHRpb25zLWNvbnRhaW5lclwiXG4gICAgICA+XG4gICAgICAgIDxTY3JvbGxWaWV3XG4gICAgICAgICAga2V5Ym9hcmRTaG91bGRQZXJzaXN0VGFwcz1cImhhbmRsZWRcIlxuICAgICAgICAgIG5lc3RlZFNjcm9sbEVuYWJsZWRcbiAgICAgICAgICBzdHlsZT17c3R5bGVzW2BvcHRpb25zU2Nyb2xsVmlldy0ke3N0eWxlLm1heEhlaWdodCB8fCAzMDB9YF0gfHw9IHtcbiAgICAgICAgICAgIGZsZXhHcm93OiAwLFxuICAgICAgICAgICAgZmxleFNocmluazogMSxcbiAgICAgICAgICAgIG1heEhlaWdodDogc3R5bGUubWF4SGVpZ2h0IHx8IDMwMCxcbiAgICAgICAgICAgIG1pbkhlaWdodDogMFxuICAgICAgICAgIH19XG4gICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3Qvb3B0aW9ucy1zY3JvbGwtdmlld1wiXG4gICAgICAgID5cbiAgICAgICAgICB7b3B0aW9uc0xpc3RDb250ZW50fVxuICAgICAgICA8L1Njcm9sbFZpZXc+XG4gICAgICAgIHtwYWdpbmF0aW9uQ29udHJvbHN9XG4gICAgICA8L1ZpZXc+XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7aW1wb3J0KFwicmVhY3RcIikuU3ludGhldGljRXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7SGF5YVNlbGVjdE9wdGlvbn0gbG9hZGVkT3B0aW9uXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgb25PcHRpb25DbGlja2VkID0gKGV2ZW50LCBsb2FkZWRPcHRpb24pID0+IHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGNvbnN0IHtvbkNoYW5nZSwgdG9nZ2xlT3B0aW9uc30gPSB0aGlzLnByb3BzXG4gICAgY29uc3Qge211bHRpcGxlfSA9IHRoaXMucFxuICAgIGNvbnN0IGN1cnJlbnRPcHRpb25zID0gdGhpcy5nZXRDdXJyZW50T3B0aW9ucygpXG4gICAgY29uc3QgdG9nZ2xlZCA9IHRoaXMuZ2V0VG9nZ2xlZCgpXG4gICAgY29uc3QgbmV3U3RhdGUgPSB7fVxuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9uID0gY3VycmVudE9wdGlvbnMuZmluZCgoY3VycmVudE9wdGlvbikgPT4gY3VycmVudE9wdGlvbi52YWx1ZSA9PSBsb2FkZWRPcHRpb24udmFsdWUpXG4gICAgY29uc3QgbmV3VG9nZ2xlZCA9IHsuLi50b2dnbGVkfVxuICAgIGxldCBuZXdDdXJyZW50T3B0aW9uc1xuICAgIGxldCBhY3Rpb25cblxuICAgIGlmIChleGlzdGluZ09wdGlvbikge1xuICAgICAgaWYgKHRvZ2dsZU9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFRvZ2dsZSA9IHRvZ2dsZWRbbG9hZGVkT3B0aW9uLnZhbHVlXVxuICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSB0b2dnbGVPcHRpb25zLmZpbmRJbmRleCgoZWxlbWVudCkgPT4gZWxlbWVudC52YWx1ZSA9PSBjdXJyZW50VG9nZ2xlKVxuXG4gICAgICAgIGlmIChjdXJyZW50SW5kZXggPj0gKHRvZ2dsZU9wdGlvbnMubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAvLyBObyBuZXh0IHRvZ2dsZWQgLSByZW1vdmUgdG9nZ2xlZCBhbmQgb3B0aW9uXG4gICAgICAgICAgZGVsZXRlIG5ld1RvZ2dsZWRbbG9hZGVkT3B0aW9uLnZhbHVlXVxuICAgICAgICAgIGFjdGlvbiA9IFwicmVtb3ZlLW9wdGlvbi1hZnRlci1sYXN0LXRvZ2dsZVwiXG5cbiAgICAgICAgICBuZXdDdXJyZW50T3B0aW9ucyA9IGN1cnJlbnRPcHRpb25zLmZpbHRlcigoY3VycmVudE9wdGlvbikgPT4gY3VycmVudE9wdGlvbi52YWx1ZSAhPSBsb2FkZWRPcHRpb24udmFsdWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQWxyZWFkeSB0b2dnbGVkIC0gc2V0IHRvIG5leHQgdG9nZ2xlXG4gICAgICAgICAgbmV3VG9nZ2xlZFtsb2FkZWRPcHRpb24udmFsdWVdID0gZGlnZyh0b2dnbGVPcHRpb25zLCBjdXJyZW50SW5kZXggKyAxLCBcInZhbHVlXCIpXG4gICAgICAgICAgYWN0aW9uID0gXCJjeWNsZS10b2dnbGVcIlxuICAgICAgICB9XG5cbiAgICAgICAgbmV3U3RhdGUudG9nZ2xlZCA9IG5ld1RvZ2dsZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlbW92ZSBmcm9tIGN1cnJlbnQgb3B0aW9uc1xuICAgICAgICBhY3Rpb24gPSBcInJlbW92ZS1vcHRpb25cIlxuICAgICAgICBuZXdDdXJyZW50T3B0aW9ucyA9IGN1cnJlbnRPcHRpb25zLmZpbHRlcigoY3VycmVudE9wdGlvbikgPT4gY3VycmVudE9wdGlvbi52YWx1ZSAhPSBsb2FkZWRPcHRpb24udmFsdWUpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBjbGlja2VkIG9wdGlvbiBpcyBkaXNhYmxlZFxuICAgICAgaWYgKGxvYWRlZE9wdGlvbi5kaXNhYmxlZCkge1xuICAgICAgICBpZiAodGhpcy5pc0RlYnVnRW5hYmxlZCgpKSB0aGlzLmRlYnVnTG9nKFwib25PcHRpb25DbGlja2VkXCIsIHtcbiAgICAgICAgICBhY3Rpb246IFwiaWdub3JlLWRpc2FibGVkLW9wdGlvblwiLFxuICAgICAgICAgIG9wdGlvblZhbHVlOiBsb2FkZWRPcHRpb24udmFsdWVcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2dnbGVPcHRpb25zKSB7XG4gICAgICAgIC8vIFNldCBmcmVzaCB0b2dnbGVcbiAgICAgICAgbmV3VG9nZ2xlZFtsb2FkZWRPcHRpb24udmFsdWVdID0gdG9nZ2xlT3B0aW9uc1swXS52YWx1ZVxuICAgICAgICBuZXdTdGF0ZS50b2dnbGVkID0gbmV3VG9nZ2xlZFxuICAgICAgfVxuXG4gICAgICBpZiAobXVsdGlwbGUgfHwgdG9nZ2xlT3B0aW9ucykge1xuICAgICAgICBhY3Rpb24gPSBcImFkZC1vcHRpb25cIlxuICAgICAgICBuZXdDdXJyZW50T3B0aW9ucyA9IGN1cnJlbnRPcHRpb25zLmNvbmNhdChbbG9hZGVkT3B0aW9uXSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbiA9IFwicmVwbGFjZS1zaW5nbGUtb3B0aW9uXCJcbiAgICAgICAgbmV3Q3VycmVudE9wdGlvbnMgPSBbbG9hZGVkT3B0aW9uXVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChcInZhbHVlc1wiIGluIHRoaXMucHJvcHMgJiYgdGhpcy5wcm9wcy52YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gY3VycmVudE9wdGlvbnMgYXJlIGNvbnRyb2xsZWQgYW5kIGEgdXNlTWVtbyBjYWxsYmFjayBpcyBoYW5kZWxpbmcgc2V0dGluZyBjdXJyZW50IG9wdGlvbnMuXG4gICAgfSBlbHNlIGlmIChuZXdDdXJyZW50T3B0aW9ucykge1xuICAgICAgbmV3U3RhdGUuY3VycmVudE9wdGlvbnMgPSBuZXdDdXJyZW50T3B0aW9uc1xuICAgIH1cblxuICAgIGNvbnN0IG9wdGlvbnMgPSBuZXdDdXJyZW50T3B0aW9ucyB8fCBjdXJyZW50T3B0aW9uc1xuICAgIGlmICh0aGlzLmlzRGVidWdFbmFibGVkKCkpIHRoaXMuZGVidWdMb2coXCJvbk9wdGlvbkNsaWNrZWRcIiwge1xuICAgICAgYWN0aW9uOiBhY3Rpb24gfHwgXCJ0b2dnbGUtb25seVwiLFxuICAgICAgbXVsdGlwbGUsXG4gICAgICBvcHRpb25WYWx1ZTogbG9hZGVkT3B0aW9uLnZhbHVlLFxuICAgICAgb3B0aW9uc0NvdW50QmVmb3JlOiBjdXJyZW50T3B0aW9ucy5sZW5ndGgsXG4gICAgICBvcHRpb25zQ291bnRBZnRlcjogb3B0aW9ucy5sZW5ndGhcbiAgICB9KVxuXG4gICAgaWYgKCFtdWx0aXBsZSB8fCB0aGlzLnAuY2xvc2VPbkNoYW5nZSkgdGhpcy5jbG9zZU9wdGlvbnMoe29wdGlvbnN9KVxuXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICAvKiogQHR5cGUge0hheWFTZWxlY3RPbkNoYW5nZVBheWxvYWR9ICovXG4gICAgICBvbkNoYW5nZSh7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBvcHRpb25zLFxuICAgICAgICB0b2dnbGVzOiBuZXdUb2dnbGVkXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLm9uQ2hhbmdlVmFsdWUpIHtcbiAgICAgIGxldCBvcHRpb25WYWx1ZVxuXG4gICAgICBpZiAobXVsdGlwbGUpIHtcbiAgICAgICAgb3B0aW9uVmFsdWUgPSBvcHRpb25zLm1hcCgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25WYWx1ZSA9IGRpZyhvcHRpb25zLCAwLCBcInZhbHVlXCIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMucC5vbkNoYW5nZVZhbHVlKG9wdGlvblZhbHVlKVxuICAgIH1cblxuICAgIGlmIChcInRvZ2dsZWRcIiBpbiBuZXdTdGF0ZSkge1xuICAgICAgdGhpcy5zLnRvZ2dsZWQgPSBuZXdTdGF0ZS50b2dnbGVkXG4gICAgfVxuXG4gICAgaWYgKFwiY3VycmVudE9wdGlvbnNcIiBpbiBuZXdTdGF0ZSkge1xuICAgICAgdGhpcy5zLmN1cnJlbnRPcHRpb25zID0gbmV3U3RhdGUuY3VycmVudE9wdGlvbnNcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0eWxpbmdOYW1lXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW3N0eWxlXVxuICAgKiBAcGFyYW0ge0FycmF5PGFueT59IFtjYWNoZXNdXG4gICAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fVxuICAgKi9cbiAgc3R5bGluZ0ZvcihzdHlsaW5nTmFtZSwgc3R5bGUgPSB7fSwgY2FjaGVzID0gW10pIHtcbiAgICBsZXQgY3VzdG9tU3R5bGluZyA9IGRpZyh0aGlzLCBcInByb3BzXCIsIFwic3R5bGVzXCIsIHN0eWxpbmdOYW1lKVxuICAgIGNvbnN0IGJhc2VTdHlsZSA9IHsuLi5zdHlsZX1cblxuICAgIGlmICh0eXBlb2YgY3VzdG9tU3R5bGluZyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIC8qKiBAdHlwZSB7SGF5YVNlbGVjdFN0eWxpbmdDb250ZXh0fSAqL1xuICAgICAgY3VzdG9tU3R5bGluZyA9IGN1c3RvbVN0eWxpbmcoe1xuICAgICAgICBvcGVuZWQ6IHRoaXMucy5vcGVuZWQsXG4gICAgICAgIG9wdGlvbnNQbGFjZW1lbnQ6IHRoaXMucy5vcHRpb25zUGxhY2VtZW50LFxuICAgICAgICBzdGF0ZTogdGhpcy5zdGF0ZSxcbiAgICAgICAgc3R5bGU6IGJhc2VTdHlsZVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY3VzdG9tU3R5bGluZykge1xuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGJhc2VTdHlsZSwgY3VzdG9tU3R5bGluZylcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jYWNoZShgc3R5bGluZ0Zvci0ke3N0eWxpbmdOYW1lfWAsIHN0eWxlLCBjYWNoZXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtIYXlhU2VsZWN0T3B0aW9ufSBvcHRpb25cbiAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9XG4gICAqL1xuICBpY29uRm9yT3B0aW9uKG9wdGlvbikge1xuICAgIGNvbnN0IHt0b2dnbGVPcHRpb25zfSA9IHRoaXMucHJvcHMgfHwge31cbiAgICBjb25zdCB0b2dnbGVkID0gdGhpcy5nZXRUb2dnbGVkKClcblxuICAgIGlmICh0b2dnbGVPcHRpb25zICYmIChvcHRpb24udmFsdWUgaW4gdG9nZ2xlZCkpIHtcbiAgICAgIGNvbnN0IHRvZ2dsZWRWYWx1ZSA9IHRvZ2dsZWRbb3B0aW9uLnZhbHVlXVxuICAgICAgY29uc3QgdG9nZ2xlZE9wdGlvbiA9IHRvZ2dsZU9wdGlvbnMuZmluZCgoZWxlbWVudCkgPT4gZWxlbWVudC52YWx1ZSA9PSB0b2dnbGVkVmFsdWUpXG5cbiAgICAgIGlmICghdG9nZ2xlZE9wdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkbid0IGZpbmQgYSB0b2dnbGUgb3B0aW9uIGZvciB2YWx1ZTogJHt0b2dnbGVkVmFsdWV9YClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRvZ2dsZWRPcHRpb24uaWNvblxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hheWFTZWxlY3RPcHRpb259IG9wdGlvblxuICAgKiBAcGFyYW0ge1wiY3VycmVudFwifFwib3B0aW9uXCJ9IG1vZGVcbiAgICogQHJldHVybnMge2ltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX1cbiAgICovXG4gIHByZXNlbnRPcHRpb24gPSAob3B0aW9uLCBtb2RlKSA9PiB7XG4gICAgY29uc3Qge29wdGlvbkNvbnRlbnQsIHRvZ2dsZU9wdGlvbnN9ID0gdGhpcy5wcm9wcyB8fCB7fVxuICAgIGNvbnN0IHRvZ2dsZWQgPSB0aGlzLmdldFRvZ2dsZWQoKVxuICAgIGNvbnN0IGljb24gPSB0aGlzLmljb25Gb3JPcHRpb24ob3B0aW9uKVxuICAgIGNvbnN0IHRvZ2dsZVZhbHVlID0gdG9nZ2xlZFtvcHRpb24udmFsdWVdXG4gICAgY29uc3QgdG9nZ2xlT3B0aW9uID0gdG9nZ2xlT3B0aW9ucz8uZmluZCgodG9nZ2xlT3B0aW9uSSkgPT4gdG9nZ2xlT3B0aW9uSS52YWx1ZSA9PSB0b2dnbGVWYWx1ZSlcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuZ2V0Q3VycmVudE9wdGlvblZhbHVlcygpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSA9PSBvcHRpb24udmFsdWUpXG4gICAgbGV0IHN0eWxlXG4gICAgbGV0IGNvbnRlbnROb2RlXG5cbiAgICBpZiAobW9kZSA9PSBcImN1cnJlbnRcIikge1xuICAgICAgc3R5bGUgPSB0aGlzLnN0eWxpbmdGb3IoXCJjdXJyZW50T3B0aW9uUHJlc2VudGF0aW9uVGV4dFwiLCB7ZmxleDogMSwgd2hpdGVTcGFjZTogXCJub3dyYXBcIn0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlID0gdGhpcy5zdHlsaW5nRm9yKFwib3B0aW9uUHJlc2VudGF0aW9uVGV4dFwiLCB7ZmxleDogMSwgd2hpdGVTcGFjZTogXCJub3dyYXBcIn0pXG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxWaWV3XG4gICAgICAgIGRhdGFTZXQ9e3RoaXMuY2FjaGUoXCJwcmVzZW50T3B0aW9uVmlld0RhdGFTZXRcIiwge1xuICAgICAgICAgIHRleHQ6IG9wdGlvbi50ZXh0LFxuICAgICAgICAgIHRvZ2dsZUljb246IHRvZ2dsZU9wdGlvbj8uaWNvbixcbiAgICAgICAgICB0b2dnbGVWYWx1ZTogdG9nZ2xlT3B0aW9uPy52YWx1ZSxcbiAgICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlXG4gICAgICAgIH0sIFtvcHRpb24udGV4dCwgb3B0aW9uLnZhbHVlLCB0b2dnbGVPcHRpb24/Lmljb24sIHRvZ2dsZU9wdGlvbj8udmFsdWVdKX1cbiAgICAgICAgc3R5bGU9e3RoaXMuY2FjaGUoXCJvcHRpb25QcmVzZW50YXRpb25TdHlsZVwiLCB7ZmxleERpcmVjdGlvbjogXCJyb3dcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIn0pfVxuICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC9vcHRpb24tcHJlc2VudGF0aW9uXCJcbiAgICAgID5cbiAgICAgICAge3RvZ2dsZU9wdGlvbnMgJiYgIShvcHRpb24udmFsdWUgaW4gdG9nZ2xlZCkgJiZcbiAgICAgICAgICA8Vmlld1xuICAgICAgICAgICAgc3R5bGU9e3RoaXMuY2FjaGUoXCJ0b2dnbGVJY29uUGxhY2Vob2xkZXJTdHlsZVwiLCB7d2lkdGg6IDIwfSl9XG4gICAgICAgICAgICB0ZXN0SUQ9XCJoYXlhLXNlbGVjdC90b2dnbGUtaWNvbi1wbGFjZWhvbGRlclwiXG4gICAgICAgICAgLz5cbiAgICAgICAgfVxuICAgICAgICB7dG9nZ2xlT3B0aW9ucyAmJiAob3B0aW9uLnZhbHVlIGluIHRvZ2dsZWQpICYmXG4gICAgICAgICAgPFZpZXcgc3R5bGU9e3RoaXMuY2FjaGUoXCJ0b2dnbGVJY29uQ29udGFpbmVyU3R5bGVcIiwge2FsaWduSXRlbXM6IFwiY2VudGVyXCIsIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLCB3aWR0aDogMjB9KX0+XG4gICAgICAgICAgICA8Rm9udEF3ZXNvbWVJY29uXG4gICAgICAgICAgICAgIG5hbWU9e2ljb259XG4gICAgICAgICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L3RvZ2dsZS1pY29uXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9WaWV3PlxuICAgICAgICB9XG4gICAgICAgIHsoKCkgPT4ge1xuICAgICAgICAgIGlmIChvcHRpb25Db250ZW50KSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0hheWFTZWxlY3RPcHRpb25SZW5kZXJDb250ZXh0fSAqL1xuICAgICAgICAgICAgY29udGVudE5vZGUgPSBvcHRpb25Db250ZW50KHtpY29uLCBtb2RlLCBvcHRpb24sIHNlbGVjdGVkLCB0b2dnbGVPcHRpb24sIHRvZ2dsZVZhbHVlLCB0b2dnbGVkfSlcbiAgICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gXCJjdXJyZW50XCIgJiYgb3B0aW9uLmN1cnJlbnRDb250ZW50KSB7XG4gICAgICAgICAgICBjb250ZW50Tm9kZSA9IG9wdGlvbi5jdXJyZW50Q29udGVudCgpXG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb24uY29udGVudCkge1xuICAgICAgICAgICAgY29udGVudE5vZGUgPSBvcHRpb24uY29udGVudCgpXG4gICAgICAgICAgfSBlbHNlIGlmIChcImh0bWxcIiBpbiBvcHRpb24gJiYgUGxhdGZvcm0uT1MgIT0gXCJ3ZWJcIikge1xuICAgICAgICAgICAgY29udGVudE5vZGUgPSA8UmVuZGVySHRtbCBzb3VyY2U9e3todG1sOiBkaWdnKG9wdGlvbiwgXCJodG1sXCIpfX0gLz5cbiAgICAgICAgICB9IGVsc2UgaWYgKFwiaHRtbFwiIGluIG9wdGlvbiAmJiBQbGF0Zm9ybS5PUyA9PSBcIndlYlwiKSB7XG4gICAgICAgICAgICBjb250ZW50Tm9kZSA9IDxkaXYgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IGRpZ2cob3B0aW9uLCBcImh0bWxcIil9fSAvPlxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50Tm9kZSA9IChcbiAgICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgICAgICAgICAgdGVzdElEPVwiaGF5YS1zZWxlY3Qvb3B0aW9uLXByZXNlbnRhdGlvbi10ZXh0XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtvcHRpb24udGV4dH1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICA8VmlldyBzdHlsZT17dGhpcy5jYWNoZShcIm9wdGlvblByZXNlbnRhdGlvbkNvbnRlbnRTdHlsZVwiLCB7ZmxleDogMX0pfT5cbiAgICAgICAgICAgICAgICB7Y29udGVudE5vZGV9XG4gICAgICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgICAgICAge29wdGlvbi5yaWdodCAmJlxuICAgICAgICAgICAgICAgIDxWaWV3IHN0eWxlPXt0aGlzLmNhY2hlKFwib3B0aW9uUHJlc2VudGF0aW9uUmlnaHRTdHlsZVwiLCB7YWxpZ25JdGVtczogXCJjZW50ZXJcIiwganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsIG1hcmdpbkxlZnQ6IDh9KX0+XG4gICAgICAgICAgICAgICAgICB7b3B0aW9uLnJpZ2h0fVxuICAgICAgICAgICAgICAgIDwvVmlldz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKVxuICAgICAgICB9KSgpfVxuICAgICAgPC9WaWV3PlxuICAgIClcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gKi9cbiAgYXN5bmMgc2V0Q3VycmVudEZyb21HaXZlblZhbHVlcygpIHtcbiAgICBjb25zdCB7b3B0aW9ucywgdmFsdWVzfSA9IHRoaXMucFxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzKSAmJiB2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAodGhpcy5zLmN1cnJlbnRPcHRpb25zPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5zLmN1cnJlbnRPcHRpb25zID0gW11cbiAgICAgIH1cblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3B0aW9ucyh7cGFnZTogdGhpcy5nZXRBY3RpdmVQYWdlKCksIHZhbHVlc30pXG4gICAgY29uc3Qge29wdGlvbnM6IGN1cnJlbnRPcHRpb25zfSA9IHRoaXMucGFyc2VPcHRpb25zUmVzdWx0KHJlc3VsdClcbiAgICBjb25zdCBjdXJyZW50VmFsdWVzID0gY3VycmVudE9wdGlvbnM/Lm1hcCgoY3VycmVudE9wdGlvbikgPT4gY3VycmVudE9wdGlvbi52YWx1ZSlcbiAgICBjb25zdCBzdGF0ZVZhbHVlcyA9IHRoaXMucy5jdXJyZW50T3B0aW9ucz8ubWFwKChjdXJyZW50T3B0aW9uKSA9PiBjdXJyZW50T3B0aW9uLnZhbHVlKVxuXG4gICAgaWYgKGFueXRoaW5nRGlmZmVyZW50KGN1cnJlbnRWYWx1ZXMsIHN0YXRlVmFsdWVzKSkge1xuICAgICAgdGhpcy5zLmN1cnJlbnRPcHRpb25zID0gY3VycmVudE9wdGlvbnNcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgSGF5YVNlbGVjdFNoYXBlQ29tcG9uZW50ID0gc2hhcGVDb21wb25lbnQoSGF5YVNlbGVjdClcblxuZXhwb3J0IGRlZmF1bHQgbWVtbyhIYXlhU2VsZWN0U2hhcGVDb21wb25lbnQpXG4iXX0=