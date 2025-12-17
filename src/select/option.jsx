import {shapeComponent, ShapeComponent} from "set-state-compare/build/shape-component.js"
import {memo, useMemo} from "react"
import {Pressable} from "react-native"
import PropTypes from "prop-types"
import React from "react"

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
    presentOption: PropTypes.func.isRequired
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

      if (hover) {
        style.backgroundColor = "steelblue"
      }

      return style
    }, [disabled, hover, selected])

    return (
      <Pressable
        dataSet={this.cache("pressableDataSet", {
          class: "select-option",
          disabled,
          selected,
          value: this.props.option.value
        }, [disabled, selected, this.props.option.value])}
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
  onPress = (e) => this.p.onOptionClicked(e, this.props.option)
}))
