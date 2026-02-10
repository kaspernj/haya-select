import {anythingDifferent} from "set-state-compare/build/diff-utils"
import Config from "../config.js"
import {dig,digg} from "diggerize"
import {Dimensions,Platform,Pressable,TextInput,View} from "react-native"
import React,{memo,useEffect,useRef} from "react"
import {shapeComponent,ShapeComponent} from "set-state-compare/build/shape-component.js"
import debounce from "debounce"
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome"
import idForComponent from "@kaspernj/api-maker/build/inputs/id-for-component"
import nameForComponent from "@kaspernj/api-maker/build/inputs/name-for-component"
import Text from "@kaspernj/api-maker/build/utils/text"
import Option from "./option"
import OptionGroup from "./option-group"
import PropTypes from "prop-types"
import propTypesExact from "prop-types-exact"
import RenderHtml from "react-native-render-html"
import {Portal} from "conjointment"
import useEventListener from "ya-use-event-listener"
import usePressOutside from "outside-eye/build/use-press-outside"

const styles = {}
const dataSets = {}
const paginationButtonDataSets = {}
const paginationButtonStyles = {}

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
 * @property {object} [defaultToggled]
 * @property {string|number} [defaultValue]
 * @property {Array<string|number>} [defaultValues]
 * @property {Array<HayaSelectOption>} [defaultValuesFromOptions]
 * @property {boolean} [debug]
 * @property {import("react").ReactNode} [id]
 * @property {object} [model]
 * @property {boolean} multiple
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
 * @property {boolean} optionsAbsolute
 * @property {boolean} optionsPortal
 * @property {number} [optionsWidth]
 * @property {import("react").ReactNode} [placeholder]
 * @property {string} [selectedBackgroundColor]
 * @property {string} [selectedHoverBackgroundColor]
 * @property {boolean} search
 * @property {object} [styles]
 * @property {object} [toggled]
 * @property {Array<HayaSelectToggleOption>} [toggleOptions]
 * @property {boolean} transparent
 * @property {Array<string|number>} [values]
 */

/** @returns {string} */
const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  const currentOptions = component.getCurrentOptions()

  if (component.props.multiple && name && currentOptions.length > 0) {
    name += "[]"
  }

  return name
}

/**
 * @typedef {object} PaginationPageButtonProps
 * @property {boolean} active
 * @property {number} page
 * @property {function(number): void} onPageSelected
 */

/** @extends {ShapeComponent<PaginationPageButtonProps>} */
const PaginationPageButton = memo(shapeComponent(class PaginationPageButton extends ShapeComponent {
  static propTypes = propTypesExact({
    active: PropTypes.bool.isRequired,
    page: PropTypes.number.isRequired,
    onPageSelected: PropTypes.func.isRequired
  })

  /** @param {import("react").SyntheticEvent} event */
  onPress = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    this.p.onPageSelected(this.p.page)
  }

  render() {
    const {active, page} = this.p

    return (
      <Pressable
        dataSet={paginationButtonDataSets[`paginationPage-${page}`] ||= {class: "pagination-page", page}}
        disabled={active}
        onPress={this.tt.onPress}
        style={paginationButtonStyles[`paginationPageButton-${active}`] ||= {
          alignItems: "center",
          backgroundColor: active ? "#0f172a" : "#e2e8f0",
          borderRadius: 999,
          height: 28,
          justifyContent: "center",
          marginHorizontal: 4,
          width: 28
        }}
      >
        <Text
          style={paginationButtonStyles[`paginationPageText-${active}`] ||= {
            color: active ? "#f8fafc" : "#334155",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {page}
        </Text>
      </Pressable>
    )
  }
}))

/** @extends {ShapeComponent<HayaSelectProps>} */
export default memo(shapeComponent(class HayaSelect extends ShapeComponent {
  static defaultProps = {
    debug: false,
    multiple: false,
    noOptionsText: null,
    onBlur: null,
    onFocus: null,
    optionsAbsolute: true,
    optionsPortal: true,
    optionsWidth: null,
    search: false,
    transparent: false
  }

  static propTypes = propTypesExact({
    attribute: PropTypes.string,
    className: PropTypes.string,
    defaultToggled: PropTypes.object,
    defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defaultValues: PropTypes.array,
    defaultValuesFromOptions: PropTypes.array,
    debug: PropTypes.bool.isRequired,
    id: PropTypes.node,
    model: PropTypes.object,
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
    styles: PropTypes.object,
    toggled: PropTypes.object,
    toggleOptions: PropTypes.arrayOf(PropTypes.shape({
      icon: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })),
    transparent: PropTypes.bool.isRequired,
    values: PropTypes.array
  })

  callOptionsPositionAboveIfOutsideScreen = false
  searchTextValue = ""
  t = Config.current().getUseTranslate()().t
  windowWidth = Dimensions.get("window").width
  windowHeight = Dimensions.get("window").height

  isDebugEnabled = () => Boolean(this.p.debug)

  debugLog = (functionName, details = undefined) => {
    if (!this.isDebugEnabled()) return

    const baseDetails = {
      id: this.p.id,
      name: this.p.name
    }

    const mergedDetails = details ? Object.assign({}, baseDetails, details) : baseDetails

    if (mergedDetails && Object.keys(mergedDetails).length > 0) {
      console.log(`[HayaSelect] ${functionName}`, mergedDetails)
    } else {
      console.log(`[HayaSelect] ${functionName}`)
    }
  }

  setup() {
    const {t} = Config.current().getUseTranslate()()

    this.t = t

    if (Array.isArray(this.props.values)) {
      for (const value of this.props.values) {
        if (typeof value == "undefined") {
          throw new Error("HayaSelect: Undefined given as value")
        }
      }
    }

    this.setInstance({
      endOfSelectRef: useRef(),
      optionsContainerRef: useRef(),
      pageInputRef: useRef(),
      searchTextInputRef: useRef(),
      selectContainerRef: useRef()
    })
    this.useStates({
      currentOptions: () => this.defaultCurrentOptions(),
      selectContainerLayout: null,
      endOfSelectLayout: null,
      height: null,
      loadedOptions: () => this.defaultLoadedOptions(),
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
      toggled: () => this.defaultToggled()
    })

    const windowTarget = Platform.OS == "web" && typeof window != "undefined" ? window : null

    useEventListener(Dimensions, "change", this.tt.onDimensionsChange)
    usePressOutside(this.tt.optionsContainerRef, this.tt.onPressOutsideOptions)
    useEventListener(windowTarget, "resize", this.tt.onAnythingResizedDebounced)
    useEventListener(windowTarget, "scroll", this.tt.onAnythingScrolledDebounced)

    if (this.isDebugEnabled()) this.debugLog("setup", {
      hasControlledValues: "values" in this.props,
      hasControlledToggled: "toggled" in this.props,
      multiple: this.p.multiple,
      optionsType: Array.isArray(this.props.options) ? "array" : typeof this.props.options
    })

    useEffect(() => {
      if (this.tt.callOptionsPositionAboveIfOutsideScreen && this.s.optionsContainerLayout) {
        this.callOptionsPositionAboveIfOutsideScreen = false
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    }, [this.tt.callOptionsPositionAboveIfOutsideScreen, this.s.optionsContainerLayout])

    useEffect(() => {
      const currentOptionIds = this.s.currentOptions?.map((currentOption) => currentOption.value)

      if (Array.isArray(this.props.values) && anythingDifferent(currentOptionIds, this.props.values) && typeof this.props.options == "function") {
        this.setCurrentFromGivenValues()
      }
    }, [this.props.values])
  }

  translate(msgID, options) {
    if (msgID.startsWith(".")) {
      return this.t(`haya_select${msgID}`, options)
    } else {
      return this.t(msgID, options)
    }
  }

  defaultCurrentOptions() {
    const {defaultValue, defaultValues, values} = this.props
    const {options} = this.p

    if (!Array.isArray(options)) return []

    return options.filter(({value}) =>
      (defaultValue && value == defaultValue) ||
        (defaultValues && defaultValues.includes(value)) ||
        (values && values.includes(value))
    )
  }

  defaultLoadedOptions() {
    const {options} = this.p

    if (typeof options == "function") {
      return undefined
    } else if (Array.isArray(options)) {
      return options
    }

    throw new Error(`Unknown type of options: ${typeof options}`)
  }

  /** @returns {number} */
  getActivePage = () => this.s.page || 1

  /**
   * @param {Array<HayaSelectOption>|HayaSelectOptionsResult} result
   * @returns {HayaSelectOptionsResult}
   */
  parseOptionsResult(result) {
    if (Array.isArray(result)) return {options: result}

    if (result && Array.isArray(result.options)) {
      return {
        options: result.options,
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize
      }
    }

    throw new Error(`Unknown options result: ${JSON.stringify(result)}`)
  }

  /**
   * @param {object} params
   * @param {Array<HayaSelectOption>} params.options
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @param {number} [params.totalCount]
   * @returns {number|null}
   */
  resolvePageSize({options, page, pageSize, totalCount}) {
    if (Number.isFinite(pageSize) && pageSize > 0) return pageSize

    if (Number.isFinite(this.s.pageSize) && this.s.pageSize > 0 && page != 1) {
      return this.s.pageSize
    }

    if (Number.isFinite(totalCount) && Array.isArray(options) && options.length > 0) {
      return options.length
    }

    return Number.isFinite(this.s.pageSize) && this.s.pageSize > 0 ? this.s.pageSize : null
  }

  defaultToggled = () => ("toggled" in this.props) ? this.p.toggled : this.props.defaultToggled || {}
  getToggled = () => ("toggled" in this.props) ? this.p.toggled : this.s.toggled
  getValues = () => ("values" in this.props) ? this.p.values : this.s.currentOptions.map((currentOption) => currentOption.value)
  getCurrentOptions = () => {
    if ("values" in this.props && typeof this.props.values != "undefined") {
      if (Array.isArray(this.p.values) && this.p.values.length === 0) return []

      if (Array.isArray(this.props.options) && Array.isArray(this.p.values)) {
        return this.p.values.map((value) => this.p.options.find((option) => option.value == value))
      } else if (this.s.loadedOptions && Array.isArray(this.p.values)) {
        return this.p.values.map((value) => {
          let foundOption = this.s.loadedOptions.find((option) => option.value == value)

          if (!foundOption) {
            foundOption = this.s.currentOptions.find((option) => option.value == value)

            if (!foundOption) {
              console.error(
                `Couldn't find option: ${value} in loadedOptions or state currentOptions`,
                {stateLoadedOptions: this.s.loadedOptions, stateCurrentOptions: this.s.currentOptions, propsOptions: this.props.options}
              )
            }
          }

          return foundOption
        })
      } else if (typeof this.props.options == "function") {
        // Options haven't been loaded yet.
      } else if (Array.isArray(this.p.values)) {
        return this.p.values.map((value) => ({value}))
      }
    }

    return this.s.currentOptions
  }

  getCurrentOptionValues() {
    if ("values" in this.props) {
      return Array.isArray(this.p.values) ? this.p.values : []
    }

    const currentOptions = this.getCurrentOptions()

    if (!currentOptions) return []

    return currentOptions
      .map((option) => option?.value)
      .filter((value) => typeof value != "undefined")
  }

  componentDidMount() {
    const {attribute, defaultValue, defaultValues, defaultValuesFromOptions, model, options} = this.props

    if (this.isDebugEnabled()) this.debugLog("componentDidMount", {
      hasAttributeModel: Boolean(attribute && model),
      hasDefaultValues: Boolean(defaultValue || defaultValues || defaultValuesFromOptions),
      optionsType: typeof options
    })

    if (((defaultValue || defaultValues || defaultValuesFromOptions) || (attribute && model)) && typeof options == "function") {
      this.loadDefaultValuesFromOptionsCallback()
    }
  }

  componentDidUpdate() {
    const newState = {}

    if ("toggled" in this.props) {
      const newToggled = this.p.toggled

      if (anythingDifferent(this.state.toggled, newToggled)) {
        newState.toggled = newToggled
      }
    }

    if (Object.keys(newState).length > 0) {
      if (this.isDebugEnabled()) this.debugLog("componentDidUpdate", {syncingKeys: Object.keys(newState)})
      this.setState(newState)
    }
  }

  render() {
    const {endOfSelectRef} = this.tt
    const {transparent} = this.p
    const {className, placeholder, toggleOptions} = this.props
    const {opened, optionsPlacement} = this.s
    const currentOptions = this.getCurrentOptions()
    const id = idForComponent(this)

    const selectContainerStyleActual = {...this.stylingFor("selectContainer", {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: transparent ? undefined : "#fff",
      border: transparent ? undefined : "1px solid #999",
      borderRadius: transparent ? undefined : 4,
      color: "#000",
      cursor: "pointer",
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 5
    }, [transparent])}

    if (opened) {
      // Prevent select from changing size once the content is replaced with search text once opened
      selectContainerStyleActual.height = this.s.height

      const baseBorderRadius = selectContainerStyleActual.borderRadius

      if (optionsPlacement == "above") {
        selectContainerStyleActual.borderTopLeftRadius = 0
        selectContainerStyleActual.borderTopRightRadius = 0
        selectContainerStyleActual.borderBottomRightRadius = baseBorderRadius
        selectContainerStyleActual.borderBottomLeftRadius = baseBorderRadius

        delete selectContainerStyleActual.borderRadius
      } else if (optionsPlacement == "below") {
        selectContainerStyleActual.borderTopLeftRadius = baseBorderRadius
        selectContainerStyleActual.borderTopRightRadius = baseBorderRadius
        selectContainerStyleActual.borderBottomRightRadius = 0
        selectContainerStyleActual.borderBottomLeftRadius = 0

        delete selectContainerStyleActual.borderRadius
      }
    }

    return (
      <View
        dataSet={this.cache("rootViewDataSet", {
          class: className,
          component: "haya-select",
          id,
          opened,
          optionsPlacement,
          toggles: Boolean(toggleOptions)
        }, [className, id, opened, optionsPlacement, Boolean(toggleOptions)])}
        style={this.stylingFor("main")}
      >
        <Pressable
          dataSet={this.selectContainerDataSet ||= {class: "select-container"}}
          onLayout={this.tt.onSelectContainerLayout}
          onPress={this.tt.onSelectClicked}
          ref={this.tt.selectContainerRef}
          style={selectContainerStyleActual}
        >
          <View
            dataSet={this.currentSelectedDataSet ||= {class: "current-selected"}}
            style={this.stylingFor("currentSelected", this.currentSelectedStyle ||= {width: "calc(100% - 25px)", flexWrap: "wrap", overflow: "hidden"})}
          >
            {opened &&
              <TextInput
                dataSet={this.searchTextInputDataSet ||= {class: "search-text-input"}}
                onChangeText={this.tt.onChangeSearchText}
                placeholder={this.translate(".search_dot_dot_dot")}
                ref={this.tt.searchTextInputRef}
                style={this.stylingFor("searchTextInput", this.searchTextInputStyle ||= {
                  width: "100%",
                  border: 0,
                  outline: "none",
                  padding: 0
                })}
                defaultValue={this.searchTextValue}
              />
            }
            {!opened &&
              <>
                {currentOptions.length == 0 &&
                  <Text numberOfLines={1} style={this.stylingFor("nothingSelected", this.nothingSelectedStyle ||= {color: "grey"})}>
                    {placeholder || this.translate(".nothing_selected")}
                  </Text>
                }
                {currentOptions.length == 0 && Platform.OS == "web" &&
                  <input
                    id={idForComponent(this)}
                    name={nameForComponentWithMultiple(this)}
                    type="hidden"
                    value=""
                  />
                }
                {currentOptions.map((currentOption) =>
                  <View
                    dataSet={this.currentOptionDataSet ||= {class: "current-option"}}
                    key={currentOption.key || `current-value-${currentOption.value}`}
                    style={this.stylingFor("currentOption", {marginRight: 6})}
                  >
                    {currentOption.type == "group" &&
                      <View style={this.stylingFor("currentOptionGroup", this.currentOptionGroupStyle ||= {fontWeight: "bold"})}>
                        <Text style={this.stylingFor("currentOptionGroupText")}>
                          {currentOption.text}
                        </Text>
                      </View>
                    }
                    {currentOption.type != "group" &&
                      <>
                        {Platform.OS == "web" && nameForComponentWithMultiple(this) &&
                          <input
                            id={idForComponent(this)}
                            name={nameForComponentWithMultiple(this)}
                            type="hidden"
                            value={digg(currentOption, "value")}
                          />
                        }
                        {this.presentOption(currentOption, "current")}
                      </>
                    }
                  </View>
                )}
              </>
            }
          </View>
          <View
            dataSet={this.chevronContainerDataSet ||= {class: "chevron-container"}}
            style={this.stylingFor("chevronContainer", this.chevronContainerStyle ||= {
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              marginLeft: "auto",
              marginRight: 8
            })}
          >
            <FontAwesomeIcon name={opened ? "chevron-up" : "chevron-down"} style={this.stylingFor("chevron", this.chevronStyle ||= {fontSize: 12})} />
          </View>
        </Pressable>
        <View
          dataSet={this.endOfSelectDataSet ||= {class: "end-of-select"}}
          onLayout={this.tt.onEndOfSelectLayout}
          ref={endOfSelectRef}
        />
        {opened && this.p.optionsPortal &&
          <Portal>
            {this.optionsContainer()}
          </Portal>
        }
        {opened && !this.p.optionsPortal &&
          <View>
            {this.optionsContainer()}
          </View>
        }
      </View>
    )
  }

  defaultValues () {
    const {attribute, defaultValue, defaultValues, defaultValuesFromOptions, model} = this.props

    if (defaultValuesFromOptions) return defaultValuesFromOptions
    if (defaultValue) return defaultValue
    if (defaultValues) return defaultValues

    if (attribute && model) {
      if (!(attribute in model)) throw new Error(`No such attribute on ${model.modelClassData().name}: ${attribute}`)

      return model[attribute]()
    }
  }

  isActive() {
    if (this.tt.endOfSelectRef.current) {
      return true
    }

    return false
  }

  async loadDefaultValuesFromOptionsCallback() {
    const defaultValues = this.defaultValues()

    if (!defaultValues) return

    if (this.isDebugEnabled()) this.debugLog("loadDefaultValuesFromOptionsCallback", {defaultValues})

    const result = await this.props.options({
      searchValue: this.getSearchText(),
      page: this.getActivePage(),
      values: defaultValues
    })

    const {options} = this.parseOptionsResult(result)
    if (this.isDebugEnabled()) this.debugLog("loadDefaultValuesFromOptionsCallback.result", {loadedOptionsCount: options?.length || 0})

    this.setState({currentOptions: this.state.currentOptions.concat(options)})
  }

  loadOptions = async ({page} = {}) => {
    const {options} = this.p
    const searchValue = this.getSearchText()
    if (this.isDebugEnabled()) this.debugLog("loadOptions", {
      page,
      searchValue,
      optionsType: Array.isArray(options) ? "array" : typeof options
    })

    if (Array.isArray(options)) {
      return this.loadOptionsFromArray(options, searchValue)
    }

    const requestedPage = Number.isFinite(page) ? page : this.getActivePage()
    const result = await options({searchValue, page: requestedPage})
    const {options: loadedOptions, page: resultPage, pageSize, totalCount} = this.parseOptionsResult(result)
    const resolvedPage = Number.isFinite(resultPage) ? resultPage : requestedPage
    const resolvedPageSize = this.resolvePageSize({options: loadedOptions, page: resolvedPage, pageSize, totalCount})
    const totalPages = Number.isFinite(totalCount) && Number.isFinite(resolvedPageSize) && resolvedPageSize > 0
      ? Math.ceil(totalCount / resolvedPageSize)
      : null

    this.setState({
      loadedOptions,
      page: resolvedPage,
      pageInputValue: String(resolvedPage),
      pageSize: Number.isFinite(totalCount) ? resolvedPageSize : null,
      totalCount: Number.isFinite(totalCount) ? totalCount : null
    }, () => this.props.onOptionsLoaded?.({options: loadedOptions}))

    if (this.isDebugEnabled()) this.debugLog("loadOptions.result", {
      loadedOptionsCount: loadedOptions?.length || 0,
      resolvedPage,
      resolvedPageSize,
      totalCount: Number.isFinite(totalCount) ? totalCount : null
    })
  }

  hayaSelectOption({key, loadedOption}) {
    if (loadedOption.type == "group") {
      return <OptionGroup key={key} option={loadedOption} />
    }

    return (
      <Option
        currentOptionValues={this.getCurrentOptionValues()}
        icon={this.iconForOption(loadedOption)}
        key={key}
        option={loadedOption}
        onOptionClicked={this.tt.onOptionClicked}
        presentOption={this.tt.presentOption}
        selectedBackgroundColor={this.props.selectedBackgroundColor}
        selectedHoverBackgroundColor={this.props.selectedHoverBackgroundColor}
      />
    )
  }

  loadOptionsFromArray(options, searchValue) {
    const lowerSearchValue = searchValue?.toLowerCase()
    const loadedOptions = options.filter(({text}) => !lowerSearchValue || text?.toLowerCase()?.includes(lowerSearchValue))
    if (this.isDebugEnabled()) this.debugLog("loadOptionsFromArray", {
      totalOptionsCount: options.length,
      searchValue,
      loadedOptionsCount: loadedOptions.length
    })

    this.setState({
      loadedOptions,
      page: 1,
      pageInputValue: "1",
      pageSize: null,
      totalCount: null
    })
  }

  onDimensionsChange = ({window}) => {
    this.windowWidth = window.width
    this.windowHeight = window.height
  }

  onSelectContainerLayout = (e) => this.setState({selectContainerLayout: Object.assign({}, digg(e, "nativeEvent", "layout"))})
  onEndOfSelectLayout = (e) => {
    const endOfSelectLayout = Object.assign({}, digg(e, "nativeEvent", "layout"))
    const newState = {endOfSelectLayout}

    if (this.s.opened && endOfSelectLayout?.width) {
      newState.optionsWidth = endOfSelectLayout.width
    }

    this.setState(newState, () => {
      if (this.s.opened && this.s.optionsContainerLayout) {
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    })
  }
  onOptionsContainerLayout = (e) => this.setState({optionsContainerLayout: Object.assign({}, digg(e, "nativeEvent", "layout"))})

  onSelectClicked = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const {opened} = this.s
    if (this.isDebugEnabled()) this.debugLog("onSelectClicked", {opened})

    if (opened) {
      this.closeOptions()
    } else {
      this.openOptions()
    }
  }

  onSearchTextInputChangedDebounced = debounce(this.tt.loadOptions, 200)

  closeOptions({options} = {}) {
    const closedOptions = options || this.getCurrentOptions()
    if (this.isDebugEnabled()) this.debugLog("closeOptions", {closedOptionsCount: closedOptions?.length || 0})

    this.setState(
      {
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
      },
      () => {
        if (this.isDebugEnabled()) this.debugLog("closeOptions.done", {opened: this.s.opened, optionsVisibility: this.s.optionsVisibility})
      }
    )

    if (this.props.onOptionsClosed) {
      this.props.onOptionsClosed({options: closedOptions})
    }

    if (this.p.onBlur) this.p.onBlur()
  }

  getSearchText = () => this.searchTextValue || ""

  resetSearchTextInput = () => {
    this.searchTextValue = ""
    const input = this.tt.searchTextInputRef.current

    if (input?.clear) {
      input.clear()
    } else if (input?.setNativeProps) {
      input.setNativeProps({text: ""})
    } else if (input) {
      try {
        input.value = ""
      } catch (error) {
        // Ignore if the ref doesn't support direct value assignment.
      }
    }
  }

  onChangeSearchText = (searchText) => {
    if (this.isDebugEnabled()) this.debugLog("onChangeSearchText", {searchText, currentPage: this.s.page})
    this.searchTextValue = searchText

    if (this.s.page != 1) {
      this.setState({page: 1, pageInputValue: "1"}, this.tt.onSearchTextInputChangedDebounced)
    } else {
      this.tt.onSearchTextInputChangedDebounced()
    }
  }

  openOptions() {
    if (this.isDebugEnabled()) this.debugLog("openOptions", {
      currentOptionsCount: this.getCurrentOptions()?.length || 0,
      searchEnabled: this.p.search
    })
    this.searchTextValue = ""
    this.callOptionsPositionAboveIfOutsideScreen = true
    this.setState(
      {
        height: this.s.selectContainerLayout.height,
        opened: true,
        optionsPlacement: "below",
        optionsVisibility: "hidden",
        optionsWidth: this.s.endOfSelectLayout?.width,
        page: 1,
        pageInputFocused: false,
        pageInputValue: "1",
        scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
        scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null
      },
      () => {
        this.resetSearchTextInput()
        this.focusTextInput()
        this.loadOptions({page: 1})
      }
    )

    if (this.p.onFocus) this.p.onFocus()
  }

  focusTextInput = () => digg(this.tt.searchTextInputRef, "current")?.focus()

  setOptionsPosition() {
    if (!this.isActive()) {
      return // Debounce after un-mount handeling.
    }

    if (this.isDebugEnabled()) this.debugLog("setOptionsPosition")
    this.callOptionsPositionAboveIfOutsideScreen = true
    this.setOptionsPositionBelow()
  }

  setOptionsPositionAboveIfOutsideScreen() {
    const {windowHeight} = this.tt
    const {optionsContainerLayout} = this.s
    const endOfSelectLayout = this.s.endOfSelectLayout

    if (!endOfSelectLayout) {
      if (this.isDebugEnabled()) this.debugLog("setOptionsPositionAboveIfOutsideScreen", {placement: "below", reason: "missing-end-of-select-layout"})
      this.setState({optionsVisibility: "visible"})
      return
    }

    const optionsTop = endOfSelectLayout.top
    const optionsTotalBottomPosition = optionsContainerLayout.height + optionsTop
    const windowHeightWithScroll = windowHeight + this.s.scrollTop

    if (windowHeightWithScroll < optionsTotalBottomPosition) {
      if (this.isDebugEnabled()) this.debugLog("setOptionsPositionAboveIfOutsideScreen", {placement: "above"})
      this.setOptionsPositionAbove()
    } else {
      if (this.isDebugEnabled()) this.debugLog("setOptionsPositionAboveIfOutsideScreen", {placement: "below"})
      this.setState({optionsVisibility: "visible"})
    }
  }

  setOptionsPositionAbove() {
    const {endOfSelectLayout} = this.s
    if (this.isDebugEnabled()) this.debugLog("setOptionsPositionAbove")

    this.setState(
      {
        opened: true,
        optionsPlacement: "above",
        optionsVisibility: "visible",
        optionsWidth: endOfSelectLayout?.width
      },
      () => this.focusTextInput()
    )
  }

  setOptionsPositionBelow() {
    if (this.isDebugEnabled()) this.debugLog("setOptionsPositionBelow")
    this.setState(
      {
        opened: true,
        optionsPlacement: "below",
        optionsVisibility: "hidden",
        optionsWidth: this.s.endOfSelectLayout?.width
      },
      () => this.focusTextInput()
    )
  }

  onAnythingResized = () => {
    if (this.isDebugEnabled()) this.debugLog("onAnythingResized", {opened: this.s.opened})
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingResizedDebounced = debounce(this.tt.onAnythingResized, 25)

  onAnythingScrolled = () => {
    if (this.isDebugEnabled()) this.debugLog("onAnythingScrolled", {opened: this.s.opened})
    if (this.s.opened) {
      this.setState({
        scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
        scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null
      })
      this.setOptionsPosition()
    }
  }

  onAnythingScrolledDebounced = debounce(this.tt.onAnythingScrolled, 25)

  onPressOutsideOptions = () => {
    if (this.isDebugEnabled()) this.debugLog("onPressOutsideOptions", {opened: this.s.opened})
    // If options are open and a click is made outside of the options container
    if (this.s.opened) {
      this.closeOptions()
    }
  }

  /** @returns {number|null} */
  paginationTotalPages() {
    const {totalCount} = this.s

    if (!Number.isFinite(totalCount) || totalCount <= 0) return null

    const pageSize = this.resolvePageSize({
      options: this.s.loadedOptions || [],
      page: this.getActivePage(),
      pageSize: this.s.pageSize,
      totalCount
    })

    if (!Number.isFinite(pageSize) || pageSize <= 0) return null

    return Math.ceil(totalCount / pageSize)
  }

  /**
   * @param {number} totalPages
   * @returns {Array<{key: string, type: "page"|"ellipsis", value?: number}>}
   */
  paginationPageItems(totalPages) {
    const currentPage = this.getActivePage()
    const items = []
    const addPage = (page) => items.push({key: `page-${page}`, type: "page", value: page})
    const addEllipsis = (key) => items.push({key, type: "ellipsis"})

    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) {
        addPage(page)
      }

      return items
    }

    addPage(1)

    const windowSize = 2
    let start = Math.max(2, currentPage - windowSize)
    let end = Math.min(totalPages - 1, currentPage + windowSize)

    if (currentPage <= 3) {
      start = 2
      end = Math.min(totalPages - 1, 5)
    } else if (currentPage >= totalPages - 2) {
      end = totalPages - 1
      start = Math.max(2, totalPages - 4)
    }

    if (start > 2) addEllipsis("ellipsis-start")

    for (let page = start; page <= end; page += 1) {
      addPage(page)
    }

    if (end < totalPages - 1) addEllipsis("ellipsis-end")

    addPage(totalPages)

    return items
  }

  paginationDisplayValue(totalPages) {
    const activePage = this.getActivePage()
    const fallbackText = `Page ${activePage} of ${totalPages}`

    return this.translate(".pagination_page_of_pages", {
      defaultValue: fallbackText,
      page: activePage,
      totalPages
    })
  }

  paginationInputValue(totalPages) {
    if (this.s.pageInputFocused) return this.s.pageInputValue

    return this.paginationDisplayValue(totalPages)
  }

  /** @param {number} page */
  setPaginationPage = (page) => {
    const totalPages = this.paginationTotalPages()
    if (this.isDebugEnabled()) this.debugLog("setPaginationPage", {requestedPage: page, totalPages})

    if (!totalPages) return

    const nextPage = Math.min(Math.max(Math.floor(page), 1), totalPages)

    if (nextPage == this.getActivePage()) {
      this.setState({pageInputValue: String(this.getActivePage())})
      return
    }

    this.setState(
      {page: nextPage, pageInputValue: String(nextPage)},
      () => this.tt.loadOptions({page: nextPage})
    )
  }

  /** @param {import("react").SyntheticEvent} event */
  onPaginationPrevPressed = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    this.setPaginationPage(this.getActivePage() - 1)
  }

  /** @param {import("react").SyntheticEvent} event */
  onPaginationNextPressed = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    this.setPaginationPage(this.getActivePage() + 1)
  }

  onPaginationInputFocus = () => {
    this.setState({
      pageInputFocused: true,
      pageInputValue: String(this.getActivePage())
    })
  }

  /** @param {string} value */
  onPaginationInputChange = (value) => {
    this.setState({pageInputValue: value})
  }

  /** @param {import("react").SyntheticEvent} event */
  onPaginationInputBlur = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    const totalPages = this.paginationTotalPages()
    const rawValue = event?.target?.value ?? this.s.pageInputValue
    const parsedValue = rawValue ? Number(String(rawValue).match(/\d+/)?.[0]) : NaN
    const nextPage = Number.isFinite(parsedValue) ? parsedValue : Number(this.s.pageInputValue)

    if (totalPages && Number.isFinite(nextPage)) {
      this.setState({pageInputFocused: false}, () => this.setPaginationPage(nextPage))
      return
    }

    this.setState({
      pageInputFocused: false,
      pageInputValue: String(this.getActivePage())
    })
  }

  /** @param {import("react").SyntheticEvent} event */
  onPaginationInputSubmit = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    const totalPages = this.paginationTotalPages()

    if (!totalPages) {
      this.setState({
        pageInputFocused: false,
        pageInputValue: String(this.getActivePage())
      })
      return
    }

    const nextPage = Number(this.s.pageInputValue)

    if (!Number.isFinite(nextPage)) {
      this.setState({
        pageInputFocused: false,
        pageInputValue: String(this.getActivePage())
      })
      return
    }

    this.setState({pageInputFocused: false}, () => this.setPaginationPage(nextPage))
  }

  /** @param {import("react").SyntheticEvent} event */
  onPaginationInputKeyDown = (event) => {
    if (event?.key !== "Enter") return

    this.tt.onPaginationInputSubmit(event)
  }

  /** @returns {import("react").ReactNode|null} */
  paginationControls() {
    const totalPages = this.paginationTotalPages()

    if (!totalPages || totalPages <= 1) return null

    const currentPage = this.getActivePage()
    const prevDisabled = currentPage <= 1
    const nextDisabled = currentPage >= totalPages

    return (
      <View
        dataSet={dataSets.paginationContainer ||= {class: "options-pagination"}}
        style={styles.paginationContainer ||= {
          borderTop: "1px solid #e2e8f0",
          padding: 8
        }}
      >
        <View
          dataSet={dataSets.paginationHeader ||= {class: "pagination-header"}}
          style={styles.paginationHeader ||= {flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}
        >
          <Pressable
            dataSet={dataSets.paginationPrevButton ||= {class: "pagination-prev"}}
            disabled={prevDisabled}
            onPress={this.tt.onPaginationPrevPressed}
            style={styles[`paginationNavButton-${prevDisabled}`] ||= {
              alignItems: "center",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              height: 30,
              justifyContent: "center",
              opacity: prevDisabled ? 0.4 : 1,
              width: 30
            }}
          >
            <FontAwesomeIcon
              name="chevron-left"
              style={styles.paginationNavIcon ||= {color: "#334155", fontSize: 12}}
            />
          </Pressable>
          <View
            dataSet={this.cache("paginationLabelDataSet", {
              class: "pagination-label",
              page: currentPage
            }, [currentPage])}
            style={styles.paginationLabelButton ||= {
              alignItems: "center",
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              justifyContent: "center",
              minWidth: 140,
              paddingHorizontal: 10,
              paddingVertical: 6
            }}
          >
            <TextInput
              dataSet={dataSets.paginationInput ||= {class: "pagination-input"}}
              keyboardType="number-pad"
              onBlur={this.tt.onPaginationInputBlur}
              onChangeText={this.tt.onPaginationInputChange}
              onFocus={this.tt.onPaginationInputFocus}
              onPressIn={this.tt.onPaginationInputFocus}
              onKeyDown={this.tt.onPaginationInputKeyDown}
              onSubmitEditing={this.tt.onPaginationInputSubmit}
              ref={this.tt.pageInputRef}
              selectTextOnFocus
              style={styles.paginationInputStyle ||= {
                border: 0,
                color: "#0f172a",
                fontSize: 12,
                outline: "none",
                padding: 0,
                textAlign: "center",
                width: 120
              }}
              value={this.paginationInputValue(totalPages)}
            />
          </View>
          <Pressable
            dataSet={dataSets.paginationNextButton ||= {class: "pagination-next"}}
            disabled={nextDisabled}
            onPress={this.tt.onPaginationNextPressed}
            style={styles[`paginationNavButton-${nextDisabled}`] ||= {
              alignItems: "center",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              height: 30,
              justifyContent: "center",
              opacity: nextDisabled ? 0.4 : 1,
              width: 30
            }}
          >
            <FontAwesomeIcon
              name="chevron-right"
              style={styles.paginationNavIcon ||= {color: "#334155", fontSize: 12}}
            />
          </Pressable>
        </View>
        <View
          dataSet={dataSets.paginationPages ||= {class: "pagination-pages"}}
          style={styles.paginationPages ||= {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 8
          }}
        >
          {this.paginationPageItems(totalPages).map((item) => {
            if (item.type == "ellipsis") {
              return (
                <View
                  dataSet={dataSets[`paginationEllipsis-${item.key}`] ||= {class: "pagination-ellipsis"}}
                  key={item.key}
                  style={styles.paginationEllipsis ||= {paddingHorizontal: 6}}
                >
                  <Text
                    style={styles.paginationEllipsisText ||= {
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    ...
                  </Text>
                </View>
              )
            }

            return (
              <PaginationPageButton
                active={item.value == currentPage}
                key={item.key}
                onPageSelected={this.tt.setPaginationPage}
                page={item.value}
              />
            )
          })}
        </View>
      </View>
    )
  }

  optionsContainer() {
    const {selectContainerLayout, loadedOptions, endOfSelectLayout, optionsContainerLayout, optionsPlacement, optionsVisibility} = this.s
    let left, top

    let style = {
      position: "absolute",
      zIndex: 99999,
      elevation: 99999,
      visibility: optionsVisibility,
      width: this.p.optionsWidth || this.s.optionsWidth,
      backgroundColor: "#fff",
      border: "1px solid #999",
      maxHeight: 300,
      overflowY: "auto"
    }

    if (!this.p.optionsPortal) {
      style.top = 0
      style.left = 0
    } else if (!this.p.optionsAbsolute) {
      style.left = 0
      style.bottom = 0
    } else if (optionsPlacement == "below") {
      if (Platform.OS == "web") {
        // onLayout top value is sometimes negative so use browser JS to get it instead
        top = digg(this.tt.endOfSelectRef.current.getBoundingClientRect(), "top") + document.documentElement.scrollTop + 1

        // onLayout left values doesn't always update when changed
        left = digg(this.tt.endOfSelectRef.current.getBoundingClientRect(), "left") + document.documentElement.scrollLeft
      } else {
        left = this.s.endOfSelectLayout.left
        top = selectContainerLayout.top
      }

      style.left = left
      style.top = top - 2
    } else if (optionsPlacement == "above") {
      if (Platform.OS == "web") {
        // onLayout top value is sometimes negative so use browser JS to get it instead
        top = digg(this.tt.selectContainerRef.current.getBoundingClientRect(), "top") + document.documentElement.scrollTop

        // onLayout left values doesn't always update when changed
        left = digg(this.tt.selectContainerRef.current.getBoundingClientRect(), "left") + document.documentElement.scrollLeft
      } else {
        left = endOfSelectLayout.left
        top = selectContainerLayout.top
      }

      style.left = left
      style.top = top - optionsContainerLayout.height + 1
    } else {
      throw new Error(`Unkonwn options placement: ${optionsPlacement}`)
    }

    style = this.stylingFor("optionsContainer", style, [left, top, style.visibility, style.width])

    const id = idForComponent(this)

    return (
      <View
        dataSet={this.cache("optionsContainerDataSet", {class: "options-container", id, role: "dialog"}, [id])}
        onLayout={this.tt.onOptionsContainerLayout}
        ref={this.tt.optionsContainerRef}
        style={style}
      >
        {loadedOptions?.map((loadedOption) =>
          this.hayaSelectOption({
            key: loadedOption.key || `loaded-option-${loadedOption.value}`,
            loadedOption
          })
        )}
        {loadedOptions?.length === 0 &&
          <View dataSet={this.noOptionsContainerDataSet ||= {class: "no-options-container"}}>
            <Text>{this.p.noOptionsText ? this.p.noOptionsText() : this.translate(".no_options_found")}</Text>
          </View>
        }
        {this.paginationControls()}
      </View>
    )
  }

  onOptionClicked = (event, loadedOption) => {
    event.preventDefault()
    event.stopPropagation()

    const {onChange, toggleOptions} = this.props
    const {multiple} = this.p
    const currentOptions = this.getCurrentOptions()
    const toggled = this.getToggled()
    const newState = {}
    const existingOption = currentOptions.find((currentOption) => currentOption.value == loadedOption.value)
    const newToggled = {...toggled}
    let newCurrentOptions
    let action

    if (existingOption) {
      if (toggleOptions) {
        const currentToggle = toggled[loadedOption.value]
        const currentIndex = toggleOptions.findIndex((element) => element.value == currentToggle)

        if (currentIndex >= (toggleOptions.length - 1)) {
          // No next toggled - remove toggled and option
          delete newToggled[loadedOption.value]
          action = "remove-option-after-last-toggle"

          newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
        } else {
          // Already toggled - set to next toggle
          newToggled[loadedOption.value] = digg(toggleOptions, currentIndex + 1, "value")
          action = "cycle-toggle"
        }

        newState.toggled = newToggled
      } else {
        // Remove from current options
        action = "remove-option"
        newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
      }
    } else {
      // Don't do anything if the clicked option is disabled
      if (loadedOption.disabled) {
        if (this.isDebugEnabled()) this.debugLog("onOptionClicked", {
          action: "ignore-disabled-option",
          optionValue: loadedOption.value
        })
        return
      }

      if (toggleOptions) {
        // Set fresh toggle
        newToggled[loadedOption.value] = toggleOptions[0].value
        newState.toggled = newToggled
      }

      if (multiple || toggleOptions) {
        action = "add-option"
        newCurrentOptions = currentOptions.concat([loadedOption])
      } else {
        action = "replace-single-option"
        newCurrentOptions = [loadedOption]
      }
    }

    if ("values" in this.props && this.props.values !== undefined) {
      // currentOptions are controlled and a useMemo callback is handeling setting current options.
    } else if (newCurrentOptions) {
      newState.currentOptions = newCurrentOptions
    }

    const options = newCurrentOptions || currentOptions
    if (this.isDebugEnabled()) this.debugLog("onOptionClicked", {
      action: action || "toggle-only",
      multiple,
      optionValue: loadedOption.value,
      optionsCountBefore: currentOptions.length,
      optionsCountAfter: options.length
    })

    if (!multiple) this.closeOptions({options})

    if (onChange) {
      onChange({
        event,
        options,
        toggles: newToggled
      })
    }

    if (this.props.onChangeValue) {
      let optionValue

      if (multiple) {
        optionValue = options.map((option) => option.value)
      } else {
        optionValue = dig(options, 0, "value")
      }

      this.p.onChangeValue(optionValue)
    }

    this.setState(newState)
  }

  stylingFor(stylingName, style = {}, caches = []) {
    let customStyling = dig(this, "props", "styles", stylingName)

    if (typeof customStyling == "function") customStyling = customStyling({state: this.state, style})

    if (customStyling) {
      return Object.assign(style, customStyling)
    }

    return this.cache(`stylingFor-${stylingName}`, style, caches)
  }

  iconForOption(option) {
    const {toggleOptions} = this.props || {}
    const toggled = this.getToggled()

    if (toggleOptions && (option.value in toggled)) {
      const toggledValue = toggled[option.value]
      const toggledOption = toggleOptions.find((element) => element.value == toggledValue)

      if (!toggledOption) {
        throw new Error(`Couldn't find a toggle option for value: ${toggledValue}`)
      }

      return toggledOption.icon
    }
  }

  presentOption = (option, mode) => {
    const {optionContent, toggleOptions} = this.props || {}
    const toggled = this.getToggled()
    const icon = this.iconForOption(option)
    const toggleValue = toggled[option.value]
    const toggleOption = toggleOptions?.find((toggleOptionI) => toggleOptionI.value == toggleValue)
    const selected = this.getCurrentOptionValues().some((value) => value == option.value)
    let style
    let contentNode

    if (mode == "current") {
      style = this.stylingFor("currentOptionPresentationText", {flex: 1, whiteSpace: "nowrap"})
    } else {
      style = this.stylingFor("optionPresentationText", {flex: 1, whiteSpace: "nowrap"})
    }

    return (
      <View
        dataSet={this.cache("presentOptionViewDataSet", {
          text: option.text,
          toggleIcon: toggleOption?.icon,
          toggleValue: toggleOption?.value,
          value: option.value
        }, [option.text, option.value, toggleOption?.icon, toggleOption?.value])}
        style={this.cache("optionPresentationStyle", {flexDirection: "row", alignItems: "center"})}
        testID="option-presentation"
      >
        {toggleOptions && !(option.value in toggled) &&
          <View
            style={this.cache("toggleIconPlaceholderStyle", {width: 20})}
            testID="toggle-icon-placeholder"
          />
        }
        {toggleOptions && (option.value in toggled) &&
          <View style={this.cache("toggleIconContainerStyle", {alignItems: "center", justifyContent: "center", width: 20})}>
            <FontAwesomeIcon
              name={icon}
              testID="toggle-icon"
            />
          </View>
        }
        {(() => {
          if (optionContent) {
            contentNode = optionContent({icon, mode, option, selected, toggleOption, toggleValue, toggled})
          } else if (mode == "current" && option.currentContent) {
            contentNode = option.currentContent()
          } else if (option.content) {
            contentNode = option.content()
          } else if ("html" in option && Platform.OS != "web") {
            contentNode = <RenderHtml source={{html: digg(option, "html")}} />
          } else if ("html" in option && Platform.OS == "web") {
            contentNode = <div dangerouslySetInnerHTML={{__html: digg(option, "html")}} />
          } else {
            contentNode = (
              <Text
                style={style}
                testID="option-presentation-text"
              >
                {option.text}
              </Text>
            )
          }

          return (
            <>
              <View style={this.cache("optionPresentationContentStyle", {flex: 1})}>
                {contentNode}
              </View>
              {option.right &&
                <View style={this.cache("optionPresentationRightStyle", {alignItems: "center", justifyContent: "center", marginLeft: 8})}>
                  {option.right}
                </View>
              }
            </>
          )
        })()}
      </View>
    )
  }

  async setCurrentFromGivenValues() {
    const {options, values} = this.p

    if (Array.isArray(values) && values.length === 0) {
      if (this.s.currentOptions?.length) {
        this.setState({currentOptions: []})
      }

      return
    }

    const result = await options({page: this.getActivePage(), values})
    const {options: currentOptions} = this.parseOptionsResult(result)
    const currentValues = currentOptions?.map((currentOption) => currentOption.value)
    const stateValues = this.s.currentOptions?.map((currentOption) => currentOption.value)

    if (anythingDifferent(currentValues, stateValues)) {
      this.setState({currentOptions})
    }
  }
}))
