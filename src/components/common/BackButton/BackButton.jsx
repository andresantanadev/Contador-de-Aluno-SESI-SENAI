import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

const BackButton = () => {
    const navigate = useNavigate();

    return (
        <button className="back-button-fixed" onClick={() => navigate(-1)} title="Voltar">
            <i className="bi bi-arrow-left"></i>
        </button>
    );
};

export default BackButton;