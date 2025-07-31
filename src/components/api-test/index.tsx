import { useEffect, useState } from 'react';

import { Test, parseCurl, makeApiCall, diffTextDeep, generateUniqueKey } from '../../lib/api';
import StatsCard from './StatsCard';

import TestList from './TestList';
import { Tabs, Tab } from 'react-bootstrap';

import CompareModal from './CompareModal';
import DataManagementModal from './DataManagementModal';
import ControlPanel from './ControlPanel';
import ProgressBar from './ProgressBar';
import TokenInput from './TokenInput';


const App = () => {
    const [testData, setTestData] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [showDataModal, setShowDataModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [overrideToken, setOverrideToken] = useState('');

    const addNewTest = ({ groupName, keyName, curlCommand }: { groupName: string; keyName: string; curlCommand: string }) => {
        try {
            const parsed = parseCurl(curlCommand);
            const test: Test = {
                id: generateUniqueKey(),
                group: groupName.trim() || 'Default',
                key: keyName.trim(),
                curlRaw: curlCommand,
                method: parsed.method,
                url: parsed.url,
                headers: parsed.headers,
                payload: parsed.payload,
                response: null,
                status: 'pending',
                diff: null,
                timestamp: new Date().toISOString(),
                selected: false,
            };
            setTestData([...testData, test]);
        } catch (e) {
            alert('Lỗi parse CURL: ' + (e as Error).message);
        }
    };

    const processTest = async (testId: string) => {
        const test = testData.find((t) => t.id === testId);
        if (!test) return;

        const updatedTests = testData.map((t) =>
            t.id === testId ? { ...t, status: 'processing' as const } : t
        );
        setTestData(updatedTests);

        try {
            const response = await makeApiCall(test.method, test.url, test.headers, test.payload, overrideToken);
            const sameKeyTests = testData.filter((t) => t.key === test.key && t.timestamp < test.timestamp && t.response);
            const diff = sameKeyTests.length > 0
                ? diffTextDeep(sameKeyTests[sameKeyTests.length - 1].response!.body, response.body)
                : null;

            setTestData((prev) =>
                prev.map((t) =>
                    t.id === testId
                        ? { ...t, response, status: response.ok ? 'success' : 'error', diff }
                        : t
                )
            );
        } catch (e) {
            setTestData((prev) =>
                prev.map((t) =>
                    t.id === testId
                        ? { ...t, response: { status: 0, statusText: 'Error', headers: {}, body: '', ok: false, error: (e as Error).message }, status: 'error' }
                        : t
                )
            );
        }
    };

    const processTests = async (tests: Test[]) => {
        const total = tests.length;
        if (total === 0) return;

        setProgress(0);

        // Cập nhật status trước khi chạy
        setTestData((prev) =>
            prev.map((t) =>
                tests.find(test => test.id === t.id)
                    ? { ...t, status: 'processing' as const }
                    : t
            )
        );

        let completed = 0;

        await Promise.all(
            tests.map(async (test) => {
                await processTest(test.id);
                completed++;
                setProgress((completed / total) * 100);
            })
        );

        setProgress(0);
    };

    const processAllTests = async () => {
        if (testData.length === 0) {
            alert('Không có test nào để xử lý!');
            return;
        }

        setSelectedTests(testData.map((t) => t.id));
        await processTests(testData);
    };

    const processSelectedTests = async () => {
        const selected = testData.filter((t) => selectedTests.includes(t.id) && t.status === 'pending');
        if (selected.length === 0) {
            alert('Vui lòng chọn ít nhất một test để chạy!');
            return;
        }
        await processTests(selected);
    };

    const clearAllTests = () => {
        if (confirm('Bạn có chắc muốn xóa tất cả tests?')) {
            setTestData([]);
            setSelectedTests([]);
        }
    };

    const toggleTestSelection = (testId: string) => {
        setSelectedTests((prev) =>
            prev.includes(testId)
                ? prev.filter((id) => id !== testId)
                : [...prev, testId]
        );
    };


    const handleDeleteSelectedTests = () => {
        if (selectedTests.length === 0) {
            alert('Vui lòng chọn ít nhất một test để xóa!');
            return;
        }
        // Lọc ra các test còn lại sau khi xóa
        const updatedTests = testData.filter((t) => !selectedTests.includes(t.id));
        setTestData(updatedTests);
        setSelectedTests([]);
    };
    const loadStorageData = (data: Test[]) => {
        setTestData(data);
    };

    const stats = {
        total: testData.length,
        success: testData.filter((t) => t.status === 'success').length,
        error: testData.filter((t) => t.status === 'error').length,
        pending: testData.filter((t) => t.status === 'pending').length,
    };

    const handleSaveToken = (newToken: string) => {
        localStorage.setItem('overrideToken', newToken);
        setOverrideToken(newToken);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('overrideToken');
        if (storedToken) setOverrideToken(storedToken);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <ControlPanel
                onSelectRun={processSelectedTests}
                onRunAll={processAllTests}
                onCompare={() => testData.length ? setShowCompareModal(true) : alert('Chưa có test nào để so sánh!')}
                onExport={() => { alert('chức năng chưa có'); }}
                onManageData={() => setShowDataModal(true)}
                onClearAll={clearAllTests}
            />

            <div className="grid grid-cols-4 gap-4 p-4 bg-white">
                <StatsCard value={stats.total} label="Tổng Tests" />
                <StatsCard value={stats.success} label="Thành Công" />
                <StatsCard value={stats.error} label="Lỗi" />
                <StatsCard value={stats.pending} label="Chờ Xử Lý" />
            </div>

            <ProgressBar progress={progress} />

            <div className="p-4">
                <Tabs defaultActiveKey="tests" id="api-tabs" className="mb-3">
                    <Tab eventKey="tests" title="Curl" className='!p-0'>
                        <TestList
                            tests={testData}
                            selectedTests={selectedTests}
                            setSelectedTests={setSelectedTests}
                            onAddTest={addNewTest}
                            onToggleTestSelection={toggleTestSelection}
                            onDeleteTests={handleDeleteSelectedTests}
                        />
                    </Tab>
                    <Tab eventKey="token" title="Cấu hình Token">
                        <div className="pt-3">
                            <TokenInput token={overrideToken} onSaveToken={handleSaveToken} />
                        </div>
                    </Tab>
                </Tabs>
            </div>

            {showCompareModal && (
                <CompareModal tests={testData} onClose={() => setShowCompareModal(false)} />
            )}
            {showDataModal && (
                <DataManagementModal tests={testData} onLoadData={loadStorageData} onClose={() => setShowDataModal(false)} />
            )}
        </div>
    );
};

export default App;
