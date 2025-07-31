const Modal = ({ title, children, onClose, footer }) => (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-7xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto">{children}</div>
            {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </div>
    </div>
);

export default Modal;
