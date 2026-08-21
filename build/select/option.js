// @ts-check
import PropTypes from "prop-types";
import { Pressable } from "react-native";
import React, { memo, useMemo } from "react";
import { shapeComponent, ShapeComponent } from "set-state-compare/build/shape-component.js";
const PressableComponent = /** @type {any} */ (Pressable);
/**
 * @typedef {object} OptionProps
 * @property {Array<string|number>} [currentOptionValues]
 * @property {boolean} disabled
 * @property {string} [icon]
 * @property {(event: import("react").SyntheticEvent, option: Record<string, any>) => void} onOptionClicked
 * @property {Record<string, any>} option
 * @property {"above"|"below"|"sheet"|undefined} [optionsPlacement]
 * @property {(option: Record<string, any>, mode: string) => import("react").ReactNode} presentOption
 * @property {string} [selectedBackgroundColor]
 * @property {string} [selectedHoverBackgroundColor]
 */
/** @typedef {{hover: boolean}} OptionState */
/** @augments {ShapeComponent<OptionProps, OptionState>} */
class Option extends ShapeComponent {
    static defaultProps = {
        disabled: false
    };
    static propTypes = {
        currentOptionValues: PropTypes.array,
        disabled: PropTypes.bool.isRequired,
        icon: PropTypes.string,
        onOptionClicked: PropTypes.func.isRequired,
        option: PropTypes.object.isRequired,
        optionsPlacement: PropTypes.oneOf(["above", "below", "sheet"]),
        presentOption: PropTypes.func.isRequired,
        selectedBackgroundColor: PropTypes.string,
        selectedHoverBackgroundColor: PropTypes.string
    };
    /** @type {OptionState} */
    state = {
        hover: false
    };
    render() {
        const { currentOptionValues, option } = this.p;
        const { hover } = this.s;
        const disabled = Boolean(option.disabled);
        const mobileSheet = this.p.optionsPlacement == "sheet";
        const selected = Boolean(currentOptionValues?.find((currentOptionValue) => currentOptionValue == option.value));
        const style = useMemo(() => {
            const selectedBackgroundColor = this.props.selectedBackgroundColor || "#cfe1ff";
            const selectedHoverBackgroundColor = this.props.selectedHoverBackgroundColor || "#9bbcfb";
            const style = {
                paddingTop: mobileSheet ? 14 : 4,
                paddingRight: mobileSheet ? 16 : 8,
                paddingBottom: mobileSheet ? 14 : 4,
                paddingLeft: mobileSheet ? 16 : 8,
                minHeight: mobileSheet ? 48 : undefined,
                color: "#000"
            };
            if (disabled) {
                style.cursor = "default";
                style.opacity = 0.6;
            }
            else {
                style.cursor = "pointer";
            }
            if (selected) {
                style.backgroundColor = selectedBackgroundColor;
            }
            if (hover) {
                style.backgroundColor = selected ? selectedHoverBackgroundColor : "steelblue";
            }
            return style;
        }, [disabled, hover, mobileSheet, selected, this.props.selectedBackgroundColor, this.props.selectedHoverBackgroundColor]);
        return (React.createElement(PressableComponent, { dataSet: this.cache("pressableDataSet", {
                disabled,
                selected,
                value: this.props.option.value
            }, [disabled, selected, this.props.option.value]), onPress: this.tt.onPress, onPointerOver: this.tt.onPointerOver, onPointerOut: this.tt.onPointerOut, style: style, testID: "haya-select/option" }, this.p.presentOption(option, "option")));
    }
    onPointerOver = () => {
        this.s.hover = true;
    };
    onPointerOut = () => {
        this.s.hover = false;
    };
    onPress = (e) => this.p.onOptionClicked(e, this.props.option);
}
const OptionShapeComponent = shapeComponent(Option);
export default memo(OptionShapeComponent);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlbGVjdC9vcHRpb24uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7QUFFWixPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUE7QUFDbEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQTtBQUN0QyxPQUFPLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsTUFBTSxPQUFPLENBQUE7QUFDMUMsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUMsTUFBTSw0Q0FBNEMsQ0FBQTtBQUV6RixNQUFNLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7QUFFekQ7Ozs7Ozs7Ozs7O0dBV0c7QUFFSCw4Q0FBOEM7QUFFOUMsMkRBQTJEO0FBQzNELE1BQU0sTUFBTyxTQUFRLGNBQWM7SUFDakMsTUFBTSxDQUFDLFlBQVksR0FBRztRQUNwQixRQUFRLEVBQUUsS0FBSztLQUNoQixDQUFBO0lBRUQsTUFBTSxDQUFDLFNBQVMsR0FBRztRQUNqQixtQkFBbUIsRUFBRSxTQUFTLENBQUMsS0FBSztRQUNwQyxRQUFRLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVO1FBQ25DLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtRQUN0QixlQUFlLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVO1FBQzFDLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7UUFDbkMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUQsYUFBYSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVTtRQUN4Qyx1QkFBdUIsRUFBRSxTQUFTLENBQUMsTUFBTTtRQUN6Qyw0QkFBNEIsRUFBRSxTQUFTLENBQUMsTUFBTTtLQUMvQyxDQUFB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Q0FBQyxFQUFFLENBQUMsWUFBWSxFQUNsQyxLQUFLLEVBQUUsS0FBSyxFQUNaLE1BQU0sRUFBQyxvQkFBb0IsSUFFMUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUNwQixDQUN0QixDQUFBO0lBQ0gsQ0FBQztJQUVELGFBQWEsR0FBRyxHQUFHLEVBQUU7UUFDbkIsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO0lBQ3JCLENBQUMsQ0FBQTtJQUVELFlBQVksR0FBRyxHQUFHLEVBQUU7UUFDbEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO0lBQ3RCLENBQUMsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7O0FBRy9ELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBRW5ELGVBQWUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtY2hlY2tcblxuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiXG5pbXBvcnQge1ByZXNzYWJsZX0gZnJvbSBcInJlYWN0LW5hdGl2ZVwiXG5pbXBvcnQgUmVhY3QsIHttZW1vLCB1c2VNZW1vfSBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IHtzaGFwZUNvbXBvbmVudCwgU2hhcGVDb21wb25lbnR9IGZyb20gXCJzZXQtc3RhdGUtY29tcGFyZS9idWlsZC9zaGFwZS1jb21wb25lbnQuanNcIlxuXG5jb25zdCBQcmVzc2FibGVDb21wb25lbnQgPSAvKiogQHR5cGUge2FueX0gKi8gKFByZXNzYWJsZSlcblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBPcHRpb25Qcm9wc1xuICogQHByb3BlcnR5IHtBcnJheTxzdHJpbmd8bnVtYmVyPn0gW2N1cnJlbnRPcHRpb25WYWx1ZXNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGRpc2FibGVkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2ljb25dXG4gKiBAcHJvcGVydHkgeyhldmVudDogaW1wb3J0KFwicmVhY3RcIikuU3ludGhldGljRXZlbnQsIG9wdGlvbjogUmVjb3JkPHN0cmluZywgYW55PikgPT4gdm9pZH0gb25PcHRpb25DbGlja2VkXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIGFueT59IG9wdGlvblxuICogQHByb3BlcnR5IHtcImFib3ZlXCJ8XCJiZWxvd1wifFwic2hlZXRcInx1bmRlZmluZWR9IFtvcHRpb25zUGxhY2VtZW50XVxuICogQHByb3BlcnR5IHsob3B0aW9uOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBtb2RlOiBzdHJpbmcpID0+IGltcG9ydChcInJlYWN0XCIpLlJlYWN0Tm9kZX0gcHJlc2VudE9wdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzZWxlY3RlZEJhY2tncm91bmRDb2xvcl1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2VsZWN0ZWRIb3ZlckJhY2tncm91bmRDb2xvcl1cbiAqL1xuXG4vKiogQHR5cGVkZWYge3tob3ZlcjogYm9vbGVhbn19IE9wdGlvblN0YXRlICovXG5cbi8qKiBAYXVnbWVudHMge1NoYXBlQ29tcG9uZW50PE9wdGlvblByb3BzLCBPcHRpb25TdGF0ZT59ICovXG5jbGFzcyBPcHRpb24gZXh0ZW5kcyBTaGFwZUNvbXBvbmVudCB7XG4gIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgZGlzYWJsZWQ6IGZhbHNlXG4gIH1cblxuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIGN1cnJlbnRPcHRpb25WYWx1ZXM6IFByb3BUeXBlcy5hcnJheSxcbiAgICBkaXNhYmxlZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICBpY29uOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uT3B0aW9uQ2xpY2tlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBvcHRpb246IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBvcHRpb25zUGxhY2VtZW50OiBQcm9wVHlwZXMub25lT2YoW1wiYWJvdmVcIiwgXCJiZWxvd1wiLCBcInNoZWV0XCJdKSxcbiAgICBwcmVzZW50T3B0aW9uOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIHNlbGVjdGVkQmFja2dyb3VuZENvbG9yOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIHNlbGVjdGVkSG92ZXJCYWNrZ3JvdW5kQ29sb3I6IFByb3BUeXBlcy5zdHJpbmdcbiAgfVxuXG4gIC8qKiBAdHlwZSB7T3B0aW9uU3RhdGV9ICovXG4gIHN0YXRlID0ge1xuICAgIGhvdmVyOiBmYWxzZVxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHtjdXJyZW50T3B0aW9uVmFsdWVzLCBvcHRpb259ID0gdGhpcy5wXG4gICAgY29uc3Qge2hvdmVyfSA9IHRoaXMuc1xuICAgIGNvbnN0IGRpc2FibGVkID0gQm9vbGVhbihvcHRpb24uZGlzYWJsZWQpXG4gICAgY29uc3QgbW9iaWxlU2hlZXQgPSB0aGlzLnAub3B0aW9uc1BsYWNlbWVudCA9PSBcInNoZWV0XCJcbiAgICBjb25zdCBzZWxlY3RlZCA9IEJvb2xlYW4oY3VycmVudE9wdGlvblZhbHVlcz8uZmluZCgoY3VycmVudE9wdGlvblZhbHVlKSA9PiBjdXJyZW50T3B0aW9uVmFsdWUgPT0gb3B0aW9uLnZhbHVlKSlcblxuICAgIGNvbnN0IHN0eWxlID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZEJhY2tncm91bmRDb2xvciA9IHRoaXMucHJvcHMuc2VsZWN0ZWRCYWNrZ3JvdW5kQ29sb3IgfHwgXCIjY2ZlMWZmXCJcbiAgICAgIGNvbnN0IHNlbGVjdGVkSG92ZXJCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnByb3BzLnNlbGVjdGVkSG92ZXJCYWNrZ3JvdW5kQ29sb3IgfHwgXCIjOWJiY2ZiXCJcbiAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICBwYWRkaW5nVG9wOiBtb2JpbGVTaGVldCA/IDE0IDogNCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBtb2JpbGVTaGVldCA/IDE2IDogOCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbW9iaWxlU2hlZXQgPyAxNCA6IDQsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBtb2JpbGVTaGVldCA/IDE2IDogOCxcbiAgICAgICAgbWluSGVpZ2h0OiBtb2JpbGVTaGVldCA/IDQ4IDogdW5kZWZpbmVkLFxuICAgICAgICBjb2xvcjogXCIjMDAwXCJcbiAgICAgIH1cblxuICAgICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgIHN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiXG4gICAgICAgIHN0eWxlLm9wYWNpdHkgPSAwLjZcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiXG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzZWxlY3RlZEJhY2tncm91bmRDb2xvclxuICAgICAgfVxuXG4gICAgICBpZiAoaG92ZXIpIHtcbiAgICAgICAgc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc2VsZWN0ZWQgPyBzZWxlY3RlZEhvdmVyQmFja2dyb3VuZENvbG9yIDogXCJzdGVlbGJsdWVcIlxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3R5bGVcbiAgICB9LCBbZGlzYWJsZWQsIGhvdmVyLCBtb2JpbGVTaGVldCwgc2VsZWN0ZWQsIHRoaXMucHJvcHMuc2VsZWN0ZWRCYWNrZ3JvdW5kQ29sb3IsIHRoaXMucHJvcHMuc2VsZWN0ZWRIb3ZlckJhY2tncm91bmRDb2xvcl0pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPFByZXNzYWJsZUNvbXBvbmVudFxuICAgICAgICBkYXRhU2V0PXt0aGlzLmNhY2hlKFwicHJlc3NhYmxlRGF0YVNldFwiLCB7XG4gICAgICAgICAgZGlzYWJsZWQsXG4gICAgICAgICAgc2VsZWN0ZWQsXG4gICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMub3B0aW9uLnZhbHVlXG4gICAgICAgIH0sIFtkaXNhYmxlZCwgc2VsZWN0ZWQsIHRoaXMucHJvcHMub3B0aW9uLnZhbHVlXSl9XG4gICAgICAgIG9uUHJlc3M9e3RoaXMudHQub25QcmVzc31cbiAgICAgICAgb25Qb2ludGVyT3Zlcj17dGhpcy50dC5vblBvaW50ZXJPdmVyfVxuICAgICAgICBvblBvaW50ZXJPdXQ9e3RoaXMudHQub25Qb2ludGVyT3V0fVxuICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgIHRlc3RJRD1cImhheWEtc2VsZWN0L29wdGlvblwiXG4gICAgICA+XG4gICAgICAgIHt0aGlzLnAucHJlc2VudE9wdGlvbihvcHRpb24sIFwib3B0aW9uXCIpfVxuICAgICAgPC9QcmVzc2FibGVDb21wb25lbnQ+XG4gICAgKVxuICB9XG5cbiAgb25Qb2ludGVyT3ZlciA9ICgpID0+IHtcbiAgICB0aGlzLnMuaG92ZXIgPSB0cnVlXG4gIH1cblxuICBvblBvaW50ZXJPdXQgPSAoKSA9PiB7XG4gICAgdGhpcy5zLmhvdmVyID0gZmFsc2VcbiAgfVxuXG4gIG9uUHJlc3MgPSAoZSkgPT4gdGhpcy5wLm9uT3B0aW9uQ2xpY2tlZChlLCB0aGlzLnByb3BzLm9wdGlvbilcbn1cblxuY29uc3QgT3B0aW9uU2hhcGVDb21wb25lbnQgPSBzaGFwZUNvbXBvbmVudChPcHRpb24pXG5cbmV4cG9ydCBkZWZhdWx0IG1lbW8oT3B0aW9uU2hhcGVDb21wb25lbnQpXG4iXX0=