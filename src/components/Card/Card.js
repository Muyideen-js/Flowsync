import React from 'react';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    onClick = null,
    padding = 'medium'
}) => {
    return (
        <div
            className={`card ${hover ? 'card-hover' : ''} card-padding-${padding} ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </div>
    );
};

export default Card;
