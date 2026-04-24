import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import authSlice from './authSlice.js'
import chatSlice from './chatSlice.js'
import channelSlice from './channelSlice.js'
import notificationSlice from './notificationSlice.js'
import uiSlice from './uiSlice.js'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'],
}

const persistedAuthReducer = persistReducer(persistConfig, authSlice)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    chat: chatSlice,
    channel: channelSlice,
    notification: notificationSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export const persistor = persistStore(store)
export default store
