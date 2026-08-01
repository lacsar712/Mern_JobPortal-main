import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthProvider";

const CreateJob = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data) => {
    data.skills = selectedOption;
    fetch(`${import.meta.env.VITE_API_URL}/post-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.acknowledged === true) {
          toast.success("职位发布成功！");
          reset();
          navigate("/my-job");
        } else {
          toast.error("职位发布失败，请稍后重试。");
        }
      })
      .catch(() => toast.error("服务器错误，请稍后重试。"));
  };

  const options = [
    { value: "JavaScript", label: "JavaScript" },
    { value: "C++", label: "C++" },
    { value: "HTML", label: "HTML" },
    { value: "CSS", label: "CSS" },
    { value: "React", label: "React" },
    { value: "Node", label: "Node" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "Redux", label: "Redux" },
  ];

  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4">
      <div className="bg-[#FAFAFA] py-10 px-4 lg:px-16">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">职位名称</label>
              <input
                defaultValue="前端开发工程师"
                {...register("jobTitle")}
                className="block w-full flex-1 border-1 bg-white py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">公司名称</label>
              <input
                placeholder="例如：微软"
                {...register("companyName")}
                className="create-job-input"
              />
            </div>
          </div>

          <div className="create-job-flex">
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">最低薪资</label>
              <input
                placeholder="20"
                {...register("minPrice")}
                className="create-job-input"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">最高薪资</label>
              <input
                placeholder="100"
                {...register("maxPrice")}
                className="create-job-input"
              />
            </div>
          </div>

          <div className="create-job-flex">
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">薪资类型</label>
              <select {...register("salaryType")} className="create-job-input">
                <option value="">请选择薪资类型</option>
                <option value="Hourly">时薪</option>
                <option value="Monthly">月薪</option>
                <option value="Yearly">年薪</option>
              </select>
            </div>
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">工作地点</label>
              <input
                placeholder="例如：上海"
                {...register("jobLocation")}
                className="create-job-input"
              />
            </div>
          </div>

          <div className="create-job-flex">
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">发布日期</label>
              <input
                className="create-job-input"
                {...register("postingDate")}
                placeholder="例如：2023-11-03"
                type="date"
              />
            </div>

            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">经验要求</label>
              <select
                {...register("experienceLevel")}
                className="create-job-input"
              >
                <option value="">请选择经验要求</option>
                <option value="Fresher">应届生</option>
                <option value="Internship">实习</option>
                <option value="Work remotely">远程办公</option>
              </select>
            </div>
          </div>

          <div className="">
            <label className="block mb-2 text-lg">所需技能：</label>
            <CreatableSelect
              className="create-job-input py-4"
              defaultValue={selectedOption}
              onChange={setSelectedOption}
              options={options}
              isMulti
              placeholder="选择或输入技能"
            />
          </div>

          <div className="create-job-flex">
            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">公司 Logo</label>
              <input
                type="url"
                placeholder="粘贴图片链接，例如：https://example.com/logo.png"
                {...register("companyLogo")}
                className="create-job-input"
              />
            </div>

            <div className="lg:w-1/2 w-full">
              <label className="block mb-2 text-lg">雇佣类型</label>
              <select
                {...register("employmentType")}
                className="create-job-input"
              >
                <option value="">请选择雇佣类型</option>
                <option value="Full-time">全职</option>
                <option value="Part-time">兼职</option>
                <option value="Temporary">临时</option>
              </select>
            </div>
          </div>

          <div className="w-full">
            <label className="block mb-2 text-lg">职位描述</label>
            <textarea
              className="w-full pl-3 py-1.5 focus:outline-none"
              rows={6}
              {...register("description")}
              placeholder="请填写职位描述"
              defaultValue={"负责产品功能开发与迭代，与产品、设计紧密协作，持续提升用户体验与系统质量。"}
            />
          </div>

          <div className="w-full">
            <label className="block mb-2 text-lg">发布人</label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full pl-3 py-1.5 focus:outline-none bg-gray-100 cursor-not-allowed"
              {...register("postedBy")}
            />
          </div>

          <input
            type="submit"
            value="提交"
            className="block mt-12 bg-blue text-white font-semibold px-8 py-2 rounded-sm cursor-pointer"
          />
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
