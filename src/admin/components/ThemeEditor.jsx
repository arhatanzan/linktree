import React from 'react';
import { Form, Row, Col, InputGroup, Button } from 'react-bootstrap';

const ThemeEditor = ({ theme, onUpdate }) => {
    const colors = theme.buttonColors || [];
    const currentFont = theme.fontFamily || "'Montserrat', sans-serif";
    const knownFonts = ["'Montserrat', sans-serif", "'Open Sans', sans-serif", "'Lato', sans-serif", "'Poppins', sans-serif", "'Roboto', sans-serif", "'Merriweather', serif", "'Playfair Display', serif", "'Lora', serif", "'Georgia', serif", "'Courier New', monospace"];
    const isCustom = !knownFonts.includes(currentFont);

    const handleUpdate = (key, value) => {
        onUpdate({ ...theme, [key]: value });
    };

    const handleColorUpdate = (index, value) => {
        const newColors = [...colors];
        newColors[index] = value;
        handleUpdate('buttonColors', newColors);
    };

    const handleRemoveColor = (index) => {
        const newColors = colors.filter((_, i) => i !== index);
        handleUpdate('buttonColors', newColors);
    };

    const handleAddColor = () => {
        handleUpdate('buttonColors', [...colors, '#000000']);
    };

    return (
        <div>
            <Row className="g-3 mb-3">
                <Col md={4}>
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control 
                        type="color" 
                        value={theme.backgroundColor || '#ffffff'} 
                        onChange={(e) => handleUpdate('backgroundColor', e.target.value)} 
                        className="w-100"
                    />
                </Col>
                <Col md={4}>
                    <Form.Label>Text Color</Form.Label>
                    <Form.Control 
                        type="color" 
                        value={theme.textColor || '#023e62'} 
                        onChange={(e) => handleUpdate('textColor', e.target.value)} 
                        className="w-100"
                    />
                </Col>
                <Col md={4}>
                    <Form.Label>Font Family</Form.Label>
                    <Form.Select 
                        value={isCustom ? 'custom' : currentFont} 
                        onChange={(e) => {
                            if (e.target.value !== 'custom') handleUpdate('fontFamily', e.target.value);
                        }}
                    >
                        <optgroup label="Sans-Serif (Modern)">
                            <option value="'Montserrat', sans-serif">Montserrat (Default)</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                        </optgroup>
                        <optgroup label="Serif (Classic)">
                            <option value="'Merriweather', serif">Merriweather</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Lora', serif">Lora</option>
                            <option value="'Georgia', serif">Georgia (System)</option>
                        </optgroup>
                        <optgroup label="Monospace (Code)">
                            <option value="'Courier New', monospace">Courier New</option>
                        </optgroup>
                        <option value="custom">Custom Font...</option>
                    </Form.Select>
                </Col>
                
                {isCustom && (
                    <Col xs={12}>
                        <div className="card card-body bg-light">
                            <Row className="g-2">
                                <Col md={6}>
                                    <Form.Label className="small">Custom Font Family (CSS)</Form.Label>
                                    <Form.Control 
                                        size="sm" 
                                        placeholder="e.g. 'My Font', sans-serif" 
                                        value={currentFont} 
                                        onChange={(e) => handleUpdate('fontFamily', e.target.value)} 
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="small">Custom Font URL (Google Fonts)</Form.Label>
                                    <Form.Control 
                                        size="sm" 
                                        placeholder="https://fonts.googleapis.com/css2?family=My+Font&display=swap" 
                                        value={theme.customFontUrl || ''} 
                                        onChange={(e) => handleUpdate('customFontUrl', e.target.value)} 
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Col>
                )}

                <Col xs={12}>
                    <Form.Label>Background Image URL (Optional)</Form.Label>
                    <Form.Control 
                        value={theme.backgroundImage || ''} 
                        placeholder="https://example.com/image.jpg" 
                        onChange={(e) => handleUpdate('backgroundImage', e.target.value)} 
                    />
                </Col>
            </Row>

            <h6 className="border-bottom pb-2 mb-3">Sizing & Spacing</h6>
            <Row className="g-3 mb-3">
                <Col md={3}>
                    <Form.Label>Base Font Size (px)</Form.Label>
                    <Form.Control type="number" value={theme.fontSize || 16} onChange={(e) => handleUpdate('fontSize', e.target.value)} />
                </Col>
                <Col md={3}>
                    <Form.Label>Section Spacing (px)</Form.Label>
                    <Form.Control type="number" value={theme.sectionSpacing || 30} onChange={(e) => handleUpdate('sectionSpacing', e.target.value)} />
                </Col>
                <Col md={3}>
                    <Form.Label>Text Spacing (px)</Form.Label>
                    <Form.Control type="number" value={theme.textSpacing || 15} onChange={(e) => handleUpdate('textSpacing', e.target.value)} />
                </Col>
                <Col md={3}>
                    <Form.Label>Button Spacing (px)</Form.Label>
                    <Form.Control type="number" value={theme.btnSpacing || 15} onChange={(e) => handleUpdate('btnSpacing', e.target.value)} />
                </Col>
            </Row>

            <h6 className="border-bottom pb-2 mb-3">Button Colors</h6>
            <div className="d-flex flex-wrap gap-2 mb-2">
                {colors.map((color, index) => (
                    <InputGroup size="sm" style={{ width: '120px' }} key={index}>
                        <Form.Control 
                            type="color" 
                            value={color} 
                            onChange={(e) => handleColorUpdate(index, e.target.value)} 
                            className="form-control-color border-end-0"
                        />
                        <Button variant="outline-danger" className="btn-icon border-start-0" onClick={() => handleRemoveColor(index)}>
                            <i className="fas fa-times"></i>
                        </Button>
                    </InputGroup>
                ))}
                <Button variant="outline-primary" size="sm" className="btn-icon px-3" onClick={handleAddColor}>
                    <i className="fas fa-plus"></i>
                </Button>
            </div>
        </div>
    );
};

export default ThemeEditor;
