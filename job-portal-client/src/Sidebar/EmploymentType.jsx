import React from 'react'
import InputField from '../components/InputField'

const EmploymentType = ({handleChange}) => {
  return (
    <div>
    <h4 className="text-lg font-medium mb-2">雇佣类型</h4>
 <div>
   <label className="sidebar-label-container">
     <input onChange={handleChange} type="radio" value="" name="test" />
     <span className="checkmark"></span>不限
   </label>
   <InputField
     handleChange={handleChange}
     value="full-time"
     title="全职"
     name="test"
   />
   <InputField
     handleChange={handleChange}
     value="temporary"
     title="临时"
     name="test"
   />
   <InputField
     handleChange={handleChange}
     value="part-time"
     title="兼职"
     name="test"
   />
 </div>
</div>
  )
}

export default EmploymentType
