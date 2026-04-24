import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'dark',
  activeView: 'dms', // 'dms', 'channels', 'search'
  rightPanelOpen: false,
  sidebarOpen: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload
    },

    setActiveView: (state, action) => {
      state.activeView = action.payload
    },

    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen
    },

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
  },
})

export const { setTheme, setActiveView, toggleRightPanel, toggleSidebar } =
  uiSlice.actions

export default uiSlice.reducer
