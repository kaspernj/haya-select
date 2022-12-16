import {digs} from "diggerize"
import PropTypes from "prop-types"
import React from "react"

export default class Option extends React.PureComponent {
  static propTypes = {
    currentOptions: PropTypes.array.isRequired,
    icon: PropTypes.string,
    onOptionClicked: PropTypes.func.isRequired,
    option: PropTypes.object.isRequired,
    presentOption: PropTypes.func.isRequired
  }

  style = {cursor: "pointer"}

  render() {
    const {currentOptions, option} = digs(this.props, "currentOptions", "option")
    const selected = Boolean(currentOptions.find((currentOption) => currentOption.value == option.value))

    return (
      <div
        className="haya-select-option"
        data-selected={selected}
        data-value={option.value}
        onClick={this.onClick}
        style={this.style}
      >
        {this.props.presentOption(option)}
      </div>
    )
  }

  onClick = (e) => this.props.onOptionClicked(e, this.props.option)
}
