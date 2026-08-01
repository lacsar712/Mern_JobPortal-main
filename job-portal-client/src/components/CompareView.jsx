import { useMemo, useState } from "react";
import { FiArrowLeft, FiX, FiCopy, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  calcMedian,
  calcMaxMedian,
  formatMedian,
  formatMedianDiff,
  sortCompareEntries,
  buildCompareSummary,
  COMPARE_SORTS,
} from "../hooks/useJobShortlist";

const CompareView = ({ jobs, onClose, onBack, onRemove }) => {
  const [sortMode, setSortMode] = useState("median");
  const [showFallback, setShowFallback] = useState(false);

  const maxMedian = useMemo(() => calcMaxMedian(jobs), [jobs]);

  const sortedJobs = useMemo(
    () => sortCompareEntries(jobs, sortMode),
    [jobs, sortMode]
  );

  const summaryText = useMemo(
    () => buildCompareSummary(sortedJobs),
    [sortedJobs]
  );

  const rows = [
    { label: "职位", key: "jobTitle" },
    { label: "公司", key: "companyName" },
    { label: "地点", key: "jobLocation" },
    { label: "雇佣类型", key: "employmentType" },
    { label: "经验", key: "experienceLevel" },
    { label: "薪资区间", key: "salaryRange" },
    { label: "中位薪资", key: "median" },
    { label: "相对最高中位薪资的差值", key: "medianDiff" },
    { label: "发布日期", key: "postingDate" },
    { label: "摘要", key: "description" },
  ];

  const renderCell = (job, key) => {
    if (key === "salaryRange") {
      return `${job.minPrice}-${job.maxPrice}k · ${job.salaryType}`;
    }
    if (key === "median") {
      return formatMedian(calcMedian(job.minPrice, job.maxPrice));
    }
    if (key === "medianDiff") {
      const median = calcMedian(job.minPrice, job.maxPrice);
      if (median == null || maxMedian == null) return "—";
      return formatMedianDiff(median - maxMedian);
    }
    if (key === "description") {
      const text = job.description || "";
      return text.length > 120 ? `${text.slice(0, 120)}…` : text;
    }
    if (key === "jobTitle") {
      return <span className="font-semibold text-primary">{job[key]}</span>;
    }
    return job[key] || "—";
  };

  const handleCopy = async () => {
    const text = buildCompareSummary(sortedJobs);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success("对比摘要已复制到剪贴板");
        setShowFallback(false);
        return;
      }
      throw new Error("clipboard unavailable");
    } catch {
      setShowFallback(true);
      toast("自动复制失败，请手动选择文本复制", { icon: "ℹ️" });
    }
  };

  const handleRemove = (job) => {
    if (typeof onRemove === "function") {
      onRemove(job.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FAFAFA] z-50 overflow-y-auto">
      <div className="max-w-screen-2xl mx-auto xl:px-24 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue hover:underline"
            >
              <FiArrowLeft /> 返回短名单
            </button>
            <span className="text-primary/30">|</span>
            <h2 className="text-xl font-bold text-primary">职位对比</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue border border-blue px-3 py-1.5 rounded hover:bg-blue/5"
            >
              <FiCopy /> 导出对比摘要
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭对比视图"
              className="p-2 rounded text-primary/70 hover:bg-gray-200"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-primary/70">排序：</span>
          {Object.entries(COMPARE_SORTS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortMode(key)}
              aria-pressed={sortMode === key}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                sortMode === key
                  ? "bg-blue text-white border-blue"
                  : "bg-white text-primary/80 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-xs text-primary/50 ml-2">
            排序仅影响对比展示，不会改变短名单顺序。
          </span>
        </div>

        {showFallback && (
          <div className="mb-4">
            <p className="text-sm text-primary/70 mb-1">
              无法自动写入剪贴板，请手动复制以下文本：
            </p>
            <textarea
              readOnly
              value={summaryText}
              onFocus={(e) => e.target.select()}
              className="w-full h-40 p-3 text-sm border border-gray-300 rounded font-mono bg-gray-50"
              aria-label="对比摘要文本，可手动复制"
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="bg-gray-50 text-left text-sm font-semibold text-primary/70 px-4 py-3 border-b border-gray-200 w-40 sticky left-0 bg-gray-50">
                  对比项
                </th>
                {sortedJobs.map((job) => (
                  <th
                    key={job.id}
                    className="text-left text-sm font-semibold text-primary px-4 py-3 border-b border-l border-gray-200 align-top"
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={job.companyLogo}
                        alt={job.companyName}
                        className="w-8 h-8 rounded object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{job.companyName}</div>
                        <div className="text-xs font-normal text-primary/60 truncate">
                          {job.jobTitle}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(job)}
                        aria-label={`从对比中移除 ${job.jobTitle}`}
                        title="移出短名单"
                        className="p-1 text-primary/40 hover:text-red-500 rounded shrink-0"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.key} className={rowIndex % 2 === 1 ? "bg-gray-50/60" : ""}>
                  <td className="text-sm font-medium text-primary/70 px-4 py-3 border-b border-gray-100 sticky left-0 bg-inherit">
                    {row.label}
                  </td>
                  {sortedJobs.map((job) => (
                    <td
                      key={job.id}
                      className={`text-sm text-primary px-4 py-3 border-b border-l border-gray-100 align-top ${
                        row.key === "median" || row.key === "medianDiff"
                          ? "font-semibold text-blue"
                          : ""
                      }`}
                    >
                      {renderCell(job, row.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
