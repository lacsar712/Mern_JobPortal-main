import React from "react";
import { FaEnvelopeOpenText, FaRocket } from "react-icons/fa6";

const Newsletter = () => {
  return (
    <div>
      <div>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          {" "}
          <FaEnvelopeOpenText /> 订阅职位通知
        </h3>
        <p className="text-primary/75 text-base mb-4">
          留下邮箱，第一时间获取匹配你技能与意向的最新职位推送。
        </p>
        <div className="w-full space-y-4">
          <input
            type="email"
            name="email"
            id="email"
            placeholder="name@mail.com"
            className="w-full block py-2 pl-3 border focus:outline-none"
          />
          <input
            type="submit"
            value="订阅"
            className="w-full block py-2 bg-blue rounded-sm text-white cursor-pointer font-semibold"
          />
        </div>
      </div>

      <div className="mt-20">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <FaRocket /> 更快被发现
        </h3>
        <p className="text-primary/75 text-base mb-4">
          上传简历，让招聘方更快看到你，提升求职成功率。
        </p>
        <div className="w-full space-y-4">
          <input
            type="submit"
            value="上传简历"
            className="w-full block py-2 bg-blue rounded-sm text-white cursor-pointer font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
