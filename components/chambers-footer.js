/**
 * Reusable Chambers Footer Component
 * -------------------------------------------------------------
 * Allows easily inserting the Modern Chambers of Atul Kumar Mishra
 * footer anywhere in the application.
 *
 * Usage Options:
 * 1. Web Component:
 *    <chambers-footer></chambers-footer>
 *
 * 2. HTML placeholder with attribute:
 *    <div data-chambers-footer></div>
 *    or
 *    <div id="reusableFooter"></div>
 *
 * 3. JavaScript programmatic rendering:
 *    renderChambersFooter('#my-footer-container');
 */

(function () {
  const workflowTabs = ['add', 'update', 'hearing', 'delete', 'courts'];

  function isWorkflowTabActive() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && workflowTabs.includes(activeTab.id)) return true;
    if (typeof window.currentActiveTabId !== 'undefined' && workflowTabs.includes(window.currentActiveTabId)) return true;
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
    return workflowTabs.includes(hash);
  }

  function getChambersFooterHtml(customOptions = {}) {
    const advocateName = customOptions.advocateName || 'CHAMBERS OF ATUL KUMAR MISHRA';
    const subtitle = customOptions.subtitle || 'Advocate & Legal Consultant &bull; All Major Courts';
    const year = customOptions.year || new Date().getFullYear();

    return `
      <footer class="modern-chambers-footer">
          <div class="footer-card-inner">
              <div class="footer-main-grid">
                  <!-- Left Brand & Features Column -->
                  <div class="footer-chambers-col">
                      <div class="footer-chambers-header">
                          <div class="footer-brand-crest">
                              <i class="fa-solid fa-scale-balanced"></i>
                          </div>
                          <div class="footer-brand-text">
                              <h4 class="footer-brand-title">${advocateName}</h4>
                              <span class="footer-brand-subtitle">${subtitle}</span>
                          </div>
                      </div>

                      <!-- 3 Feature Pillars -->
                      <div class="footer-features-grid">
                          <div class="footer-feature-item">
                              <div class="footer-feature-icon">
                                  <i class="fa-solid fa-file-contract"></i>
                              </div>
                              <h5 class="footer-feature-title">Case Tracking</h5>
                              <p class="footer-feature-desc">Real-time judicial tracking.</p>
                          </div>
                          <div class="footer-feature-item">
                              <div class="footer-feature-icon">
                                  <i class="fa-solid fa-calendar-check"></i>
                              </div>
                              <h5 class="footer-feature-title">Cause Lists</h5>
                              <p class="footer-feature-desc">Automated generation &amp; hearing sync.</p>
                          </div>
                          <div class="footer-feature-item">
                              <div class="footer-feature-icon">
                                  <i class="fa-solid fa-file-pen"></i>
                              </div>
                              <h5 class="footer-feature-title">Digital Registers</h5>
                              <p class="footer-feature-desc">Comprehensive matter details.</p>
                          </div>
                      </div>
                  </div>

                  <!-- Right Navigation Portals Column -->
                  <div class="footer-portals-col">
                      <h5 class="footer-portals-title">
                          <i class="fa-solid fa-compass"></i> NAVIGATION PORTALS
                      </h5>
                      <div class="footer-portals-grid">
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('home') : (window.location.href='index.html#home')" class="footer-portal-link">
                              <i class="fa-solid fa-house portal-ico-pink"></i>
                              <span>Dashboard</span>
                          </a>
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('search') : (window.location.href='index.html#search')" class="footer-portal-link">
                              <i class="fa-solid fa-folder-open portal-ico-teal"></i>
                              <span>Registry</span>
                          </a>
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('causelist') : (window.location.href='index.html#causelist')" class="footer-portal-link">
                              <i class="fa-solid fa-scroll portal-ico-green"></i>
                              <span>Cause List</span>
                          </a>
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('upcoming') : (window.location.href='index.html#upcoming')" class="footer-portal-link">
                              <i class="fa-solid fa-calendar-days portal-ico-cyan"></i>
                              <span>Upcoming</span>
                          </a>
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('calendar') : (window.location.href='index.html#calendar')" class="footer-portal-link">
                              <i class="fa-solid fa-calendar portal-ico-mint"></i>
                              <span>Calendar</span>
                          </a>
                          <a href="javascript:void(0);" onclick="typeof showTab === 'function' ? showTab('dbmanager') : (window.location.href='index.html#dbmanager')" class="footer-portal-link">
                              <i class="fa-solid fa-database portal-ico-blue"></i>
                              <span>Database</span>
                          </a>
                      </div>
                  </div>
              </div>

              <!-- Faint Courthouse & Sparkle Watermarks -->
              <div class="footer-watermark-court" aria-hidden="true">
                  <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="1.2">
                      <path d="M10 40 L80 10 L150 40 Z"></path>
                      <path d="M20 40 L140 40"></path>
                      <path d="M26 40 L26 95 M44 40 L44 95 M62 40 L62 95 M80 40 L80 95 M98 40 L98 95 M116 40 L116 95 M134 40 L134 95"></path>
                      <path d="M16 95 L144 95 M10 105 L150 105"></path>
                  </svg>
              </div>
              <div class="footer-sparkle-star" aria-hidden="true">✦</div>
          </div>

          <!-- Bottom Copyright & Back to Top Bar -->
          <div class="footer-bottom-bar">
              <div class="footer-bottom-inner">
                  <div class="footer-copyright-text">
                      &copy; ${year} <strong>${advocateName}</strong> &bull; LEGAL CMS PLATFORM &bull; ALL RIGHTS RESERVED.
                  </div>
                  <button type="button" class="footer-back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" title="Return to top">
                      <i class="fa-solid fa-rotate-left"></i> Back to Top
                  </button>
              </div>
          </div>
      </footer>
    `.trim();
  }

  // Programmatic function
  function renderChambersFooter(target, options) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.innerHTML = getChambersFooterHtml(options);
      if (isWorkflowTabActive()) {
        el.style.display = 'none';
      }
    }
  }

  // Web Component definition
  if (typeof customElements !== 'undefined' && !customElements.get('chambers-footer')) {
    class ChambersFooterElement extends HTMLElement {
      connectedCallback() {
        this.innerHTML = getChambersFooterHtml();
        if (isWorkflowTabActive()) {
          this.style.display = 'none';
        }
      }
    }
    customElements.define('chambers-footer', ChambersFooterElement);
  }

  // Auto-mount on DOMContentLoaded
  function autoMountFooters() {
    const hide = isWorkflowTabActive();
    document.querySelectorAll('[data-chambers-footer], #reusableFooter').forEach(el => {
      if (!el.innerHTML.trim()) {
        el.innerHTML = getChambersFooterHtml();
      }
      if (hide) {
        el.style.display = 'none';
      }
    });
    document.querySelectorAll('.modern-chambers-footer').forEach(f => {
      if (hide) {
        f.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMountFooters);
  } else {
    autoMountFooters();
  }

  // Expose globally on window
  window.getChambersFooterHtml = getChambersFooterHtml;
  window.renderChambersFooter = renderChambersFooter;
})();
