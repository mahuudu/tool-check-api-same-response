
const StatsCard = ({ value, label }) => (
    <div className="bg-gray-100 p-2 rounded-lg text-center m-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
    </div>
);

export default StatsCard;
