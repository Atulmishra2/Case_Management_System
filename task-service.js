/**
 * TaskService — To-do and deadline management
 */

import { formatDateDMY, escapeHtml, getSafeValue } from './case-service.js';

class TaskService {
  constructor(caseService) {
    this.cases = caseService;
    this.tasks = [];
  }

  loadTasks() {
    const saved = safeStorage.get('cmCaseTasks');
    if (saved) {
      try {
        this.tasks = JSON.parse(saved);
      } catch (e) {
        this.tasks = [];
      }
    } else {
      this.tasks = [];
    }
    window.caseTasks = this.tasks;
  }

  saveTasks() {
    safeStorage.set('cmCaseTasks', JSON.stringify(this.tasks), false);
    window.caseTasks = this.tasks;
  }

  addTask(task) {
    this.tasks.unshift({
      id: Date.now().toString(),
      status: 'pending',
      created_at: new Date().toISOString(),
      ...task
    });
    this.saveTasks();
  }

  updateTask(id, updates) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = { ...this.tasks[idx], ...updates };
      this.saveTasks();
    }
  }

  deleteTask(id) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      this.saveTasks();
    }
  }

  getPendingTasks() {
    return this.tasks.filter(t => (t.status || '').toLowerCase() !== 'done');
  }

  getTasksDueSoon() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    
    return this.tasks.filter(t => {
      if ((t.status || '').toLowerCase() === 'done') return false;
      const deadline = new Date(t.deadlineDate || t.deadline);
      if (isNaN(deadline.getTime())) return false;
      return deadline >= today && deadline <= weekAhead;
    });
  }

  populateTodoCaseDropdown() {
    const select = document.getElementById('todoCaseSelect');
    if (!select) return;

    if (this.cases.cases.length === 0) {
      select.innerHTML = '<option value="">No cases available — create a case first</option>';
      return;
    }

    const sortedCases = [...this.cases.cases].sort((a, b) => {
      const numA = (a.caseNo || a.criminalCaseNumber || '').toUpperCase();
      const numB = (b.caseNo || b.criminalCaseNumber || '').toUpperCase();
      return numA.localeCompare(numB);
    });

    let html = `<option value="">-- Select Case --</option>`;
    sortedCases.forEach(c => {
      const caseNum = c.caseNo || c.criminalCaseNumber || '';
      const caseName = c.caseName || 
        (c.plaintiff ? `${c.plaintiff} vs ${c.defendant}` : 
        (c.victimName ? `${c.victimName} vs ${c.accusedName}` : ''));
      html += `<option value="${escapeHtml(caseNum)}">${escapeHtml(caseNum)} — ${escapeHtml(caseName)}</option>`;
    });

    select.innerHTML = html;
  }

  renderCaseTasks() {
    this.loadTasks();

    const container = document.getElementById('tasksListContainer');
    if (!container) return;

    const pendingTasks = this.getPendingTasks();
    const todayStr = new Date().toISOString().split('T')[0];

    if (pendingTasks.length === 0) {
      container.innerHTML = `
        <div class="home-empty-tasks">
          <div class="empty-icon"><i class="fa-solid fa-check-circle"></i></div>
          <p>All tasks and deadlines are up-to-date.</p>
          <button type="button" class="btn btn-primary" style="margin-top: 0.75rem;" onclick="openAddTodoModal()">
            <i class="fa-solid fa-plus"></i> Add New Task
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    pendingTasks.forEach(t => {
      const isCompleted = (t.status || '').toLowerCase() === 'done';
      const deadline = t.deadlineDate || t.deadline || '';
      const deadlineDate = deadline ? new Date(deadline) : null;
      
      let deadlineBadgeHtml = '';
      let deadlineClass = '';
      
      if (isCompleted) {
        deadlineClass = 'completed';
        deadlineBadgeHtml = '<span class="todo-deadline-badge completed"><i class="fa-solid fa-check"></i> Completed</span>';
      } else if (deadlineDate) {
        deadlineDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          deadlineClass = 'overdue';
          deadlineBadgeHtml = `<span class="todo-deadline-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue (${Math.abs(diffDays)} days)</span>`;
        } else if (diffDays === 0) {
          deadlineClass = 'today';
          deadlineBadgeHtml = '<span class="todo-deadline-badge today"><i class="fa-solid fa-bolt"></i> Due Today</span>';
        } else {
          deadlineClass = 'normal';
          deadlineBadgeHtml = `<span class="todo-deadline-badge normal"><i class="fa-solid fa-calendar"></i> Due in ${diffDays} days</span>`;
        }
      } else {
        deadlineBadgeHtml = '<span class="todo-deadline-badge normal"><i class="fa-solid fa-clock"></i> No Deadline</span>';
      }

      const priorityClass = (t.priority || '').toLowerCase() === 'high' ? 'urgent-task' : '';
      const taskCase = t.caseNo || '';
      const taskCaseObj = taskCase ? this.cases.getCaseByNumber(taskCase) : null;
      const hearingFormatted = taskCaseObj?.nextHearing 
        ? `Hearing: ${formatDateDMY(taskCaseObj.nextHearing)}` 
        : 'No hearing scheduled';
      
      let hearingBadgeHtml = '';
      if (taskCaseObj?.nextHearing && taskCaseObj.nextHearing !== '—' && taskCaseObj.nextHearing !== 'null') {
        const hearingDate = new Date(taskCaseObj.nextHearing);
        hearingDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((hearingDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          hearingBadgeHtml = `<span class="todo-deadline-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> Hearing passed</span>`;
        } else if (diffDays === 0) {
          hearingBadgeHtml = `<span class="todo-deadline-badge today"><i class="fa-solid fa-bolt"></i> Hearing Today</span>`;
        } else {
          hearingBadgeHtml = `<span class="todo-deadline-badge normal"><i class="fa-solid fa-calendar"></i> ${hearingFormatted}</span>`;
        }
      } else {
        hearingBadgeHtml = '<span class="todo-deadline-badge normal"><i class="fa-solid fa-triangle-exclamation"></i> Undated Case</span>';
      }

      html += `
        <div class="todo-item-card ${priorityClass}" style="border-left: 3px solid ${isCompleted ? '#10b981' : (t.priority === 'high' ? '#ef4444' : '#cbd5e1')};">
          <div class="todo-item-content">
            <div class="todo-item-header">
              <span class="todo-title">${escapeHtml(t.taskTitle || t.task || 'Legal Action')}</span>
              ${deadlineBadgeHtml}
            </div>
            <div class="todo-item-meta">
              ${taskCase ? `<span class="todo-case-ref"><i class="fa-solid fa-folder"></i> Case: <strong>${escapeHtml(taskCase)}</strong></span>` : ''}
              ${hearingBadgeHtml}
            </div>
            ${t.description ? `<div class="todo-description">${escapeHtml(t.description)}</div>` : ''}
          </div>
          <div class="todo-actions">
            <button type="button" class="table-view-btn" onclick="toggleTodoStatus('${t.id}')" title="${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}">
              <i class="fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle-dot'}"></i>
            </button>
            <button type="button" class="table-view-btn todo-delete-btn" onclick="deleteCaseTask('${t.id}')" title="Delete Task">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.updateTodoCounters();
  }

  updateTodoCounters() {
    this.loadTasks();

    const pendingCount = this.getPendingTasks().length;
    const todoNavCount = document.getElementById('todoNavCount');
    if (todoNavCount) todoNavCount.textContent = String(pendingCount);
    
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
    
    const todoTaskCountEl = document.getElementById('todoTaskCount');
    const todoCompletedCountEl = document.getElementById('todoCompletedCount');
    const todoPendingCountEl = document.getElementById('todoPendingCount');
    
    if (todoTaskCountEl) todoTaskCountEl.textContent = `Total: ${totalTasks}`;
    if (todoCompletedCountEl) todoCompletedCountEl.textContent = `Completed: ${completedTasks}`;
    if (todoPendingCountEl) todoPendingCountEl.textContent = `Pending: ${pendingCount}`;
  }

  openAddTodoModal(caseNo = '') {
    const modal = document.getElementById('addTodoModal');
    const caseSelect = document.getElementById('todoCaseSelect');
    
    if (modal) {
      modal.classList.remove('hidden');
      if (caseSelect) {
        this.populateTodoCaseDropdown();
        if (caseNo) {
          setTimeout(() => {
            caseSelect.value = caseNo;
          }, 100);
        }
      }
    }
  }

  closeAddTodoModal() {
    const modal = document.getElementById('addTodoModal');
    if (modal) modal.classList.add('hidden');
    
    const titleEl = document.getElementById('todoTitle');
    const descEl = document.getElementById('todoDescription');
    const caseEl = document.getElementById('todoCaseSelect');
    const deadlineEl = document.getElementById('todoDeadline');
    const priorityEl = document.getElementById('todoPriority');
    
    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (caseEl) caseEl.value = '';
    if (deadlineEl) deadlineEl.value = '';
    if (priorityEl) priorityEl.value = 'normal';
  }

  addTodoTask() {
    const titleEl = document.getElementById('todoTitle');
    const descEl = document.getElementById('todoDescription');
    const caseEl = document.getElementById('todoCaseSelect');
    const deadlineEl = document.getElementById('todoDeadline');
    const priorityEl = document.getElementById('todoPriority');

    if (!titleEl || !titleEl.value.trim()) {
      alert('Please enter a task title.');
      return;
    }

    this.addTask({
      taskTitle: titleEl.value.trim(),
      description: descEl ? descEl.value.trim() : '',
      caseNo: caseEl ? caseEl.value.trim() : '',
      deadlineDate: deadlineEl ? deadlineEl.value : '',
      priority: priorityEl ? priorityEl.value : 'normal',
      status: 'pending'
    });

    this.closeAddTodoModal();
    this.renderCaseTasks();
    this.showToastNotification('Task scheduled!', 2000, 'success');
  }

  toggleTodoStatus(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      this.updateTask(id, { 
        status: task.status === 'done' ? 'pending' : 'done' 
      });
      this.renderCaseTasks();
      this.updateTodoCounters();
    }
  }

  deleteCaseTask(id) {
    if (confirm('Remove this task?')) {
      this.deleteTask(id);
      this.renderCaseTasks();
      this.updateTodoCounters();
      this.showToastNotification('Task removed', 2000, 'warning');
    }
  }
}

// Import for storage
import { safeStorage } from './auth-service.js';

export { TaskService };