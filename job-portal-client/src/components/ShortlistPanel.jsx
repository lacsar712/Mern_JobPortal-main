import { useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const ShortlistPanel = ({
  isOpen,
  onClose,
  items,
  count,
  selectedCount,
  selectedIds,
  storageDegraded,
  onToggleSelection,
  onRemove,
  onClear,
  onCompare,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCompare = () => {
    onCompare();
  };

  const handleClear = () => {
    if (window.confirm("确认清空短名单吗？此操作无法撤销。")) {
      onClear();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 flex h-full w-[min(100%,28rem)] flex-col bg-white shadow-2xl ${
          isOpen ? "block" : "hidden"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="职位短名单"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-primary">职位短名单</h2>
            <p className="text-sm text-primary/60">已加入 {count}/8 个职位</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭短名单"
            className="rounded p-2 text-primary/70 hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {storageDegraded && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            当前为临时模式，短名单仅保存在当前会话中，刷新后可能丢失。
          </div>
        )}

        {count >= 8 && (
          <div className="border-b border-blue/20 bg-blue/5 px-5 py-3 text-sm text-blue">
            短名单已满（8/8），请先移出部分职位再添加新的。
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-primary/60">
              <p className="text-lg font-medium">还没有加入任何职位</p>
              <p className="mt-2 text-sm">在职位卡片上点击“加入短名单”即可开始对比。</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                const selectionDisabled = !checked && selectedCount >= 4;

                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-3 hover:border-blue"
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={selectionDisabled}
                        onChange={() => onToggleSelection(item.id)}
                        aria-label={`选择 ${item.jobTitle}`}
                        className="mt-1 h-4 w-4 accent-blue"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.companyLogo}
                            alt={item.companyName}
                            className="h-10 w-10 rounded object-contain"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-primary">
                              {item.jobTitle}
                            </h3>
                            <p className="truncate text-sm text-primary/70">
                              {item.companyName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            aria-label={`从短名单移除 ${item.jobTitle}`}
                            className="rounded p-2 text-primary/60 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary/70">
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin /> {item.jobLocation || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiClock /> {item.employmentType || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiDollarSign />
                            {item.minPrice || "—"}-{item.maxPrice || "—"}k
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar /> {item.postingDate || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-gray-200 px-5 py-4">
            <p className="text-sm text-primary/60">
              已选择 {selectedCount} 个职位，可对比 2～4 个职位。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCompare}
                className="flex-1 rounded bg-blue px-4 py-2 font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={items.length === 0}
              >
                对比所选
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded border border-gray-300 px-4 py-2 font-medium text-primary hover:border-red-500 hover:text-red-600"
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
