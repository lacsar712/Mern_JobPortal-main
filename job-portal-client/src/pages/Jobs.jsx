
const Jobs = ({ result }) => {
  return (
    <>
     <div>
     <h3 className='text-lg font-bold mb-2'>{result.length} 个职位</h3>
     </div>
      <section className="card-container">{result}</section>
    </>
  );
};

export default Jobs;
