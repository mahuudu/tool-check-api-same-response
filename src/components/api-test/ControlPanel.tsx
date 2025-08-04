import ActionButton from './ActionButton';

const ControlPanel = ({ onSelectRun, onRunAll, onCompare, onExport, onManageData, onClearAll , onShowCompareJson }) => (
    <div className="flex flex-wrap justify-center p-4 bg-gray-50">
        <ActionButton text="Chạy với select" onClick={onSelectRun} />
        <ActionButton text="Chạy Tất Cả" onClick={onRunAll} />
        <ActionButton text="So Sánh" onClick={onCompare} />
        <ActionButton text="Json compare" onClick={onShowCompareJson} />
        <ActionButton text="Lưu Trữ" onClick={onManageData} />
        <ActionButton text="Xóa Tất Cả" onClick={onClearAll} bgColor="bg-red-500" hoverColor="hover:bg-red-600" />
    </div>
);

export default ControlPanel;
