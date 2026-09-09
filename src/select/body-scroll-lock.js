import {Platform} from "react-native"

/**
 * Reference-counted body-scroll lock shared by every HayaSelect in the bundle.
 * Body scroll is a single global browser resource, so overlapping mobile sheets
 * must not each save/restore the overflow independently: the first lock records
 * the previous overflow and the last unlock restores it.
 */

let lockCount = 0
let previousBodyOverflow = undefined
let previousDocumentOverflow = undefined

/** @returns {boolean} */
function canManageBodyScroll() {
  return Platform.OS === "web" && typeof document !== "undefined" && Boolean(document.body)
}

/** @returns {void} */
export function acquireBodyScrollLock() {
  if (!canManageBodyScroll()) return

  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    previousDocumentOverflow = document.documentElement?.style.overflow

    document.body.style.overflow = "hidden"
    if (document.documentElement) document.documentElement.style.overflow = "hidden"
  }

  lockCount += 1
}

/** @returns {void} */
export function releaseBodyScrollLock() {
  if (!canManageBodyScroll()) return
  if (lockCount === 0) return

  lockCount -= 1

  if (lockCount > 0) return

  document.body.style.overflow = previousBodyOverflow || ""
  if (document.documentElement) document.documentElement.style.overflow = previousDocumentOverflow || ""

  previousBodyOverflow = undefined
  previousDocumentOverflow = undefined
}
