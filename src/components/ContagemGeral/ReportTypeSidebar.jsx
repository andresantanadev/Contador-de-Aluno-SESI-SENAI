// /src/components/ContagemGeral/ReportTypeSidebar.jsx
import React from 'react';
import './ReportTypeSidebar.css'; // (CSS abaixo)

const reportTypes = [
    { key: 'diario', name: 'Diário', icon: 'bi-calendar-day' },
    { key: 'semanal', name: 'Semanal', icon: 'bi-calendar-week' },
    { key: 'mensal', name: 'Mensal', icon: 'bi-calendar-month' },
    { key: 'anual', name: 'Anual', icon: 'bi-calendar-event' },
    { key: 'personalizado', name: 'Personalizado', icon: 'bi-calendar-range' },
];

const ReportTypeSidebar = ({ activeType, onTypeChange }) => {
    return (
        <div className="report-type-sidebar">
            <h3 className="report-type-title">Relatórios</h3>
            <div className="report-type-list">
                {reportTypes.map((type) => (
                    <button
                        key={type.key}
                        className={`report-type-item ${activeType === type.key ? 'active' : ''}`}
                        onClick={() => onTypeChange(type.key)}
                    >
                        <i className={`bi ${type.icon}`}></i>
                        <span>{type.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportTypeSidebar;