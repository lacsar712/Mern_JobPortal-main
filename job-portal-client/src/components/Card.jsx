import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useJobShortlist } from "../hooks/useJobShortlist";
import { useCompareIds } from "../hooks/useShortlistUrlSync";

const Card = ({ data }) => {
  const { isInShortlist, toggleJob } = useJobShortlist();
  const compareIds = useCompareIds();
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
  const shortlisted = isInShortlist(_id);
  const inCompare = compareIds.includes(String(_id));
  return (
    <div>
      <section
        className="card relative"
        style={shortlisted ? { borderColor: "#3575E2" } : undefined}
      >
        {inCompare && (
          <span className="absolute top-2 right-2 text-xs font-medium text-white bg-amber-500 px-2 py-0.5 rounded-full">
            对比中
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

        <button
          onClick={() => toggleJob(data)}
          aria-label={shortlisted ? `将 ${jobTitle} 移出短名单` : `将 ${jobTitle} 加入短名单`}
          className={`mt-3 px-4 py-1.5 text-sm rounded-sm border transition-colors ${
            shortlisted
              ? "bg-blue text-white border-blue hover:opacity-90"
              : "text-blue border-blue hover:bg-blue hover:text-white"
          }`}
        >
          {shortlisted ? "移出短名单" : "加入短名单"}
        </button>
      </section>
    </div>
  );
};

export default Card;
