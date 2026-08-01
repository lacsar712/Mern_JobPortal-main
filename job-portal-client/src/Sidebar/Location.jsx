import React from "react";
import InputField from "../components/InputField";

const Location = ({ handleChange }) => {
  return (
    <div>
      <h4 className="text-lg font-medium mb-2">工作地点</h4>
      <div>
        <label className="sidebar-label-container">
          <input onChange={handleChange} type="radio" value="" name="test" />
          <span className="checkmark"></span>全部
        </label>
        <InputField
          handleChange={handleChange}
          value="london"
          title="伦敦"
          name="test"
        />
        <InputField
          handleChange={handleChange}
          value="seattle"
          title="西雅图"
          name="test"
        />
        <InputField
          handleChange={handleChange}
          value="madrid"
          title="马德里"
          name="test"
        />
        <InputField
          handleChange={handleChange}
          value="boston"
          title="波士顿"
          name="test"
        />
      </div>
    </div>
  );
};

export default Location;
