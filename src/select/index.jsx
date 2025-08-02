import {anythingDifferent} from "set-state-compare/src/diff-utils"
import config from "../config.js"
import {dig, digg} from "diggerize"
import {Dimensions, Platform, Pressable, Text, TextInput, View} from "react-native"
import React, {memo, useEffect, useRef} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"
import debounce from "debounce"
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome"
import idForComponent from "@kaspernj/api-maker/build/inputs/id-for-component"
import nameForComponent from "@kaspernj/api-maker/build/inputs/name-for-component"
import Option from "./option"
import OptionGroup from "./option-group"
import PropTypes from "prop-types"
import propTypesExact from "prop-types-exact"
import RenderHtml from "react-native-render-html"
import {Portal} from "conjointment"
import useEventListener from "@kaspernj/api-maker/build/use-event-listener"
import usePressOutside from "outside-eye/build/use-press-outside"

const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  const currentOptions = component.getCurrentOptions()

  if (component.props.multiple && name && currentOptions.length > 0) {
    name += "[]"
  }

  return name
}

export default memo(shapeComponent(class HayaSelect extends ShapeComponent {
  static defaultProps = {
    multiple: false,
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
    id: PropTypes.node,
    model: PropTypes.object,
    multiple: PropTypes.bool.isRequired,
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onChangeValue: PropTypes.func,
    onFocus: PropTypes.func,
    onOptionsClosed: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    optionsAbsolute: PropTypes.bool.isRequired,
    optionsPortal: PropTypes.bool.isRequired,
    optionsWidth: PropTypes.number,
    placeholder: PropTypes.node,
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
  windowWidth = Dimensions.get("window").width
  windowHeight = Dimensions.get("window").height

  setup() {
    const {t} = config.getUseTranslate()()

    if (this.props.values) {
      for (const value of this.props.values) {
        if (typeof value == "undefined") {
          throw new Error("HayaSelect: Undefined given as value")
        }
      }
    }

    this.setInstance({
      endOfSelectRef: useRef(),
      optionsContainerRef: useRef(),
      searchTextInputRef: useRef(),
      selectContainerRef: useRef(),
      t
    })
    this.useStates({
      currentOptions: () => this.defaultCurrentOptions(),
      selectContainerLayout: null,
      endOfSelectLayout: null,
      height: null,
      loadedOptions: () => this.defaultLoadedOptions(),
      opened: false,
      optionsContainerLayout: null,
      optionsPlacement: undefined,
      optionsTop: undefined,
      optionsVisibility: undefined,
      optionsWidth: undefined,
      scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
      scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null,
      searchText: "",
      toggled: () => this.defaultToggled()
    })

    useEventListener(Dimensions, "change", this.tt.onDimensionsChange)
    usePressOutside(this.tt.optionsContainerRef, this.tt.onPressOutsideOptions)

    if (Platform.OS == "web") {
      useEventListener(window, "resize", this.tt.onAnythingResizedDebounced)
      useEventListener(window, "scroll", this.tt.onAnythingScrolledDebounced)
    }

    useEffect(() => {
      if (this.tt.callOptionsPositionAboveIfOutsideScreen && this.s.optionsContainerLayout) {
        this.callOptionsPositionAboveIfOutsideScreen = false
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    }, [this.tt.callOptionsPositionAboveIfOutsideScreen, this.s.optionsContainerLayout])

    useEffect(() => {
      const currentOptionIds = this.s.currentOptions?.map((currentOption) => currentOption.value)

      if (this.props.values && anythingDifferent(currentOptionIds, this.props.values) && typeof this.props.options == "function") {
        this.setCurrentFromGivenValues()
      }
    }, [this.props.values])
  }

  translate(msgID) {
    if (msgID.startsWith(".")) {
      return this.t(`haya_select${msgID}`)
    } else {
      return this.t(msgID)
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

  defaultToggled = () => ("toggled" in this.props) ? this.p.toggled : this.props.defaultToggled || {}
  getToggled = () => ("toggled" in this.props) ? this.p.toggled : this.s.toggled
  getValues = () => ("values" in this.props) ? this.p.values : this.s.currentOptions.map((currentOption) => currentOption.value)
  getCurrentOptions = () => {
    if ("values" in this.props && typeof this.props.values != "undefined") {
      if (Array.isArray(this.props.options) && this.props.values) {
        return this.p.values.map((value) => this.p.options.find((option) => option.value == value))
      } else if (this.s.loadedOptions && this.props.values) {
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
      } else if (typeof this.props.options == "function" && this.props.values) {
        // Options haven't been loaded yet.
      } else if (this.props.values) {
        return this.p.values.map((value) => ({value}))
      }
    }

    return this.s.currentOptions
  }

  getCurrentOptionValues() {
    if ("values" in this.props) {
      return this.p.values
    }

    return this.getCurrentOptions().map((option) => option.value)
  }

  componentDidMount() {
    const {attribute, defaultValue, defaultValues, defaultValuesFromOptions, model, options} = this.props

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

    const selectContainerStyleActual = this.stylingFor("selectContainer", {
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
    }, [transparent])

    if (opened) {
      // Prevent select from changing size once the content is replaced with search text once opened
      selectContainerStyleActual.height = this.s.height

      if (optionsPlacement == "above") {
        selectContainerStyleActual.borderTopLeftRadius = 0
        selectContainerStyleActual.borderTopRightRadius = 0
        selectContainerStyleActual.borderBottomRightRadius = selectContainerStyleActual.borderRadius
        selectContainerStyleActual.borderBottomLeftRadius = selectContainerStyleActual.borderRadius

        delete selectContainerStyleActual.borderRadius
      } else if (optionsPlacement == "below") {
        selectContainerStyleActual.borderTopLeftRadius = selectContainerStyleActual.borderRadius
        selectContainerStyleActual.borderTopRightRadius = selectContainerStyleActual.borderRadius
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
                onChange={this.tt.onSearchTextInputChangedDebounced}
                onChangeText={this.tt.onChangeSearchText}
                placeholder={this.translate(".search_dot_dot_dot")}
                ref={this.tt.searchTextInputRef}
                style={this.stylingFor("searchTextInput", this.searchTextInputStyle ||= {
                  width: "100%",
                  border: 0,
                  outline: "none",
                  padding: 0
                })}
                value={this.state.searchText}
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

    const result = await this.props.options({
      searchValue: this.s.searchText,
      values: defaultValues
    })

    this.setState({currentOptions: this.state.currentOptions.concat(result)})
  }

  loadOptions = async () => {
    const {options} = this.p
    const searchValue = this.s.searchText

    if (Array.isArray(options)) {
      return this.loadOptionsFromArray(options, searchValue)
    }

    const loadedOptions = await options({searchValue})

    this.setState({loadedOptions})
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
      />
    )
  }

  loadOptionsFromArray(options, searchValue) {
    const lowerSearchValue = searchValue?.toLowerCase()
    const loadedOptions = options.filter(({text}) => !lowerSearchValue || text?.toLowerCase()?.includes(lowerSearchValue))

    this.setState({loadedOptions})
  }

  onDimensionsChange = ({window}) => {
    this.windowWidth = window.width
    this.windowHeight = window.height
  }

  onSelectContainerLayout = (e) => this.setState({selectContainerLayout: Object.assign({}, digg(e, "nativeEvent", "layout"))})
  onEndOfSelectLayout = (e) => this.setState({endOfSelectLayout: Object.assign({}, digg(e, "nativeEvent", "layout"))})
  onOptionsContainerLayout = (e) => this.setState({optionsContainerLayout: Object.assign({}, digg(e, "nativeEvent", "layout"))})

  onSelectClicked = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const {opened} = this.s

    if (opened) {
      this.closeOptions()
    } else {
      this.openOptions()
    }
  }

  onSearchTextInputChangedDebounced = debounce(this.tt.loadOptions, 200)

  closeOptions() {
    this.setState({
      height: null,
      loadedOptions: undefined,
      opened: false,
      optionsContainerLayout: null
    })

    if (this.props.onOptionsClosed) {
      this.props.onOptionsClosed({options: this.getCurrentOptions()})
    }

    if (this.p.onBlur) this.p.onBlur()
  }

  onChangeSearchText = (searchText) => this.setState({searchText})

  openOptions() {
    this.setOptionsPositionBelow()
    this.loadOptions()
    this.callOptionsPositionAboveIfOutsideScreen = true
    this.setState(
      {
        height: this.s.selectContainerLayout.height,
        opened: true,
        scrollLeft: Platform.OS == "web" ? document.documentElement.scrollLeft : null,
        scrollTop: Platform.OS == "web" ? document.documentElement.scrollTop : null,
        searchText: ""
      },
      () => {
        this.focusTextInput()
      }
    )

    if (this.p.onFocus) this.p.onFocus()
  }

  focusTextInput = () => digg(this.tt.searchTextInputRef, "current")?.focus()

  setOptionsPosition() {
    if (!this.isActive()) {
      return // Debounce after un-mount handeling.
    }

    this.callOptionsPositionAboveIfOutsideScreen = true
    this.setOptionsPositionBelow()
  }

  setOptionsPositionAboveIfOutsideScreen() {
    const {windowHeight} = this.tt
    const {optionsContainerLayout} = this.s
    const optionsTop = this.s.endOfSelectLayout.top
    const optionsTotalBottomPosition = optionsContainerLayout.height + optionsTop
    const windowHeightWithScroll = windowHeight + this.s.scrollTop

    if (windowHeightWithScroll < optionsTotalBottomPosition) {
      this.setOptionsPositionAbove()
    } else {
      this.setState({optionsVisibility: "visible"})
    }
  }

  setOptionsPositionAbove() {
    const {endOfSelectLayout} = this.s

    this.setState(
      {
        opened: true,
        optionsPlacement: "above",
        optionsVisibility: "visible",
        optionsWidth: endOfSelectLayout.width
      },
      () => this.focusTextInput()
    )
  }

  setOptionsPositionBelow() {
    this.setState(
      {
        opened: true,
        optionsPlacement: "below",
        optionsVisibility: "hidden",
        optionsWidth: this.s.endOfSelectLayout.width
      },
      () => this.focusTextInput()
    )
  }

  onAnythingResized = () => {
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingResizedDebounced = debounce(this.tt.onAnythingResized, 25)

  onAnythingScrolled = () => {
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
    // If options are open and a click is made outside of the options container
    if (this.s.opened) {
      this.closeOptions()
    }
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
            <Text>{this.translate(".no_options_found")}</Text>
          </View>
        }
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

    if (existingOption) {
      if (toggleOptions) {
        const currentToggle = toggled[loadedOption.value]
        const currentIndex = toggleOptions.findIndex((element) => element.value == currentToggle)

        if (currentIndex >= (toggleOptions.length - 1)) {
          // No next toggled - remove toggled and option
          delete newToggled[loadedOption.value]

          newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
        } else {
          // Already toggled - set to next toggle
          newToggled[loadedOption.value] = digg(toggleOptions, currentIndex + 1, "value")
        }

        newState.toggled = newToggled
      } else {
        // Remove from current options
        newCurrentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
      }
    } else {
      // Don't do anything if the clicked option is disabled
      if (loadedOption.disabled) return

      if (toggleOptions) {
        // Set fresh toggle
        newToggled[loadedOption.value] = toggleOptions[0].value
        newState.toggled = newToggled
      }

      if (multiple || toggleOptions) {
        newCurrentOptions = currentOptions.concat([loadedOption])
      } else {
        newCurrentOptions = [loadedOption]
      }
    }

    if ("values" in this.props && this.props.values !== undefined) {
      // currentOptions are controlled and a useMemo callback is handeling setting current options.
    } else if (newCurrentOptions) {
      newState.currentOptions = newCurrentOptions
    }

    const options = newCurrentOptions || currentOptions

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

    if (!multiple) this.closeOptions()
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
    const {toggleOptions} = this.props || {}
    const toggled = this.getToggled()
    const icon = this.iconForOption(option)
    const toggleValue = toggled[option.value]
    const toggleOption = toggleOptions?.find((toggleOptionI) => toggleOptionI.value == toggleValue)
    let style

    if (mode == "current") {
      style = this.stylingFor("currentOptionPresentationText", {flex: 1, whiteSpace: "nowrap"})
    } else {
      style = this.stylingFor("optionPresentationText", {flex: 1, whiteSpace: "nowrap"})
    }

    return (
      <View
        dataSet={{
          class: "option-presentation",
          text: option.text,
          toggleIcon: toggleOption?.icon,
          toggleValue: toggleOption?.value,
          value: option.value
        }}
        style={this.optionPresentationStyle ||= {flexDirection: "row"}}
      >
        {toggleOptions && !(option.value in toggled) &&
          <View
            dataSet={this.toggleIconPlaceholderDataSet ||= {class: "toggle-icon-placeholder"}}
            style={this.toggleIconPlaceholderStyle ||= {width: 20}}
          />
        }
        {toggleOptions && (option.value in toggled) &&
          <View style={this.toggleIconContainerStyle ||= {alignItems: "center", justifyContent: "center", width: 20}}>
            <FontAwesomeIcon
              dataSet={this.toggleIconDataSet ||= {class: "toggle-icon"}}
              name={icon}
            />
          </View>
        }
        {(() => {
          if (mode == "current" && option.currentContent) {
            return option.currentContent()
          } else if (option.content) {
            return option.content()
          } else if ("html" in option && Platform.OS != "web") {
            return <RenderHtml source={{html: digg(option, "html")}} />
          } else if ("html" in option && Platform.OS == "web") {
            return <div dangerouslySetInnerHTML={{__html: digg(option, "html")}} />
          } else {
            return (
              <Text
                dataSet={this.optionPresentationTextDataSet ||= {class: "option-presentation-text"}}
                style={style}
              >
                {option.text}
              </Text>
            )
          }
        })()}
      </View>
    )
  }

  async setCurrentFromGivenValues() {
    const {options, values} = this.p
    const currentOptions = await options({values})
    const currentValues = currentOptions?.map((currentOption) => currentOption.value)
    const stateValues = this.s.currentOptions?.map((currentOption) => currentOption.value)

    if (anythingDifferent(currentValues, stateValues)) {
      this.setState({currentOptions})
    }
  }
}))
