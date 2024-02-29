import PropTypes from "prop-types"
import {memo} from "react"

const OptionGroup = ({option}) => {
  return (
    <div className="haya-select--option-group">
      {option.text}
    </div>
  )
}

OptionGroup.propTypes = {
  option: PropTypes.object.isRequired
}

export default memo(OptionGroup)
