import { configureStore } from '@reduxjs/toolkit'
import { repositoriesSlice } from './features/repositories/slice'

export const store = configureStore({
    reducer: {
        repositories: repositoriesSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch