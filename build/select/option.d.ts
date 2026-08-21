declare const _default: React.NamedExoticComponent<OptionProps>;
export default _default;
export type OptionProps = {
    currentOptionValues?: (string | number)[] | undefined;
    disabled: boolean;
    icon?: string | undefined;
    onOptionClicked: (event: import("react").SyntheticEvent, option: Record<string, any>) => void;
    option: Record<string, any>;
    optionsPlacement?: "above" | "below" | "sheet" | undefined;
    presentOption: (option: Record<string, any>, mode: string) => import("react").ReactNode;
    selectedBackgroundColor?: string | undefined;
    selectedHoverBackgroundColor?: string | undefined;
};
export type OptionState = {
    hover: boolean;
};
import React from "react";
//# sourceMappingURL=option.d.ts.map