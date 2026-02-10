import PropTypes from "prop-types"
import {Pressable} from "react-native"
import React, {memo, useMemo} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/build/shape-component.js"

export default memo(shapeComponent(class Option extends ShapeComponent {
  static defaultProps = {
    disabled: false
  }

  static propTypes = {
    currentOptionValues: PropTypes.array,
    disabled: PropTypes.bool.isRequired,
    icon: PropTypes.string,
    onOptionClicked: PropTypes.func.isRequired,
    option: PropTypes.object.isRequired,
    presentOption: PropTypes.func.isRequired,
    selectedBackgroundColor: PropTypes.string,
    selectedHoverBackgroundColor: PropTypes.string
  }

  setup() {
    this.useStates({
      hover: false
    })
  }

  render() {
    const {currentOptionValues, option} = this.p
    const {hover} = this.s
    const disabled = Boolean(option.disabled)
    const selected = Boolean(currentOptionValues?.find((currentOptionValue) => currentOptionValue == option.value))

    const style = useMemo(() => {
      const selectedBackgroundColor = this.props.selectedBackgroundColor || "#cfe1ff"
      const selectedHoverBackgroundColor = this.props.selectedHoverBackgroundColor || "#9bbcfb"
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
        style.backgroundColor = selectedBackgroundColor
      }

      if (hover) {
        style.backgroundColor = selected ? selectedHoverBackgroundColor : "steelblue"
      }

      return style
    }, [disabled, hover, selected, this.props.selectedBackgroundColor, this.props.selectedHoverBackgroundColor])

    return (
      <Pressable
        dataSet={this.cache("pressableDataSet", {
          class: "select-option",
          disabled,
          selected,
          value: this.props.option.value
        }, [disabled, selected, this.props.option.value])}
        onPressIn={this.tt.onPressIn}
        onPress={this.tt.onPress}
        onPointerOver={this.tt.onPointerOver}
        onPointerOut={this.tt.onPointerOut}
        style={style}
      >
        {this.p.presentOption(option, "option")}
      </Pressable>
    )
  }

  onPointerOver = () => this.setState({hover: true})
  onPointerOut = () => this.setState({hover: false})
  onPressIn = (e) => {
    this.didPressIn = true
    this.p.onOptionClicked(e, this.props.option)
  }
  onPress = (e) => {
    if (this.didPressIn) {
      this.didPressIn = false
      return
    }

    this.p.onOptionClicked(e, this.props.option)
  }
}))
