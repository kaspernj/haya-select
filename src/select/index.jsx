import "./style"
import classNames from "classnames"
import config from "../config.js"
import {digg, digs} from "diggerize"
import debounce from "debounce"
import {idForComponent, nameForComponent} from "@kaspernj/api-maker-inputs"
import PropTypes from "prop-types"

const nameForComponentWithMultiple = (component) => {
  let name = nameForComponent(component)

  if (component.props.multiple) name += "[]"

  return name
}

const presentOption = (currentValue) => {
  if (currentValue.text) return currentValue.text

  if (currentValue.html) {
    return (
      <div dangerouslySetInnerHTML={{__html: digg(currentValue, "html")}} />
    )
  }

  throw new Error("Couldn't figure out how to present option")
}

const LoadedOption = class LoadedOption extends BaseComponent {
  render() {
    const {currentOptions, loadedOption} = digs(this.props, "currentOptions", "loadedOption")
    const selected = Boolean(currentOptions.find((currentOption) => currentOption.value == loadedOption.value))

    return (
      <div
        className="haya-select-option"
        data-selected={selected}
        data-value={digg(loadedOption, "value")}
        onClick={this.onOptionClicked}
        style={{cursor: "pointer"}}
      >
        {presentOption(loadedOption)}
      </div>
    )
  }

  onOptionClicked = (e) => this.props.onClick(e, this.props.loadedOption)
}

export default class CustomSelect extends React.PureComponent {
  static defaultProps = {
    multiple: false,
    search: false
  }

  static propTypes = {
    attribute: PropTypes.string,
    className: PropTypes.string,
    defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defaultValues: PropTypes.array,
    defaultValuesFromOptions: PropTypes.array,
    model: PropTypes.object,
    multiple: PropTypes.bool.isRequired,
    onChange: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    search: PropTypes.bool.isRequired
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
    scrollTop: undefined
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
    const {attribute, defaultValuesFromOptions, model, options} = this.props

    if ((defaultValuesFromOptions || (attribute && model)) && typeof options == "function") {
      this.loadDefaultValuesFromOptionsCallback()
    }
  }

  render() {
    const {endOfSelectRef} = digs(this, "endOfSelectRef")
    const {attribute, className, defaultValue, defaultValues, model, multiple, onChange, options, search, ...restProps} = this.props
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
                  {I18n.t("haya_select.nothing_selected")}
                </div>
              }
              {currentOptions.map((currentOption) =>
                <div className="current-option" key={`current-value-${digg(currentOption, "value")}`}>
                  <input
                    id={idForComponent(this)}
                    name={nameForComponentWithMultiple(this)}
                    type="hidden"
                    value={digg(currentOption, "value")}
                  />
                  {presentOption(currentOption)}
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
    const {attribute, defaultValuesFromOptions, model} = this.props

    if (defaultValuesFromOptions) return defaultValuesFromOptions

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
      currentOptions,
      loadedOptions,
      optionsLeft,
      optionsTop,
      optionsWidth,
      scrollLeft,
      scrollTop
    } = digs(
      this.state,
      "currentOptions",
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
          <LoadedOption
            currentOptions={currentOptions}
            key={`loaded-option-${digg(loadedOption.value)}`}
            loadedOption={loadedOption}
            onClick={this.onOptionClicked}
          />
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

    const {onChange} = this.props
    const {multiple} = digs(this.props, "multiple")

    this.setState((prevState) => {
      const existingOption = prevState.currentOptions.find((currentOption) => currentOption.value == loadedOption.value)

      if (existingOption) {
        return {
          currentOptions: prevState.currentOptions.filter((currentOption) => currentOption.value != loadedOption.value)
        }
      } else {
        if (multiple) {
          return {currentOptions: prevState.currentOptions.concat([loadedOption])}
        } else {
          return {currentOptions: [loadedOption]}
        }
      }
    })

    if (!multiple) this.closeOptions()
    if (onChange) onChange(loadedOption)
  }
}
