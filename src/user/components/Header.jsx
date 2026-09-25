import React from 'react';

const Header = ({ profile }) => {
    if (!profile) return null;
    return (
        <header id="site-header" className="text-center">
            <h1 className="brand-name">{profile.name || ''}</h1>
            <p className="subtitle">{profile.subtitle || ''}</p>
        </header>
    );
};

export default Header;
