import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, Plus, BarChart3, Download, Archive, Trash2, Check, X, Clock, RotateCw } from 'lucide-react';

const ApiTestSuite = () => {
    const [testData, setTestData] = useState([]);
    const [currentId, setCurrentId] = useState(1);
    const [groupName, setGroupName] = useState('API Test');
    const [keyName, setKeyName] = useState('');
    const [curlInput, setCurlInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showStorageModal, setShowStorageModal] = useState(false);
    const [expandedTests, setExpandedTests] = useState(new Set());

    // Utility functions
    const safeJsonParse = (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    };

    const deepCompare = (obj1, obj2) => {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return obj1 === obj2;
        if (typeof obj1 !== typeof obj2) return false;
        if (typeof obj1 !== "object") return obj1 === obj2;
        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;

        for (let key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!deepCompare(obj1[key], obj2[key])) return false;
        }
        return true;
    };

    const parseCurl = (curlCommand) => {
        let method = "GET";
        let url = "";
        let headers = {};
        let payload = "";

        try {
            const methodMatch = curlCommand.match(/--request\s+(\w+)/i);
            if (methodMatch) method = methodMatch[1].toUpperCase();

            const urlMatch = curlCommand.match(/(?:--url|--location(?:\s+--request\s+\w+)?)\s*['"]?(https?:\/\/[^\s'"]+)['"]?/i);
            if (urlMatch) url = urlMatch[1];

            const headerRegex = /--header\s+'([^:]+):\s*(.+?)'/g;
            let headerMatch;
            while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
                headers[headerMatch[1].trim()] = headerMatch[2].trim();
            }

            const payloadMatch = curlCommand.match(/--data(?:-raw)?\s+'([\s\S]+?)'/);
            if (payloadMatch) payload = payloadMatch[1];

            return { method, url, headers, payload };
        } catch (e) {
            throw new Error("Không thể parse CURL command: " + e.message);
        }
    };

    const makeApiCall = async (method, url, headers, payload) => {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        };

        if (["POST", "PUT", "PATCH"].includes(method) && payload) {
            options.body = payload;
        }

        const response = await fetch(url, options);
        const responseText = await response.text();

        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText,
            ok: response.ok,
        };
    };

    // Test management
    const addNewTest = () => {
        if (!curlInput.trim()) {
            alert("Vui lòng nhập CURL command!");
            return;
        }

        if (!keyName.trim()) {
            alert("Vui lòng nhập Key để so sánh!");
            return;
        }

        try {
            const parsed = parseCurl(curlInput);
            const test = {
                id: currentId,
                group: groupName || "Default",
                key: keyName,
                curlRaw: curlInput,
                method: parsed.method,
                url: parsed.url,
                headers: parsed.headers,
                payload: parsed.payload,
                response: null,
                status: "pending",
                diff: null,
                timestamp: new Date().toISOString(),
                selected: false,
            };

            setTestData(prev => [...prev, test]);
            setCurrentId(prev => prev + 1);
            setCurlInput('');
            setKeyName('');
        } catch (e) {
            alert("Lỗi parse CURL: " + e.message);
        }
    };

    const processTest = async (testId) => {
        setTestData(prev => prev.map(test =>
            test.id === testId ? { ...test, status: 'processing' } : test
        ));

        const test = testData.find(t => t.id === testId);
        if (!test) return;

        try {
            const response = await makeApiCall(test.method, test.url, test.headers, test.payload);

            // Calculate diff with previous test with same key
            const sameKeyTests = testData.filter(t => t.key === test.key && t.id < test.id && t.response);
            let diff = null;
            if (sameKeyTests.length > 0) {
                const prevTest = sameKeyTests[sameKeyTests.length - 1];
                const prevResponse = safeJsonParse(prevTest.response.body);
                const currentResponse = safeJsonParse(response.body);
                diff = deepCompare(prevResponse, currentResponse) ? "✅ No difference" : "⚠️ Different responses";
            }

            setTestData(prev => prev.map(t =>
                t.id === testId ? {
                    ...t,
                    response,
                    status: response.ok ? 'success' : 'error',
                    diff
                } : t
            ));
        } catch (e) {
            setTestData(prev => prev.map(t =>
                t.id === testId ? {
                    ...t,
                    response: { error: e.message },
                    status: 'error'
                } : t
            ));
        }
    };

    const processAllTests = async () => {
        const pendingTests = testData.filter(t => t.status === 'pending');
        if (pendingTests.length === 0) {
            alert("Không có test nào để xử lý!");
            return;
        }

        setIsProcessing(true);
        for (let i = 0; i < pendingTests.length; i++) {
            await processTest(pendingTests[i].id);
            setProgress(((i + 1) / pendingTests.length) * 100);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        setIsProcessing(false);
        setProgress(0);
    };

    const clearAllTests = () => {
        if (confirm("Bạn có chắc muốn xóa tất cả tests?")) {
            setTestData([]);
            setCurrentId(1);
        }
    };

    const toggleExpanded = (testId) => {
        setExpandedTests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testId)) {
                newSet.delete(testId);
            } else {
                newSet.add(testId);
            }
            return newSet;
        });
    };

    const exportToCSV = () => {
        if (testData.length === 0) {
            alert("Chưa có dữ liệu để export!");
            return;
        }

        const headers = ["Key", "Group", "Method", "URL", "Status", "Response", "Timestamp"];
        let csvContent = headers.join(",") + "\n";

        testData.forEach(test => {
            const row = [
                `"${test.key}"`,
                `"${test.group}"`,
                `"${test.method}"`,
                `"${test.url}"`,
                `"${test.status}"`,
                `"${test.response ? (test.response.error || JSON.stringify(test.response.body).replace(/"/g, '""')) : "N/A"}"`,
                `"${new Date(test.timestamp).toLocaleString("vi-VN")}"`,
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `api-test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Stats calculation
    const stats = {
        total: testData.length,
        success: testData.filter(t => t.status === 'success').length,
        error: testData.filter(t => t.status === 'error').length,
        pending: testData.filter(t => t.status === 'pending').length
    };

    // Components
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: 'Chờ xử lý' },
            processing: { icon: RotateCw, color: 'bg-blue-100 text-blue-800', text: 'Đang xử lý...' },
            success: { icon: Check, color: 'bg-green-100 text-green-800', text: 'Thành công' },
            error: { icon: X, color: 'bg-red-100 text-red-800', text: 'Lỗi' }
        };

        const config = statusConfig[status];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const MethodBadge = ({ method }) => {
        const colors = {
            GET: 'bg-green-500',
            POST: 'bg-blue-500',
            PUT: 'bg-orange-500',
            DELETE: 'bg-red-500'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${colors[method] || 'bg-gray-500'}`}>
                {method}
            </span>
        );
    };

    const TestItem = ({ test }) => {
        const isExpanded = expandedTests.has(test.id);

        return (
            <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 mb-4 overflow-hidden hover:shadow-lg transition-shadow">
                <div
                    className="p-4 cursor-pointer bg-gray-50 border-b"
                    onClick={() => toggleExpanded(test.id)}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <MethodBadge method={test.method} />
                            <span className="font-medium">{test.key} | {test.group}</span>
                            <span className="text-sm text-gray-500 truncate max-w-md">{test.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={test.status} />
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h6 className="font-semibold text-sm text-gray-600 uppercase">Key</h6>
                                <div className="p-3 bg-gray-100 rounded border text-sm font-mono">{test.key}</div>
                            </div>
                            <div className="space-y-2">
                                <h6 className="font-semibold text-sm text-gray-600 uppercase">Group</h6>
                                <div className="p-3 bg-gray-100 rounded border text-sm font-mono">{test.group}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h6 className="font-semibold text-sm text-gray-600 uppercase">CURL Command</h6>
                            <div className="p-3 bg-gray-100 rounded border text-sm font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                {test.curlRaw}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h6 className="font-semibold text-sm text-gray-600 uppercase">Headers</h6>
                                <div className="p-3 bg-gray-100 rounded border text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {JSON.stringify(test.headers, null, 2)}
                                </div>
                            </div>
                            {test.payload && (
                                <div className="space-y-2">
                                    <h6 className="font-semibold text-sm text-gray-600 uppercase">Payload</h6>
                                    <div className="p-3 bg-gray-100 rounded border text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {test.payload}
                                    </div>
                                </div>
                            )}
                        </div>

                        {test.response && (
                            <div className="space-y-2">
                                <h6 className="font-semibold text-sm text-gray-600 uppercase">Response</h6>
                                <div className="p-3 bg-gray-100 rounded border text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {test.response.error || JSON.stringify(test.response, null, 2)}
                                </div>
                            </div>
                        )}

                        {test.diff && (
                            <div className="space-y-2">
                                <h6 className="font-semibold text-sm text-gray-600 uppercase">Diff với test trước (cùng key)</h6>
                                <div className="p-3 bg-gray-100 rounded border text-sm font-mono">
                                    {test.diff}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800">
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">🚀 API Test Huyen Le</h1>
                            <img
                                src="https://cdn.airvoicewireless.com/default/1113303/hl.png"
                                alt="Logo"
                                className="w-20 h-20 mx-auto rounded-full border-4 border-white/20 object-contain bg-white/10"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-6 bg-gray-50 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input
                                type="text"
                                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tên nhóm test (VD: Login API)"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <input
                                type="text"
                                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Key để so sánh (VD: user-login)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                            />
                            <button
                                onClick={addNewTest}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm Test Mới
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={processAllTests}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Play className="w-4 h-4" />
                                {isProcessing ? 'Đang xử lý...' : 'Chạy Tất Cả'}
                            </button>
                            <button
                                onClick={() => setShowComparisonModal(true)}
                                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <BarChart3 className="w-4 h-4" />
                                So Sánh
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                onClick={() => setShowStorageModal(true)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Archive className="w-4 h-4" />
                                Lưu Trữ
                            </button>
                            <button
                                onClick={clearAllTests}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Xóa Tất Cả
                            </button>
                        </div>

                        <textarea
                            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="4"
                            placeholder="Paste CURL command ở đây...&#10;Ví dụ: curl --location --request GET 'https://api.example.com/users' --header 'Authorization: Bearer token123'"
                            value={curlInput}
                            onChange={(e) => setCurlInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.ctrlKey && e.key === 'Enter') {
                                    addNewTest();
                                }
                            }}
                        />
                    </div>

                    {/* Stats */}
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-lg p-4 text-center border">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total}</div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">Tổng Tests</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 text-center border">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.success}</div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">Thành Công</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 text-center border">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.error}</div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">Lỗi</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 text-center border">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">Chờ Xử Lý</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {progress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}

                        {/* Tests Container */}
                        <div>
                            {testData.length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl text-gray-500 mb-2">Chưa có test nào</h3>
                                    <p className="text-gray-400">Thêm CURL command đầu tiên để bắt đầu!</p>
                                </div>
                            ) : (
                                testData.map(test => <TestItem key={test.id} test={test} />)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiTestSuite;