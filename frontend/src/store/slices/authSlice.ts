import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { User } from '@/types'
import { authApi } from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('token', data.accessToken)
      return data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Login failed')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout().catch(() => {})
  localStorage.removeItem('token')
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    return await authApi.me()
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status ?? 0
    return rejectWithValue(status)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.accessToken
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        if (action.payload === 401) {
          state.user = null
          state.token = null
          localStorage.removeItem('token')
        }
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
