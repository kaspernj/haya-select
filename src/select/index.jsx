import {anythingDifferent} from "set-state-compare/src/diff-utils"
import config from "../config.js"
import {digg, digs} from "diggerize"
import debounce from "debounce"
import idForComponent from "@kaspernj/api-maker/src/inputs/id-for-component.mjs"
import nameForComponent from "@kaspernj/api-maker/src/inputs/name-for-component.mjs"
import Option from "./option"
import OptionGroup from "./option-group"
import PropTypes from "prop-types"
import propTypesExact from "prop-types-exact"
import {memo, useRef} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"
import {Platform, Pressable, Text, TextInput, View} from "react-native"
import useEventListener from "@kaspernj/api-maker/src/use-event-listener"

const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  if (component.props.multiple && name) name += "[]"

  return name
}

export default memo(shapeComponent(class HayaSelect extends ShapeComponent {
  static defaultProps = {
    multiple: false,
    search: false
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
    onChange: PropTypes.func,
    onOptionsClosed: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    placeholder: PropTypes.node,
    search: PropTypes.bool.isRequired,
    selectContainerStyle: PropTypes.object,
    toggled: PropTypes.object,
    toggleOptions: PropTypes.arrayOf(PropTypes.shape({
      icon: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })),
    values: PropTypes.array
  })

  p = fetchingObject(() => this.props)
  s = fetchingObject(() => this.state)
  tt = fetchingObject(this)

  setup() {
    const {t} = useI18n({namespace: "haya_select"})

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
      currentSelectedRef: useRef(),
      searchTextInputRef: useRef(),
      t
    })
    this.useStates({
      currentOptions: () => this.defaultCurrentOptions(),
      loadedOptions: () => this.defaultLoadedOptions(),
      opened: false,
      optionsLeft: undefined,
      optionsPlacement: undefined,
      optionsTop: undefined,
      optionsVisibility: undefined,
      optionsWidth: undefined,
      searchText: "",
      scrollLeft: undefined,
      scrollTop: undefined,
      toggled: () => this.defaultToggled()
    })
    useEventListener(window, "click", this.onWindowClicked)
    useEventListener(window, "resize", this.tt.onAnythingResizedDebounced)
    useEventListener(window, "scroll", this.tt.onAnythingScrolledDebounced)
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
      if (this.s.loadedOptions || typeof this.props.options == "function" && this.props.values) {
        if (this.s.loadedOptions) {
          return this.p.values.map((value) => this.s.loadedOptions.find((option) => option.value == value))
        } else {
          this.setCurrentFromGivenValues()
        }
      } else if (Array.isArray(this.props.options)) {
        return this.p.values.map((value) => this.p.options.find((option) => option.value == value))
      } else {
        return this.p.values.map((value) => ({value}))
      }
    }

    return this.s.currentOptions
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
    const {currentSelectedRef, endOfSelectRef} = this.tt
    const {
      attribute,
      className,
      defaultToggled,
      defaultValue,
      defaultValues,
      id,
      model,
      multiple,
      name,
      onChange,
      onOptionsClosed,
      options,
      placeholder,
      search,
      selectContainerStyle,
      toggleOptions,
      ...restProps
    } = this.props
    const {opened, optionsPlacement} = this.s
    const currentOptions = this.getCurrentOptions()
    const BodyPortal = config.getBodyPortal()

    const selectContainerStyleActual = Object.assign(
      {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        border: "1px solid #999",
        color: "#000",
        cursor: "pointer",
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 5
      },
      selectContainerStyle
    )

    if (opened) {
      if (optionsPlacement == "above") {
        selectContainerStyleActual.borderTopLeftRadius = 0
        selectContainerStyleActual.borderTopRightRadius = 0
        selectContainerStyleActual.borderBottomRightRadius = 4
        selectContainerStyleActual.borderBottomLeftRadius = 4
      } else if (optionsPlacement == "below") {
        selectContainerStyleActual.borderTopLeftRadius = 4
        selectContainerStyleActual.borderTopRightRadius = 4
        selectContainerStyleActual.borderBottomRightRadius = 0
        selectContainerStyleActual.borderBottomLeftRadius = 0
      }
    } else {
      selectContainerStyleActual.borderRadius = 4
    }

    const chevronStyle = {fontSize: 24}

    if (opened) {
      chevronStyle.marginBottom = -9
    } else {
      chevronStyle.marginTop = -9
    }

    return (
      <View
        dataSet={{class: className, component: "haya-select", id: idForComponent(this), opened, optionsPlacement, toggles: Boolean(toggleOptions)}}
        {...restProps}
      >
        {opened &&
          <BodyPortal>
            {this.optionsContainer()}
          </BodyPortal>
        }
        <Pressable
          dataSet={{class: "select-container"}}
          onPress={this.tt.onSelectClicked}
          style={selectContainerStyleActual}
        >
          <View
            dataSet={{class: "current-selected"}}
            ref={currentSelectedRef}
            style={{flexWrap: "wrap"}}
          >
            {opened &&
              <TextInput
                dataSet={{class: "search-text-input"}}
                onChange={this.tt.onSearchTextInputChangedDebounced}
                onChangeText={this.tt.onChangeSearchText}
                placeholder={this.t(".search_dot_dot_dot")}
                ref={this.tt.searchTextInputRef}
                style={{
                  width: "100%",
                  border: 0,
                  outline: "none",
                  padding: 0
                }}
                value={this.state.searchText}
              />
            }
            {!opened &&
              <>
                {currentOptions.length == 0 &&
                  <Text style={{color: "grey"}}>
                    {placeholder || this.t(".nothing_selected")}
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
                  <View dataSet={{class: "current-option"}} key={currentOption.key || `current-value-${currentOption.value}`} style={{marginRight: 6}}>
                    {currentOption.type == "group" &&
                      <View style={{fontWeight: "bold"}}>
                        <Text>
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
                        {this.presentOption(currentOption)}
                      </>
                    }
                  </View>
                )}
              </>
            }
          </View>
          <View
            className="chevron-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              marginRight: 8,
              marginLeft: "auto"
            }}
          >
            <Text style={chevronStyle}>
              {opened &&
                <>&#8963;</>
              }
              {!opened &&
                <>&#8964;</>
              }
            </Text>
          </View>
        </Pressable>
        <View ref={endOfSelectRef} />
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
        currentOptions={this.getCurrentOptions()}
        icon={this.iconForOption(loadedOption)}
        key={key}
        option={loadedOption}
        onOptionClicked={this.onOptionClicked}
        presentOption={this.presentOption}
      />
    )
  }

  loadOptionsFromArray(options, searchValue) {
    const lowerSearchValue = searchValue?.toLowerCase()
    const loadedOptions = options.filter(({text}) => !lowerSearchValue || text?.toLowerCase()?.includes(lowerSearchValue))

    this.setState({loadedOptions})
  }

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
      loadedOptions: undefined,
      opened: false
    })

    if (this.props.onOptionsClosed) {
      this.props.onOptionsClosed({options: this.getCurrentOptions()})
    }
  }

  onChangeSearchText = (searchText) => this.setState({searchText})

  openOptions() {
    this.setOptionsPositionBelow()
    this.loadOptions()
    this.setState(
      {opened: true, searchText: ""},
      () => {
        this.focusTextInput()
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    )
  }

  focusTextInput = () => digg(this.tt.searchTextInputRef, "current")?.focus()

  setOptionsPosition() {
    if (!this.isActive()) {
      return // Debounce after un-mount handeling.
    }

    this.setOptionsPositionBelow()
    this.setOptionsPositionAboveIfOutsideScreen()
  }

  setOptionsPositionAboveIfOutsideScreen() {
    const {optionsContainerRef} = this.tt
    const {optionsTop} = this.s
    const optionsHeight = digg(optionsContainerRef, "current", "offsetHeight")
    const scrollTop = document.documentElement.scrollTop
    const optionsTotalHeight = optionsHeight + optionsTop + scrollTop
    const windowHeightWithScroll = window.innerHeight + scrollTop

    if (windowHeightWithScroll < optionsTotalHeight) {
      this.setOptionsPositionAbove()
    } else {
      this.setState({optionsVisibility: "visible"})
    }
  }

  setOptionsPositionAbove() {
    const {optionsContainerRef, currentSelectedRef, endOfSelectRef} = this.tt
    const optionsHeight = digg(optionsContainerRef, "current", "offsetHeight")
    const position = currentSelectedRef.current.getBoundingClientRect()
    const {top} = digs(position, "top")
    const optionsTop = top - optionsHeight + 2
    const {left, width} = digs(endOfSelectRef.current.getBoundingClientRect(), "left", "width")

    this.setState(
      {
        opened: true,
        optionsLeft: left,
        optionsPlacement: "above",
        optionsTop,
        optionsVisibility: "visible",
        optionsWidth: width,
        scrollLeft: document.documentElement.scrollLeft,
        scrollTop: document.documentElement.scrollTop
      },
      () => this.focusTextInput()
    )
  }

  setOptionsPositionBelow() {
    const {endOfSelectRef} = this.tt
    const position = endOfSelectRef.current.getBoundingClientRect()
    const {left, top, width} = digs(position, "left", "top", "width")

    this.setState(
      {
        opened: true,
        optionsLeft: left,
        optionsPlacement: "below",
        optionsTop: top,
        optionsVisibility: "hidden",
        optionsWidth: width,
        scrollLeft: document.documentElement.scrollLeft,
        scrollTop: document.documentElement.scrollTop
      },
      () => this.focusTextInput()
    )
  }

  onAnythingResized = (e) => {
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingResizedDebounced = debounce(this.tt.onAnythingResized, 25)

  onAnythingScrolled = (e) => {
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingScrolledDebounced = debounce(this.tt.onAnythingScrolled, 25)

  onWindowClicked = (e) => {
    const {optionsContainerRef} = this.tt
    const {opened} = this.s

    // If options are open and a click is made outside of the options container
    if (opened && optionsContainerRef.current && !optionsContainerRef.current?.contains(e.target)) {
      this.closeOptions()
    }
  }

  optionsContainer() {
    const {optionsContainerRef} = this.tt
    const {loadedOptions, optionsLeft, optionsTop, optionsVisibility, optionsWidth, scrollLeft, scrollTop} = this.s

    return (
      <View
        dataSet={{class: "options-container", id: idForComponent(this)}}
        ref={optionsContainerRef}
        style={{
          position: "absolute",
          left: optionsLeft + scrollLeft,
          top: optionsTop + scrollTop - 1,
          zIndex: 99999,
          visibility: optionsVisibility,
          width: optionsWidth,
          backgroundColor: "#fff",
          border: "1px solid #999",
          maxHeight: 300,
          overflowY: "auto"
        }}
      >
        {loadedOptions?.map((loadedOption) =>
          this.hayaSelectOption({
            key: loadedOption.key || `loaded-option-${loadedOption.value}`,
            loadedOption
          })
        )}
        {loadedOptions?.length === 0 &&
          <View dataSet={{class: "no-options-container"}}>
            <Text>
              {this.t(".no_options_found")}
            </Text>
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

    if (existingOption) {
      if (toggleOptions) {
        const currentToggle = toggled[loadedOption.value]
        const currentIndex = toggleOptions.findIndex((element) => element.value == currentToggle)

        if (currentIndex >= (toggleOptions.length - 1)) {
          // No next toggled - remove toggled and option
          delete newToggled[loadedOption.value]

          newState.currentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
        } else {
          // Already toggled - set to next toggle
          newToggled[loadedOption.value] = digg(toggleOptions, currentIndex + 1, "value")
        }

        newState.toggled = newToggled
      } else {
        // Remove from current options
        newState.currentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
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
        newState.currentOptions = currentOptions.concat([loadedOption])
      } else {
        newState.currentOptions = [loadedOption]
      }
    }

    if (onChange) {
      onChange({
        event,
        options: newState.currentOptions || currentOptions,
        toggles: newToggled
      })
    }

    if (!multiple) this.closeOptions()
    this.setState(newState)
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

  presentOption = (currentValue) => {
    const {toggleOptions} = this.props || {}
    const toggled = this.getToggled()
    const icon = this.iconForOption(currentValue)
    const toggleValue = toggled[currentValue.value]
    const toggleOption = toggleOptions?.find((toggleOptionI) => toggleOptionI.value == toggleValue)

    return (
      <View
        dataSet={{class: "option-presentation"}}
        data-toggle-icon={toggleOption?.icon}
        data-toggle-value={toggleOption?.value}
        data-value={currentValue.value}
      >
        {toggleOptions && !(currentValue.value in toggled) &&
          <i className="fa fa-fw" />
        }
        {toggleOptions && (currentValue.value in toggled) &&
          <i className={`fa fa-fw fa-${icon}`} />
        }
        {currentValue.content}
        {!currentValue.content &&
          <Text>{currentValue.text}</Text>
        }
        {("html" in currentValue) &&
          <div dangerouslySetInnerHTML={{__html: digg(currentValue, "html")}} />
        }
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
