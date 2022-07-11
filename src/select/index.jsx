import "./style"
import classNames from "classnames"
import config from "../config.js"
import {digg, digs} from "diggerize"
import debounce from "debounce"
import EventListener from "@kaspernj/api-maker/src/event-listener"
import idForComponent from "@kaspernj/api-maker-inputs/src/id-for-component.mjs"
import nameForComponent from "@kaspernj/api-maker-inputs/src/name-for-component.mjs"
import PropTypes from "prop-types"

const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  if (component.props.multiple) name += "[]"

  return name
}

export default class HayaSelect extends React.PureComponent {
  static defaultProps = {
    defaultToggled: {},
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
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    placeholder: PropTypes.node,
    search: PropTypes.bool.isRequired,
    toggleOptions: PropTypes.arrayOf(PropTypes.shape({
      icon: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    }))
  }

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
    toggled: digg(this, "props", "defaultToggled")
  }

  defaultCurrentOptions() {
    const {defaultValue, defaultValues} = this.props
    const {options} = digs(this.props, "options")

    if (!Array.isArray(options)) return []

    return options.filter(({value}) =>
      (defaultValue && value == defaultValue) ||
        (defaultValues && defaultValues.includes(value))
    )
  }

  defaultLoadedOptions() {
    const {options} = digs(this.props, "options")

    if (typeof options == "function") {
      return undefined
    } else if (Array.isArray(options)) {
      return options
    }

    throw new Error(`Unknown type of options: ${typeof options}`)
  }

  componentDidMount() {
    const {attribute, defaultValue, defaultValuesFromOptions, model, options} = this.props

    if (((defaultValue || defaultValuesFromOptions) || (attribute && model)) && typeof options == "function") {
      this.loadDefaultValuesFromOptionsCallback()
    }
  }

  render() {
    const {endOfSelectRef} = digs(this, "endOfSelectRef")
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
      options,
      placeholder,
      search,
      toggleOptions,
      ...restProps
    } = this.props
    const {currentOptions, opened} = digs(this.state, "currentOptions", "opened")
    const BodyPortal = config.getBodyPortal()

    return (
      <div
        className={classNames("haya-select", className)}
        data-id={idForComponent(this)}
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
                <div className="current-option" key={`current-value-${digg(currentOption, "value")}`}>
                  {nameForComponentWithMultiple(this) &&
                    <input
                      id={idForComponent(this)}
                      name={nameForComponentWithMultiple(this)}
                      type="hidden"
                      value={digg(currentOption, "value")}
                    />
                  }
                  {this.presentOption(currentOption)}
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
    const {attribute, defaultValue, defaultValuesFromOptions, model} = this.props

    if (defaultValuesFromOptions) return defaultValuesFromOptions
    if (defaultValue) return defaultValue

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
    const {options} = digs(this.props, "options")
    const searchValue = digg(this, "searchTextInputRef", "current")?.value

    if (Array.isArray(options)) {
      return this.loadOptionsFromArray(options, searchValue)
    }

    const loadedOptions = await options({searchValue})

    this.setState({loadedOptions})
  }

  hayaSelectOption({key, loadedOption}) {
    const {currentOptions} = digs(this.state, "currentOptions")
    const selected = Boolean(currentOptions.find((currentOption) => currentOption.value == loadedOption.value))

    return (
      <div
        className="haya-select-option"
        data-selected={selected}
        data-value={digg(loadedOption, "value")}
        key={key}
        onClick={(e) => this.onOptionClicked(e, loadedOption)}
        style={{cursor: "pointer"}}
      >
        {this.presentOption(loadedOption)}
      </div>
    )
  }

  loadOptionsFromArray(options, searchValue) {
    const lowerSearchValue = searchValue?.toLowerCase()
    const loadedOptions = options.filter(({text}) => !lowerSearchValue || text.toLowerCase().includes(lowerSearchValue))

    this.setState({loadedOptions})
  }

  onSelectClicked = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const {opened} = digs(this.state, "opened")

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
  }

  openOptions() {
    const {endOfSelectRef} = digs(this, "endOfSelectRef")
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
      () => {
        digg(this, "searchTextInputRef", "current").focus()
      }
    )
  }

  onWindowClicked = (e) => {
    const {optionsContainerRef} = digs(this, "optionsContainerRef")
    const {opened} = digs(this.state, "opened")

    // If options are open and a click is made outside of the options container
    if (opened && optionsContainerRef.current && !optionsContainerRef.current?.contains(e.target)) {
      this.setState({opened: false})
    }
  }

  optionsContainer() {
    const {optionsContainerRef} = digs(this, "endOfSelectRef", "optionsContainerRef")
    const {
      loadedOptions,
      optionsLeft,
      optionsTop,
      optionsWidth,
      scrollLeft,
      scrollTop
    } = digs(
      this.state,
      "loadedOptions",
      "currentOptions",
      "opened",
      "optionsLeft",
      "optionsTop",
      "optionsWidth",
      "scrollLeft",
      "scrollTop"
    )

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
            key: `loaded-option-${digg(loadedOption.value)}`,
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
    const {multiple} = digs(this.props, "multiple")

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

  presentOption = (currentValue) => {
    const {toggleOptions} = this.props || {}
    const {toggled} = digs(this.state, "toggled")

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
          <i className={`fa fa-fw fa-${toggleOptions[toggled[currentValue.value]].icon}`} />
        }
        {currentValue.text}
        {("html" in currentValue) &&
          <div dangerouslySetInnerHTML={{__html: digg(currentValue, "html")}} />
        }
      </div>
    )
  }
}
