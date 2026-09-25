import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import './styles/admin.css';
import { loadTenantData } from '../tenantData';
import SectionEditor from './components/SectionEditor';

const AdminPanel = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Data State
    const [currentData, setCurrentData] = useState(null);
    const [activeView, setActiveView] = useState('home'); // 'home', general-* setting, or pageId
    const [hasChanges, setHasChanges] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Modal States
    const [showAddPageModal, setShowAddPageModal] = useState(false);
    const [newPageId, setNewPageId] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [commitMessage, setCommitMessage] = useState('Update site data via Admin Panel');
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [isAddingGlobalSection, setIsAddingGlobalSection] = useState(false);

    // Load Config & Check Session
    useEffect(() => {
        // Add admin-body class to body for styling
        document.body.classList.add('admin-body');
        
        const performLogout = () => {
            localStorage.removeItem('adminPassword');
            localStorage.removeItem('lastActiveTime');
            localStorage.removeItem('sessionTimeout');
            setIsAuthenticated(false);
            setCurrentData(null);
        };

        const verifySession = async () => {
            const storedAuth = localStorage.getItem('adminPassword');
            const lastActive = localStorage.getItem('lastActiveTime');
            const timeout = parseInt(localStorage.getItem('sessionTimeout')) || 30;

            if (storedAuth) {
                // Check timeout locally first
                if (lastActive && (Date.now() - parseInt(lastActive) > timeout * 60 * 1000)) {
                    console.log("Session timed out locally");
                    performLogout();
                    return;
                }

                try {
                                        const endpoint = '/.netlify/functions/login';
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: storedAuth })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        setIsAuthenticated(true);
                        // Update session info
                        localStorage.setItem('lastActiveTime', Date.now());
                        if (data.timeout) localStorage.setItem('sessionTimeout', data.timeout);
                        await initData();
                    } else {
                        // Invalid session
                        performLogout();
                    }
                } catch (e) {
                    console.error("Session verification failed", e);
                    setIsAuthenticated(false);
                }
            }
        };

        verifySession();

        // Handle cross-tab login/logout
        const handleStorageChange = (e) => {
            if (e.key === 'adminPassword') {
                if (e.newValue) {
                    verifySession(); 
                } else {
                    setIsAuthenticated(false);
                    setCurrentData(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            document.body.classList.remove('admin-body');
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Session Timeout & Activity Tracker
    useEffect(() => {
        if (!isAuthenticated) return;

        let lastWrite = Date.now();
        
        const updateActivity = () => {
            const now = Date.now();
            // Throttle updates to localStorage (max once per minute)
            if (now - lastWrite > 60000) { 
                localStorage.setItem('lastActiveTime', now);
                lastWrite = now;
            }
        };

        const checkTimeout = () => {
            const lastActive = localStorage.getItem('lastActiveTime');
            const timeout = parseInt(localStorage.getItem('sessionTimeout')) || 30;
            
            if (lastActive && (Date.now() - parseInt(lastActive) > timeout * 60 * 1000)) {
                console.log("Session timed out due to inactivity");
                handleLogout();
            }
        };

        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        
        const interval = setInterval(checkTimeout, 60000); // Check every minute

        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
            clearInterval(interval);
        };
    }, [isAuthenticated]);

    const initData = async () => {
        const initialSiteData = await loadTenantData();
        const data = JSON.parse(JSON.stringify(initialSiteData));
        if (!data.sectionOrder) data.sectionOrder = ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
        if (!data.globalSections) data.globalSections = ['theme', 'profile', 'connectLinks'];
        data.globalSections = [...new Set(['theme', 'profile', 'connectLinks', ...data.globalSections])];
        if (!data.sectionSettings) data.sectionSettings = {};
        if (!data.theme) data.theme = { buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'] };
        if (!data.pages) data.pages = {};
        if (!data.changelog) data.changelog = [];

        // Ensure all global sections are present in all pages' sectionOrder
        if (data.globalSections) {
            const globalKeys = data.globalSections.filter(k => k !== 'theme'); // Theme is not a visible section
            
            // 1. Check Home Page (sectionOrder)
            globalKeys.forEach(key => {
                if (!data.sectionOrder.includes(key)) {
                    // Insert before footer if possible
                    const footerIndex = data.sectionOrder.indexOf('footer');
                    if (footerIndex !== -1) {
                        data.sectionOrder.splice(footerIndex, 0, key);
                    } else {
                        data.sectionOrder.push(key);
                    }
                }
            });

            // 2. Check Subpages
            Object.keys(data.pages).forEach(pageId => {
                const page = data.pages[pageId];
                if (!page.sectionOrder) page.sectionOrder = [];
                
                globalKeys.forEach(key => {
                    if (!page.sectionOrder.includes(key)) {
                        const footerIndex = page.sectionOrder.indexOf('footer');
                        if (footerIndex !== -1) {
                            page.sectionOrder.splice(footerIndex, 0, key);
                        } else {
                            page.sectionOrder.push(key);
                        }
                    }
                });
            });
        }

        setCurrentData(data);
        setHasChanges(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
        try {
                        const endpoint = '/.netlify/functions/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                localStorage.setItem('adminPassword', password);
                localStorage.setItem('lastActiveTime', Date.now());
                if (data.timeout) localStorage.setItem('sessionTimeout', data.timeout);
                setIsAuthenticated(true);
                await initData();
            } else {
                throw new Error(data.message || 'Invalid password');
            }
        } catch (error) {
            setLoginError(error.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminPassword');
        localStorage.removeItem('lastActiveTime');
        localStorage.removeItem('sessionTimeout');
        setIsAuthenticated(false);
        setPassword('');
    };

    const handleSave = () => {
        setShowSaveModal(true);
    };

    const handleConfirmSave = async () => {
        setLoading(true);
        
        // Add changelog entry
        const now = new Date();
        const newEntry = {
            date: now.toLocaleDateString(),
            timestamp: now.toLocaleTimeString(),
            message: commitMessage
        };
        
        const dataToSave = { ...currentData };
        if (!dataToSave.changelog) dataToSave.changelog = [];
        dataToSave.changelog.unshift(newEntry);

        try {
                        const endpoint = '/.netlify/functions/save-data';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    password: localStorage.getItem('adminPassword'),
                    data: dataToSave, 
                    message: commitMessage 
                })
            });
            if (response.ok) {
                alert('Changes saved successfully!');
                setCurrentData(dataToSave);
                setHasChanges(false);
                setShowSaveModal(false);
            } else {
                const errText = await response.text();
                throw new Error(errText || 'Failed to save changes');
            }
        } catch (error) {
            alert(`Error saving changes: ${error.message}\n\nNote: If you are running on localhost, ensure you are using 'netlify dev' to enable backend functions.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePage = () => {
        if (!newPageId) return;
        const sanitized = newPageId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (currentData.pages[sanitized]) {
            alert("Page already exists");
            return;
        }
        const newData = {...currentData};
        newData.pages[sanitized] = {
            sectionOrder: (currentData.globalSections || []).filter((key) => key !== 'theme'),
            useGlobalFooter: true
        };
        setCurrentData(newData);
        setActiveView(sanitized);
        setHasChanges(true);
        setShowAddPageModal(false);
        setNewPageId('');
    };

    // Helper to get active data object (Home or Page)
    const getActiveData = () => {
        if (activeView.startsWith('general-') || activeView === 'changelog') return currentData;
        if (activeView === 'home') return currentData;
        return currentData.pages[activeView] || currentData;
    };

    const handleUpdateSection = (key, newData) => {
        const newCurrentData = { ...currentData };
        
        if (activeView.startsWith('general-')) {
             newCurrentData[key] = newData;
        } else if (activeView === 'home') {
            newCurrentData[key] = newData;
        } else {
            newCurrentData.pages[activeView][key] = newData;
        }
        
        setCurrentData(newCurrentData);
        setHasChanges(true);
    };

    const handleTogglePageFooter = (useGlobalFooter) => {
        const newCurrentData = { ...currentData };
        const page = { ...newCurrentData.pages[activeView], useGlobalFooter };

        if (!useGlobalFooter && !page.connectLinks) {
            page.connectLinks = JSON.parse(JSON.stringify(newCurrentData.connectLinks || { title: '', links: [] }));
            page.footer = newCurrentData.footer || '';
        }

        newCurrentData.pages[activeView] = page;
        setCurrentData(newCurrentData);
        setHasChanges(true);
    };

    const handleMoveSection = (index, direction, isGlobalList) => {
        const newCurrentData = { ...currentData };
        let list;
        
        if (isGlobalList) {
            list = newCurrentData.globalSections;
        } else if (activeView === 'home') {
            list = newCurrentData.sectionOrder;
        } else {
            list = newCurrentData.pages[activeView].sectionOrder;
        }
        
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < list.length) {
            // If moving global sections, also sync the master sectionOrder
            if (isGlobalList) {
                const key1 = list[index];
                const key2 = list[newIndex];
                const masterList = newCurrentData.sectionOrder;
                const idx1 = masterList.indexOf(key1);
                const idx2 = masterList.indexOf(key2);
                
                if (idx1 !== -1 && idx2 !== -1) {
                    [masterList[idx1], masterList[idx2]] = [masterList[idx2], masterList[idx1]];
                }
            }

            [list[index], list[newIndex]] = [list[newIndex], list[index]];
            setCurrentData(newCurrentData);
            setHasChanges(true);
        }
    };

    const handleMoveToGlobal = (key) => {
        const newCurrentData = { ...currentData };
        
        if (activeView === 'home') {
            // Home Page: Move to Global Defaults list
            if (!newCurrentData.globalSections) newCurrentData.globalSections = [];
            if (!newCurrentData.globalSections.includes(key)) {
                newCurrentData.globalSections.push(key);
                
                // Add to all other pages
                Object.keys(newCurrentData.pages || {}).forEach(pageId => {
                    const page = newCurrentData.pages[pageId];
                    if (!page.sectionOrder.includes(key)) {
                        page.sectionOrder.push(key);
                    }
                });

                setCurrentData(newCurrentData);
                setHasChanges(true);
            }
        } else if (activeView !== 'global') {
            // Sub Page: Move to Global (Copy and Delete Local)
            if (confirm(`Move section '${key}' to Global Defaults? It will be available to all pages.`)) {
                const pageData = newCurrentData.pages[activeView];
                // Copy data to global if not exists
                if (!newCurrentData[key] && pageData[key]) {
                    newCurrentData[key] = JSON.parse(JSON.stringify(pageData[key]));
                }
                
                // Remove from local data storage (but keep in order list for positioning)
                delete pageData[key];
                
                // Add to global list
                if (!newCurrentData.globalSections.includes(key)) {
                    newCurrentData.globalSections.push(key);
                }

                // Add to master sectionOrder (Home) if not present
                if (!newCurrentData.sectionOrder.includes(key)) {
                    newCurrentData.sectionOrder.push(key);
                }

                // Add to all OTHER pages
                Object.keys(newCurrentData.pages || {}).forEach(pageId => {
                    if (pageId === activeView) return; // Already here
                    const page = newCurrentData.pages[pageId];
                    if (!page.sectionOrder.includes(key)) {
                        page.sectionOrder.push(key);
                    }
                });
                
                setCurrentData(newCurrentData);
                setHasChanges(true);
            }
        }
    };

    const handleMoveToLocal = (key) => {
        if (activeView === 'home' || activeView.startsWith('general-')) {
            // Remove from Global Defaults list
            const newCurrentData = { ...currentData };
            if (newCurrentData.globalSections) {
                newCurrentData.globalSections = newCurrentData.globalSections.filter(k => k !== key);
                setCurrentData(newCurrentData);
                setHasChanges(true);
            }
        }
    };

    const handleDeleteSection = (key) => {
        if (!confirm('Delete this section?')) return;
        const newCurrentData = { ...currentData };
        const data = (activeView === 'home') ? newCurrentData : newCurrentData.pages[activeView];
        
        delete data[key];
        data.sectionOrder = data.sectionOrder.filter(k => k !== key);
        
        setCurrentData(newCurrentData);
        setHasChanges(true);
    };

    const handleToggleDivider = (key, type, value) => {
        const newCurrentData = { ...currentData };
        // For global view, we edit the root data directly, just like home view
        const data = (activeView === 'home' || activeView.startsWith('general-')) ? newCurrentData : newCurrentData.pages[activeView];
        
        if (!data.sectionSettings) data.sectionSettings = {};
        if (!data.sectionSettings[key]) data.sectionSettings[key] = {};
        
        if (type === 'top') data.sectionSettings[key].dividerTop = value;
        if (type === 'bottom') data.sectionSettings[key].dividerBottom = value;
        
        setCurrentData(newCurrentData);
        setHasChanges(true);
    };

    const handleAddSection = (isGlobal = false) => {
        setIsAddingGlobalSection(isGlobal);
        setNewSectionName('');
        setShowAddSectionModal(true);
    };

    const handleConfirmAddSection = () => {
        if (!newSectionName) return;
        
        const key = newSectionName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!key) return;

        const newCurrentData = { ...currentData };
        let targetData;
        let orderList;

        if (isAddingGlobalSection) {
            targetData = newCurrentData;
            if (!newCurrentData.globalSections) newCurrentData.globalSections = [];
            orderList = newCurrentData.globalSections;
        } else {
            targetData = (activeView === 'home') ? newCurrentData : newCurrentData.pages[activeView];
            if (!targetData.sectionOrder) targetData.sectionOrder = [];
            orderList = targetData.sectionOrder;
        }

        if (targetData[key]) {
            alert("Section already exists!");
            return;
        }

        // Prevent adding reserved global sections to pages
        if (!isAddingGlobalSection && (key === 'profile' || key === 'footer' || key === 'theme' || key === 'connectLinks')) {
            alert("This section name is reserved for global settings.");
            return;
        }

        // Add new section data
        targetData[key] = {
            title: newSectionName,
            links: []
        };
        
        // Add to order
        orderList.push(key);

        setCurrentData(newCurrentData);
        setHasChanges(true);
        setShowAddSectionModal(false);
    };

    const handleDiscard = () => {
        if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
            setActiveView('home');
              initData();
        }
    };

    const handleDeletePage = () => {
        if (activeView === 'home' || activeView.startsWith('general-')) return;
        if (!window.confirm(`Are you sure you want to delete the page "${activeView}"? This cannot be undone.`)) return;

        const newCurrentData = { ...currentData };
        delete newCurrentData.pages[activeView];
        
        setCurrentData(newCurrentData);
        setHasChanges(true);
        setActiveView('home');
    };

    const handleMenuClick = (view) => {
        setActiveView(view);
        setShowMobileSidebar(false);
    };

    if (!isAuthenticated) {
        return (
            <Modal show={true} backdrop="static" centered>
                <Modal.Header><Modal.Title>Admin Login</Modal.Title></Modal.Header>
                <Modal.Body>
                    {loginError && <Alert variant="danger">{loginError}</Alert>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading} className="w-100">{loading ? 'Verifying...' : 'Login'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        );
    }

    if (!currentData) return <div>Loading...</div>;

    const activeData = getActiveData();

    // Calculate button count for cyclic colors
    let globalButtonCount = 0;

    return (
        <div className="admin-dashboard">
            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)}></div>}

            {/* Sidebar */}
            <div className={`admin-sidebar ${showMobileSidebar ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>{currentData?.profile?.name || 'Linktree'}</h3>
                    <span className="badge bg-primary">Admin</span>
                </div>
                
                <div className="sidebar-menu">
                    <div className="menu-label">General</div>
                    <button className={`menu-item ${activeView === 'general-theme' ? 'active' : ''}`} onClick={() => handleMenuClick('general-theme')}>
                        <i className="fas fa-palette"></i> Theme Settings
                    </button>
                    <button className={`menu-item ${activeView === 'general-profile' ? 'active' : ''}`} onClick={() => handleMenuClick('general-profile')}>
                        <i className="fas fa-user"></i> Profile
                    </button>
                    <button className={`menu-item ${activeView === 'general-footer' ? 'active' : ''}`} onClick={() => handleMenuClick('general-footer')}>
                        <i className="fas fa-share-alt"></i> Footer
                    </button>

                    <div className="menu-label mt-4">Pages</div>
                    <button 
                        className={`menu-item ${activeView === 'home' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('home')}
                    >
                        <i className="fas fa-home"></i> Home Page
                    </button>
                    
                    {Object.keys(currentData.pages || {}).map(pageId => (
                        <button 
                            key={pageId}
                            className={`menu-item ${activeView === pageId ? 'active' : ''}`}
                            onClick={() => handleMenuClick(pageId)}
                        >
                            <i className="fas fa-file-alt"></i> {pageId}
                        </button>
                    ))}

                    <button className="menu-item add-page-btn" onClick={() => setShowAddPageModal(true)}>
                        <i className="fas fa-plus"></i> Add New Page
                    </button>

                    <div className="menu-label mt-4">System</div>
                    <button 
                        className={`menu-item ${activeView === 'changelog' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('changelog')}
                    >
                        <i className="fas fa-history"></i> Changelog
                    </button>
                </div>

                <div className="sidebar-footer">
                    <button className="btn-logout" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-content">
                {/* Top Bar */}
                <div className="top-bar">
                    <div className="breadcrumb">
                        <Button variant="link" className="d-md-none me-2 p-0 text-dark" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
                            <i className="fas fa-bars"></i>
                        </Button>
                        <span className="text-muted">Dashboard</span>
                        <i className="fas fa-chevron-right mx-2 text-muted" style={{fontSize: '0.8em'}}></i>
                        <span className="fw-bold text-dark">
                            {activeView === 'general-theme' ? 'Theme Settings' :
                                activeView === 'general-profile' ? 'Profile' :
                                activeView === 'general-footer' ? 'Footer' :
                                (activeView === 'home' ? 'Home Page' : activeView)}
                        </span>
                    </div>
                    <div className="actions d-flex gap-2">
                        {activeView !== 'home' && activeView !== 'global' && activeView !== 'changelog' && (
                            <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={handleDeletePage}
                                className="d-flex align-items-center me-2"
                            >
                                <i className="fas fa-trash-alt me-1"></i> Delete Page
                            </Button>
                        )}
                          <a href={activeView.startsWith('general-') || activeView === 'home' || activeView === 'changelog' ? '/' : `/${activeView}`} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                            <i className="fas fa-external-link-alt me-1"></i> View Site
                        </a>
                        {hasChanges && (
                            <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={handleDiscard}
                                className="d-flex align-items-center"
                            >
                                <i className="fas fa-undo me-1"></i> Discard
                            </Button>
                        )}
                        <Button 
                            variant={hasChanges ? "primary" : "secondary"} 
                            size="sm"
                            onClick={handleSave} 
                            disabled={!hasChanges}
                            className="save-btn d-flex align-items-center"
                        >
                            {hasChanges ? 'Save Changes' : 'Saved'}
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="editor-area">
                    {activeView === 'changelog' ? (
                        <div className="section-list">
                            <div className="bg-white p-5 rounded-4 shadow-sm border">
                                <h2 className="fw-bold text-dark mb-4">System Changelog</h2>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{width: '150px'}}>Date</th>
                                                <th style={{width: '150px'}}>Time</th>
                                                <th>Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(currentData.changelog || []).map((entry, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-bold text-muted">{entry.date}</td>
                                                    <td className="text-muted small">{entry.timestamp}</td>
                                                    <td>{entry.message}</td>
                                                </tr>
                                            ))}
                                            {(!currentData.changelog || currentData.changelog.length === 0) && (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-muted py-5">
                                                        <i className="fas fa-history fa-2x mb-3 opacity-50"></i>
                                                        <p className="mb-0">No changes recorded yet.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : activeView.startsWith('general-') ? (
                        <div className="section-list">
                            <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="fw-bold text-dark mb-1">General</h2>
                                        <p className="text-muted mb-0">Manage settings shared across your pages.</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button variant="light" className="border" onClick={() => setExpandAll(!expandAll)}>
                                            <i className={`fas fa-${expandAll ? 'compress' : 'expand'} me-2`}></i>
                                            {expandAll ? 'Collapse All' : 'Expand All'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {(activeView === 'general-theme' ? ['theme'] : activeView === 'general-profile' ? ['profile'] : ['connectLinks']).map((key, index) => {
                                // Calculate start index for colors
                                const currentStartIndex = globalButtonCount;
                                const sectionData = currentData[key];
                                const items = sectionData?.links || sectionData || [];
                                if (Array.isArray(items)) {
                                    globalButtonCount += items.length;
                                }

                                return (
                                    <SectionEditor 
                                        key={key}
                                        sectionKey={key}
                                        index={index}
                                        data={{...currentData, openAllSections: expandAll}}
                                        isGlobalList={true}
                                        activePageId={null}
                                        availablePages={['home', ...Object.keys(currentData.pages || {})]}
                                        onUpdate={(k, d) => handleUpdateSection(k, d)}
                                        onMove={(i, d) => handleMoveSection(i, d, true)}
                                        onMoveToLocal={handleMoveToLocal}
                                        onToggleDivider={handleToggleDivider}
                                        startColorIndex={currentStartIndex}
                                        theme={currentData.theme}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="section-list">
                            {/* Welcome / Stats Banner */}
                            <div className="bg-white p-4 rounded-4 shadow-sm mb-5 border">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="fw-bold text-dark mb-1">
                                            {activeView === 'home' ? 'Home Page' : activeView}
                                        </h2>
                                        <p className="text-muted mb-0">
                                            {activeView === 'home' ? `${activeData.sectionOrder?.length || 0} active sections` : 'Global sections are shown below and can be reordered for this page.'}
                                        </p>
                                    </div>
                                    {activeView !== 'home' && (
                                        <Form.Check
                                            type="switch"
                                            id="use-global-footer"
                                            label="Use global footer"
                                            checked={activeData.useGlobalFooter !== false}
                                            onChange={(e) => handleTogglePageFooter(e.target.checked)}
                                        />
                                    )}
                                    <div className="d-flex gap-2">
                                        <Button variant="light" className="border" onClick={() => setExpandAll(!expandAll)}>
                                            <i className={`fas fa-${expandAll ? 'compress' : 'expand'} me-2`}></i>
                                            {expandAll ? 'Collapse All' : 'Expand All'}
                                        </Button>
                                        <Button variant="primary" onClick={() => handleAddSection(false)} className="shadow-sm">
                                            <i className="fas fa-plus me-2"></i> Add Section
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {(activeData.sectionOrder || []).map((key, index) => {
                                // Skip connectLinks as it is now part of footer
                                if (key === 'connectLinks') return null;
                                // Theme is configuration, not a visible page section.
                                if (key === 'theme' || key === 'footer') return null;
                                
                                const isGlobal = currentData.globalSections && currentData.globalSections.includes(key);

                                // Calculate start index for colors
                                const currentStartIndex = globalButtonCount;
                                const sectionData = isGlobal ? currentData[key] : activeData[key];
                                const items = sectionData?.links || sectionData || [];
                                if (Array.isArray(items)) {
                                    globalButtonCount += items.length;
                                }

                                return (
                                    <SectionEditor 
                                        key={key}
                                        sectionKey={key}
                                        index={index}
                                        data={{...(isGlobal ? currentData : activeData), openAllSections: expandAll}}
                                        isGlobalList={false}
                                        isReadOnly={isGlobal}
                                        activePageId={activeView === 'home' ? null : activeView}
                                        availablePages={['home', ...Object.keys(currentData.pages || {})]}
                                        onUpdate={isGlobal ? undefined : handleUpdateSection}
                                        onMove={(i, d) => handleMoveSection(i, d, false)}
                                        onMoveToGlobal={isGlobal ? undefined : handleMoveToGlobal}
                                        onDelete={isGlobal ? undefined : handleDeleteSection}
                                        onToggleDivider={handleToggleDivider}
                                        startColorIndex={currentStartIndex}
                                        theme={activeData.theme}
                                    />
                                );
                            })}

                            {activeView !== 'home' && activeData.useGlobalFooter === false && (
                                <SectionEditor
                                    sectionKey="connectLinks"
                                    index={(activeData.sectionOrder || []).length}
                                    data={{...activeData, openAllSections: expandAll}}
                                    isGlobalList={false}
                                    activePageId={activeView}
                                    availablePages={['home', ...Object.keys(currentData.pages || {})]}
                                    onUpdate={handleUpdateSection}
                                    onMove={() => {}}
                                    onToggleDivider={handleToggleDivider}
                                    startColorIndex={globalButtonCount}
                                    theme={activeData.theme || currentData.theme}
                                />
                            )}
                            
                            {(!activeData.sectionOrder || activeData.sectionOrder.length === 0) && (
                                <div className="text-center py-5">
                                    <div className="bg-white p-5 rounded-4 border border-dashed d-inline-block">
                                        <i className="fas fa-layer-group fa-3x mb-3 text-primary opacity-50"></i>
                                        <h4 className="fw-bold text-dark">Start Building</h4>
                                        <p className="text-muted mb-4">This page is currently empty.</p>
                                        <Button variant="primary" size="lg" onClick={() => handleAddSection(false)}>
                                            Add Your First Section
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Page Modal */}
            <Modal show={showAddPageModal} onHide={() => setShowAddPageModal(false)} centered contentClassName="border-0 shadow-lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">Add New Page</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="text-uppercase text-muted small fw-bold">Page ID (URL Slug)</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. my-new-page" 
                            value={newPageId} 
                            onChange={(e) => setNewPageId(e.target.value)} 
                            autoFocus
                            className="form-control-lg"
                        />
                        <Form.Text className="text-muted">
                            This will create a new page at /{newPageId || '...'}
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowAddPageModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreatePage} disabled={!newPageId}>Create Page</Button>
                </Modal.Footer>
            </Modal>

            {/* Add Section Modal */}
            <Modal show={showAddSectionModal} onHide={() => setShowAddSectionModal(false)} centered contentClassName="border-0 shadow-lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">
                        {isAddingGlobalSection ? 'Add Global Section' : 'Add Page Section'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="text-uppercase text-muted small fw-bold">Section Name</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. My New Section" 
                            value={newSectionName} 
                            onChange={(e) => setNewSectionName(e.target.value)} 
                            autoFocus
                            className="form-control-lg"
                        />
                        <Form.Text className="text-muted">
                            This will be the internal ID and default title.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowAddSectionModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmAddSection} disabled={!newSectionName}>Add Section</Button>
                </Modal.Footer>
            </Modal>

            {/* Save Confirmation Modal */}
            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered contentClassName="border-0 shadow-lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">Save Changes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="mb-3 border-0 bg-info bg-opacity-10 text-info">
                        <i className="fas fa-info-circle me-2"></i>
                        This will update the live site immediately.
                    </Alert>
                    <Form.Group>
                        <Form.Label className="text-uppercase text-muted small fw-bold">Commit Message</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={commitMessage} 
                            onChange={(e) => setCommitMessage(e.target.value)} 
                            className="form-control-lg"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowSaveModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Confirm Save'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminPanel;
