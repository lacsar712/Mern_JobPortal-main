import { useState } from "react";
import { FiArrowLeft, FiCopy, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  COMPARE_SORT_MODES,
  sortCompareItems,
  computeMedian,
  formatMedian,
  formatMedianDiff,
  formatSalaryRange,
  buildCompareSummaryText,
} from "../hooks/useJobShortlist";

// 对比表表头固定使用（§6.2）
const COLUMNS = [
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

const SORT_OPTIONS = [
  { mode: COMPARE_SORT_MODES.MEDIAN, label: "按中位薪资" },
  { mode: COMPARE_SORT_MODES.DATE, label: "按发布日期" },
  { mode: COMPARE_SORT_MODES.TITLE, label: "按职位名" },
];

const truncate = (text, max = 80) =>
  text && text.length > max ? `${text.slice(0, max)}…` : text || "—";

/**
 * 对比视图：并排表格对比短名单中勾选的 2～4 个职位。
 * 排序切换仅影响本视图呈现顺序，不改写 localStorage 中的 addedAt 顺序；
 * median / 差值均复用 useJobShortlist 模块的同一套口径。
 */
const CompareView = ({ items, onBack, onRemove }) => {
  const [sortMode, setSortMode] = useState(COMPARE_SORT_MODES.MEDIAN);
  const [fallbackText, setFallbackText] = useState(null);
  const sortedItems = sortCompareItems(items, sortMode);

  // 导出对比摘要：优先 Clipboard API，失败降级为只读 textarea 手动复制
  const handleExport = async () => {
    const text = buildCompareSummaryText(sortedItems);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("对比摘要已复制到剪贴板");
    } catch {
      setFallbackText(text);
      toast.error("复制失败，请手动复制下方文本");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto" role="dialog" aria-label="职位对比视图">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-24 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-primary">职位对比（{items.length}）</h2>
          <div className="flex items-center gap-4">
            {/* 排序切换（仅影响呈现顺序） */}
            <div className="flex gap-2" role="group" aria-label="对比排序方式">
              {SORT_OPTIONS.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  aria-pressed={sortMode === mode}
                  className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                    sortMode === mode
                      ? "bg-blue text-white border-blue"
                      : "text-blue border-blue hover:bg-blue hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              aria-label="导出对比摘要到剪贴板"
              className="flex items-center gap-2 border border-blue text-blue px-3 py-1.5 text-sm rounded-sm hover:bg-blue hover:text-white transition-colors"
            >
              <FiCopy /> 导出对比摘要
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue hover:underline"
            >
              <FiArrowLeft /> 返回短名单
            </button>
          </div>
        </div>

        {/* 剪贴板不可用时的降级展示 */}
        {fallbackText !== null && (
          <div className="mb-4 border border-amber-300 bg-amber-50 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-amber-800">请手动复制以下对比摘要：</p>
              <button
                onClick={() => setFallbackText(null)}
                aria-label="关闭手动复制区"
                className="text-amber-800 hover:text-amber-900"
              >
                <FiX />
              </button>
            </div>
            <textarea
              readOnly
              value={fallbackText}
              rows={Math.min(sortedItems.length + 6, 12)}
              onFocus={(event) => event.target.select()}
              className="w-full text-xs font-mono bg-white border border-gray-200 rounded p-2"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#FAFAFA]">
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr
                  key={item.id}
                  className={computeMedian(item) === null ? "text-primary/50" : ""}
                >
                  <td className="border border-gray-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.companyLogo}
                        alt={item.companyName}
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <span className="font-semibold text-primary">{item.jobTitle}</span>
                        <button
                          onClick={() => onRemove(item.id)}
                          aria-label={`将 ${item.jobTitle} 移出短名单`}
                          className="block text-xs text-red-500 hover:underline mt-0.5"
                        >
                          移出
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">{item.companyName}</td>
                  <td className="border border-gray-200 px-3 py-2">{item.jobLocation}</td>
                  <td className="border border-gray-200 px-3 py-2">{item.employmentType}</td>
                  <td className="border border-gray-200 px-3 py-2">{item.experienceLevel}</td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                    {formatSalaryRange(item)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap font-medium">
                    {formatMedian(item)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                    {item.postingDate}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-primary/70">
                    {truncate(item.description)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 「相对最高中位薪资的差值」行：以当前对比集合最大 median 为基准 */}
          <table className="w-full border-collapse text-sm mt-4">
            <tbody>
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary bg-[#FAFAFA] whitespace-nowrap">
                  相对最高中位薪资的差值
                </th>
                {sortedItems.map((item) => (
                  <td
                    key={item.id}
                    className="border border-gray-200 px-3 py-2 whitespace-nowrap"
                  >
                    <span className="block text-xs text-primary/50 mb-0.5">{item.jobTitle}</span>
                    {formatMedianDiff(item, sortedItems)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-primary/50 mt-4">
          排序仅影响当前对比视图呈现顺序；无法计算/解析的条目排在最后。
        </p>
      </div>
    </div>
  );
};

export default CompareView;
