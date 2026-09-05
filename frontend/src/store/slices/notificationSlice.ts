import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationsApi } from '@/api/notifications'

interface NotificationState {
  unreadCount: number
}

const initialState: NotificationState = { unreadCount: 0 }

export const fetchUnreadCount = createAsyncThunk('notifications/fetchUnreadCount', async () => {
  return await notificationsApi.getUnreadCount()
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    decrementUnread: (state) => { state.unreadCount = Math.max(0, state.unreadCount - 1) },
    clearUnread: (state) => { state.unreadCount = 0 },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload
    })
  },
})

export const { decrementUnread, clearUnread } = notificationSlice.actions
export default notificationSlice.reducer
