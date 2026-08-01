import React, { useState } from "react";
import { FiX, FiArrowLeft, FiClipboard } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  computeMedian,
  formatMedian,
  formatMedianDiff,
  sortCompareItems,
  computeMedianDiffs,
  buildCompareSummary,
} from "../hooks/useJobShortlist";

// §6.2 对比表表头固定顺序
const HEADERS = [
  "职位",
  "公司",
  "地点",
  "雇佣类型",
  "经验",
  "薪资区间",
  "中位薪资",
  "发布日期",
  "摘要",
];

// 排序切换项（仅影响对比视图呈现顺序，不改写 localStorage）
const SORT_OPTIONS = [
  { key: "median", label: "按中位薪资" },
  { key: "date", label: "按发布日期" },
  { key: "title", label: "按职位名" },
];

// description 截断展示（避免表格过宽）
function truncate(text, max = 80) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

const CompareView = ({ items, onBack, onRemove }) => {
  const [sortKey, setSortKey] = useState("median"); // 默认按中位薪资降序
  const [fallbackText, setFallbackText] = useState(""); // 剪贴板失败时的降级展示

  const sorted = sortCompareItems(items, sortKey);
  // 差值以「当前对比集合」为基准，复用第一轮 computeMedian 口径
  const { diffs } = computeMedianDiffs(sorted);

  // 导出对比摘要：优先 Clipboard API，失败降级为只读 textarea 供手动复制。
  const handleExport = async () => {
    const summary = buildCompareSummary(sorted);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
        toast.success("对比摘要已复制到剪贴板");
        setFallbackText("");
        return;
      }
      throw new Error("Clipboard API 不可用");
    } catch (e) {
      // 降级：展示只读文本框，提示用户手动复制
      setFallbackText(summary);
      toast("剪贴板不可用，请手动复制下方文本");
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-primary">
          职位对比（{sorted.length}）
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            aria-label="导出对比摘要到剪贴板"
            className="flex items-center gap-1 text-sm bg-blue text-white px-3 py-1 rounded"
          >
            <FiClipboard /> 导出对比摘要
          </button>
          <button
            type="button"
            onClick={onBack}
            aria-label="返回短名单"
            className="flex items-center gap-1 text-blue hover:underline text-sm"
          >
            <FiArrowLeft /> 返回短名单
          </button>
        </div>
      </div>

      {fallbackText && (
        <div className="mb-3">
          <p className="text-xs text-orange-600 mb-1">
            剪贴板不可用，请手动选中复制以下内容：
          </p>
          <textarea
            readOnly
            value={fallbackText}
            aria-label="对比摘要文本"
            className="w-full h-40 border border-gray-300 rounded p-2 text-xs font-mono"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      {/* 排序切换 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-primary/70">排序：</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSortKey(opt.key)}
            aria-label={opt.label}
            aria-pressed={sortKey === opt.key}
            className={`text-sm px-3 py-1 rounded border transition-colors ${
              sortKey === opt.key
                ? "bg-blue text-white border-blue"
                : "bg-white text-blue border-blue hover:bg-blue/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue/10 text-primary">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="border border-gray-200 px-3 py-2 text-left font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const median = computeMedian(item.minPrice, item.maxPrice);
              return (
                <tr key={item.id} className="align-top hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">
                    {item.jobTitle}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    {item.companyName}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    {item.jobLocation}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    {item.employmentType}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    {item.experienceLevel}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                    {item.minPrice}-{item.maxPrice}k
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap font-semibold text-blue">
                    {formatMedian(median)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                    {item.postingDate}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 max-w-xs text-primary/70">
                    {truncate(item.description)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`从对比中移出 ${item.jobTitle}`}
                      className="flex items-center gap-1 text-red-500 hover:underline"
                    >
                      <FiX /> 移出
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* 相对最高中位薪资的差值行 */}
            <tr className="bg-gray-50 font-medium">
              <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                相对最高中位薪资
              </td>
              <td
                className="border border-gray-200 px-3 py-2 text-primary/60"
                colSpan={HEADERS.length}
              >
                <div className="flex flex-wrap gap-4">
                  {sorted.map((item) => (
                    <span key={item.id} className="whitespace-nowrap">
                      {item.jobTitle}：
                      <span
                        className={
                          diffs[item.id] === 0
                            ? "text-blue font-semibold"
                            : "text-primary"
                        }
                      >
                        {formatMedianDiff(diffs[item.id])}
                      </span>
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareView;
