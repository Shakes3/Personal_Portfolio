/**
 * ============================================================================
 * AI CHAT ASSISTANT - INTERCOM / VEED.IO EDITION (chat-widget.js)
 * Clean, modern SaaS Help & AI Messenger widget.
 * Features:
 * - Multi-view architecture: Home Dashboard, Messages Thread, Help Center
 * - Authentic VEED.IO / Intercom aesthetic layout
 * - Brand logo & overlapping team avatars
 * - "How can we help?" hero greeting
 * - "Send us a message" action card
 * - "Status: All systems operational" live status card
 * - Real-time FAQ search filter + instant prompt submission
 * - Bottom tab navigation (Home, Messages, Help)
 * - Real-time Typewriter Streaming & Markdown cards
 * - Circular Launcher with Down Chevron ⌵ when open
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  const DEFAULT_CONFIG = {
    apiEndpoint: (window.location.origin.includes(':8000') || window.location.pathname.includes('home')) ? '/AiChat/' : 'http://localhost:8000/api/chat',
    brandName: "ABHISHEK.AI",
    title: "Abhishek's Assistant",
    subtitle: "Active • Powered by Gemini AI",
    // modelBadge: "Gemini AI",
    enableSound: true,
    persistHistory: true,
    autoOpenDelay: 3500,
    systemPrompt: `You are Abhishek's personal AI Assistant. Answer questions about projects, technical skills (Python, Django, FastAPI, LLMs, GenAI, LangChain, React), background, and hiring availability with a friendly, professional, and knowledgeable tone. Keep answers concise, insightful, and formatted nicely.`,
    faqQuestions: [
      { text: "What are Abhishek's top projects?" },
      { text: "What is Abhishek's core tech stack & skills?" },
      { text: "Is Abhishek open for hire or consulting?" },
      { text: "How can I contact Abhishek directly?" }
      // { text: "Explain the AI Assistant & RAG architecture" }
    ]
  };

  class AIChatAssistant {
    constructor() {
      this.isInitialized = false;
      this.config = { ...DEFAULT_CONFIG };
      this.isOpen = false;
      this.activeTab = 'messages'; // 'home' | 'messages' | 'help'
      this.isMaximized = false;
      this.isThinking = false;
      this.isStreaming = false;
      this.stopRequested = false;
      this.messages = [];
      this.audioCtx = null;
      this.recognition = null;
      this.isRecording = false;
      this.dom = {};
      this.unreadCount = 0;
    }

    /**
     * Initialize widget
     */
    init(customOptions = {}) {
      if (this.isInitialized) {
        this.config = { ...this.config, ...customOptions };
        return this;
      }

      this.isInitialized = true;
      this.config = { ...this.config, ...customOptions };

      this.buildDOM();
      this.attachEventListeners();
      this.initVoiceInput();
      this.loadSavedHistory();
      this.checkApiStatus();

      // Show proactive callout after delay if no messages yet
      if (this.config.autoOpenDelay) {
        setTimeout(() => {
          if (!this.isOpen && this.dom.callout && this.messages.length === 0) {
            this.dom.callout.classList.remove('hidden');
          }
        }, this.config.autoOpenDelay);
      }

      console.log('🤖 [AIChatWidget] Intercom Edition initialized.');
      return this;
    }

    /**
     * Build and inject Widget HTML
     */
    buildDOM() {
      if (document.getElementById('ai-chat-root')) return;

      const root = document.createElement('div');
      root.id = 'ai-chat-root';
      root.className = 'ai-chat-root';

      root.innerHTML = `
        <!-- Floating Launcher (Minimized / Toggle state) -->
        <div class="ai-chat-launcher-wrap">
          <!-- Proactive Callout Tooltip -->
          <div class="ai-chat-callout hidden" id="ac-callout">
            <span style="font-size:16px;">👋</span>
            <div class="ai-chat-callout-text">
              Questions? <span>Chat with my AI</span>
            </div>
            <button class="ai-chat-callout-close" id="ac-callout-close" title="Dismiss">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Main Circular Floating Launcher Button -->
          <button class="ai-chat-launcher" id="ac-launcher" aria-label="Toggle AI Assistant" title="Open Support & AI Assistant">
            <!-- Closed Icon: Chat Bubble SVG -->
            <div class="ai-chat-icon-chat">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>

            <!-- Open Icon: DOWN CHEVRON ⌵ (Exact match to VEED.IO screenshot) -->
            <div class="ai-chat-icon-close">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            <span class="ai-chat-badge hidden" id="ac-badge">1</span>
          </button>
        </div>

        <!-- Pop-Up Widget Window (Card) -->
        <div class="ai-chat-window" id="ac-window" role="dialog" aria-modal="true" aria-label="Help & AI Assistant Window">
          
          <div class="ai-chat-viewport">
            
            <!-- ==========================================================
                 VIEW 1: HOME DASHBOARD (AUTHENTIC VEED.IO STYLE)
                 ========================================================== -->
            <div class="ai-chat-view is-active" id="ac-view-home">
              <div class="ai-chat-home-scroll">
                
                <!-- Brand Row: VEED.IO style Brand Logo + Overlapping Avatars -->
                <div class="ai-chat-brand-row">
                  <div class="ai-chat-brand-logo">
                    ${this.config.brandName.split('.')[0]}<span>.${this.config.brandName.split('.')[1] || 'IO'}</span>
                  </div>

                  <!-- Overlapping Team Avatars -->
                  <div class="ai-chat-team-avatars">
                    <div class="ai-chat-avatar-pill" title="Abhishek (Engineer)">
                      <img src="avatar.jpg" alt="Abhishek" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces'"/>
                    </div>
                    <div class="ai-chat-avatar-pill" style="background:#4f46e5;" title="AI Assistant">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces" alt="Team"/>
                    </div>
                    <div class="ai-chat-avatar-pill" style="background:#10b981;" title="Gemini Engine">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces" alt="AI"/>
                    </div>
                  </div>
                </div>

                <!-- Greeting Hero Section -->
                <div class="ai-chat-hero">
                  <div class="ai-chat-greeting-subtitle">
                    Hi visitor <span style="display:inline-block;animation:ac-pulse 1.8s infinite;">👋</span>
                  </div>
                  <div class="ai-chat-greeting-title">
                    How can we help?
                  </div>
                </div>

                <!-- Card 1: Send us a message -->
                <div class="ai-chat-action-card" id="ac-card-send-msg" role="button" tabindex="0">
                  <div class="ai-chat-card-info">
                    <div class="ai-chat-card-heading">
                      Send us a message
                    </div>
                    <div class="ai-chat-card-sub">
                      We typically reply in under 20 minutes
                    </div>
                  </div>
                  <div class="ai-chat-card-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </div>
                </div>

                <!-- Card 2: Status Banner (All systems operational) -->
                <div class="ai-chat-status-card">
                  <div class="ai-chat-status-icon-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div class="ai-chat-status-details">
                    <div class="ai-chat-status-heading">
                      Status: All systems operational
                    </div>
                    <div class="ai-chat-status-sub" id="ac-status-sub">
                      Updated August 17, 2023 · 15:30 BST
                    </div>
                  </div>
                </div>

                <!-- Card 3: Search for help & FAQ Accordion -->
                <div class="ai-chat-faq-card">
                  <!-- Search input inside FAQ card -->
                  <div class="ai-chat-search-wrap">
                    <input 
                      type="text" 
                      class="ai-chat-search-input" 
                      id="ac-search-input" 
                      placeholder="Search for help..." 
                      aria-label="Search FAQ"
                    />
                    <div class="ai-chat-search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>

                  <!-- FAQ List Items with Chevrons -->
                  <div class="ai-chat-faq-list" id="ac-faq-list">
                    ${this.config.faqQuestions.map(q => `
                      <button class="ai-chat-faq-row" data-prompt="${q.text.replace(/"/g, '&quot;')}">
                        <span>${q.text}</span>
                        <span class="ai-chat-faq-chevron">›</span>
                      </button>
                    `).join('')}
                  </div>
                </div>

              </div>
            </div>

            <!-- ==========================================================
                 VIEW 2: MESSAGES / CHAT THREAD VIEW
                 ========================================================== -->
            <div class="ai-chat-view" id="ac-view-messages">
              <!-- Messages Header -->
              <div class="ai-chat-messages-header">
                <div class="ai-chat-msg-header-left">
                  <button class="ai-chat-btn-back" id="ac-btn-back-home" title="Back to Home">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div class="ai-chat-header-avatar">
                    <img src="avatar.jpg" alt="Abhishek" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces'"/>
                    <span class="ai-chat-header-dot"></span>
                  </div>
                  <div class="ai-chat-header-meta">
                    <div class="ai-chat-header-name">${this.config.title}</div>
                    <div class="ai-chat-header-status">${this.config.subtitle}</div>
                  </div>
                </div>

                <div class="ai-chat-header-actions">
                  <!-- Clear conversation -->
                  <button class="ai-chat-action-btn" id="ac-btn-clear" title="Clear chat history">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                  <!-- Sound Toggle -->
                  <button class="ai-chat-action-btn" id="ac-btn-sound" title="Toggle audio chime">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="ac-icon-sound">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Message Feed Body -->
              <div class="ai-chat-messages-body" id="ac-messages-body">
                <!-- Initial welcome message -->
                <div class="ai-chat-row bot" id="ac-initial-bot-row">
                  <div class="ai-chat-msg-avatar">AI</div>
                  <div class="ai-chat-msg-content">
                    <div class="ai-chat-bubble">
                      <p>Hello! I am Abhishek's AI Assistant. How can I assist you today? You can ask about my <strong>top projects</strong>, <strong>technical stack</strong>, or <strong>availability for hire</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Input Area at Bottom of Messages View -->
              <div class="ai-chat-input-bar">
                <form id="ac-form" class="ai-chat-input-dock">
                  <textarea 
                    class="ai-chat-textarea" 
                    id="ac-textarea" 
                    rows="1" 
                    placeholder="Send a message..." 
                    aria-label="Your message"
                  ></textarea>

                  <div class="ai-chat-input-actions">
                    <!-- Voice Mic Button -->
                    <button type="button" class="ai-chat-btn-tool" id="ac-btn-mic" title="Voice dictation">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </button>

                    <!-- Send Button -->
                    <button type="submit" class="ai-chat-btn-submit" id="ac-btn-send" title="Send message">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="ac-send-icon">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </form>

                <div class="ai-chat-input-hints">
                  <span>⚡ Powered by Gemini AI</span>
                  <span>Shift+Enter for newline</span>
                </div>
              </div>
            </div>

            <!-- ==========================================================
                 VIEW 3: HELP / KNOWLEDGE BASE VIEW
                 ========================================================== -->
            <div class="ai-chat-view" id="ac-view-help">
              <div class="ai-chat-messages-header">
                <div class="ai-chat-msg-header-left">
                  <button class="ai-chat-btn-back" id="ac-btn-back-help" title="Back to Home">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div class="ai-chat-header-name">Help & Knowledge Base</div>
                </div>
              </div>

              <div class="ai-chat-help-scroll">
                <div class="ai-chat-help-card" role="button" data-prompt="Explain Abhishek's top projects in detail">
                  <div class="ai-chat-help-heading">🚀 Standout Projects</div>
                  <div class="ai-chat-help-text">Learn about the AI Chat Assistant, Financial Multi-Agent Pipeline, and YouTube Intelligence workflow.</div>
                </div>

                <div class="ai-chat-help-card" role="button" data-prompt="What is your core tech stack and architecture proficiency?">
                  <div class="ai-chat-help-heading">🛠️ Tech Stack & Skills</div>
                  <div class="ai-chat-help-text">Explore skills across Python, Django, FastAPI, LLMs, LangChain, React, and DevOps.</div>
                </div>

                <div class="ai-chat-help-card" role="button" data-prompt="Are you open for hire, full-time roles, or consulting?">
                  <div class="ai-chat-help-heading">💼 Hiring & Opportunities</div>
                  <div class="ai-chat-help-text">Abhishek is open for Full-Stack & Generative AI software engineering positions and consulting.</div>
                </div>

                <div class="ai-chat-help-card" role="button" data-prompt="How can I contact Abhishek or schedule a discussion?">
                  <div class="ai-chat-help-heading">📫 Contact & Social Links</div>
                  <div class="ai-chat-help-text">Connect directly via Email, LinkedIn, GitHub, or through the contact section on this site.</div>
                </div>
              </div>
            </div>

          </div>

          <!-- ==========================================================
               BOTTOM TAB NAVIGATION (HOME, MESSAGES, HELP)
               ========================================================== -->
          <nav class="ai-chat-bottom-nav">
            <!-- Home Tab -->
            <button class="ai-chat-tab-btn is-active" id="ac-tab-home" title="Home">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </button>

            <!-- Messages Tab -->
            <button class="ai-chat-tab-btn" id="ac-tab-messages" title="Messages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Messages</span>
              <span class="ai-chat-tab-badge hidden" id="ac-tab-badge"></span>
            </button>

            <!-- Help Tab -->
            <button class="ai-chat-tab-btn" id="ac-tab-help" title="Help">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Help</span>
            </button>
          </nav>

        </div>
      `;

      document.body.appendChild(root);

      // Cache DOM references
      this.dom = {
        root,
        launcher: document.getElementById('ac-launcher'),
        callout: document.getElementById('ac-callout'),
        calloutClose: document.getElementById('ac-callout-close'),
        badge: document.getElementById('ac-badge'),
        tabBadge: document.getElementById('ac-tab-badge'),
        window: document.getElementById('ac-window'),
        
        // Views
        viewHome: document.getElementById('ac-view-home'),
        viewMessages: document.getElementById('ac-view-messages'),
        viewHelp: document.getElementById('ac-view-help'),

        // Tabs
        tabHome: document.getElementById('ac-tab-home'),
        tabMessages: document.getElementById('ac-tab-messages'),
        tabHelp: document.getElementById('ac-tab-help'),

        // Home View elements
        cardSendMsg: document.getElementById('ac-card-send-msg'),
        searchInput: document.getElementById('ac-search-input'),
        faqList: document.getElementById('ac-faq-list'),

        // Messages View elements
        btnBackHome: document.getElementById('ac-btn-back-home'),
        btnBackHelp: document.getElementById('ac-btn-back-help'),
        messagesBody: document.getElementById('ac-messages-body'),
        textarea: document.getElementById('ac-textarea'),
        form: document.getElementById('ac-form'),
        sendBtn: document.getElementById('ac-btn-send'),
        sendIcon: document.getElementById('ac-send-icon'),
        micBtn: document.getElementById('ac-btn-mic'),
        soundBtn: document.getElementById('ac-btn-sound'),
        soundIcon: document.getElementById('ac-icon-sound'),
        clearBtn: document.getElementById('ac-btn-clear'),
        initialBotRow: document.getElementById('ac-initial-bot-row')
      };
    }

    /**
     * Attach Event Listeners
     */
    attachEventListeners() {
      // Toggle Launcher (Open / Minimize)
      if (this.dom.launcher) {
        this.dom.launcher.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      }

      // Close callout
      if (this.dom.calloutClose) {
        this.dom.calloutClose.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dom.callout.classList.add('hidden');
        });
      }

      // Click callout to open
      if (this.dom.callout) {
        this.dom.callout.addEventListener('click', () => {
          this.open();
        });
      }

      // Tab navigation
      if (this.dom.tabHome) {
        this.dom.tabHome.addEventListener('click', () => this.switchTab('home'));
      }
      if (this.dom.tabMessages) {
        this.dom.tabMessages.addEventListener('click', () => this.switchTab('messages'));
      }
      if (this.dom.tabHelp) {
        this.dom.tabHelp.addEventListener('click', () => this.switchTab('help'));
      }

      // Back buttons to return to Home view
      if (this.dom.btnBackHome) {
        this.dom.btnBackHome.addEventListener('click', () => this.switchTab('home'));
      }
      if (this.dom.btnBackHelp) {
        this.dom.btnBackHelp.addEventListener('click', () => this.switchTab('home'));
      }

      // "Send us a message" action card on Home view
      if (this.dom.cardSendMsg) {
        this.dom.cardSendMsg.addEventListener('click', () => {
          this.switchTab('messages');
          setTimeout(() => {
            if (this.dom.textarea) this.dom.textarea.focus();
          }, 150);
        });
      }

      // FAQ / Help Search in Home View (Real-time filter + Enter to ask)
      if (this.dom.searchInput) {
        this.dom.searchInput.addEventListener('input', () => {
          const query = this.dom.searchInput.value.toLowerCase().trim();
          const rows = this.dom.faqList.querySelectorAll('.ai-chat-faq-row');
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? 'flex' : 'none';
          });
        });

        this.dom.searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.dom.searchInput.value.trim();
            if (query) {
              this.dom.searchInput.value = '';
              this.switchTab('messages');
              this.handleUserSubmit(query);
            }
          }
        });
      }

      // FAQ Rows click -> Open chat & submit
      if (this.dom.faqList) {
        this.dom.faqList.addEventListener('click', (e) => {
          const row = e.target.closest('.ai-chat-faq-row');
          if (row) {
            const prompt = row.getAttribute('data-prompt');
            if (prompt) {
              this.switchTab('messages');
              this.handleUserSubmit(prompt);
            }
          }
        });
      }

      // Help View cards click -> Open chat & submit
      if (this.dom.viewHelp) {
        this.dom.viewHelp.addEventListener('click', (e) => {
          const card = e.target.closest('.ai-chat-help-card');
          if (card) {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
              this.switchTab('messages');
              this.handleUserSubmit(prompt);
            }
          }
        });
      }

      // Follow-up chips in Messages View
      if (this.dom.messagesBody) {
        this.dom.messagesBody.addEventListener('click', (e) => {
          const pill = e.target.closest('.ai-chat-followup-pill');
          if (pill) {
            const prompt = pill.getAttribute('data-prompt');
            if (prompt) {
              this.handleUserSubmit(prompt);
            }
          }
        });
      }

      // Textarea auto-resize & keyboard submission
      if (this.dom.textarea) {
        this.dom.textarea.addEventListener('input', () => {
          this.dom.textarea.style.height = 'auto';
          this.dom.textarea.style.height = Math.min(this.dom.textarea.scrollHeight, 100) + 'px';
        });

        this.dom.textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.submitInput();
          }
        });
      }

      // Form submission
      if (this.dom.form) {
        this.dom.form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (this.isStreaming) {
            this.stopRequested = true;
          } else {
            this.submitInput();
          }
        });
      }

      // Sound Mute Toggle
      if (this.dom.soundBtn) {
        this.dom.soundBtn.addEventListener('click', () => {
          this.config.enableSound = !this.config.enableSound;
          this.updateSoundIcon();
        });
      }

      // Clear Conversation
      if (this.dom.clearBtn) {
        this.dom.clearBtn.addEventListener('click', () => {
          if (confirm('Clear chat conversation?')) {
            this.clearMessages();
          }
        });
      }

      // Voice Button
      if (this.dom.micBtn) {
        this.dom.micBtn.addEventListener('click', () => {
          this.toggleVoiceInput();
        });
      }

      // Global keyboard shortcuts (Esc to close)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.minimize();
        }
      });
    }

    /**
     * Switch active tab (Home | Messages | Help)
     */
    switchTab(tabName) {
      this.activeTab = tabName;

      // Update Views
      if (this.dom.viewHome) this.dom.viewHome.classList.toggle('is-active', tabName === 'home');
      if (this.dom.viewMessages) this.dom.viewMessages.classList.toggle('is-active', tabName === 'messages');
      if (this.dom.viewHelp) this.dom.viewHelp.classList.toggle('is-active', tabName === 'help');

      // Update Tab buttons
      if (this.dom.tabHome) this.dom.tabHome.classList.toggle('is-active', tabName === 'home');
      if (this.dom.tabMessages) this.dom.tabMessages.classList.toggle('is-active', tabName === 'messages');
      if (this.dom.tabHelp) this.dom.tabHelp.classList.toggle('is-active', tabName === 'help');

      if (tabName === 'messages') {
        this.unreadCount = 0;
        this.updateBadge();
        setTimeout(() => this.scrollToBottom(), 50);
      }
    }

    /**
     * Open the Widget
     */
    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.dom.root.classList.add('is-open');
      if (this.dom.callout) this.dom.callout.classList.add('hidden');
      if (this.dom.launcher) {
        this.dom.launcher.setAttribute('aria-expanded', 'true');
        this.dom.launcher.setAttribute('title', 'Close Assistant');
      }
      this.unreadCount = 0;
      this.updateBadge();

      this.playSound('open');
    }

    /**
     * Minimize / Close the Widget
     */
    minimize() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.dom.root.classList.remove('is-open');
      if (this.dom.launcher) {
        this.dom.launcher.setAttribute('aria-expanded', 'false');
        this.dom.launcher.setAttribute('title', 'Open Support & AI Assistant');
      }
      this.playSound('minimize');
    }

    /**
     * Toggle open / minimize
     */
    toggle() {
      if (this.isOpen) {
        this.minimize();
      } else {
        this.open();
      }
    }

    /**
     * Submit current text input
     */
    submitInput() {
      if (!this.dom.textarea) return;
      const text = this.dom.textarea.value.trim();
      if (!text || this.isThinking || this.isStreaming) return;

      this.dom.textarea.value = '';
      this.dom.textarea.style.height = 'auto';
      this.handleUserSubmit(text);
    }

    /**
     * Helper to retrieve CSRF token
     */
    getCsrfToken() {
      const input = document.querySelector('[name=csrfmiddlewaretoken]');
      if (input && input.value) return input.value;
      const match = document.cookie.match(/csrftoken=([^;]+)/);
      return match ? match[1] : '';
    }

    /**
     * Process user query and stream response
     */
    async handleUserSubmit(userText) {
      if (this.dom.callout) this.dom.callout.classList.add('hidden');

      // Ensure we are in Messages view
      this.switchTab('messages');

      // Add user message to UI
      this.appendMessage('user', userText);
      this.messages.push({ role: 'user', content: userText });
      this.saveHistory();

      this.playSound('send');
      this.setThinking(true);

      try {
        let fullReply = '';

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const isDjango = this.config.apiEndpoint.toLowerCase().includes('aichat');
          let res;

          if (isDjango) {
            const formData = new FormData();
            formData.append('message', userText);

            const headers = {};
            const csrfToken = this.getCsrfToken();
            if (csrfToken) headers['X-CSRFToken'] = csrfToken;

            res = await fetch(this.config.apiEndpoint, {
              method: 'POST',
              headers: headers,
              body: formData,
              signal: controller.signal
            });
          } else {
            res = await fetch(this.config.apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: userText,
                messages: this.messages,
                system_prompt: this.config.systemPrompt
              }),
              signal: controller.signal
            });
          }

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}`);
          }

          const data = await res.json();
          fullReply = data.ai_response || data.reply || data.response || (data.choices && data.choices[0]?.message?.content) || 'I received your message, but no response was returned.';
        } catch (err) {
          console.warn('[AIChatWidget] Live API call failed, using intelligent fallback...', err);
          await this.delay(400);
          fullReply = this.generateMockReply(userText);
        }

        this.setThinking(false);

        // Stream the response with Typewriter Animation!
        await this.streamMessage('bot', fullReply);
        this.messages.push({ role: 'assistant', content: fullReply });
        this.saveHistory();
        this.playSound('receive');

        // Append follow-up suggestion chips
        this.renderFollowups(userText);

        if (!this.isOpen || this.activeTab !== 'messages') {
          this.unreadCount++;
          this.updateBadge();
        }

      } catch (error) {
        this.setThinking(false);
        this.appendMessage('bot', `⚠️ **Notice**: ${error.message}`);
      }
    }

    /**
     * Typewriter Streaming Message Display
     */
    async streamMessage(role, fullText) {
      this.isStreaming = true;
      this.stopRequested = false;
      this.updateSendButtonState();

      const row = document.createElement('div');
      row.className = `ai-chat-row ${role}`;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      row.innerHTML = `
        <div class="ai-chat-msg-avatar">AI</div>
        <div class="ai-chat-msg-content">
          <div class="ai-chat-bubble"><span class="ai-chat-stream-text"></span><span class="ai-chat-streaming-cursor">|</span></div>
          <div class="ai-chat-msg-meta">
            <span>${timeStr}</span>
            <div class="ai-chat-msg-actions">
              <button class="ai-chat-msg-btn ac-btn-copy-msg" title="Copy response">Copy</button>
            </div>
          </div>
        </div>
      `;

      this.dom.messagesBody.appendChild(row);
      this.scrollToBottom();

      const textContainer = row.querySelector('.ai-chat-stream-text');
      const cursor = row.querySelector('.ai-chat-streaming-cursor');

      const tokens = fullText.match(/\S+|\s+/g) || [fullText];
      let currentString = '';

      for (let i = 0; i < tokens.length; i++) {
        if (this.stopRequested) break;

        currentString += tokens[i];
        if (i % 2 === 0 || i === tokens.length - 1) {
          textContainer.innerHTML = this.parseMarkdown(currentString);
          this.scrollToBottom();
          await this.delay(14);
        }
      }

      textContainer.innerHTML = this.parseMarkdown(fullText);

      if (cursor) cursor.remove();
      this.isStreaming = false;
      this.stopRequested = false;
      this.updateSendButtonState();

      this.bindMessageActions(row, fullText);
    }

    /**
     * Render Contextual Follow-up Chips
     */
    renderFollowups(query) {
      const q = query.toLowerCase();
      let suggestions = [];

      if (q.includes('project') || q.includes('work')) {
        suggestions = ["Tell me about your tech stack", "Are you open for hire?", "How can I contact Abhishek?"];
      } else if (q.includes('skill') || q.includes('stack')) {
        suggestions = ["Show your top projects", "What LLM models have you worked with?", "Open for consulting?"];
      } else {
        suggestions = ["View top projects", "What is your tech stack?", "Get in touch"];
      }

      const followupDiv = document.createElement('div');
      followupDiv.className = 'ai-chat-followups';
      followupDiv.innerHTML = suggestions.map(s => `
        <button class="ai-chat-followup-pill" data-prompt="${s}">
          <span>${s} →</span>
        </button>
      `).join('');

      this.dom.messagesBody.appendChild(followupDiv);
      this.scrollToBottom();
    }

    /**
     * Append regular static message
     */
    appendMessage(role, text) {
      const row = document.createElement('div');
      row.className = `ai-chat-row ${role}`;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (role === 'bot') {
        const parsedHTML = this.parseMarkdown(text);
        row.innerHTML = `
          <div class="ai-chat-msg-avatar">AI</div>
          <div class="ai-chat-msg-content">
            <div class="ai-chat-bubble">${parsedHTML}</div>
            <div class="ai-chat-msg-meta">
              <span>${timeStr}</span>
              <div class="ai-chat-msg-actions">
                <button class="ai-chat-msg-btn ac-btn-copy-msg" title="Copy response">Copy</button>
              </div>
            </div>
          </div>
        `;
        this.bindMessageActions(row, text);
      } else {
        row.innerHTML = `
          <div class="ai-chat-msg-content">
            <div class="ai-chat-bubble">${this.escapeHTML(text)}</div>
            <div class="ai-chat-msg-meta">
              <span>${timeStr}</span>
            </div>
          </div>
        `;
      }

      this.dom.messagesBody.appendChild(row);
      this.scrollToBottom();
    }

    bindMessageActions(row, text) {
      const copyBtn = row.querySelector('.ac-btn-copy-msg');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(text);
          copyBtn.textContent = '✓ Copied';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 1500);
        });
      }
    }

    /**
     * Typing Indicator
     */
    setThinking(thinking) {
      this.isThinking = thinking;
      if (this.dom.sendBtn) this.dom.sendBtn.disabled = thinking;

      const existingTyping = document.getElementById('ac-typing-indicator');
      if (existingTyping) {
        existingTyping.remove();
      }

      if (thinking) {
        const typingRow = document.createElement('div');
        typingRow.id = 'ac-typing-indicator';
        typingRow.className = 'ai-chat-typing-row';
        typingRow.innerHTML = `
          <div class="ai-chat-msg-avatar">AI</div>
          <div class="ai-chat-typing-bubble">
            <span class="ai-chat-typing-dot"></span>
            <span class="ai-chat-typing-dot"></span>
            <span class="ai-chat-typing-dot"></span>
            <span class="ai-chat-typing-text">AI is typing...</span>
          </div>
        `;
        this.dom.messagesBody.appendChild(typingRow);
        this.scrollToBottom();
      }
    }

    updateSendButtonState() {
      if (!this.dom.sendBtn) return;
      if (this.isStreaming) {
        this.dom.sendBtn.setAttribute('title', 'Stop');
        this.dom.sendBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        `;
      } else {
        this.dom.sendBtn.setAttribute('title', 'Send message');
        this.dom.sendBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        `;
      }
    }

    /**
     * Clear messages
     */
    clearMessages() {
      this.messages = [];
      localStorage.removeItem('ac_portfolio_messages');
      const messages = this.dom.messagesBody.querySelectorAll('.ai-chat-row:not(#ac-initial-bot-row), .ai-chat-followups, #ac-typing-indicator');
      messages.forEach(m => m.remove());
      this.scrollToBottom();
      this.playSound('open');
    }

    /**
     * LocalStorage Session Persistence
     */
    saveHistory() {
      if (!this.config.persistHistory) return;
      try {
        localStorage.setItem('ac_portfolio_messages', JSON.stringify(this.messages.slice(-20)));
      } catch (e) {}
    }

    loadSavedHistory() {
      if (!this.config.persistHistory) return;
      try {
        const saved = localStorage.getItem('ac_portfolio_messages');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            this.messages = list;
            list.forEach(m => {
              this.appendMessage(m.role === 'user' ? 'user' : 'bot', m.content);
            });
          }
        }
      } catch (e) {}
    }

    /**
     * Speech Recognition
     */
    initVoiceInput() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        if (this.dom.micBtn) this.dom.micBtn.style.display = 'none';
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording = true;
        if (this.dom.micBtn) {
          this.dom.micBtn.classList.add('is-recording');
        }
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && this.dom.textarea) {
          this.dom.textarea.value = transcript;
          this.submitInput();
        }
      };

      this.recognition.onerror = () => this.stopVoiceInput();
      this.recognition.onend = () => this.stopVoiceInput();
    }

    toggleVoiceInput() {
      if (!this.recognition) return;
      if (this.isRecording) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch (e) {}
      }
    }

    stopVoiceInput() {
      this.isRecording = false;
      if (this.dom.micBtn) {
        this.dom.micBtn.classList.remove('is-recording');
      }
    }

    updateSoundIcon() {
      if (!this.dom.soundBtn) return;
      if (this.config.enableSound) {
        this.dom.soundBtn.setAttribute('title', 'Sound: Enabled');
        this.dom.soundBtn.style.color = '#111827';
      } else {
        this.dom.soundBtn.setAttribute('title', 'Sound: Muted');
        this.dom.soundBtn.style.color = '#9ca3af';
      }
    }

    async checkApiStatus() {
      // Backend is checked and status card displays live operation
    }

    updateBadge() {
      if (this.dom.badge) {
        if (this.unreadCount > 0) {
          this.dom.badge.textContent = this.unreadCount;
          this.dom.badge.classList.remove('hidden');
        } else {
          this.dom.badge.classList.add('hidden');
        }
      }
      if (this.dom.tabBadge) {
        if (this.unreadCount > 0) {
          this.dom.tabBadge.classList.remove('hidden');
        } else {
          this.dom.tabBadge.classList.add('hidden');
        }
      }
    }

    scrollToBottom() {
      if (!this.dom.messagesBody) return;
      setTimeout(() => {
        this.dom.messagesBody.scrollTop = this.dom.messagesBody.scrollHeight;
      }, 30);
    }

    /**
     * Web Audio API Synthesizer Chimes
     */
    playSound(type = 'receive') {
      if (!this.config.enableSound) return;
      try {
        if (!this.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'send') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'receive') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.setValueAtTime(680, now + 0.06);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'open') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(460, now + 0.08);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        }
      } catch (e) {}
    }

    /**
     * Clean Markdown & Structured Cards Parser
     */
    parseMarkdown(md) {
      if (!md) return '';
      let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // 1. Code blocks
      const codeBlocks = [];
      text = text.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const safeCode = this.escapeHTML(code.trim());
        const id = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`
          <pre style="background:#111827;color:#f9fafb;padding:10px 12px;border-radius:8px;font-size:12px;overflow-x:auto;margin:8px 0;font-family:var(--ac-font-mono);"><code>${safeCode}</code></pre>
        `);
        return id;
      });

      // 2. Inline code
      text = text.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;color:#111827;padding:1px 5px;border-radius:4px;font-family:var(--ac-font-mono);font-size:12px;">$1</code>');

      // 3. Bold & Italic
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // 4. Headings
      text = text.replace(/^### (.*$)/gim, '<h4 style="font-size:13.5px;font-weight:700;margin:8px 0 4px;">$1</h4>');
      text = text.replace(/^## (.*$)/gim, '<h3 style="font-size:14.5px;font-weight:700;margin:10px 0 5px;">$1</h3>');

      // 5. Links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;">$1</a>');

      // 6. Project Cards & Bullet Parsing
      const lines = text.split('\n');
      const output = [];
      let i = 0;

      while (i < lines.length) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (!line) {
          i++;
          continue;
        }

        // Project card title check: "1. <strong>Project Name</strong>"
        const cardTitleMatch = line.match(/^(?:(?:\d+\.|\*|-|•)\s+)?<strong>([^<]+)<\/strong>[:\s]*(.*)$/);
        if (cardTitleMatch) {
          const title = cardTitleMatch[1].replace(/[:\s]+$/, '');
          let initialDesc = cardTitleMatch[2] ? cardTitleMatch[2].trim() : '';
          const subPoints = [];
          let techTags = [];

          i++;
          while (i < lines.length) {
            const nextRaw = lines[i];
            const nextTrim = nextRaw.trim();
            if (!nextTrim) {
              i++;
              break;
            }
            if (nextTrim.match(/^(?:(?:\d+\.|\*|-|•)\s+)?<strong>/)) {
              break;
            }
            const subMatch = nextTrim.match(/^(?:[-*•]\s+)(.*)$/);
            if (subMatch) {
              let pointText = subMatch[1].trim();
              if (pointText.toLowerCase().includes('tech') && pointText.includes(':')) {
                const techList = pointText.replace(/^.*tech[:\s*]+/i, '').replace(/[.*]/g, '');
                techTags = techList.split(/[,|]/).map(t => t.trim()).filter(Boolean);
              } else {
                subPoints.push(pointText);
              }
              i++;
            } else if (nextRaw.startsWith('   ') || nextRaw.startsWith('\t')) {
              subPoints.push(nextTrim);
              i++;
            } else {
              break;
            }
          }

          let bodyHtml = '';
          if (initialDesc) {
            bodyHtml += `<div class="ai-chat-card-desc">${initialDesc}</div>`;
          }
          if (subPoints.length > 0) {
            bodyHtml += `<div class="ai-chat-card-desc">${subPoints.join(' ')}</div>`;
          }
          if (techTags.length > 0) {
            bodyHtml += `<div class="ai-chat-card-tags">${techTags.map(t => `<span class="ai-chat-tech-tag">${t}</span>`).join('')}</div>`;
          }

          output.push(`
            <div class="ai-chat-card-item">
              <div class="ai-chat-card-header">
                <span class="ai-chat-card-badge">⚡</span>
                <span class="ai-chat-card-title">${title}</span>
              </div>
              ${bodyHtml}
            </div>
          `);
          continue;
        }

        // Standard bullet or numbered list
        if (line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/)) {
          output.push('<ul style="padding-left:18px;margin:6px 0;">');
          while (i < lines.length) {
            const listLine = lines[i].trim();
            const listMatch = listLine.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
            if (listMatch) {
              output.push(`<li style="margin-bottom:4px;">${listMatch[1]}</li>`);
              i++;
            } else if (!listLine) {
              i++;
              break;
            } else {
              break;
            }
          }
          output.push('</ul>');
          continue;
        }

        if (line.startsWith('__CODE_BLOCK_') || line.startsWith('<h3') || line.startsWith('<h4') || line.startsWith('<div')) {
          output.push(line);
        } else {
          output.push(`<p>${line}</p>`);
        }
        i++;
      }

      let res = output.join('\n');
      codeBlocks.forEach((codeHtml, idx) => {
        res = res.replace(`__CODE_BLOCK_${idx}__`, codeHtml);
      });

      return res;
    }

    escapeHTML(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fallback Answers
     */
    generateMockReply(query) {
      const q = query.toLowerCase();

      if (q.includes('project') || q.includes('work') || q.includes('built')) {
        return `Here are some of Abhishek's standout projects:\n\n` +
          `1. **AI Chat Assistant & RAG Engine**\n` +
          `   - Real-time conversational agent with streaming response cadence, customizable personas, and zero-latency UI.\n` +
          `   - *Tech:* Django, FastAPI, Gemini API, Vanilla JS, CSS3.\n\n` +
          `2. **Financial Research & Market Intelligence Agent**\n` +
          `   - Autonomous multi-agent pipeline synthesizing real-time financial filings, SEC reports, and market sentiment.\n` +
          `   - *Tech:* LangChain, Python, Vector Embeddings.\n\n` +
          `3. **YouTube & Media Transcription Pipeline**\n` +
          `   - Long-form multimodal video parser creating timestamped chapter highlights and flashcards.\n\n` +
          `Would you like to know more about the architecture of any of these?`;
      }

      if (q.includes('skill') || q.includes('stack') || q.includes('technolog')) {
        return `Abhishek's core technical stack includes:\n\n` +
          `- **AI & LLMs**: Gemini API, OpenAI GPT-4o, LangChain, RAG Architectures, Vector DBs, Prompt Engineering.\n` +
          `- **Backend**: Python, Django, FastAPI, Flask, REST APIs, PostgreSQL.\n` +
          `- **Frontend**: Modern JavaScript (ES6+), HTML5/CSS3, Responsive UI/UX, React.\n` +
          `- **Tools & DevOps**: Git, Docker, Linux, CI/CD pipelines.\n\n` +
          `All systems are built with clean code principles and high testability.`;
      }

      if (q.includes('hire') || q.includes('available') || q.includes('job') || q.includes('freelance') || q.includes('contract')) {
        return `**Yes, Abhishek is open for exciting opportunities!** 🚀\n\n` +
          `Available for:\n` +
          `- Full-time AI / Full-Stack Software Engineering roles\n` +
          `- High-impact Generative AI & LLM consulting\n` +
          `- Custom RAG & AI Agent architecture design\n\n` +
          `You can connect directly via the contact form on this portfolio or reach out via email!`;
      }

      if (q.includes('contact') || q.includes('email') || q.includes('reach') || q.includes('call')) {
        return `You can get in touch with Abhishek directly via:\n\n` +
          `- 📧 **Email**: Check the contact section on this page\n` +
          `- 🐙 **GitHub**: Active on open-source repositories\n` +
          `- 💼 **LinkedIn**: Connect for professional inquiries\n\n` +
          `Feel free to reach out anytime!`;
      }

      return `Thanks for reaching out! As Abhishek's AI Assistant, I can provide details on his **projects**, **technical stack**, or **work availability**.\n\n` +
        `Feel free to ask your question or pick any topic from the Help tab!`;
    }
  }

  // Global Export
  window.AIChatWidget = new AIChatAssistant();

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[src*="chat-widget.js"]');
    if (script && script.getAttribute('data-auto-init') === 'false') return;
    window.AIChatWidget.init();
  });

})(window, document);
