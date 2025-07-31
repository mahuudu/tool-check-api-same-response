
import ActionButton from './ActionButton';
import Modal from './Modal';
import CompareRow from './CompareRow';
import { useState } from 'react';

import ResponseCompare from './ResponseCompare';

const CompareModal = ({ tests, onClose }) => {
    const [detailCompareData, setDetailCompareData] = useState(null);

    const testsByKey = {};
    tests.forEach((test) => {
        if (!testsByKey[test.key]) testsByKey[test.key] = [];
        testsByKey[test.key].push(test);
    });

    return (
        <>
            <Modal
                title="Bảng So Sánh API Tests"
                onClose={onClose}
                footer={
                    <ActionButton text="Đóng" onClick={onClose} bgColor="bg-gray-500" hoverColor="hover:bg-gray-600" />
                }
            >
                <div className="space-y-4">
                    {tests.length === 0 ? (
                        <div className="text-center py-4">
                            <h5>Chưa có dữ liệu để so sánh</h5>
                        </div>
                    ) : (
                        <>
                            {Object.keys(testsByKey).map((key) => (
                                <div key={key} className="bg-white rounded-lg mb-2">
                                    <div className="bg-gray-100 p-3 rounded-t-lg flex justify-between items-center">
                                        <h6 className="m-0 text-left">Key: {key} ({testsByKey[key].length} tests)</h6>
                                        <button
                                            className="text-blue-600 text-sm hover:underline"
                                            onClick={() => setDetailCompareData(testsByKey[key])}
                                        >
                                            So sánh chi tiết
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="p-2">Group</th>
                                                    <th className="p-2">Method</th>
                                                    <th className="p-2">URL</th>
                                                    <th className="p-2">Status</th>
                                                    <th className="p-2">Response Preview</th>
                                                    <th className="p-2">Timestamp</th>
                                                    <th className="p-2">Text So sánh</th>
                                                    <th className="p-2">Key So sánh</th>
                                                    <th className="p-2">So sánh</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {testsByKey[key].map((test, index) => (
                                                    <CompareRow
                                                        key={test.id}
                                                        test={test}
                                                        previousTest={index > 0 ? testsByKey[key][index - 1] : undefined}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </Modal>

            <ResponseCompare detailCompareData={detailCompareData} setDetailCompareData={setDetailCompareData} />
        </>
    );
};

export default CompareModal;
