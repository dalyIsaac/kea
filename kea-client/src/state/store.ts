import { configureStore } from "@reduxjs/toolkit";
import { useSelector as useRawSelector } from "react-redux";
import { crumbsSlice } from "./crumbs/slice";
import { fileTreeSlice } from "./file-tree/slice";

export const store = configureStore({
  reducer: {
    [fileTreeSlice.name]: fileTreeSlice.reducer,
    [crumbsSlice.name]: crumbsSlice.reducer,
  },
});

export type KeaState = ReturnType<typeof store.getState>;
export type KeaDispatch = typeof store.dispatch;
export const useKeaSelector: <T>(selector: (state: KeaState) => T) => T = useRawSelector;
