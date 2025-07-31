// components/CompareRow.tsx
import { parseResponseBody } from '../../lib/api';
import React, { useState } from 'react';
import ReactJson from 'react-json-view';

const CompareRow = ({ test, previousTest }: { test: any; previousTest?: any }) => {
    const rawBody = test.response?.body;
    const [showFull, setShowFull] = useState(false);
 
    if (!test || typeof test !== 'object') return null;

    let previewText = 'N/A';
    if (test.response?.error) {
        previewText = `❌ ${test.response.error}`;
    } else if (rawBody) {
        const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
        previewText = bodyStr.length > 100 && !showFull ? bodyStr.substring(0, 100) + '...' : bodyStr;
    }

    let textCompare: React.ReactNode = 'N/A';
    let keyCompare: React.ReactNode = 'N/A';
    let fieldDiff: React.ReactNode = 'N/A';

    if (
        previousTest &&
        test.response &&
        previousTest.response &&
        test.status === 'success' &&
        previousTest.status === 'success'
    ) {
        const prevText = previousTest.response.body;
        const currText = test.response.body;

        textCompare = prevText === currText ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ Giống nhau</span>
        ) : (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Khác nhau</span>
        );

        const prevParsed = parseResponseBody(prevText);
        const currParsed = parseResponseBody(currText);

        if (typeof prevParsed === 'object' && typeof currParsed === 'object' && prevParsed && currParsed) {
            const prevKeys = Object.keys(prevParsed);
            const currKeys = Object.keys(currParsed);

            const added = currKeys.filter(k => !prevKeys.includes(k));
            const removed = prevKeys.filter(k => !currKeys.includes(k));

            keyCompare = JSON.stringify(prevKeys.sort()) === JSON.stringify(currKeys.sort()) ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ Keys giống nhau</span>
            ) : (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Keys khác nhau</span>
            );

            fieldDiff = (
                <div className="text-sm text-yellow-800 space-y-1">
                    {added.length > 0 && <div><b>+ Thêm:</b> {added.join(', ')}</div>}
                    {removed.length > 0 && <div><b>- Thiếu:</b> {removed.join(', ')}</div>}
                    {added.length === 0 && removed.length === 0 && <div>Không có khác biệt về key</div>}
                </div>
            );
        } else {
            keyCompare = <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">❓ Không phải object</span>;
        }
    }

    return (
        <>
            <tr className="border-t align-top">
                <td className="p-2 font-bold whitespace-nowrap">{test.group}</td>
                <td className="p-2">
                    <span
                        className={`px-2 py-1 rounded text-white ${test.method.toLowerCase() === 'get'
                            ? 'bg-blue-500'
                            : test.method.toLowerCase() === 'post'
                                ? 'bg-green-500'
                                : 'bg-gray-500'
                            }`}
                    >
                        {test.method}
                    </span>
                </td>
                <td className="p-2 max-w-xs truncate" title={test.url}>{test.url}</td>
                <td className="p-2">
                    <span
                        className={`text-lg ${test.status === 'success'
                            ? 'text-green-500'
                            : test.status === 'error'
                                ? 'text-red-500'
                                : test.status === 'processing'
                                    ? 'text-blue-500'
                                    : 'text-yellow-500'
                            }`}
                    >
                        {test.status === 'success' && '✅'}
                        {test.status === 'error' && '❌'}
                        {test.status === 'processing' && '⏳'}
                        {test.status === 'pending' && '⏰'}
                    </span>{' '}
                    {test.status}
                </td>
                <td className="p-2 max-w-xs">
                    <div className="text-sm whitespace-pre-wrap">
                        {rawBody && typeof rawBody === 'object' && (
                            <div className="pt-1">
                                <button
                                    className="text-blue-600 text-sm hover:underline"
                                    onClick={() => setShowFull(!showFull)}
                                >
                                    {showFull ? 'Ẩn bớt' : 'Xem đầy đủ'}
                                </button>
                                <div className={`${showFull ? 'block' : 'hidden'} mt-2 border rounded bg-gray-50 p-2 text-xs`}>
                                    <ReactJson
                                        src={typeof rawBody === 'object' ? rawBody : parseResponseBody(rawBody)}
                                        name={false}
                                        collapsed={false}
                                        enableClipboard={true}
                                        displayDataTypes={false}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </td>
                <td className="p-2 text-sm whitespace-nowrap">{new Date(test.timestamp).toLocaleString('vi-VN')}</td>
                <td className="p-2">{textCompare}</td>
                <td className="p-2">{keyCompare}</td>
                <td className="p-2">{fieldDiff}</td>
            </tr>
        </>
    );
};

export default CompareRow;
