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
import {anythingDifferent} from "set-state-compare"

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
  s = fetchingObject(() => this.state)
  t = fetchingObject(this)

  endOfSelectRef = React.createRef()
  optionsContainerRef = React.createRef()
  searchTextInputRef = React.createRef()

  state = {
    currentOptions: this.defaultCurrentOptions(),
    loadedOptions: this.defaultLoadedOptions(),
    opened: false,
    optionsLeft: undefined,
    optionsTop: undefined,
    optionsWidth: undefined,
    scrollLeft: undefined,
    scrollTop: undefined,
    toggled: this.defaultToggled()
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

  defaultToggled() {
    return this.props.defaultToggled || this.props.toggled || {}
  }

  componentDidMount() {
    const {attribute, defaultValue, defaultValues, defaultValuesFromOptions, model, options} = this.props

    if (((defaultValue || defaultValues || defaultValuesFromOptions) || (attribute && model)) && typeof options == "function") {
      this.loadDefaultValuesFromOptionsCallback()
    }
  }

  componentDidUpdate() {
    this.setState((prevState) => {
      const stateUpdate = {}

      if ("values" in this.props) {
        const newCurrentOptions = this.defaultCurrentOptions()

        if (anythingDifferent(prevState.currentOptions, newCurrentOptions)) {
          stateUpdate.currentOptions = newCurrentOptions
        }
      }

      if ("toggled" in this.props) {
        const newToggled = digg(this, "props", "toggled")

        if (anythingDifferent(prevState.toggled, newToggled)) {
          stateUpdate.toggled = newToggled
        }
      }

      return stateUpdate
    })
  }

  render() {
    const {endOfSelectRef} = this.t
    const {
      attribute,
      className,
      defaultToggled,
      defaultValue,
      defaultValues,
      id,
      model,
      multiple,
      onChange,
      onOptionsClosed,
      options,
      placeholder,
      search,
      toggleOptions,
      ...restProps
    } = this.props
    const {currentOptions, opened} = this.s
    const BodyPortal = config.getBodyPortal()

    return (
      <div
        className={classNames("haya-select", className)}
        data-id={idForComponent(this)}
        data-toggles={Boolean(toggleOptions)}
        {...restProps}
      >
        {opened &&
          <BodyPortal>
            {this.optionsContainer()}
          </BodyPortal>
        }
        <div
          className="haya-select-current-selected"
          data-opened={opened}
          onClick={this.onSelectClicked}
        >
          {opened &&
            <input
              className="haya-select-search-text-input"
              onChange={digg(this, "onSearchTextInputChangedDebounced")}
              placeholder={I18n.t("haya_select.search_dot_dot_dot")} type="text"
              ref={digg(this, "searchTextInputRef")}
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

  async loadDefaultValuesFromOptionsCallback() {
    const defaultValues = this.defaultValues()

    if (!defaultValues) return

    const result = await this.props.options({
      searchValue: digg(this, "searchTextInputRef", "current")?.value,
      values: defaultValues
    })

    this.setState((prevState) => ({
      currentOptions: prevState.currentOptions.concat(result)
    }))
  }

  loadOptions = async () => {
    const {options} = this.p
    const searchValue = digg(this, "searchTextInputRef", "current")?.value

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
      currentOptions={this.state.currentOptions}
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

  onSearchTextInputChangedDebounced = debounce(digg(this, "loadOptions"), 200)

  closeOptions() {
    this.setState({
      loadedOptions: undefined,
      opened: false
    })

    if (this.props.onOptionsClosed) {
      this.props.onOptionsClosed({options: this.state.currentOptions})
    }
  }

  openOptions() {
    const {endOfSelectRef} = this.t
    const position = endOfSelectRef.current.getBoundingClientRect()
    const {left, top, width} = digs(position, "left", "top", "width")

    this.loadOptions()

    this.setState(
      {
        opened: true,
        optionsLeft: left,
        optionsTop: top,
        optionsWidth: width,
        scrollLeft: document.documentElement.scrollLeft,
        scrollTop: document.documentElement.scrollTop
      },
      () => digg(this, "searchTextInputRef", "current").focus()
    )
  }

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
    const {loadedOptions, optionsLeft, optionsTop, optionsWidth, scrollLeft, scrollTop} = this.s

    return (
      <div
        className="haya-select-options-container"
        data-id={idForComponent(this)}
        ref={optionsContainerRef}
        style={{
          left: optionsLeft + scrollLeft,
          top: optionsTop + scrollTop - 1,
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

  onOptionClicked = (e, loadedOption) => {
    e.preventDefault()
    e.stopPropagation()

    const {onChange, toggleOptions} = this.props
    const {multiple} = this.p

    this.setState(
      (prevState) => {
        const existingOption = prevState.currentOptions.find((currentOption) => currentOption.value == loadedOption.value)
        const newState = {}
        const {toggled} = digs(prevState, "toggled")
        const newToggled = {...toggled}

        if (existingOption) {
          if (toggleOptions) {
            const currentIndex = digg(toggled, loadedOption.value)

            if (currentIndex >= (toggleOptions.length - 1)) {
              delete newToggled[loadedOption.value]

              newState.currentOptions = prevState.currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
            } else {
              newToggled[loadedOption.value] = toggled[loadedOption.value] + 1
            }

            newState.toggled = newToggled
          } else {
            newState.currentOptions = prevState.currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
          }
        } else {
          if (toggleOptions) {
            newToggled[loadedOption.value] = 0
            newState.toggled = newToggled
          }

          if (multiple || toggleOptions) {
            newState.currentOptions = prevState.currentOptions.concat([loadedOption])
          } else {
            newState.currentOptions = [loadedOption]
          }
        }

        return newState
      },
      () => {
        if (onChange) {
          const toggles = {}

          for(const toggleKey in this.state.toggled) {
            const toggleValue = digg(this, "state", "toggled", toggleKey)
            const toggleOption = digg(this, "props", "toggleOptions", toggleValue)

            toggles[toggleKey] = toggleOption
          }

          onChange({
            options: this.state.currentOptions,
            toggles
          })
        }
      }
    )

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
        {currentValue.text}
        {("html" in currentValue) &&
          <div dangerouslySetInnerHTML={{__html: digg(currentValue, "html")}} />
        }
      </div>
    )
  }
}
