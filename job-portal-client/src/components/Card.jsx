import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiStar,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import useJobShortlist from "../hooks/useJobShortlist";
import useShortlistUrlSync from "../hooks/useShortlistUrlSync";

const Card = ({ data }) => {
  const {
    _id,
    companyLogo,
    jobTitle,
    companyName,
    jobLocation,
    employmentType,
    minPrice,
    maxPrice,
    postingDate,
    description,
  } = data;

  const { isShortlisted, toggleItem, resolveShortlistIds } = useJobShortlist();
  const { inCompare, compareIds } = useShortlistUrlSync(resolveShortlistIds);

  const active = isShortlisted(_id);
  // 当前 URL 处于对比模式且本卡片被 compare 到 → 「对比中」样式
  const comparing = inCompare && compareIds.includes(String(_id));

  const handleToggle = (e) => {
    // 阻止冒泡到外层 Link，避免误触发跳转
    e.preventDefault();
    e.stopPropagation();
    toggleItem(data);
  };

  // 联动高亮：优先展示「对比中」；否则展示「仅在短名单」
  const cardHighlight = comparing
    ? "ring-2 ring-blue border-l-4 border-blue"
    : active
    ? "border-l-4 border-blue"
    : "";

  return (
    <div>
      <section className={`card relative ${cardHighlight}`}>
        {comparing && (
          <span className="absolute top-2 right-2 text-xs bg-blue text-white px-2 py-0.5 rounded-full">
            对比中
          </span>
        )}
        {!comparing && active && (
          <span className="absolute top-2 right-2 text-xs bg-blue/10 text-blue px-2 py-0.5 rounded-full">
            已收藏
          </span>
        )}
        <Link
          to={`/jobs/${_id}`}
          className="flex gap-4 flex-col sm:flex-row items-start"
        >
          <img src={companyLogo} alt={jobTitle} className="w-16 h-16 mb-4" />
          <div className="card-details">
            <h4 className="text-primary mb-1">{companyName}</h4>
            <h3 className="text-lg font-semibold mb-2">{jobTitle}</h3>

            <div className="text-primary/70 text-base flex flex-wrap gap-2 mb-2">
              <span className="flex items-center gap-2">
                <FiMapPin /> {jobLocation}
              </span>
              <span className="flex items-center gap-2">
                <FiClock /> {employmentType}
              </span>
              <span className="flex items-center gap-2">
                <FiDollarSign /> {minPrice}-{maxPrice}k
              </span>
              <span className="flex items-center gap-2">
                <FiCalendar /> {postingDate}
              </span>
            </div>

            <p className="text-base text-primary/70 ">{description}</p>
          </div>
        </Link>

        {/* §4.1 短名单 Toggle：状态即时可见 */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={active ? "移出短名单" : "加入短名单"}
          className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition-colors ${
            active
              ? "bg-blue text-white border-blue"
              : "bg-white text-blue border-blue hover:bg-blue/10"
          }`}
        >
          <FiStar className={active ? "fill-current" : ""} />
          {active ? "移出短名单" : "加入短名单"}
        </button>
      </section>
    </div>
  );
};

export default Card;
