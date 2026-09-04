/**
 * CaseBook — Legal Case Management System
 * Modern Modular JavaScript (ES6 Modules)
 * 
 * Architecture:
 * - AuthService: Authentication and session management
 * - SupabaseService: Database operations and cloud sync
 * - CaseService: Case CRUD operations
 * - HearingService: Hearing management
 * - CalendarService: Calendar and scheduling
 * - TaskService: To-do and deadline management
 * - UIService: UI rendering and DOM manipulation
 * - App: Main orchestrator
 */

import { AuthService } from './auth-service.js';
import { SupabaseService } from './supabase-service.js';
import { CaseService } from './case-service.js';
import { HearingService } from './hearing-service.js';
import { CalendarService } from './calendar-service.js';
import { TaskService } from './task-service.js';
import { UIService } from './ui-service.js';
import { App } from './app-core.js';

// Initialize the application
const app = new App();
app.init();

// Expose for backward compatibility
window.app = app;
window.showTab = app.showTab.bind(app);
window.handleAdminLogin = app.handleAdminLogin.bind(app);
window.handleGuestLogin = app.handleGuestLogin.bind(app);
window.handleLogout = app.handleLogout.bind(app);
window.triggerPwaInstall = app.triggerPwaInstall.bind(app);
window.setQuickCaseFilter = app.setQuickCaseFilter.bind(app);
window.setHearingDateOffset = app.setHearingDateOffset.bind(app);
window.setHearingStagePreset = app.setHearingStagePreset.bind(app);
window.updateHearingLivePreview = app.updateHearingLivePreview.bind(app);
window.toggleEditPrevDate = app.toggleEditPrevDate.bind(app);
window.savePrevDateEdit = app.savePrevDateEdit.bind(app);
window.showToastNotification = app.showToastNotification.bind(app);
window.copyCaseNumberToClipboard = app.copyCaseNumberToClipboard.bind(app);
window.openCaseHistoryModal = app.openCaseHistoryModal.bind(app);
window.openCaseHistoryModalByNo = app.openCaseHistoryModalByNo.bind(app);
window.closeCaseHistoryModal = app.closeCaseHistoryModal.bind(app);
window.openUpdateHearingForCase = app.openUpdateHearingForCase.bind(app);
window.renderHearingCaseInfo = app.renderHearingCaseInfo.bind(app);
window.populateHearingCaseDropdown = app.populateHearingCaseDropdown.bind(app);
window.populateTodoCaseDropdown = app.populateTodoCaseDropdown.bind(app);
window.initCauseListTab = app.initCauseListTab.bind(app);
window.setCauseListDateOffset = app.setCauseListDateOffset.bind(app);
window.renderCauseListTable = app.renderCauseListTable.bind(app);
window.sendDailyCauseListWhatsApp = app.sendDailyCauseListWhatsApp.bind(app);
window.renderCalendarView = app.renderCalendarView.bind(app);
window.renderUpcomingWeekHearings = app.renderUpcomingWeekHearings.bind(app);
window.renderCaseTasks = app.renderCaseTasks.bind(app);
window.exportAllCasesToCSV = app.exportAllCasesToCSV.bind(app);
window.renderHomeDashboard = app.renderHomeDashboard.bind(app);
window.filterCaseTables = app.filterCaseTables.bind(app);
window.refreshAllCaseTables = app.refreshAllCaseTables.bind(app);
window.openTodoForCase = app.openTodoForCase.bind(app);
window.deleteCaseTask = app.deleteCaseTask.bind(app);
window.toggleTodoStatus = app.toggleTodoStatus.bind(app);
window.loadCaseForUpdate = app.loadCaseForUpdate.bind(app);
window.updateCaseById = app.updateCaseById.bind(app);
window.deleteCaseFromSupabase = app.deleteCaseFromSupabase.bind(app);
window.updateHearingInSupabase = app.updateHearingInSupabase.bind(app);
window.sendWhatsAppHearingNotice = app.sendWhatsAppHearingNotice.bind(app);
window.togglePasswordVisibility = app.togglePasswordVisibility.bind(app);
window.handleChangeCredentials = app.handleChangeCredentials.bind(app);
window.goPreviousTab = app.goPreviousTab.bind(app);
window.goForwardTab = app.goForwardTab.bind(app);
window.updateNavigationButtons = app.updateNavigationButtons.bind(app);
window.restoreActiveAdminTab = app.restoreActiveAdminTab.bind(app);
window.renderCivilCasesTable = app.renderCivilCasesTable.bind(app);
window.getAllCaseRecords = () => app.cases.getAll();
window.getSupabaseClient = () => app.db.getClient();
window.getActiveAdminUsername = () => app.auth.getUsername();
window.getActiveAdminPassword = () => app.auth.getPassword();
window.isValidAdminLogin = (u, p) => app.auth.validateLogin(u, p);
window.addCaseToSupabase = (data) => app.cases.add(data);
window.updateCaseInSupabase = (data) => app.cases.update(data);

export { app };
