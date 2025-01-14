import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Crumb, CrumbsState } from "./types";

export const initialCrumbsState: CrumbsState = {
  crumbs: [],
};

export const crumbsSlice = createSlice({
  name: "crumbs",
  initialState: initialCrumbsState,
  reducers: {
    setCrumbs: (state, action: PayloadAction<Crumb[]>) => {
      state.crumbs = action.payload;
    },
  },
});
