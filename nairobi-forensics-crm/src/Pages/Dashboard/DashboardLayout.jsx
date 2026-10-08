// src/Pages/Dashboard/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Topbar from '../../Components/Topbar/Topbar';
import FloatingClock from '../../Components/FloatingClock/FloatingClock';
import './dashboard-layout.css';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="dashboard-main">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <Outlet />
            </div>

            {/* Floating draggable clock */}
            <FloatingClock />
        </div>
    );
};

export default DashboardLayout;