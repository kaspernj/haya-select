import {memo} from "react"
import PropTypes from "prop-types"
import React from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/build/shape-component.js"
import {Text, View} from "react-native"

export default memo(shapeComponent(class OptionGroup extends ShapeComponent {
  static propTypes = {
    option: PropTypes.object.isRequired
  }

  render() {
    return (
      <View
        dataSet={this.rootViewDataSet ||= {class: "haya-select--option-group"}}
        style={this.rootViewStyle ||= {
          paddingTop: 4,
          paddingRight: 8,
          paddingBottom: 4,
          paddingLeft: 8,
          color: "#000",
          fontWeight: "bold"
        }}
      >
        <Text>
          {this.props.option.text}
        </Text>
      </View>
    )
  }
}))
