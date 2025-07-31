
import { useState } from 'react';
import { Button, Form, Card, Row, Col } from 'react-bootstrap';
import ActionButton from './ActionButton';
import { TestItem } from './TestItem';

const TestList = ({ tests = [], onAddTest, onDeleteTests, selectedTests, setSelectedTests }: any) => {
    const [groupName, setGroupName] = useState('');
    const [keyName, setKeyName] = useState('');
    const [curlCommand, setCurlCommand] = useState('');

    const [openItems, setOpenItems] = useState({});

    const handleAddTest = () => {
        if (!curlCommand.trim()) {
            alert('Vui lòng nhập CURL command!');
            return;
        }
        if (!keyName.trim()) {
            alert('Vui lòng nhập Key để so sánh!');
            return;
        }
        onAddTest({ groupName, keyName, curlCommand });
        setGroupName('');
        setKeyName('');
        setCurlCommand('');
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleAddTest();
        }
    };

    const toggleTestSelection = (testId) => {
        setSelectedTests((prev) =>
            prev.includes(testId)
                ? prev.filter((id) => id !== testId)
                : [...prev, testId]
        );
    };

    const handleDeleteSelected = () => {
        if (selectedTests.length === 0) {
            alert('Vui lòng chọn ít nhất một test để xóa!');
            return;
        }
        if (confirm('Bạn có chắc muốn xóa các tests đã chọn?')) {
            onDeleteTests(selectedTests);
        }
    };

    const toggleCollapse = (testId) => {
        setOpenItems((prev) => ({ ...prev, [testId]: !prev[testId] }));
    };

    return (
        <div className="">
            <Card className="mb-3 shadow-sm p-2">
                <Card.Body className="p-3">
                    <Form>
                        <Form.Group as={Row} className="mb-2">
                            <Col sm={6}>
                                <Form.Control
                                    type="text"
                                    size="lg"
                                    placeholder="Group name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="rounded-2"
                                />
                            </Col>
                            <Col sm={6}>
                                <Form.Control
                                    type="text"
                                    size="lg"
                                    placeholder="Key name"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    className="rounded-2"
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control
                                as="textarea"
                                rows={6}
                                size="lg"
                                placeholder="Paste your CURL command here"
                                value={curlCommand}
                                onChange={(e) => setCurlCommand(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="rounded-2 font-monospace"
                            />
                        </Form.Group>
                    </Form>
                    <div>
                        <ActionButton text="Thêm Test Mới" onClick={handleAddTest} />
                        <Button
                            variant="danger"
                            className="ms-2"
                            onClick={handleDeleteSelected}
                            disabled={selectedTests.length === 0}
                        >
                            <i className="bi bi-trash me-1"></i> Xóa Tests Đã Chọn
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {tests.length === 0 ? (
                <div className="text-center text-muted">
                    <i className="bi bi-clipboard-data" style={{ fontSize: '4rem' }}></i>
                    <h3 className="mt-3">Chưa có test nào</h3>
                    <p>Thêm CURL command đầu tiên để bắt đầu!</p>
                </div>
            ) : (
                <div>
                    {tests.map((test) => (
                        <TestItem
                            key={test.id}
                            test={test}
                            onToggleCollapse={toggleCollapse}
                            isOpen={openItems[test.id]}
                            onToggleSelection={toggleTestSelection}
                            isSelected={selectedTests.includes(test.id)}
                        />
                    ))}
                </div>
            )}

        </div>
    );
};

export default TestList;
