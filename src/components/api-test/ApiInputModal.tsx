import { useState } from 'react';
import Modal from './Modal';
import ActionButton from './ActionButton';
import CompareModal from './CompareModal';

const ApiInputModal = ({onClose}) => {
    const [json1, setJson1] = useState('');
    const [json2, setJson2] = useState('');
    const [compareData, setCompareData] = useState(null);
    const [error, setError] = useState('');

    const handleCompare = () => {
        try {
            const parsedJson1 = JSON.parse(json1 || '{}');
            const parsedJson2 = JSON.parse(json2 || '{}');

            const testData : any = [
                {
                    id: '1',
                    key: 'api-test',
                    group: 'Input 1',
                    method: 'POST',
                    url: 'user-input-1',
                    status: 200,
                    response: { body: parsedJson1 },
                    timestamp: new Date().toISOString(),
                },
                {
                    id: '2',
                    key: 'api-test',
                    group: 'Input 2',
                    method: 'POST',
                    url: 'user-input-2',
                    status: 200,
                    response: { body: parsedJson2 },
                    timestamp: new Date().toISOString(),
                },
            ];

            setCompareData(testData);
            setError('');
        } catch (err) {
            setError('Invalid JSON format. Please check your input.');
        }
    };

    return (
        <>
            <Modal
                title="Nhập JSON để so sánh"
                onClose={() => {
                    setJson1('');
                    setJson2('');
                    setError('');
                    onClose()
                }}
                footer={
                    <>
                        <ActionButton
                            text="So sánh"
                            onClick={handleCompare}
                            bgColor="bg-blue-500"
                            hoverColor="hover:bg-blue-600"
                        />
                    </>
                }
            >
                <div className="space-y-4">
                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            JSON Input 1
                        </label>
                        <textarea
                            className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={json1}
                            onChange={(e) => setJson1(e.target.value)}
                            placeholder='Enter JSON here (e.g., {"key": "value"})'
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            JSON Input 2
                        </label>
                        <textarea
                            className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={json2}
                            onChange={(e) => setJson2(e.target.value)}
                            placeholder='Enter JSON here (e.g., {"key": "value"})'
                        />
                    </div>
                </div>
            </Modal>
            {compareData && (
                <CompareModal
                    tests={compareData}
                    onClose={() => setCompareData(null)}
                />
            )}
        </>
    );
};

export default ApiInputModal;