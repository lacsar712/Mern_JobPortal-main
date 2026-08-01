import React from "react";
import InputField from "../components/InputField";
import Button from "../components/Button";

const Salary = ({ handleChange, handleClick }) => {
  return (
    <div>
      <h4 className="text-lg font-medium mb-2">薪资</h4>
      <div className="mb-4">
        <Button onClickHandler={handleClick} value="hourly" title="时薪" />
        <Button onClickHandler={handleClick} value="monthly" title="月薪" />
        <Button onClickHandler={handleClick} value="yearly" title="年薪" />
      </div>

      <div>
        <label className="sidebar-label-container">
          <input onChange={handleChange} type="radio" value="" name="test2" />
          <span className="checkmark"></span>不限
        </label>

        <InputField
          handleChange={handleChange}
          value={30}
          title="< 30k"
          name="test2"
        />

        <InputField
          handleChange={handleChange}
          value={50}
          title="< 50k"
          name="test2"
        />

        <InputField
          handleChange={handleChange}
          value={80}
          title="< 80k"
          name="test2"
        />

        <InputField
          handleChange={handleChange}
          value={100}
          title="< 100k"
          name="test2"
        />
      </div>
    </div>
  );
};

export default Salary;
