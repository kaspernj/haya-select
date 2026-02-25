import React, {memo} from "react"
import {Pressable} from "react-native"
import {shapeComponent, ShapeComponent} from "set-state-compare/build/shape-component.js"
import Text from "@kaspernj/api-maker/build/utils/text"
import PropTypes from "prop-types"
import propTypesExact from "prop-types-exact"

const dataSets = {}
const styles = {}

/**
 * @typedef {object} PaginationPageButtonProps
 * @property {boolean} active
 * @property {number} page
 * @property {function(number): void} onPageSelected
 */

/** @extends {ShapeComponent<PaginationPageButtonProps>} */
export default memo(shapeComponent(class PaginationPageButton extends ShapeComponent {
  static propTypes = propTypesExact({
    active: PropTypes.bool.isRequired,
    page: PropTypes.number.isRequired,
    onPageSelected: PropTypes.func.isRequired
  })

  /** @param {import("react").SyntheticEvent} event */
  onPress = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()

    this.p.onPageSelected(this.p.page)
  }

  render() {
    const {active, page} = this.p

    return (
      <Pressable
        dataSet={dataSets[`paginationPage-${page}`] ||= {class: "pagination-page", page}}
        disabled={active}
        onPress={this.tt.onPress}
        style={styles[`paginationPageButton-${active}`] ||= {
          alignItems: "center",
          backgroundColor: active ? "#0f172a" : "#e2e8f0",
          borderRadius: 999,
          height: 28,
          justifyContent: "center",
          marginHorizontal: 4,
          width: 28
        }}
      >
        <Text
          style={styles[`paginationPageText-${active}`] ||= {
            color: active ? "#f8fafc" : "#334155",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {page}
        </Text>
      </Pressable>
    )
  }
}))
