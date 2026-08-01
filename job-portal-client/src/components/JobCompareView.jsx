import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCopy, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  buildCompareSummary,
  calculateSalaryMedian,
  formatSalaryDiff,
  formatSalaryMedian,
  getSalaryRangeText,
  COMPARE_SORT_MEDIAN,
  COMPARE_SORT_DATE,
  COMPARE_SORT_TITLE,
} from "../hooks/useJobShortlist";

const SORT_OPTIONS = [
  { value: COMPARE_SORT_MEDIAN, label: "按中位薪资" },
  { value: COMPARE_SORT_DATE, label: "按发布日期" },
  { value: COMPARE_SORT_TITLE, label: "按职位名" },
];

const JobCompareView = ({
  items,
  maxMedian,
  compareSort,
  onSortChange,
  onClose,
  onRemove,
}) => {
  const [showExportArea, setShowExportArea] = useState(false);
  const [copied, setCopied] = useState(false);

  const summaryText = buildCompareSummary(items);

  const handleExport = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summaryText);
        setCopied(true);
        toast.success("对比摘要已复制到剪贴板");
        window.setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error("clipboard unavailable");
    } catch {
      setShowExportArea(true);
      toast("自动复制失败，可在下方文本框手动复制", { icon: "ℹ️" });
    }
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      toast.success("已复制");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动选中文本复制");
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-blue/30 bg-blue/5 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">职位对比</h2>
          <p className="text-sm text-primary/60">
            对比 {items.length} 个职位，可切换排序方式。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded border border-blue bg-white px-4 py-2 text-sm font-medium text-blue hover:bg-blue hover:text-white"
          >
            {copied ? <FiCheck /> : <FiCopy />}
            导出对比摘要
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-primary hover:border-blue hover:text-blue"
          >
            返回短名单
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              compareSort === option.value
                ? "bg-blue text-white"
                : "bg-white text-primary/70 ring-1 ring-gray-300 hover:ring-blue"
            }`}
            aria-pressed={compareSort === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showExportArea && (
        <div className="mb-4 rounded border border-blue/30 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-primary">
              对比摘要（可手动复制）
            </p>
            <button
              type="button"
              onClick={handleManualCopy}
              className="inline-flex items-center gap-1 rounded bg-blue px-3 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              {copied ? <FiCheck /> : <FiCopy />}
              复制
            </button>
          </div>
          <textarea
            readOnly
            value={summaryText}
            onFocus={(event) => event.target.select()}
            className="h-44 w-full resize-y rounded border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-primary/80 focus:outline-none focus:ring-2 focus:ring-blue"
            aria-label="对比摘要文本"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">职位</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">公司</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">地点</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">雇佣类型</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">经验</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">薪资区间</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">中位薪资</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">相对最高差值</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary">发布日期</th>
              <th className="px-4 py-3 font-semibold text-primary">摘要</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => {
              const median = calculateSalaryMedian(item);

              return (
                <tr key={item.id} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <Link
                      to={`/jobs/${item.id}`}
                      className="flex items-center gap-3 font-medium text-blue hover:underline"
                    >
                      <img
                        src={item.companyLogo}
                        alt={item.companyName}
                        className="h-10 w-10 object-contain"
                      />
                      <span>{item.jobTitle || "—"}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {item.companyName || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {item.jobLocation || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {item.employmentType || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {item.experienceLevel || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {getSalaryRangeText(item)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-primary">
                    {formatSalaryMedian(median)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-4 font-medium ${
                      median !== null && median === maxMedian
                        ? "text-blue"
                        : "text-primary/70"
                    }`}
                  >
                    {formatSalaryDiff(median, maxMedian)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-primary/80">
                    {item.postingDate || "—"}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-primary/75">
                    <p className="line-clamp-3">{item.description || "—"}</p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="mt-3 text-xs font-medium text-red-600 hover:underline"
                    >
                      从对比结果移出
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default JobCompareView;
