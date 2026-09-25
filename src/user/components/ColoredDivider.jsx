import React from 'react';

const ColoredDivider = () => {
    return (
        <div className="hr-container mx-auto">
            <div className="box">
                <div className="box-sm red"></div>
                <div className="box-sm orange"></div>
                <div className="box-sm yellow-bar"></div>
                <div className="box-sm green-bar"></div>
                <div className="box-sm blue-bar"></div>
                <div className="box-sm purple"></div>
            </div>
        </div>
    );
};

export default ColoredDivider;
