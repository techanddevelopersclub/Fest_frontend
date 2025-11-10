import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isAdmin: false,
  isLoggedIn: false,
  isOrganiser: false,
  isPaymentVerifier: false,
  isVerified: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { accessToken, user } = action.payload;
      state.isOrganiser = user.role === "organiser" && user.organisation;
      state.isAdmin = user.role === "admin";
      state.isPaymentVerifier = user.role === "paymentVerifier";
      state.user = user;
      state.accessToken = accessToken;
      state.isLoggedIn = true;
      state.isVerified = user.isVerified;
    },
    clearCredentials(state, action) {
      state.user = null;
      state.accessToken = null;
      state.isAdmin = false;
      state.isOrganiser = false;
      state.isPaymentVerifier = false;
      state.isLoggedIn = false;
      state.isVerified = false;
    },
    setUser(state, action) {
      state.user = action.payload;
      // Update role flags when user is updated
      if (action.payload) {
        state.isOrganiser = action.payload.role === "organiser" && action.payload.organisation;
        state.isAdmin = action.payload.role === "admin";
        state.isPaymentVerifier = action.payload.role === "paymentVerifier";
        state.isVerified = action.payload.isVerified;
      }
    },
  },
});

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectIsOrganiser = (state) => state.auth.isOrganiser;
export const selectIsPaymentVerifier = (state) => state.auth.isPaymentVerifier;
export const selectIsVerified = (state) => state.auth.isVerified;

export const { setCredentials, clearCredentials, setUser } = authSlice.actions;

export default authSlice.reducer;
