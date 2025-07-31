
const ProgressBar = ({ progress }) => (
    <div className="px-4 mx-auto">
        <div className="w-full bg-gray-200 h-2 rounded px-4 mx-auto">
            <div
                className="bg-blue-600 h-2 rounded transition-all duration-300"
                style={{ width: `${progress}% ` }}
            ></div>
        </div>
    </div>
);

export default ProgressBar;
