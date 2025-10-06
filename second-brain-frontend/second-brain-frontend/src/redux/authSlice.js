import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            console.log('Sending request to backend...', { email, password }); // Debug log
            
            const response = await fetch('http://localhost:5006/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Add this!
                body: JSON.stringify({ email, password })
            });

            console.log('Response status:', response.status); // Debug log

            const data = await response.json();
            console.log('Response data:', data); // Debug log

            if (!response.ok) {
                return rejectWithValue(data.error || 'Login failed');
            }

            return data.user;
        } catch (error) {
            console.error('Fetch error:', error); // Debug log
            return rejectWithValue(error.message || 'Network error. Please try again.');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;