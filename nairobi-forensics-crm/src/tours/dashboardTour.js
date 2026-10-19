// src/tours/dashboardTour.js
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'nf_dashboard_tour_completed';

/**
 * Check if the user has already completed the tour.
 */
export const hasCompletedTour = () => {
    return localStorage.getItem(TOUR_KEY) === 'true';
};

/**
 * Mark the tour as completed.
 */
export const markTourCompleted = () => {
    localStorage.setItem(TOUR_KEY, 'true');
};

/**
 * Reset the tour (so it shows again next time).
 */
export const resetTour = () => {
    localStorage.removeItem(TOUR_KEY);
};

/**
 * Start the dashboard tour.
 * @param {Object} opts - optional callbacks
 * @param {Function} opts.onComplete - called when tour finishes or is skipped
 */
export const startDashboardTour = (opts = {}) => {
    const driverInstance = driver({
        showProgress: true,
        progressText: 'Step {{current}} of {{total}}',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Got it! ',
        allowClose: true,
        overlayColor: 'rgba(5, 10, 48, 0.85)',
        stagePadding: 8,
        stageRadius: 8,
        disableActiveInteraction: false,

        onDestroyStarted: () => {
            // Called when tour ends (either done or skipped)
            markTourCompleted();
            if (opts.onComplete) opts.onComplete();
            driverInstance.destroy();
        },

        steps: [
            // ===== WELCOME =====
            {
                popover: {
                    title: 'Welcome to Nairobi Forensics CRM!',
                    description:
                        "Let me show you around in 60 seconds. You'll learn where everything is and how to manage clients, invoices, payments, and reports.",
                    side: 'center',
                    align: 'center'
                }
            },

            // ===== SIDEBAR =====
            {
                element: '.sidebar',
                popover: {
                    title: ' Navigation Menu',
                    description:
                        'All the main sections of the app live here. Sections are grouped: MAIN, SALES, FINANCE, REPORTING, etc.',
                    side: 'right',
                    align: 'start'
                }
            },

            // ===== DASHBOARD LINK =====
            {
                element: 'a[href="/dashboard"]',
                popover: {
                    title: ' Dashboard',
                    description:
                        'Your home page. Always brings you back here — see stats, recent invoices, payments, and collection progress.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== CLIENTS =====
            {
                element: 'a[href="/dashboard/clients"]',
                popover: {
                    title: ' Clients',
                    description:
                        'Manage your clients. Add new ones, edit their details, and click any client to view their full financial statement.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== INVOICES =====
            {
                element: 'a[href="/dashboard/invoices"]',
                popover: {
                    title: ' Invoices',
                    description:
                        'Create and manage invoices. Each invoice auto-generates a unique number based on the client code.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== PAYMENTS =====
            {
                element: 'a[href="/dashboard/payments"]',
                popover: {
                    title: ' Payments',
                    description:
                        'Record payments here. Payments auto-update the invoice balance and auto-generate receipts.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== RECEIPTS =====
            {
                element: 'a[href="/dashboard/receipts"]',
                popover: {
                    title: ' Receipts',
                    description:
                        'Every payment generates a receipt automatically. Download as PDF or print.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== REPORTS =====
            {
                element: 'a[href="/dashboard/reports"]',
                popover: {
                    title: ' Reports',
                    description:
                        'See financial insights: total invoiced, collected, outstanding, collection rate, and top clients.',
                    side: 'right',
                    align: 'center'
                }
            },

            // ===== TOPBAR =====
            {
                element: '.topbar',
                popover: {
                    title: ' Top Bar',
                    description:
                        'Notifications appear here. The bell icon shows new activity — new payments, clients, invoices.',
                    side: 'bottom',
                    align: 'center'
                }
            },

            // ===== WELCOME BANNER =====
            {
                element: '.welcome-banner',
                popover: {
                    title: ' Welcome Banner',
                    description:
                        "Quick action buttons for 'New Invoice' and 'New Client' — get to work in one click.",
                    side: 'bottom',
                    align: 'center'
                }
            },

            // ===== KPI CARDS =====
            {
                element: '.kpi-grid',
                popover: {
                    title: 'Key Metrics',
                    description:
                        'At-a-glance stats: Total Clients, Invoices, Collected, and Outstanding. Click any card to drill in.',
                    side: 'bottom',
                    align: 'center'
                }
            },

            // ===== FINISH =====
            {
                popover: {
                    title: ' You\'re all set!',
                    description:
                        "You can restart this tour anytime from Settings. Happy invoicing!",
                    side: 'center',
                    align: 'center'
                }
            }
        ]
    });

    driverInstance.drive();
};