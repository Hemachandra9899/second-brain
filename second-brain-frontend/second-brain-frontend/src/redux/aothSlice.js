// redux/aothSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5006/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Registration failed');
      }

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const aothSlice = createSlice({
  name: 'aoth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuth: false,
  },
  reducers: {
    clearRegisterError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuth = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRegisterError } = aothSlice.actions;
export default aothSlice.reducer;
