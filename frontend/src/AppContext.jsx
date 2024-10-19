// AppContext.jsx
import { createContext, useState } from "react";

// Create a Context
export const AppContext = createContext();

// Create a Provider component
const AppProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const value = {
    isDark,
    setIsDark,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
