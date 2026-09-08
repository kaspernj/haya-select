import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"

/**
 * Context to coordinate multiple HayaSelect instances so only one is open at a time.
 *
 * @typedef {object} HayaSelectContextValue
 * @property {string|null} openSelectId The ID of the currently open select, or null.
 * @property {function(string): void} openSelect Open a select by ID, closing any other open select.
 * @property {function(string): void} closeSelect Close a select by ID.
 * @property {function(string): void} registerSelect Register a select instance.
 * @property {function(string): void} unregisterSelect Unregister a select instance.
 */

const HayaSelectContext = createContext({
  openSelectId: null,
  openSelect: () => {},
  closeSelect: () => {},
  registerSelect: () => {},
  unregisterSelect: () => {}
})

/**
 * @param {import("react").ReactNode} children
 * @returns {import("react").ReactElement}
 */
export function HayaSelectProvider({children}) {
  const [openSelectId, setOpenSelectId] = useState(null)
  const registeredSelectsRef = useRef(new Set())

  const registerSelect = useCallback((id) => {
    registeredSelectsRef.current.add(id)
  }, [])

  const unregisterSelect = useCallback((id) => {
    registeredSelectsRef.current.delete(id)
  }, [])

  const openSelect = useCallback((id) => {
    setOpenSelectId((currentOpenId) => {
      // If this select is already open, keep it open (toggle behavior handled by component)
      if (currentOpenId === id) return currentOpenId

      // Close any other open select
      return id
    })
  }, [])

  const closeSelect = useCallback((id) => {
    setOpenSelectId((currentOpenId) => {
      // Only close if this select is the currently open one
      if (currentOpenId === id) return null

      return currentOpenId
    })
  }, [])

  const contextValue = useMemo(() => ({
    openSelectId,
    openSelect,
    closeSelect,
    registerSelect,
    unregisterSelect
  }), [openSelectId, openSelect, closeSelect, registerSelect, unregisterSelect])

  // Cleanup: close select on unmount if it's the open one
  useEffect(() => {
    return () => {
      setOpenSelectId(null)
    }
  }, [])

  return (
    <HayaSelectContext.Provider value={contextValue}>
      {children}
    </HayaSelectContext.Provider>
  )
}

/**
 * Hook to consume the HayaSelect coordination context.
 *
 * @returns {HayaSelectContextValue}
 */
export function useHayaSelectContext() {
  return useContext(HayaSelectContext)
}
