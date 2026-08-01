import React from 'react'
import InputField from '../components/InputField'

const WorkExperience = ({handleChange}) => {
  return (
    <div>
         <h4 className="text-lg font-medium mb-2">工作经验</h4>
      <div>
        <label className="sidebar-label-container">
          <input onChange={handleChange} type="radio" value="" name="test" />
          <span className="checkmark"></span>经验不限
        </label>
        <InputField
          handleChange={handleChange}
          value="Internship"
          title="实习"
          name="test"
        />
        <InputField
          handleChange={handleChange}
          value="Work remotely"
          title="远程办公"
          name="test"
        />
      </div>
    </div>
  )
}

export default WorkExperience
