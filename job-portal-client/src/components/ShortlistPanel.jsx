import { FiBookmark, FiX, FiTrash2, FiColumns } from "react-icons/fi";

const ShortlistPanel = ({
  open,
  onClose,
  items,
  count,
  maxItems,
  storageAvailable,
  selectedIds,
  onToggleSelect,
  onRemove,
  onClear,
  onCompare,
}) => {
  const handleClear = () => {
    if (count === 0) return;
    const confirmed = window.confirm("确定要清空短名单吗？此操作不可撤销。");
    if (confirmed) {
      onClear();
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="职位短名单"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiBookmark className="text-blue" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">短名单</h2>
            <span
              className="ml-1 inline-flex items-center justify-center text-xs font-medium bg-blue/10 text-blue rounded-full px-2 py-0.5"
              aria-label={`当前已加入 ${count} 个职位，上限 ${maxItems} 个`}
            >
              {count}/{maxItems}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭短名单面板"
            className="p-1.5 rounded text-primary/70 hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>

        {!storageAvailable && (
          <div className="px-5 py-2 bg-amber-50 text-amber-800 text-xs border-b border-amber-200">
            当前为临时模式，本地存储不可用，刷新后数据将丢失。
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-primary/60">
              <FiBookmark size={40} className="mb-3 text-gray-300" aria-hidden="true" />
              <p className="text-base">还没有加入任何职位</p>
              <p className="text-sm mt-1">浏览职位列表，点击「加入短名单」即可收藏。</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`选择 ${item.jobTitle} 进行对比`}
                        className="mt-1 h-4 w-4 accent-blue"
                      />
                      <img
                        src={item.companyLogo}
                        alt={item.companyName}
                        className="w-10 h-10 rounded object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-primary truncate">
                          {item.jobTitle}
                        </h4>
                        <p className="text-xs text-primary/70 truncate">
                          {item.companyName}
                        </p>
                        <div className="text-xs text-primary/60 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>{item.jobLocation}</span>
                          <span>· {item.employmentType}</span>
                          <span>· {item.minPrice}-{item.maxPrice}k</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`从短名单移除 ${item.jobTitle}`}
                        className="p-1.5 text-primary/50 hover:text-red-500 rounded"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-gray-200 px-5 py-3 space-y-2 bg-gray-50">
            <p className="text-xs text-primary/60">
              已勾选 <span className="font-semibold text-blue">{selectedCount}</span> 个（对比需 2～4 个）
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCompare}
                disabled={selectedCount < 2 || selectedCount > 4}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiColumns />
                对比所选
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-primary/80 text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
              >
                <FiTrash2 />
                清空
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default ShortlistPanel;
