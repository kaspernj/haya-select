import PropTypes from "prop-types"
import React from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/build/shape-component.js"
import {Text, View} from "react-native"

export default shapeComponent(class OptionGroup extends ShapeComponent {
  static propTypes = {
    option: PropTypes.object.isRequired,
    stylingFor: PropTypes.func.isRequired
  }

  stylingFor = (stylingName, style = {}, caches = []) => this.p.stylingFor(stylingName, style, caches)

  render() {
    return (
      <View
        style={this.tt.stylingFor("optionGroup", this.rootViewStyle ||= {
          paddingTop: 4,
          paddingRight: 8,
          paddingBottom: 4,
          paddingLeft: 8
        })}
        testID="haya-select/option-group"
      >
        <Text
          style={this.tt.stylingFor("optionGroupText", this.textStyle ||= {
            color: "#000",
            fontWeight: "700"
          })}
          testID="haya-select/option-group-text"
        >
          {this.p.option.text}
        </Text>
      </View>
    )
  }
})
