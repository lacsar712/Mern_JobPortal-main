import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useParams } from "react-router-dom";
import { FaBriefcase } from "react-icons/fa6";
import { FiBookmark, FiCheck } from "react-icons/fi";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { useJobShortlist } from "../hooks/useJobShortlist";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState([]);
  const { isShortlisted, toggleShortlist } = useJobShortlist();
  const isShortlistedJob = isShortlisted(job);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/all-jobs/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch(() => toast.error("职位详情加载失败。"));
  }, []);

  const handleJobApply = async () => {
    const { value: url } = await Swal.fire({
      input: "url",
      inputLabel: "简历 / CV 链接",
      inputPlaceholder: "请输入链接地址",
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      showCancelButton: true,
    });
    if (url) {
      Swal.fire({
        title: `已输入链接：${url}`,
        showCancelButton: true,
        confirmButtonText: "确认投递",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire("投递成功！", "", "success");
        } else if (result.isDenied) {
          Swal.fire("未保存更改", "", "info");
        }
      });
    }
  };
  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4">
      <PageHeader title={"职位详情"} path={"职位详情"} />

      <div className="mt-10">
        <h3 className="font-semibold mb-2">职位 ID：{id}</h3>

        <div className="my-4">
          <h2 className="text-2xl font-medium text-blue">职位详情</h2>
          <p className="text-primary/75 md:w-1/3 text-sm italic my-1">
            以下信息可帮助你判断该职位是否符合个人意向，你可随时在个人资料中管理求职偏好。
          </p>
        </div>

        <div className="my-4 space-y-2">
          <div className="flex items-center gap-2">
            <FaBriefcase />
            <p className="text-xl font-medium mb-2">
              雇佣类型：
              <span className=" ml-2 text-gray-700 ">
                {job.employmentType}
              </span>
            </p>
          </div>
          <button className="bg-blue px-6 py-1 text-white rounded-sm">
            {job.jobTitle}
          </button>
          <button
            className="bg-indigo-700 px-6 py-1  text-white rounded-sm ms-2"
            onClick={handleJobApply}
          >
            立即申请
          </button>
          {job?._id && (
            <button
              type="button"
              onClick={() => toggleShortlist(job)}
              aria-label={isShortlistedJob ? "移出短名单" : "加入短名单"}
              className={`ms-2 inline-flex items-center gap-2 rounded-sm px-6 py-1 ${
                isShortlistedJob
                  ? "bg-blue text-white"
                  : "border border-gray-300 text-primary hover:border-blue hover:text-blue"
              }`}
            >
              {isShortlistedJob ? <FiCheck /> : <FiBookmark />}
              {isShortlistedJob ? "移出短名单" : "加入短名单"}
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-12 mt-12">
          <div className="md:w-1/3">
            <h4 className="text-lg font-medium mb-3">福利待遇</h4>
            <p className="text-sm text-primary/70 mb-2">
              摘自完整职位描述
            </p>
            <ul className="list-disc list-outside text-primary/90 space-y-2 text-base">
              <li>
                1. ${job.minPrice}-{job.maxPrice}k
              </li>
              <li>2. 伤残保险</li>
              <li>3. 员工折扣</li>
              <li>4. 弹性支出账户</li>
              <li>5. 健康保险</li>
              <li>6. 带薪休假</li>
              <li>7. 视力保险</li>
              <li>8. 志愿服务假</li>
              <li>9. 牙科保险</li>
            </ul>
          </div>

          <div className="md:w-1/3">
            <h4 className="text-lg font-medium mb-3">岗位概述</h4>
            <p className="text-primary/90">
              我们是一家快速发展的科技服务公司，长期致力于为客户提供优质的产品研发与技术支持服务。我们以人为本，推动创新，并积极回馈所在社区。
              <br /> <br />
              该岗位将加入 Web 设计与开发团队，使用现代 Web 技术构建和维护各类业务应用，与产品、设计紧密协作，持续交付高质量成果。
            </p>
          </div>
          <div className="md:w-1/3">
            <h4 className="text-lg font-medium mb-3">成长空间</h4>
            <p className="text-primary/90">
              我们重视团队文化与良好的协作氛围，专注于向客户交付高质量产品。
              <br />
              <br />
              我们正在招聘不同经验水平的开发者。以下要求为该岗位的基本门槛，欢迎有热情、愿意成长的你加入。
            </p>
          </div>
        </div>

        <div className="text-primary/75 my-5 space-y-6">
          <p>
            {job.description ||
              "该岗位将参与产品核心功能的设计与实现，持续优化性能与用户体验，并与跨职能团队保持高效协作。"}
          </p>
          <p>
            我们鼓励主动学习与技术分享，提供清晰的晋升路径与完善的培训体系，帮助你在专业领域持续成长。
          </p>
          <p>
            如果你对这份工作感兴趣，欢迎点击「立即申请」提交简历链接，我们会尽快与你联系。
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
