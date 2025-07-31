// components/TokenInput.tsx

import { Form, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';

const TokenInput = ({ token, onSaveToken }: { token: string; onSaveToken: (val: string) => void }) => {
    const [inputValue, setInputValue] = useState(token);

    useEffect(() => {
        setInputValue(token);
    }, [token]);

    const handleSave = () => {
        onSaveToken(inputValue)
    };

    return (
        <div className="px-4 my-2">
            <Form.Group className="mb-3" controlId="tokenInput">
                <Form.Label className="text-sm fw-bold">
                    Authorization Bearer Token (Override)
                </Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Nhập token để override Authorization header"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="rounded-2"
                />
            </Form.Group>
            <Button variant="primary" onClick={handleSave}>
                <i className="bi bi-save me-1"></i> Lưu Token
            </Button>
        </div>
    );
};

export default TokenInput;
