// src/Components/FloatingClock/FloatingClock.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
    // FaMicrophone,
     FaChevronDown, 
    //  FaChevronUp 
    } from 'react-icons/fa';
import './FloatingClock.css';

const STORAGE_KEY = 'nf_clock_position_v1';
const MINIMIZED_KEY = 'nf_clock_minimized_v1';

const FloatingClock = () => {
    // ===== Position state =====
    const [position, setPosition] = useState(() => {
        // Restore saved position, or default to bottom-right
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return {
            x: window.innerWidth - 240,
            y: window.innerHeight - 120
        };
    });

    const [minimized, setMinimized] = useState(() => {
        return localStorage.getItem(MINIMIZED_KEY) === 'true';
    });

    const [dragging, setDragging] = useState(false);
    const [now, setNow] = useState(new Date());

    // ===== Refs for drag =====
    const dragStartRef = useRef({ x: 0, y: 0 });
    const positionStartRef = useRef({ x: 0, y: 0 });
    const clockRef = useRef(null);

    // ===== Update time every second =====
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ===== Persist position =====
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }, [position]);

    // ===== Persist minimized state =====
    useEffect(() => {
        localStorage.setItem(MINIMIZED_KEY, String(minimized));
    }, [minimized]);

    // ===== Keep clock in viewport when window resizes =====
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => {
                const maxX = window.innerWidth - 60;
                const maxY = window.innerHeight - 60;
                return {
                    x: Math.min(prev.x, maxX),
                    y: Math.min(prev.y, maxY)
                };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== Drag handlers =====
    const handleMouseDown = useCallback((e) => {
        // Ignore right-click
        if (e.button !== 0) return;
        e.preventDefault();

        setDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        positionStartRef.current = { ...position };
    }, [position]);

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e) => {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;

            const newX = positionStartRef.current.x + dx;
            const newY = positionStartRef.current.y + dy;

            // Clamp to viewport
            const maxX = window.innerWidth - 60;
            const maxY = window.innerHeight - 60;

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging]);

    // ===== Touch support (for tablets) =====
    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        setDragging(true);
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        positionStartRef.current = { ...position };
    }, [position]);

    useEffect(() => {
        if (!dragging) return;

        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            const dx = touch.clientX - dragStartRef.current.x;
            const dy = touch.clientY - dragStartRef.current.y;

            const newX = positionStartRef.current.x + dx;
            const newY = positionStartRef.current.y + dy;

            const maxX = window.innerWidth - 60;
            const maxY = window.innerHeight - 60;

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleTouchEnd = () => setDragging(false);

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [dragging]);

    // ===== Format date and time =====
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // ===== Minimized mode — just a small dot =====
    if (minimized) {
        return (
            <div
                className="nf-clock nf-clock-minimized"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`
                }}
                ref={clockRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                title="Click to expand clock"
                onClick={(e) => {
                    // Only expand if not dragging
                    if (!dragging) setMinimized(false);
                }}
            >
                <div className="nf-clock-dot" />
            </div>
        );
    }

    // ===== Full clock =====
    return (
        <div
            className={`nf-clock ${dragging ? 'dragging' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
            ref={clockRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Minimize button (top-right) */}
            <button
                className="nf-clock-minimize"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(true);
                }}
                title="Minimize"
            >
                <FaChevronDown />
            </button>

            {/* Date + Time */}
            <div className="nf-clock-content">
                <div className="nf-clock-date">
                    {weekday} {day} {month} {year}
                </div>
                <div className="nf-clock-time">{time}</div>
            </div>

            {/* Microphone button 
            
                className="nf-clock-mic"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    // Placeholder — future voice feature
                    console.log('🎤 Voice feature coming soon');
                }}
                title="Voice input (coming soon)"
            >
                <FaMicrophone />
            </button>*/}
        </div>
    );
};

export default FloatingClock;