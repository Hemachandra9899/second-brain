import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ===================== REGISTER USER ASYNC THUNK =====================
export const registerUser = createAsyncThunk(
    'auth/register',
    async ({ name, email, password }, { rejectWithValue }) => {
        try {
            console.log("Debugging register values:", { name, email, password });

            const response = await fetch('http://localhost:5006/auth/register', {
                method: 'POST',
                headers: {  // ✅ Fixed "header" → "headers"
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // ✅ Ensure cookies/session are handled
                body: JSON.stringify({ name, email, password }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                return rejectWithValue(data.error || 'Registration failed');
            }

            return data.user; // ✅ Return the user object from backend
        } catch (error) {
            console.error('Register Fetch failed:', error);
            return rejectWithValue(error.message || 'Network error during registration');
        }
    }
);

// ===================== REGISTER SLICE =====================
const registerSlice = createSlice({
    name: 'register',
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
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuth = false;
            });
    },
});

export const { clearRegisterError } = registerSlice.actions;
export default registerSlice.reducer;
