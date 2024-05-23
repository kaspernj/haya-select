import PropTypes from "prop-types"
import {memo} from "react"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component.js"

export default memo(shapeComponent(class OptionGroup extends ShapeComponent {
  static propTypes = {
    option: PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="haya-select--option-group">
        {option.text}
      </div>
    )
  }
}))
