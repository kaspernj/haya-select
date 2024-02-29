import PropTypes from "prop-types"
import {memo, useMemo} from "react"
import useShape from "set-state-compare/src/use-shape.js"

const Option = (props) => {
  const s = useShape(props)
  const onClick = useCallback((e) => s.p.onOptionClicked(e, s.p.option), [])
  const selected = Boolean(s.p.currentOptions.find((currentOption) => currentOption.value == s.p.option.value))

  return (
    <div
      className="haya-select-option"
      data-disabled={Boolean(s.p.option.disabled)}
      data-selected={selected}
      data-value={s.p.option.value}
      onClick={onClick}
    >
      {props.presentOption(s.p.option)}
    </div>
  )
}

Option.propTypes = {
  currentOptions: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  onOptionClicked: PropTypes.func.isRequired,
  option: PropTypes.object.isRequired,
  presentOption: PropTypes.func.isRequired
}

export default memo(Option)
