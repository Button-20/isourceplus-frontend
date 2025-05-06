import { createContext, useContext, useState } from "react";
import { useAuth } from "./app.context";

const ApiContext = createContext();

export const ApiContextProvider = ({ children }) => {
  return <ApiContext.Provider value={{}}>{children}</ApiContext.Provider>;
};

export const useApiContext = () => {
  return useContext(ApiContext);
};
