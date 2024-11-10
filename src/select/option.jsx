import PropTypes from "prop-types"
import {memo} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"
import {View} from "react-native"

export default memo(shapeComponent(class Option extends ShapeComponent {
  static defaultProps = {
    disabled: false
  }

  static propTypes = {
    currentOptionValues: PropTypes.array.isRequired,
    disabled: PropTypes.bool.isRequired,
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
    const {currentOptionValues, option} = this.p
    const disabled = Boolean(option.disabled)
    const selected = Boolean(currentOptionValues.find((currentOptionValue) => currentOptionValue == option.value))
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
          class: "select-option",
          disabled,
          selected,
          value: this.props.option.value
        }}
        onClick={this.tt.onClick}
        onPointerOver={this.tt.onPointerOver}
        onPointerOut={this.tt.onPointerOut}
        style={style}
      >
        {this.p.presentOption(option, "option")}
      </View>
    )
  }

  onClick = (e) => this.p.onOptionClicked(e, this.props.option)
  onPointerOver = () => this.setState({hover: true})
  onPointerOut = () => this.setState({hover: false})
}))
