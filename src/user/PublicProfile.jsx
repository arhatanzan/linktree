import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { loadTenantData } from '../tenantData'
import './styles/user.css'
import Header from './components/Header'
import Profile from './components/Profile'
import LinkSection from './components/LinkSection'
import ColoredDivider from './components/ColoredDivider'
import Footer from './components/Footer'
import NotFound from '../NotFound'

const EMPTY_THEME = {}

function PublicProfile() {
  const [searchParams] = useSearchParams();
  const { pageId: paramPageId } = useParams();
  const pageId = paramPageId || searchParams.get('page');
  
    const [activeData, setActiveData] = useState(null);
  const [isSubPage, setIsSubPage] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTenantData().then(siteData => {
      if (cancelled) return;

      if (pageId && (!siteData.pages || !siteData.pages[pageId])) {
          setIsNotFound(true);
          return;
      }
      setIsNotFound(false);

      if (pageId && siteData.pages && siteData.pages[pageId]) {
          const pageData = siteData.pages[pageId];
        
        // 1. Prepare Base Data
        const newActiveData = {
            ...pageData,
            theme: pageData.theme || siteData.theme,
            profile: pageData.profile || siteData.profile,
            footer: (pageData.useGlobalFooter !== false) ? siteData.footer : pageData.footer,
        };

        // Footer data is global by default, with an opt-in page override.
        if (newActiveData.useGlobalFooter !== false) {
            newActiveData.connectLinks = siteData.connectLinks;
            newActiveData.footer = siteData.footer;
        }

        // 2. Handle Global Sections Data
        // Since global sections are now explicitly in the page's sectionOrder, we just need to ensure the data is present.
        // Fallback: If a global section is NOT in sectionOrder (legacy data), append it.
        let finalOrder = pageData.sectionOrder ? [...pageData.sectionOrder] : [];
        
        if (siteData.globalSections && siteData.globalSections.length > 0) {
             siteData.globalSections.forEach(key => {
                 if (key === 'theme') return;
                 
                 // Ensure data exists
                 if (!newActiveData[key]) {
                     newActiveData[key] = siteData[key];
                 }
                 
                 // Ensure it is in the order list
                 if (!finalOrder.includes(key)) {
                     // Insert before footer if possible
                     const footerIndex = finalOrder.indexOf('footer');
                     if (footerIndex !== -1) {
                         finalOrder.splice(footerIndex, 0, key);
                     } else {
                         finalOrder.push(key);
                     }
                 }
             });
        }
        
        newActiveData.sectionOrder = finalOrder;

        setActiveData(newActiveData);
        setIsSubPage(true);
            } else {
                    setActiveData(siteData);
                    setIsSubPage(false);
            }
        });

        return () => {
            cancelled = true;
        };
  }, [pageId]);

    const theme = activeData?.theme || EMPTY_THEME;
  
  // Apply theme variables
  useEffect(() => {
    const root = document.documentElement;
    const props = {
        '--bg-color': theme.backgroundColor,
        '--bg-image': theme.backgroundImage ? `url('${theme.backgroundImage}')` : null,
        '--text-color': theme.textColor,
        '--font-family': theme.fontFamily,
        '--font-size-base': theme.fontSize ? theme.fontSize + 'px' : null,
        '--section-spacing': theme.sectionSpacing ? theme.sectionSpacing + 'px' : null,
        '--text-spacing': theme.textSpacing ? theme.textSpacing + 'px' : null,
        '--btn-spacing': theme.btnSpacing ? theme.btnSpacing + 'px' : null,
        '--header-bg': theme.backgroundColor
    };

    for (const [key, value] of Object.entries(props)) {
        if (value) root.style.setProperty(key, value);
    }
    
    // Custom Font
    if (theme.customFontUrl) {
        let link = document.getElementById('custom-font-link');
        if (!link) {
            link = document.createElement('link');
            link.id = 'custom-font-link';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = theme.customFontUrl;
    }
  }, [theme]);

  // Apply button colors globally to match legacy behavior
  useEffect(() => {
      const buttons = document.querySelectorAll('.link-btn');
      const colors = theme.buttonColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];
      
      let colorIndex = 0;
      buttons.forEach((btn) => {
          if (btn.classList.contains('custom-color')) return;
          
          const color = colors[colorIndex % colors.length];
          btn.style.setProperty('--btn-color', color);
          colorIndex++;
      });
  }, [activeData, theme]);

  if (isNotFound) return <NotFound />;
  if (!activeData) return null;

  // Filter out profile and footer from the dynamic order list as they are fixed
    let order = (activeData.sectionOrder || []).filter(key => key !== 'profile' && key !== 'footer' && key !== 'connectLinks');
  
  // Handle Back Button for subpages
  if (isSubPage) {
      order = ['backButton', ...order];
  }

  const renderSection = (key, index) => {
      // Divider Logic
      const settings = (activeData.sectionSettings && activeData.sectionSettings[key]) || {};
      let showTop = settings.dividerTop;
      let showBottom = settings.dividerBottom;

      // Default divider logic: Show top divider for all sections except the first one
      if (typeof showTop === 'undefined') {
          showTop = index > 0;
      }
      if (typeof showBottom === 'undefined') showBottom = false;

      let content = null;
      
      switch(key) {
          case 'backButton':
              content = (
                 <div className="links" id="back-btn">
                    <Link to="/" className="link-btn" style={{maxWidth: '250px', '--btn-color': '#6c757d'}}>
                        <i className="fas fa-arrow-left me-2"></i> Back to Home
                    </Link>
                 </div>
              );
              break;
          default:
              if (activeData[key]) {
                  const section = activeData[key];
                  content = <LinkSection title={section.title} items={section.links || section} theme={theme} id={`section-${key}`} />;
              }
              break;
      }

      if (!content) return null;

      return (
          <React.Fragment key={key}>
              {showTop && <ColoredDivider />}
              {content}
              {showBottom && <ColoredDivider />}
          </React.Fragment>
      );
  };

  return (
    <>
      {/* Fixed Header (Profile) */}
      <Header profile={activeData.profile} />
      <Profile profile={activeData.profile} />
      
      <div id="site-container">
          {order.map((key, index) => renderSection(key, index))}
      </div>

      {/* Fixed Footer */}
      <ColoredDivider />
    <LinkSection items={activeData.connectLinks?.links || activeData.connectLinks} isConnect={true} theme={theme} id="connect-container" />
      <Footer text={activeData.footer} />
    </>
  )
}

export default PublicProfile
