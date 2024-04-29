import "./style"
import classNames from "classnames"
import config from "../config.js"
import {digg, digs} from "diggerize"
import debounce from "debounce"
import EventListener from "@kaspernj/api-maker/src/event-listener"
import idForComponent from "@kaspernj/api-maker/src/inputs/id-for-component.mjs"
import nameForComponent from "@kaspernj/api-maker/src/inputs/name-for-component.mjs"
import Option from "./option"
import OptionGroup from "./option-group"
import PropTypes from "prop-types"
import React from "react"
import {anythingDifferent, Shape} from "set-state-compare"

const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  if (component.props.multiple && name) name += "[]"

  return name
}

export default class HayaSelect extends React.PureComponent {
  static defaultProps = {
    multiple: false,
    search: false
  }

  static propTypes = {
    attribute: PropTypes.string,
    className: PropTypes.string,
    defaultToggled: PropTypes.object,
    defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defaultValues: PropTypes.array,
    defaultValuesFromOptions: PropTypes.array,
    id: PropTypes.node,
    model: PropTypes.object,
    multiple: PropTypes.bool.isRequired,
    onChange: PropTypes.func,
    onOptionsClosed: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    placeholder: PropTypes.node,
    search: PropTypes.bool.isRequired,
    toggled: PropTypes.object,
    toggleOptions: PropTypes.arrayOf(PropTypes.shape({
      icon: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })),
    values: PropTypes.array
  }

  p = fetchingObject(() => this.props)
  s = fetchingObject(() => this.shape)
  t = fetchingObject(this)

  endOfSelectRef = React.createRef()
  optionsContainerRef = React.createRef()
  currentSelectedRef = React.createRef()
  searchTextInputRef = React.createRef()

  shape = new Shape(this, {
    currentOptions: this.defaultCurrentOptions(),
    loadedOptions: this.defaultLoadedOptions(),
    opened: false,
    optionsLeft: undefined,
    optionsPlacement: undefined,
    optionsTop: undefined,
    optionsVisibility: undefined,
    optionsWidth: undefined,
    scrollLeft: undefined,
    scrollTop: undefined,
    toggled: this.defaultToggled()
  })

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

  defaultToggled() {
    return this.props.defaultToggled || this.props.toggled || {}
  }

  componentDidMount() {
    const {attribute, defaultValue, defaultValues, defaultValuesFromOptions, model, options} = this.props

    if (((defaultValue || defaultValues || defaultValuesFromOptions) || (attribute && model)) && typeof options == "function") {
      this.loadDefaultValuesFromOptionsCallback()
    }

    window.addEventListener("resize", this.t.onAnythingResizedDebounced, true)
    window.addEventListener("scroll", this.t.onAnythingScrolledDebounced, true)
  }

  componentDidUpdate() {
    const newState = {}

    if ("values" in this.props) {
      const newCurrentOptions = this.defaultCurrentOptions()

      if (anythingDifferent(this.shape.currentOptions, newCurrentOptions)) {
        newState.currentOptions = newCurrentOptions
      }
    }

    if ("toggled" in this.props) {
      const newToggled = this.p.toggled

      if (anythingDifferent(this.shape.toggled, newToggled)) {
        newState.toggled = newToggled
      }
    }

    this.shape.set(newState)
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.t.onAnythingResizedDebounced)
    window.removeEventListener("scroll", this.t.onAnythingScrolledDebounced)
  }

  render() {
    const {currentSelectedRef, endOfSelectRef, onSelectClicked, onSearchTextInputChangedDebounced} = this.t
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
      toggleOptions,
      ...restProps
    } = this.props
    const {currentOptions, opened, optionsPlacement} = this.s
    const BodyPortal = config.getBodyPortal()

    return (
      <div
        className={classNames("haya-select", className)}
        data-id={idForComponent(this)}
        data-opened={opened}
        data-options-placement={optionsPlacement}
        data-toggles={Boolean(toggleOptions)}
        {...restProps}
      >
        {opened &&
          <BodyPortal>
            {this.optionsContainer()}
          </BodyPortal>
        }
        <div className="haya-select-container" onClick={onSelectClicked}>
          <div
            className="haya-select-current-selected"
            ref={currentSelectedRef}
          >
            {opened &&
              <input
                className="haya-select-search-text-input"
                onChange={onSearchTextInputChangedDebounced}
                placeholder={I18n.t("haya_select.search_dot_dot_dot")}
                type="text"
                ref={this.t.searchTextInputRef}
              />
            }
            {!opened &&
              <>
                {currentOptions.length == 0 &&
                  <div style={{color: "grey"}}>
                    {placeholder || I18n.t("haya_select.nothing_selected")}
                  </div>
                }
                {currentOptions.map((currentOption) =>
                  <div className="current-option" key={currentOption.key || `current-value-${currentOption.value}`}>
                    {currentOption.type == "group" &&
                      <div style={{fontWeight: "bold"}}>
                        {currentOption.text}
                      </div>
                    }
                    {currentOption.type != "group" &&
                      <>
                        {nameForComponentWithMultiple(this) &&
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
                  </div>
                )}
              </>
            }
          </div>
          <div className="haya-select-chevron-down-container">
            <i className="fa fa-chevron-down" />
          </div>
        </div>
        <div ref={endOfSelectRef} />
      </div>
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
    if (this.t.endOfSelectRef.current) {
      return true
    }

    return false
  }

  async loadDefaultValuesFromOptionsCallback() {
    const defaultValues = this.defaultValues()

    if (!defaultValues) return

    const result = await this.props.options({
      searchValue: digg(this.t.searchTextInputRef, "current")?.value,
      values: defaultValues
    })

    this.shape.set({currentOptions: this.shape.currentOptions.concat(result)})
  }

  loadOptions = async () => {
    const {options} = this.p
    const searchValue = digg(this.t.searchTextInputRef, "current")?.value

    if (Array.isArray(options)) {
      return this.loadOptionsFromArray(options, searchValue)
    }

    const loadedOptions = await options({searchValue})

    this.shape.set({loadedOptions})
  }

  hayaSelectOption({key, loadedOption}) {
    if (loadedOption.type == "group") {
      return <OptionGroup key={key} option={loadedOption} />
    }

    return <Option
      currentOptions={this.shape.currentOptions}
      icon={this.iconForOption(loadedOption)}
      key={key}
      option={loadedOption}
      onOptionClicked={this.onOptionClicked}
      presentOption={this.presentOption}
    />
  }

  loadOptionsFromArray(options, searchValue) {
    const lowerSearchValue = searchValue?.toLowerCase()
    const loadedOptions = options.filter(({text}) => !lowerSearchValue || text.toLowerCase().includes(lowerSearchValue))

    this.shape.set({loadedOptions})
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

  onSearchTextInputChangedDebounced = debounce(this.t.loadOptions, 200)

  closeOptions() {
    this.shape.set({
      loadedOptions: undefined,
      opened: false
    })

    if (this.props.onOptionsClosed) {
      this.props.onOptionsClosed({options: this.shape.currentOptions})
    }
  }

  openOptions() {
    this.setOptionsPositionBelow()
    this.loadOptions()
    this.shape.set(
      {opened: true},
      () => {
        this.focusTextInput()
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    )
  }

  focusTextInput = () => digg(this.t.searchTextInputRef, "current").focus()

  setOptionsPosition() {
    if (!this.isActive()) return // Debounce after un-mount handeling.

    this.setOptionsPositionBelow()
    this.setOptionsPositionAboveIfOutsideScreen()
  }

  setOptionsPositionAboveIfOutsideScreen() {
    const {optionsContainerRef} = this.t
    const {optionsTop} = this.s
    const optionsHeight = digg(optionsContainerRef, "current", "offsetHeight")
    const scrollTop = document.documentElement.scrollTop
    const optionsTotalHeight = optionsHeight + optionsTop + scrollTop

    if (window.innerHeight < optionsTotalHeight) {
      this.setOptionsPositionAbove()
    } else {
      this.shape.set({optionsVisibility: "visible"})
    }
  }

  setOptionsPositionAbove() {
    const {optionsContainerRef, currentSelectedRef, searchTextInputRef} = this.t
    const optionsHeight = digg(optionsContainerRef, "current", "offsetHeight")
    const position = currentSelectedRef.current.getBoundingClientRect()
    const {left, top, width} = digs(position, "left", "top", "width")
    const optionsTop = top - optionsHeight + 2

    this.shape.set(
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
      () => searchTextInputRef.current.focus()
    )
  }

  setOptionsPositionBelow() {
    const {endOfSelectRef, searchTextInputRef} = this.t
    const position = endOfSelectRef.current.getBoundingClientRect()
    const {left, top, width} = digs(position, "left", "top", "width")

    this.shape.set(
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
      () => searchTextInputRef.current.focus()
    )
  }

  onAnythingResized = (e) => {
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingResizedDebounced = debounce(this.t.onAnythingResized, 25)

  onAnythingScrolled = (e) => {
    if (this.s.opened) {
      this.setOptionsPosition()
    }
  }

  onAnythingScrolledDebounced = debounce(this.t.onAnythingScrolled, 25)

  onWindowClicked = (e) => {
    const {optionsContainerRef} = this.t
    const {opened} = this.s

    // If options are open and a click is made outside of the options container
    if (opened && optionsContainerRef.current && !optionsContainerRef.current?.contains(e.target)) {
      this.closeOptions()
    }
  }

  optionsContainer() {
    const {optionsContainerRef} = this.t
    const {loadedOptions, optionsLeft, optionsTop, optionsVisibility, optionsWidth, scrollLeft, scrollTop} = this.s

    return (
      <div
        className="haya-select-options-container"
        data-id={idForComponent(this)}
        ref={optionsContainerRef}
        style={{
          left: optionsLeft + scrollLeft,
          top: optionsTop + scrollTop - 1,
          visibility: optionsVisibility,
          width: optionsWidth,
        }}
      >
        <EventListener event="click" onCalled={this.onWindowClicked} target={window} />
        {loadedOptions?.map((loadedOption) =>
          this.hayaSelectOption({
            key: loadedOption.key || `loaded-option-${loadedOption.value}`,
            loadedOption
          })
        )}
        {loadedOptions?.length === 0 &&
          <div className="haya-select-no-options-container">
            {I18n.t("haya_select.no_options_found")}
          </div>
        }
      </div>
    )
  }

  onOptionClicked = (event, loadedOption) => {
    event.preventDefault()
    event.stopPropagation()

    const {onChange, toggleOptions} = this.props
    const {multiple} = this.p
    const {currentOptions, toggled} = this.shape
    const newState = {}
    const existingOption = currentOptions.find((currentOption) => currentOption.value == loadedOption.value)
    const newToggled = {...toggled}

    if (existingOption) {
      if (toggleOptions) {
        const currentIndex = digg(toggled, loadedOption.value)

        if (currentIndex >= (toggleOptions.length - 1)) {
          delete newToggled[loadedOption.value]

          newState.currentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
        } else {
          newToggled[loadedOption.value] = toggled[loadedOption.value] + 1
        }

        newState.toggled = newToggled
      } else {
        newState.currentOptions = currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
      }
    } else {
      // Don't do anything if the clicked option is disabled
      if (loadedOption.disabled) return

      if (toggleOptions) {
        newToggled[loadedOption.value] = 0
        newState.toggled = newToggled
      }

      if (multiple || toggleOptions) {
        newState.currentOptions = currentOptions.concat([loadedOption])
      } else {
        newState.currentOptions = [loadedOption]
      }
    }

    this.shape.set(newState)

    if (onChange) {
      const toggles = {}

      for(const toggleKey in this.shape.toggled) {
        const toggleValue = digg(this.s.toggled, toggleKey)
        const toggleOption = digg(this.p.toggleOptions, toggleValue)

        toggles[toggleKey] = toggleOption
      }

      onChange({
        event,
        options: this.shape.currentOptions,
        toggles
      })
    }

    if (!multiple) this.closeOptions()
  }

  iconForOption(option) {
    const {toggleOptions} = this.props || {}
    const {toggled} = this.s

    if (toggleOptions && (option.value in toggled)) {
      const icon = toggleOptions[toggled[option.value]].icon

      return icon
    }
  }

  presentOption = (currentValue) => {
    const {toggleOptions} = this.props || {}
    const {toggled} = this.s
    const icon = this.iconForOption(currentValue)

    return (
      <div
        className="haya-select-option-presentation"
        data-toggle-icon={toggleOptions && toggled && toggleOptions[toggled[currentValue.value]]?.icon}
        data-toggle-value={toggleOptions && toggled && toggleOptions[toggled[currentValue.value]]?.value}
        data-value={currentValue.value}
      >
        {toggleOptions && !(currentValue.value in toggled) &&
          <i className="fa fa-fw" />
        }
        {toggleOptions && (currentValue.value in toggled) &&
          <i className={`fa fa-fw fa-${icon}`} />
        }
        {currentValue.content}
        {!currentValue.content && currentValue.text}
        {("html" in currentValue) &&
          <div dangerouslySetInnerHTML={{__html: digg(currentValue, "html")}} />
        }
      </div>
    )
  }
}
