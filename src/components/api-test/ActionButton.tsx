
const ActionButton = ({ text, onClick, bgColor = "bg-blue-500", hoverColor = "hover:bg-blue-600", additionalClasses = "" }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 ${bgColor} ${hoverColor} text-white rounded m-1 transition duration-200 ${additionalClasses}`}
    >
        {text}
    </button>
);

export default ActionButton;
