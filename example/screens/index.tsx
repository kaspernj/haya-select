import React from "react"

import BasicSelectScreen from "./basic-select-screen"
import CloseOnChangeScreen from "./close-on-change-screen"
import ControlledValuesScreen from "./controlled-values-screen"
import FilterSelectScreen from "./filter-select-screen"
import MobileSheetResizeScreen from "./mobile-sheet-resize-screen"
import MobileSheetSelectScreen from "./mobile-sheet-select-screen"
import ModuleApiScreen from "./module-api-screen"
import MultipleClearScreen from "./multiple-clear-screen"
import MultipleHighlightScreen from "./multiple-highlight-screen"
import MultipleSelectScreen from "./multiple-select-screen"
import NoOptionsSelectScreen from "./no-options-select-screen"
import OptionContentScreen from "./option-content-screen"
import PaginationChangePageScreen from "./pagination-change-page-screen"
import PaginationLongPageScreen from "./pagination-long-page-screen"
import PaginationManualEntryScreen from "./pagination-manual-entry-screen"
import PaginationNextPrevScreen from "./pagination-next-prev-screen"
import PaginationSelectScreen from "./pagination-select-screen"
import PlacementCallbackScreen from "./placement-callback-screen"
import RightOptionScreen from "./right-option-screen"
import RoundedCornersSelectScreen from "./rounded-corners-select-screen"
import StaleValuesScreen from "./stale-values-screen"

const screens: Record<string, React.ComponentType> = {
  "basic-select": BasicSelectScreen,
  "close-on-change": CloseOnChangeScreen,
  "controlled-values": ControlledValuesScreen,
  "filter-select": FilterSelectScreen,
  "mobile-sheet-resize": MobileSheetResizeScreen,
  "mobile-sheet-select": MobileSheetSelectScreen,
  "module-api": ModuleApiScreen,
  "multiple-clear": MultipleClearScreen,
  "multiple-highlight": MultipleHighlightScreen,
  "multiple-select": MultipleSelectScreen,
  "no-options-select": NoOptionsSelectScreen,
  "option-content": OptionContentScreen,
  "pagination-change-page": PaginationChangePageScreen,
  "pagination-long-page": PaginationLongPageScreen,
  "pagination-manual-entry": PaginationManualEntryScreen,
  "pagination-next-prev": PaginationNextPrevScreen,
  "pagination-select": PaginationSelectScreen,
  "placement-callback": PlacementCallbackScreen,
  "right-option": RightOptionScreen,
  "rounded-corners-select": RoundedCornersSelectScreen,
  "stale-values": StaleValuesScreen
}

export const screenForName = (name: string | null) => {
  if (name && screens[name]) return screens[name]

  return ModuleApiScreen
}
