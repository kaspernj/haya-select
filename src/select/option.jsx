import PropTypes from "prop-types"
import {memo} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"

export default memo(shapeComponent(class Option extends ShapeComponent {
  static propTypes = {
    currentOptions: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    icon: PropTypes.string,
    onOptionClicked: PropTypes.func.isRequired,
    option: PropTypes.object.isRequired,
    presentOption: PropTypes.func.isRequired
  }

  render() {
    const selected = Boolean(this.props.currentOptions.find((currentOption) => currentOption.value == this.props.option.value))

    return (
      <div
        className="haya-select-option"
        data-disabled={Boolean(this.props.option.disabled)}
        data-selected={selected}
        data-value={this.props.option.value}
        onClick={this.onClick}
      >
        {this.props.presentOption(this.props.option)}
      </div>
    )
  }

  onClick = (e) => this.props.onOptionClicked(e, this.props.option)
}))
