import { useState } from 'react';
import { Badge, Row, Col, Form } from 'react-bootstrap';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactJson from 'react-json-view';

export const TestHeader = ({ test, onToggleCollapse, isOpen, onToggleSelection, isSelected }) => {
    const getMethodColor = (method) => {
        switch (method.toLowerCase()) {
            case 'get':
                return 'success';
            case 'post':
                return 'warning-custom';
            case 'put':
                return 'primary';
            case 'delete':
                return 'danger';
            case 'patch':
                return 'info-custom';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 border-b rounded-xl">
            {/* Left section: checkbox + info */}
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelection(test.id);
                    }}
                    className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />

                {/* Info section */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge bg={getMethodColor(test.method)} className="text-uppercase px-2 py-1">
                            {test.method}
                        </Badge>
                        <span className="font-medium text-sm">Key: {test.key}</span>
                        <span className="text-muted text-sm">| Group: {test.group}</span>
                    </div>
                    <small className="text-muted truncate max-w-[360px] text-xs">{test.url}</small>
                </div>
            </div>

            {/* Right: Toggle button + Status */}
            <div className="flex items-center gap-3">
                <Badge
                    bg={
                        test.status === 'success'
                            ? 'success'
                            : test.status === 'error'
                                ? 'danger'
                                : test.status === 'processing'
                                    ? 'info'
                                    : 'secondary'
                    }
                    className="py-1 px-2 text-nowrap text-sm"
                >
                    {test.status === 'success' && (
                        <>
                            <i className="bi bi-check-circle me-1"></i> Thành công
                        </>
                    )}
                    {test.status === 'error' && (
                        <>
                            <i className="bi bi-x-circle me-1"></i> Lỗi
                        </>
                    )}
                    {test.status === 'processing' && (
                        <>
                            <i className="bi bi-arrow-repeat me-1 animate-spin-slow"></i> Đang xử lý
                        </>
                    )}
                    {test.status === 'pending' && (
                        <>
                            <i className="bi bi-clock me-1"></i> Chờ xử lý
                        </>
                    )}
                </Badge>

                {/* Toggle Collapse Button */}
                <button
                    onClick={() => onToggleCollapse(test.id)}
                    className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
            </div>
        </div>
    );
};


// Custom component for test details
export const TestDetails = ({ test }) => {
    const [viewMode, setViewMode] = useState<'json' | 'text'>('json');

    const Block = ({ label, children }) => (
        <div className="mb-3">
            <div className="text-uppercase fw-bold text-secondary small mb-1">{label}</div>
            <div className="bg-dark text-light p-3 rounded-3 border font-monospace text-break">
                {children}
            </div>
        </div>
    );

    const renderResponse = () => {

  
        if (test.response.error) {
            return <div className="text-danger text-start">{test.response.error}</div>;
        }

        const rawBody = test.response.body;
        let parsedJson = null;

        if (typeof rawBody === 'object') {
            parsedJson = rawBody;
        } else {
            try {
                parsedJson = JSON.parse(rawBody);
            } catch {
                parsedJson = null;
            }
        }

        return (
            <div className="bg-white border rounded p-3">
                {/* Toggle View */}
                <div className="d-flex gap-4 align-items-center mb-2">
                    <Form.Check
                        inline
                        label="JSON"
                        name="viewMode"
                        type="radio"
                        id={`json-radio-${test.id}`}
                        checked={viewMode === 'json'}
                        onChange={() => setViewMode('json')}
                    />
                    <Form.Check
                        inline
                        label="Text"
                        name="viewMode"
                        type="radio"
                        id={`text-radio-${test.id}`}
                        checked={viewMode === 'text'}
                        onChange={() => setViewMode('text')}
                    />
                </div>

                {/* Display content */}
                {viewMode === 'json' && parsedJson ? (
                    <div className="text-start overflow-auto max-h-[400px]">
                        <ReactJson
                            src={parsedJson}
                            name={false}
                            collapsed={2}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            style={{ fontSize: '0.85rem', minWidth: '100%' }} // tránh bị thu nhỏ bất thường
                        />
                    </div>
                ) : (
                    <pre className="mb-0 text-start text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
                        {typeof rawBody === 'string'
                            ? rawBody
                            : JSON.stringify(rawBody, null, 2)}
                    </pre>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 bg-body-tertiary border-top">
            <Row className="gy-3">
                <Col xs={6}>
                    <Block label="CURL Command">{test.curlRaw}</Block>
                </Col>

                <Col md={6}>
                    <Block label="Headers">{JSON.stringify(test.headers, null, 2)}</Block>
                </Col>

                {test.payload && (
                    <Col md={6}>
                        <Block label="Payload">{test.payload}</Block>
                    </Col>
                )}

                {test.response && (
                    <Col xs={12}>
                        <div className="mb-3">
                            <div className="text-uppercase fw-bold text-secondary small mb-1">Response</div>
                            {renderResponse()}
                        </div>
                    </Col>
                )}

                {test.diff && (
                    <Col xs={12}>
                        <Block label="Diff với test trước (cùng key)">{test.diff}</Block>
                    </Col>
                )}
            </Row>
        </div>
    );
};


const colorPalette = [
    'border-blue-500 bg-blue-50',
    'border-green-500 bg-green-50',
    'border-purple-500 bg-purple-50',
    'border-pink-500 bg-pink-50',
    'border-orange-500 bg-orange-50',
    'border-teal-500 bg-teal-50',
];

const keyColorMap = new Map();
let colorIndex = 0;

const getColorByKey = (key) => {
    if (!keyColorMap.has(key)) {
        keyColorMap.set(key, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
    }
    return keyColorMap.get(key);
};

// Custom component for a single test item
export const TestItem = ({ test, onToggleCollapse, isOpen, onToggleSelection, isSelected }) => {
    const colorClass = getColorByKey(test.key);

    return (
        <div
            key={test.id}
            className={`mb-2 p-0 shadow-xl border-2 ${colorClass} hover:shadow-md transition-shadow  rounded-xl`}
        >
            <TestHeader
                test={test}
                onToggleCollapse={onToggleCollapse}
                isOpen={isOpen}
                onToggleSelection={onToggleSelection}
                isSelected={isSelected}
            />
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'
                    }`}
            >
                <TestDetails test={test} />
            </div>
        </div>
    );
};