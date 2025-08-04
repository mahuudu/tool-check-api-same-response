import ReactJson from "react-json-view";
import ActionButton from "./ActionButton";
import Modal from "./Modal";
import { Col, Row } from "react-bootstrap";


const ResponseCompareItem = ({ test }) => {
    return (
        <div className="border rounded p-2 bg-gray-50 text-start">
            <div className="font-semibold mb-1 text-left">{test.group} - {test.method}</div>
            <ReactJson
                src={typeof test.response?.body === 'object' ? test.response.body : { raw: test.response?.body || 'N/A' }}
                name={false}
                collapsed={false}
                enableClipboard={true}
                displayDataTypes={false}
                style={{ fontSize: '0.85rem' }}
            />
        </div>
    );
};

const deepCompare = (base, current, path = '') => {
    const diffs : any = [];

    if (Array.isArray(base) && Array.isArray(current)) {
        const maxLength = Math.max(base.length, current.length);
        for (let i = 0; i < maxLength; i++) {
            const baseValue = i < base.length ? JSON.stringify(base[i]) : '<missing>';
            const currentValue = i < current.length ? JSON.stringify(current[i]) : '<missing>';
            if (baseValue !== currentValue) {
                diffs.push({
                    key: `${path}[${i}]`,
                    baseValue,
                    currentValue,
                });
            }
        }
    } else if (typeof base === 'object' && typeof current === 'object' && base !== null && current !== null) {
        const allKeys = [...new Set([...Object.keys(base), ...Object.keys(current)])];
        allKeys.forEach((key) => {
            const newPath = path ? `${path}.${key}` : key;
            const baseValue = base[key] !== undefined ? base[key] : '<missing>';
            const currentValue = current[key] !== undefined ? current[key] : '<missing>';
            if (typeof baseValue === 'object' && typeof currentValue === 'object') {
                diffs.push(...deepCompare(baseValue, currentValue, newPath));
            } else if (JSON.stringify(baseValue) !== JSON.stringify(currentValue)) {
                diffs.push({
                    key: newPath,
                    baseValue: JSON.stringify(baseValue),
                    currentValue: JSON.stringify(currentValue),
                });
            }
        });
    }

    return diffs;
};

const getKeysDeep = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return new Set();
    const keys = new Set();
    Object.keys(obj).forEach((key) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        keys.add(newKey);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedKeys = getKeysDeep(obj[key], newKey);
            nestedKeys.forEach((nestedKey) => keys.add(nestedKey));
        }
    });
    return keys;
};

const KeyDiffSummary = ({ tests }) => {
    if (tests.length < 2) return null;

    const allKeys = tests.map((t) => {
        const body = t.response?.body && typeof t.response.body === 'object' ? t.response.body : {};
        return getKeysDeep(body);
    });

    const base = allKeys[0];
    const added = new Set();
    const removed = new Set();

    for (let i = 1; i < allKeys.length; i++) {
        for (let key of allKeys[i]) {
            if (!base.has(key)) added.add(key);
        }
        for (let key of base) {
            if (!allKeys[i].has(key)) removed.add(key);
        }
    }

    return (
        <div className="border rounded p-3 bg-yellow-50 mb-3 text-sm">
            <div className="font-semibold mb-2">🔍 So sánh keys giữa các response:</div>
            {added.size > 0 && (
                <div>
                    <b>+ Thêm:</b> {[...added].sort().join(', ')}
                </div>
            )}
            {removed.size > 0 && (
                <div>
                    <b>- Thiếu:</b> {[...removed].sort().join(', ')}
                </div>
            )}
            {added.size === 0 && removed.size === 0 && (
                <div>✅ Tất cả response có cùng keys.</div>
            )}
        </div>
    );
};

const TextDiffSummary = ({ tests }) => {
    if (tests.length < 2) return null;

    const base = tests[0].response?.body?.data || {};
    const truncateValue = (value, maxLength = 50) => {
        if (!value || value === '<empty>' || value === '<missing>') return value;
        return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    };

    const diffs = tests.slice(1).map((t, i) => {
        const current = t.response?.body?.data || {};
        const lineDiffs = deepCompare(base, current);

        return (
            <div key={i} className="mb-4">
                <div className="font-semibold text-gray-800 mb-2">
                    🧾 So sánh với Test #{i + 1}:
                </div>
                {lineDiffs.length > 0 ? (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="py-2 px-4 text-left w-48">Key</th>
                                <th className="py-2 px-4 text-left">Base (Test #1)</th>
                                <th className="py-2 px-4 text-left">Test #{i + 1}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineDiffs.map((diff, j) => (
                                <tr
                                    key={j}
                                    className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                    <td className="py-2 px-4 font-semibold text-blue-600 w-48">
                                        {diff.key}
                                    </td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-red-600 font-mono">−</span>
                                            <pre className="text-red-600 bg-red-50 p-1 rounded flex-1 text-left">
                                                {truncateValue(diff.baseValue)}
                                                {diff.baseValue.length > 50 && (
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                                        onClick={() => alert(diff.baseValue)}
                                                    >
                                                        Xem thêm
                                                    </button>
                                                )}
                                            </pre>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-green-600 font-mono">+</span>
                                            <pre className="text-green-600 bg-green-50 p-1 rounded flex-1 text-left">
                                                {truncateValue(diff.currentValue)}
                                                {diff.currentValue.length > 50 && (
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                                        onClick={() => alert(diff.currentValue)}
                                                    >
                                                        Xem thêm
                                                    </button>
                                                )}
                                            </pre>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-green-600">🧾 Không có khác biệt với #{i + 1}</div>
                )}
            </div>
        );
    });

    return (
        <div className="border rounded-lg p-4 bg-blue-50 mb-4 text-sm">
            <div className="font-semibold text-gray-800 mb-3">
                🧬 So sánh nội dung text giữa các response:
            </div>
            {diffs}
        </div>
    );
};

export default function ResponseCompare({ detailCompareData, setDetailCompareData }) {

    return (
        <>
            {detailCompareData && (
                <Modal
                    title="So sánh chi tiết các response"
                    onClose={() => setDetailCompareData(null)}
                    footer={<ActionButton text="Đóng" onClick={() => setDetailCompareData(null)} bgColor="bg-gray-500" hoverColor="hover:bg-gray-600" />}
                >
                    <KeyDiffSummary tests={detailCompareData} />
                    <TextDiffSummary tests={detailCompareData} />
                    <Row className="g-3">
                        {detailCompareData.map((t, idx) => (
                            <Col key={t.id || idx} xs={12} md={6}>
                                <ResponseCompareItem test={t} />
                            </Col>
                        ))}
                    </Row>
                </Modal>
            )}
        </>
    )
}