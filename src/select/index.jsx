import "./style"
import {anythingDifferent} from "set-state-compare/src/diff-utils"
import classNames from "classnames"
import config from "../config.js"
import {digg, digs} from "diggerize"
import debounce from "debounce"
import idForComponent from "@kaspernj/api-maker/src/inputs/id-for-component.mjs"
import nameForComponent from "@kaspernj/api-maker/src/inputs/name-for-component.mjs"
import Option from "./option"
import OptionGroup from "./option-group"
import PropTypes from "prop-types"
import {memo, useRef} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"
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
  s = fetchingObject(() => this.state)
  tt = fetchingObject(this)

  setup() {
    const {t} = useI18n({namespace: "haya_select"})

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
    if ("values" in this.props) {
      if (this.s.loadedOptions) {
        return this.p.values.map((value) => this.s.loadedOptions.find((option) => option.value == value))
      } else if (this.props.options) {
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

    if ("values" in this.props) {
      const newCurrentOptions = this.defaultCurrentOptions()

      if (anythingDifferent(this.state.currentOptions, newCurrentOptions)) {
        newState.currentOptions = newCurrentOptions
      }
    }

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
    const {currentSelectedRef, endOfSelectRef, onSelectClicked, onSearchTextInputChangedDebounced} = this.tt
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
    const {opened, optionsPlacement} = this.s
    const currentOptions = this.getCurrentOptions()
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
          <div className="haya-select-current-selected" ref={currentSelectedRef}>
            {opened &&
              <input
                className="haya-select-search-text-input"
                onChange={onSearchTextInputChangedDebounced}
                placeholder={this.t(".search_dot_dot_dot")}
                type="text"
                ref={this.tt.searchTextInputRef}
              />
            }
            {!opened &&
              <>
                {currentOptions.length == 0 &&
                  <div style={{color: "grey"}}>
                    {placeholder || this.t(".nothing_selected")}
                  </div>
                }
                {currentOptions.length == 0 &&
                  <input
                    id={idForComponent(this)}
                    name={nameForComponentWithMultiple(this)}
                    type="hidden"
                    value=""
                  />
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
    if (this.tt.endOfSelectRef.current) {
      return true
    }

    return false
  }

  async loadDefaultValuesFromOptionsCallback() {
    const defaultValues = this.defaultValues()

    if (!defaultValues) return

    const result = await this.props.options({
      searchValue: digg(this.tt.searchTextInputRef, "current")?.value,
      values: defaultValues
    })

    this.setState({currentOptions: this.state.currentOptions.concat(result)})
  }

  loadOptions = async () => {
    const {options} = this.p
    const searchValue = digg(this.tt.searchTextInputRef, "current")?.value

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

    return <Option
      currentOptions={this.getCurrentOptions()}
      icon={this.iconForOption(loadedOption)}
      key={key}
      option={loadedOption}
      onOptionClicked={this.onOptionClicked}
      presentOption={this.presentOption}
    />
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

  openOptions() {
    this.setOptionsPositionBelow()
    this.loadOptions()
    this.setState(
      {opened: true},
      () => {
        this.focusTextInput()
        this.setOptionsPositionAboveIfOutsideScreen()
      }
    )
  }

  focusTextInput = () => digg(this.tt.searchTextInputRef, "current").focus()

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

    if (window.innerHeight < optionsTotalHeight) {
      this.setOptionsPositionAbove()
    } else {
      this.setState({optionsVisibility: "visible"})
    }
  }

  setOptionsPositionAbove() {
    const {optionsContainerRef, currentSelectedRef, searchTextInputRef} = this.tt
    const optionsHeight = digg(optionsContainerRef, "current", "offsetHeight")
    const position = currentSelectedRef.current.getBoundingClientRect()
    const {left, top, width} = digs(position, "left", "top", "width")
    const optionsTop = top - optionsHeight + 2

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
      () => searchTextInputRef.current.focus()
    )
  }

  setOptionsPositionBelow() {
    const {endOfSelectRef, searchTextInputRef} = this.tt
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
      () => searchTextInputRef.current.focus()
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
        {loadedOptions?.map((loadedOption) =>
          this.hayaSelectOption({
            key: loadedOption.key || `loaded-option-${loadedOption.value}`,
            loadedOption
          })
        )}
        {loadedOptions?.length === 0 &&
          <div className="haya-select-no-options-container">
            {this.t(".no_options_found")}
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
}))
