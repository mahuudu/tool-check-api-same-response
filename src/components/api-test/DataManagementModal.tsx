
import { useState, useEffect } from 'react';
import ActionButton from './ActionButton';
import Modal from './Modal';

const DataManagementModal = ({ tests, onLoadData, onClose }) => {
  const [storedData, setStoredData] = useState([]);

  useEffect(() => {
    const loadStorageList = () => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('test_')) keys.push(key);
      }
      keys.sort().reverse();
      const data = keys.map((key) => {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          return { key, ...item };
        } catch (error) {
          console.error('Error parsing stored data:', error);
          return null;
        }
      }).filter(Boolean);
      setStoredData(data);
    };
    loadStorageList();
  }, []);

  const saveCurrentData = () => {
    if (tests.length === 0) {
      alert('Chưa có dữ liệu để lưu!');
      return;
    }
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const key = `test_${dateStr} `;
    const dataToSave = {
      timestamp: now.toISOString(),
      data: tests,
      stats: {
        total: tests.length,
        success: tests.filter((t) => t.status === 'success').length,
        error: tests.filter((t) => t.status === 'error').length,
        pending: tests.filter((t) => t.status === 'pending').length,
      },
    };
    try {
      localStorage.setItem(key, JSON.stringify(dataToSave));
      setStoredData([{ key, ...dataToSave }, ...storedData]);
      alert('✅ Đã lưu dữ liệu thành công!');
    } catch (error) {
      alert('❌ Lỗi khi lưu dữ liệu: ' + error.message);
    }
  };

  const loadStorageData = (key) => {
    if (confirm('Tải dữ liệu này sẽ thay thế dữ liệu hiện tại. Bạn có chắc chắn?')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        onLoadData(data.data);
        alert('✅ Đã tải dữ liệu thành công!');
        onClose();
      } catch (error) {
        alert('❌ Lỗi khi tải dữ liệu: ' + error.message);
      }
    }
  };

  const deleteStorageData = (key) => {
    if (confirm('Bạn có chắc muốn xóa dữ liệu này?')) {
      localStorage.removeItem(key);
      setStoredData(storedData.filter((item) => item.key !== key));
    }
  };

  const clearAllStorage = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã lưu?')) {
      const keysToDelete = storedData.map((item) => item.key);
      keysToDelete.forEach((key) => localStorage.removeItem(key));
      setStoredData([]);
      alert('✅ Đã xóa tất cả dữ liệu lưu trữ!');
    }
  };

  return (
    <Modal
      title="Quản Lý Dữ Liệu"
      onClose={onClose}
      footer={
        <ActionButton text="Đóng" onClick={onClose} bgColor="bg-gray-500" hoverColor="hover:bg-gray-600" />
      }
    >
      <p className="text-sm text-gray-600 mb-4">
        Lưu ý: Dữ liệu được lưu trong localStorage của trình duyệt.
      </p>
      <div className="mb-4 flex space-x-2">
        <ActionButton
          text="Lưu Dữ Liệu Hiện Tại"
          onClick={saveCurrentData}
          additionalClasses="flex-1"
        />
        <ActionButton
          text="Xóa Tất Cả Lưu Trữ"
          onClick={clearAllStorage}
          bgColor="bg-red-500"
          hoverColor="hover:bg-red-600"
          additionalClasses="flex-1"
        />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Dữ Liệu Đã Lưu:</h3>
        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          {storedData.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Chưa có dữ liệu nào được lưu
            </div>
          ) : (
            storedData.map((item) => (
              <div
                key={item.key}
                className="p-2 border rounded mb-2 bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => loadStorageData(item.key)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">📁 {item.key}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </div>
                    <div className="text-sm">
                      📊 {item.stats.total} tests |{' '}
                      <span className="text-green-600">✅ {item.stats.success}</span> |{' '}
                      <span className="text-red-600">❌ {item.stats.error}</span>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStorageData(item.key);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DataManagementModal;
