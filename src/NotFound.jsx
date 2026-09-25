import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center px-3">
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="lead text-muted mb-5">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link to="/" className="btn btn-primary btn-lg rounded-pill px-5">
                Go to Home
            </Link>
        </div>
    );
};

export default NotFound;
