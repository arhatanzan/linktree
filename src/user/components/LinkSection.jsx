import React from 'react';

const LinkSection = ({ title, items, isConnect = false, theme, id }) => {
    if (!items || items.length === 0) return null;

    const buttonColors = theme?.buttonColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];

    // Group items into blocks of "content" or "links"
    const blocks = [];
    let currentLinkBlock = [];

    items.forEach((item, index) => {
        const { title, subtitle, description } = item;
        const hasContent = title || subtitle || description;

        if (hasContent) {
            // Flush current link block if any
            if (currentLinkBlock.length > 0) {
                blocks.push({ type: 'links', items: currentLinkBlock });
                currentLinkBlock = [];
            }
            blocks.push({ type: 'content', item, index });
        } else {
            currentLinkBlock.push({ item, index });
        }
    });
    if (currentLinkBlock.length > 0) {
        blocks.push({ type: 'links', items: currentLinkBlock });
    }

    return (
        <div id={id} className="text-center">
            {title && <h2 className="section-title text-center">{title}</h2>}
            {blocks.map((block, blockIndex) => {
                if (block.type === 'links') {
                    const wrapperClass = isConnect ? 'social-icons d-flex justify-content-center' : 'links';
                    return (
                        <div key={blockIndex} className={wrapperClass}>
                            {block.items.map(({ item, index }) => {
                                const { text, url, icon, customColor } = item;
                                const btnStyle = customColor ? { '--btn-color': customColor } : {};
                                const btnClass = customColor ? 'link-btn custom-color' : 'link-btn';

                                if (icon) {
                                    const iconStyle = customColor ? { color: customColor } : {};
                                    return (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={iconStyle}>
                                            <i className={icon}></i>
                                        </a>
                                    );
                                } else if (text && url) {
                                    return (
                                        <a key={index} href={url} className={btnClass} style={btnStyle} target="_blank" rel="noopener noreferrer">
                                            {text}
                                        </a>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    );
                } else {
                    const { item, index } = block;
                    const { title, subtitle, description, text, url, customColor } = item;
                    const btnStyle = customColor ? { '--btn-color': customColor } : {};
                    const btnClass = customColor ? 'link-btn custom-color' : 'link-btn';

                    return (
                        <div key={blockIndex}>
                            <p className="text-content mx-auto">
                                {title && <strong>{title}</strong>}
                                {title && subtitle && ' | '}
                                {subtitle && <span className="hindi-text">{subtitle}</span>}
                                {(title || subtitle) && <br />}
                                {description}
                            </p>
                            {text && url && (
                                <div className="links">
                                    <a href={url} className={btnClass} style={btnStyle}>{text}</a>
                                </div>
                            )}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export default LinkSection;
