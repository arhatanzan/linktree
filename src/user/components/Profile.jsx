import React from 'react';

const Profile = ({ profile }) => {
    if (!profile || !profile.image) return null;
    return (
        <div className="profile-container text-center">
            <img src={profile.image} alt="Profile" className="profile-img mx-auto d-block" />
        </div>
    );
};

export default Profile;
