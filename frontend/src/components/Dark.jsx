import React, { useContext } from "react";
import "./Dark.css";
import { AppContext } from "../AppContext";
const Dark = () => {
  const { isDark, setIsDark } = useContext(AppContext);
  return (
    <div onClick={() => setIsDark(!isDark)}>
      <label>
        <input className="toggle-checkbox" type="checkbox" />
        <div className="toggle-slot">
          <div className="sun-icon-wrapper">
            <div
              className="iconify sun-icon"
              data-icon="feather-sun"
              data-inline="false"
            ></div>
          </div>
          <div className="toggle-button"></div>
          <div className="moon-icon-wrapper">
            <div
              className="iconify moon-icon"
              data-icon="feather-moon"
              data-inline="false"
            ></div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default Dark;
