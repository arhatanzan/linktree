import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup } from 'react-bootstrap';
import ThemeEditor from './ThemeEditor';

const SectionEditor = ({ 
    sectionKey, 
    index, 
    data, 
    isGlobalList, 
    activePageId, 
    availablePages, // New prop
    isReadOnly = false, // New prop for global sections in page view
    onUpdate, 
    onMove, 
    onMoveToGlobal, 
    onMoveToLocal, 
    onDelete,
    onToggleDivider,
    startColorIndex = 0,
    theme = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (data.openAllSections !== undefined) {
            setIsOpen(data.openAllSections);
        }
    }, [data.openAllSections]);

    const buttonColors = theme.buttonColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];

    // Determine Title and Type
    let title = 'Unknown Section';
    let type = 'custom';
    let isInherited = false;

    const staticSections = {
        profile: 'Profile',
        connectLinks: 'Footer (Icons & Text)',
        footer: 'Footer (Legacy)',
        theme: 'Theme Settings'
    };

    // Allow overriding title for static sections if it exists in data
    if (data[sectionKey]?.title) {
        title = data[sectionKey].title;
        type = staticSections[sectionKey] ? 'static' : 'custom';
    } else if (staticSections[sectionKey]) {
        title = staticSections[sectionKey];
        type = 'static';
    } else if (data[sectionKey]) {
        title = data[sectionKey].title || 'Custom Section';
        type = 'custom';
    } else if (activePageId) {
        // Inherited
        title = 'Inherited Section'; 
        isInherited = true;
    }

    const settings = (data.sectionSettings && data.sectionSettings[sectionKey]) || {};
    const showDividerTop = settings.dividerTop ?? (index > 0 && sectionKey !== 'footer');
    const showDividerBottom = settings.dividerBottom ?? false;

    const renderListEditor = (key, items, isConnect = false) => {
        return (
            <div>
                {items.map((item, idx) => (
                    <div key={idx} className="item-card">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-light text-dark border">Item #{idx + 1}</span>
                            <Button variant="outline-danger" size="sm" className="btn-icon border-0" onClick={() => {
                                const newItems = [...items];
                                newItems.splice(idx, 1);
                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                            }} title="Remove Item">
                                <i className="fas fa-trash-alt"></i>
                            </Button>
                        </div>
                        <div className="row g-3">
                            {isConnect ? (
                                <div className="col-12">
                                    <Form.Label>Icon Class</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><i className={item.icon || 'fas fa-question'}></i></InputGroup.Text>
                                        <Form.Control 
                                            value={item.icon || ''} 
                                            placeholder="fab fa-instagram"
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, icon: e.target.value };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        FontAwesome class (e.g. <code>fab fa-instagram</code>)
                                    </Form.Text>
                                </div>
                            ) : (
                                <>
                                    <div className="col-md-6">
                                        <Form.Label>Title</Form.Label>
                                        <Form.Control 
                                            value={item.title || ''} 
                                            placeholder="Item Title"
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, title: e.target.value };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Label>Sub-Title</Form.Label>
                                        <Form.Control 
                                            value={item.subtitle || ''} 
                                            placeholder="Item Sub-Title"
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, subtitle: e.target.value };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={2}
                                            value={item.description || ''} 
                                            placeholder="Description text..."
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, description: e.target.value };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Label>Button Text</Form.Label>
                                        <Form.Control 
                                            value={item.text || ''} 
                                            placeholder="Click Here"
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, text: e.target.value };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            <div className={isConnect ? "col-md-12" : "col-md-6"}>
                                <Form.Label>URL</Form.Label>
                                <InputGroup>
                                    <Form.Control 
                                        value={item.url || ''} 
                                        placeholder="https://..."
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[idx] = { ...item, url: e.target.value };
                                            onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                        }}
                                    />
                                    <Form.Select 
                                        style={{ maxWidth: '120px' }}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, url: `/${e.target.value}` };
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">Link to...</option>
                                        {(availablePages || []).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </Form.Select>
                                </InputGroup>
                            </div>

                            <div className="col-md-6">
                                <Form.Label>Custom Color</Form.Label>
                                <div className="d-flex gap-2 align-items-center">
                                    <Form.Control 
                                        type="color"
                                        value={item.customColor || '#000000'} 
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[idx] = { ...item, customColor: e.target.value };
                                            onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                        }}
                                        className="form-control-color w-100"
                                        title="Pick a custom color"
                                    />
                                    
                                    {!isConnect && (
                                        <div 
                                            title={`Default Cyclic Color: ${buttonColors[(startColorIndex + idx) % buttonColors.length]}`}
                                            style={{
                                                width: '38px', 
                                                height: '38px', 
                                                backgroundColor: buttonColors[(startColorIndex + idx) % buttonColors.length], 
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                cursor: 'help',
                                                flexShrink: 0
                                            }}
                                        ></div>
                                    )}

                                    {isConnect && (
                                        <div 
                                            title="Icon Preview"
                                            className="d-flex align-items-center justify-content-center border rounded bg-light"
                                            style={{
                                                width: '38px', 
                                                height: '38px', 
                                                color: item.customColor || '#023e62',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            <i className={item.icon || 'fas fa-question'}></i>
                                        </div>
                                    )}

                                    {item.customColor && (
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={() => {
                                                const newItems = [...items];
                                                const { customColor, ...rest } = item;
                                                newItems[idx] = rest;
                                                onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                                            }}
                                            title="Clear Custom Color"
                                        >
                                            <i className="fas fa-times"></i>
                                        </Button>
                                    )}
                                </div>
                                {!isConnect && (
                                    <Form.Text className="text-muted" style={{fontSize: '0.75rem'}}>
                                        Right box shows the default cyclic color.
                                    </Form.Text>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <Button variant="outline-primary" className="w-100 py-2 border-dashed" onClick={() => {
                    const newItems = [...items];
                    if (isConnect) {
                        newItems.push({ icon: 'fab fa-instagram', url: '#' });
                    } else {
                        newItems.push({ title: 'New Item', url: '#' });
                    }
                    onUpdate(key, Array.isArray(data[key]) ? newItems : { ...data[key], links: newItems });
                }}>
                    <i className="fas fa-plus me-2"></i> Add Item
                </Button>
            </div>
        );
    };

    const renderContent = () => {
        if (sectionKey === 'theme') {
            return <ThemeEditor theme={data.theme || {}} onUpdate={(newTheme) => onUpdate('theme', newTheme)} />;
        }

        if (sectionKey === 'connectLinks') {
            const footer = data.connectLinks || {};
            return (
                <div>
                    <div className="mb-4">
                        <h6 className="text-muted mb-3">Social Icons</h6>
                        {renderListEditor('connectLinks', footer.links || [], true)}
                    </div>
                    <hr />
                    <Form.Label>Footer Text</Form.Label>
                    <Form.Control
                        value={data.footer || ''}
                        onChange={(e) => onUpdate('footer', e.target.value)}
                        placeholder="Copyright text or similar..."
                    />
                </div>
            );
        }
        
        // Generic List Editor
        const items = data[sectionKey]?.links || data[sectionKey] || [];
        if (Array.isArray(items)) {
            return (
                <div>
                    <div className="mb-3">
                        <Form.Label>Section Title (Display Name)</Form.Label>
                        <Form.Control 
                            value={data[sectionKey]?.title || ''} 
                            placeholder="Enter section title..."
                            onChange={(e) => {
                                const currentData = data[sectionKey];
                                const newData = Array.isArray(currentData) 
                                    ? { links: currentData, title: e.target.value }
                                    : { ...currentData, title: e.target.value };
                                onUpdate(sectionKey, newData);
                            }}
                        />
                        <hr className="my-3" />
                    </div>
                    {renderListEditor(sectionKey, items, sectionKey === 'connectLinks')}
                </div>
            );
        }
        
        // Profile Editor
        if (sectionKey === 'profile') {
            const profile = data.profile || {};
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                            value={profile.name || ''} 
                            onChange={(e) => onUpdate('profile', { ...profile, name: e.target.value })} 
                        />
                    </div>
                    <div className="col-md-6">
                        <Form.Label>Subtitle</Form.Label>
                        <Form.Control 
                            value={profile.subtitle || ''} 
                            onChange={(e) => onUpdate('profile', { ...profile, subtitle: e.target.value })} 
                        />
                    </div>
                    <div className="col-12">
                        <Form.Label>Image URL</Form.Label>
                        <Form.Control 
                            value={profile.image || ''} 
                            onChange={(e) => onUpdate('profile', { ...profile, image: e.target.value })} 
                        />
                    </div>
                </div>
            );
        }

        // Legacy Footer Editor (Hidden/Deprecated)
        if (sectionKey === 'footer') {
             return <div>Footer settings have been moved to &apos;Connect Icons&apos;.</div>;
        }

        return <div>Unknown Section Type</div>;
    };

    return (
        <div className="section-card" id={`section-${sectionKey}`}>
            <div className={`section-header ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                    <h2 className="m-0 fs-5">
                        {title} 
                        <span className="badge bg-secondary ms-2" style={{fontSize: '0.6em'}}>
                            {isGlobalList ? 'Global' : (type === 'custom' ? (isInherited ? 'Global' : 'Custom') : 'Static')}
                        </span>
                        {isReadOnly && <span className="badge bg-info ms-1" style={{fontSize: '0.6em'}}>Read Only</span>}
                    </h2>
                    {!isGlobalList && (
                        <div className="d-flex gap-1 ms-auto me-3" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={() => onMove(index, -1)} disabled={index === 0}>
                                <i className="fas fa-arrow-up"></i>
                            </Button>
                            <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={() => onMove(index, 1)} disabled={false}> {/* Need to pass total length to disable down */}
                                <i className="fas fa-arrow-down"></i>
                            </Button>
                        </div>
                    )}
                </div>
                <i className={`fas fa-chevron-down toggle-icon ${isOpen ? 'rotate-180' : ''}`}></i>
            </div>
            {isOpen && (
                <div className="section-content">
                    {isReadOnly && (
                        <div className="alert alert-info mb-3">
                            <i className="fas fa-info-circle me-2"></i>
                            This is a global section. You can reorder it here, but content must be edited in <strong>Global Settings</strong>.
                        </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <div className="d-flex gap-4">
                            <Form.Check 
                                type="switch"
                                id={`divider-top-${sectionKey}`}
                                label="Divider Top"
                                checked={showDividerTop}
                                onChange={(e) => onToggleDivider(sectionKey, 'top', e.target.checked)}
                                disabled={isReadOnly}
                            />
                            <Form.Check 
                                type="switch"
                                id={`divider-bottom-${sectionKey}`}
                                label="Divider Bottom"
                                checked={showDividerBottom}
                                onChange={(e) => onToggleDivider(sectionKey, 'bottom', e.target.checked)}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="d-flex gap-2">
                            {!activePageId && isGlobalList && sectionKey !== 'theme' && (
                                <Button variant="warning" size="sm" onClick={() => onMoveToLocal(sectionKey)}>Move to Page Specific</Button>
                            )}
                            {sectionKey !== 'connectLinks' && ((!activePageId && !isGlobalList && !isReadOnly) || (activePageId && !isInherited && !isReadOnly)) ? (
                                <Button variant="info" size="sm" className="text-white" onClick={() => onMoveToGlobal(sectionKey)}>Move to Global Defaults</Button>
                            ) : null}
                            {!isGlobalList && !isInherited && sectionKey !== 'theme' && sectionKey !== 'connectLinks' && !isReadOnly && (
                                <Button variant="danger" size="sm" onClick={() => onDelete(sectionKey)}>Delete</Button>
                            )}
                        </div>
                    </div>
                    <div style={isReadOnly ? {pointerEvents: 'none', opacity: 0.6} : {}}>
                        {renderContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionEditor;
