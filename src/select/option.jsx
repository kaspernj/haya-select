import PropTypes from "prop-types"
import {memo} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"
import {View} from "react-native"

export default memo(shapeComponent(class Option extends ShapeComponent {
  static propTypes = {
    currentOptions: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    icon: PropTypes.string,
    onOptionClicked: PropTypes.func.isRequired,
    option: PropTypes.object.isRequired,
    presentOption: PropTypes.func.isRequired
  }

  setup() {
    this.useStates({
      hover: false
    })
  }

  render() {
    const disabled = Boolean(this.props.option.disabled)
    const selected = Boolean(this.props.currentOptions.find((currentOption) => currentOption.value == this.props.option.value))
    const style = {
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      color: "#000"
    }

    if (disabled) {
      style.cursor = "default"
      style.opacity = 0.6
    } else {
      style.cursor = "pointer"
    }

    if (selected) {
      style.backgroundColor = "#80b2ff"
    }

    if (this.state.hover) {
      style.backgroundColor = "steelblue"
    }

    return (
      <View
        dataSet={{
          class: "haya-select-option",
          disabled,
          selected,
          value: this.props.option.value
        }}
        onClick={this.onClick}
        onPointerOver={this.onPointerOver}
        onPointerOut={this.onPointerOut}
        style={style}
      >
        {this.props.presentOption(this.props.option)}
      </View>
    )
  }

  onClick = (e) => this.props.onOptionClicked(e, this.props.option)
  onPointerOver = () => this.setState({hover: true})
  onPointerOut = () => this.setState({hover: false})
}))
