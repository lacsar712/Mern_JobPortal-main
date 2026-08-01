import { FiX, FiTrash2 } from "react-icons/fi";
import {
  useJobShortlist,
  formatSalaryRange,
  COMPARE_MIN,
  COMPARE_MAX,
} from "../hooks/useJobShortlist";

/**
 * 短名单面板（抽屉）：展示已加入职位摘要，支持勾选对比、单项移除与一键清空。
 * 勾选状态由父组件（URL 同步 hook）受控；业务规则均来自 useJobShortlist 模块。
 */
const ShortlistPanel = ({ open, onClose, onCompare, selectedIds, onSelectedChange }) => {
  const { shortlist, count, tempMode, removeJob, clearShortlist } = useJobShortlist();

  if (!open) return null;

  const handleCheck = (id) => {
    onSelectedChange(
      selectedIds.includes(id)
        ? selectedIds.filter((itemId) => itemId !== id)
        : [...selectedIds, id]
    );
  };

  const handleRemove = (id) => {
    onSelectedChange(selectedIds.filter((itemId) => itemId !== id));
    removeJob(id);
  };

  const handleClear = () => {
    if (window.confirm("确定要清空短名单吗？该操作不可撤销。")) {
      onSelectedChange([]);
      clearShortlist();
    }
  };

  const handleCompare = () => {
    onCompare(selectedIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="职位短名单面板">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

      <aside className="relative z-10 w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary">
            职位短名单
            <span className="ml-2 text-sm font-medium text-white bg-blue rounded-full px-2 py-0.5">
              {count}/8
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="关闭短名单面板"
            className="text-primary/60 hover:text-primary text-xl"
          >
            <FiX />
          </button>
        </div>

        {tempMode && (
          <p className="px-5 py-2 text-xs text-amber-700 bg-amber-50">
            当前为临时模式：本地存储不可用，刷新页面后短名单将丢失。
          </p>
        )}

        {/* 列表区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {shortlist.length === 0 ? (
            <p className="text-primary/60 text-sm mt-8 text-center">还没有加入任何职位</p>
          ) : (
            <ul className="space-y-3">
              {shortlist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border border-gray-200 rounded p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleCheck(item.id)}
                    aria-label={`勾选 ${item.jobTitle} 用于对比`}
                    className="mt-1 h-4 w-4 accent-blue cursor-pointer"
                  />
                  <img
                    src={item.companyLogo}
                    alt={item.companyName}
                    className="w-10 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary truncate">{item.jobTitle}</p>
                    <p className="text-sm text-primary/70">{item.companyName}</p>
                    <p className="text-xs text-primary/60 mt-1">
                      {item.jobLocation} · {item.employmentType} · {formatSalaryRange(item)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    aria-label={`将 ${item.jobTitle} 移出短名单`}
                    className="text-red-500 hover:text-red-700 mt-1"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部操作区 */}
        {shortlist.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-primary/60">
              已勾选 {selectedIds.length} 个（对比需 {COMPARE_MIN}～{COMPARE_MAX} 个）
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCompare}
                className="flex-1 bg-blue text-white py-2 rounded-sm hover:opacity-90"
              >
                对比所选
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-sm hover:bg-red-50"
              >
                清空
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ShortlistPanel;
