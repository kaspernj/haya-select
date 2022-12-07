import PropTypes from "prop-types"
import React from "react"

export default class OptionGroup extends React.PureComponent {
  static propTypes = {
    option: PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="haya-select--option-group">
        {this.props.option.text}
      </div>
    )
  }
}
