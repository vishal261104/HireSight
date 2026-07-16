'use strict';

const API_BASE = window.location.origin;

const SKILL_SUGGESTIONS = [
  'Generative AI', 'Machine Learning', 'Deep Learning', 'Natural Language Processing',
  'Computer Vision', 'Python', 'JavaScript', 'TypeScript', 'React', 'Next.js',
  'Node.js', 'Vue.js', 'Angular', 'Flutter', 'Swift', 'Kotlin',
  'Data Science', 'Data Analytics', 'Data Engineering', 'Power BI', 'Tableau',
  'DevOps', 'Kubernetes', 'Docker', 'AWS', 'Azure', 'Google Cloud',
  'Full Stack Development', 'Backend Development', 'Frontend Development',
  'Cybersecurity', 'Blockchain', 'Web3', 'AR/VR', 'Embedded Systems',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL',
  'Prompt Engineering', 'LLM Fine-tuning', 'MLOps',
];

const TYPED_PHRASES = [
  'Real Opportunities.',
  'Industry Demand.',
  'Career Success.',
  'Your Dream Job.',
  'Market Insights.',
];

const $ = (id) => document.getElementById(id);

const DOM = {
  form:            $('search-form'),
  skillInput:      $('skill-input'),
  locationInput:   $('location-input'),
  skillGroup:      $('skill-group'),
  skillError:      $('skill-error'),
  locationError:   $('location-error'),
  searchBtn:       $('search-btn'),
  suggestions:     $('skill-suggestions'),
  pills:           document.querySelectorAll('.pill'),
  typedText:       $('typed-text'),

  loadingState:    $('loading-state'),
  errorState:      $('error-state'),
  resultsContent:  $('results-content'),
  errorMessage:    $('error-message'),
  retryBtn:        $('retry-btn'),
  newSearchBtn:    $('new-search-btn'),

  ls1: $('ls-1'),
  ls2: $('ls-2'),
  ls3: $('ls-3'),
  loadingSkillName: $('loading-skill-name'),

  statDemandVal:   $('stat-demand-val'),
  statSalaryVal:   $('stat-salary-val'),
  statGrowthVal:   $('stat-growth-val'),
  statJobsVal:     $('stat-jobs-val'),

  resultSkillDisplay:    $('result-skill-display'),
  resultLocationDisplay: $('result-location-display'),
  overviewText:    $('overview-text'),
  insightsList:    $('insights-list'),
  industriesTags:  $('industries-tags'),
  companiesTags:   $('companies-tags'),
  roadmapContainer:$('roadmap-container'),
  recSkillsTags:   $('rec-skills-tags'),
  recSkillsSection:$('rec-skills-section'),
  jobsList:        $('jobs-list'),
  jobsCountBadge:  $('jobs-count-badge'),

  chatSection:     $('chat-section'),
  chatForm:        $('chat-form'),
  chatInput:       $('chat-input'),
  chatMessages:    $('chat-messages'),
  chatSendBtn:     $('chat-send-btn'),
  chatExamples:    $('chat-examples'),
};

let lastQuery = { skill: '', location: '' };
let activeSuggestionIdx = -1;
let suggestionItems = [];
let typedInterval = null;
let sessionId = crypto.randomUUID();

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  const NUM = 60;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.2, 0.2),
      vy: rand(-0.4, -0.1),
      size: rand(1, 2.5),
      alpha: rand(0.1, 0.5),
      color: Math.random() > 0.5 ? '#7c3aed' : '#06b6d4',
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: NUM }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10) {
        particles[i] = createParticle();
        particles[i].y = canvas.height + 10;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
}

function initTypingAnimation() {
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const el = DOM.typedText;

  function tick() {
    const phrase = TYPED_PHRASES[phraseIdx];
    if (deleting) {
      charIdx--;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % TYPED_PHRASES.length;
        return setTimeout(tick, 400);
      }
      return setTimeout(tick, 40);
    } else {
      charIdx++;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === phrase.length) {
        deleting = true;
        return setTimeout(tick, 2400);
      }
      return setTimeout(tick, 70);
    }
  }

  tick();
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

function filterSuggestions(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 7);
}

function renderSuggestions(matches) {
  DOM.suggestions.innerHTML = '';
  activeSuggestionIdx = -1;
  suggestionItems = [];

  if (!matches.length) {
    DOM.suggestions.classList.remove('visible');
    return;
  }

  matches.forEach((match, i) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = match;
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', 'false');
    div.id = `suggestion-${i}`;

    div.addEventListener('click', () => {
      DOM.skillInput.value = match;
      DOM.suggestions.classList.remove('visible');
    });

    DOM.suggestions.appendChild(div);
    suggestionItems.push(div);
  });

  DOM.suggestions.classList.add('visible');
}

function closeSuggestions() {
  DOM.suggestions.classList.remove('visible');
  activeSuggestionIdx = -1;
}

DOM.skillInput.addEventListener('input', (e) => {
  const matches = filterSuggestions(e.target.value);
  renderSuggestions(matches);
  DOM.skillError.textContent = '';
  DOM.skillGroup.classList.remove('error');
});

DOM.skillInput.addEventListener('keydown', (e) => {
  if (!DOM.suggestions.classList.contains('visible')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSuggestionIdx = Math.min(activeSuggestionIdx + 1, suggestionItems.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSuggestionIdx = Math.max(activeSuggestionIdx - 1, 0);
  } else if (e.key === 'Enter' && activeSuggestionIdx >= 0) {
    e.preventDefault();
    DOM.skillInput.value = suggestionItems[activeSuggestionIdx].textContent;
    closeSuggestions();
    return;
  } else if (e.key === 'Escape') {
    closeSuggestions();
    return;
  }

  suggestionItems.forEach((item, i) => {
    const active = i === activeSuggestionIdx;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active) DOM.skillInput.setAttribute('aria-activedescendant', item.id);
  });
});

document.addEventListener('click', (e) => {
  if (!DOM.skillGroup.contains(e.target)) closeSuggestions();
});

DOM.pills.forEach((pill) => {
  pill.addEventListener('click', () => {
    DOM.skillInput.value = pill.dataset.skill;
    closeSuggestions();
    DOM.skillInput.focus();
  });
});

function validateForm() {
  let valid = true;
  const skill = DOM.skillInput.value.trim();

  if (!skill) {
    DOM.skillError.textContent = 'Please enter a skill to search.';
    DOM.skillInput.classList.add('error');
    valid = false;
  } else {
    DOM.skillError.textContent = '';
    DOM.skillInput.classList.remove('error');
  }

  return valid;
}

function showLoading(skill) {
  DOM.loadingSkillName.textContent = skill;
  setHidden(DOM.loadingState, false);
  setHidden(DOM.errorState, true);
  setHidden(DOM.resultsContent, true);

  const steps = [DOM.ls1, DOM.ls2, DOM.ls3];
  steps.forEach(s => s.classList.remove('active', 'done'));

  let i = 0;
  const interval = setInterval(() => {
    if (i > 0) steps[i - 1].classList.replace('active', 'done');
    if (i < steps.length) {
      steps[i].classList.add('active');
      i++;
    } else {
      clearInterval(interval);
    }
  }, 2200);

  return interval;
}

function showError(msg) {
  DOM.errorMessage.textContent = msg || 'An unexpected error occurred. Please try again.';
  setHidden(DOM.loadingState, true);
  setHidden(DOM.errorState, false);
  setHidden(DOM.resultsContent, true);
}

function setHidden(el, hidden) {
  if (hidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

function setButtonLoading(loading) {
  DOM.searchBtn.classList.toggle('loading', loading);
  DOM.searchBtn.disabled = loading;
}

function buildTag(text, type) {
  const span = document.createElement('span');
  span.className = `tag tag-${type}`;
  span.textContent = text;
  return span;
}

function renderTags(container, items, type) {
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<span style="color:var(--clr-text-3);font-size:.8rem">No data</span>';
    return;
  }
  items.forEach((item, i) => {
    const tag = buildTag(item, type);
    tag.style.animationDelay = `${i * 50}ms`;
    container.appendChild(tag);
  });
}

function renderRoadmap(paths) {
  DOM.roadmapContainer.innerHTML = '';
  if (!paths || !paths.length) return;

  paths.forEach((path, i) => {
    const item = document.createElement('div');
    item.className = 'roadmap-item';
    item.style.animationDelay = `${i * 80}ms`;
    item.innerHTML = `
      <div class="roadmap-node">${i + 1}</div>
      <div class="roadmap-label">${escapeHtml(path)}</div>
    `;
    DOM.roadmapContainer.appendChild(item);
  });
}

function getTypeBadgeClass(type) {
  if (!type) return 'badge-other';
  const t = type.toUpperCase();
  if (t.includes('FULL')) return 'badge-fulltime';
  if (t.includes('INTERN')) return 'badge-intern';
  return 'badge-other';
}

function getTypeLabel(type) {
  if (!type) return 'Job';
  const t = type.toUpperCase();
  if (t.includes('FULL')) return 'Full-time';
  if (t.includes('INTERN')) return 'Internship';
  return type;
}

function renderJobs(jobs) {
  DOM.jobsList.innerHTML = '';

  const count = jobs ? jobs.length : 0;
  DOM.jobsCountBadge.textContent = `${count} job${count !== 1 ? 's' : ''}`;
  DOM.statJobsVal.textContent = count;

  if (!count) {
    DOM.jobsList.innerHTML = `
      <div class="jobs-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 0.75rem;opacity:.4"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        <p>No job listings found.<br>Try a different skill or location.</p>
      </div>`;
    return;
  }

  jobs.forEach((job, i) => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('role', 'listitem');
    card.style.animationDelay = `${i * 60}ms`;

    const badgeClass = getTypeBadgeClass(job.type);
    const typeLabel  = getTypeLabel(job.type);
    const location   = job.location || 'India';
    const applyLink  = job.apply_link && job.apply_link !== '#'
      ? `<a href="${escapeHtml(job.apply_link)}" target="_blank" rel="noopener noreferrer" class="job-apply-link" aria-label="Apply for ${escapeHtml(job.title || 'this job')}">
           Apply Now
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>`
      : '';

    card.innerHTML = `
      <div class="job-header">
        <div class="job-title">${escapeHtml(job.title || 'Untitled Position')}</div>
        <span class="job-type-badge ${badgeClass}">${typeLabel}</span>
      </div>
      <div class="job-company">${escapeHtml(job.company || 'Company')}</div>
      <div class="job-meta">
        <span class="job-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHtml(location)}
        </span>
      </div>
      ${applyLink}
    `;

    DOM.jobsList.appendChild(card);
  });
}

function renderStats(data) {
  DOM.statSalaryVal.textContent = data.salary_range || '—';
  DOM.statGrowthVal.textContent = data.growth_rate  || '—';

  const level = (data.demand_level || 'High').toLowerCase();
  const levelClass = level === 'high' ? 'demand-high' : level === 'medium' ? 'demand-medium' : 'demand-low';
  DOM.statDemandVal.textContent = data.demand_level || '—';
  DOM.statDemandVal.className = `stat-value ${levelClass}`;
}

function renderInsights(insights) {
  DOM.insightsList.innerHTML = '';
  (insights || []).forEach(insight => {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.innerHTML = `<div class="insight-dot"></div><span>${escapeHtml(insight)}</span>`;
    DOM.insightsList.appendChild(div);
  });
}

function renderResults(data) {
  DOM.resultSkillDisplay.textContent = data.skill || lastQuery.skill;
  DOM.resultLocationDisplay.textContent = `📍 ${data.location || lastQuery.location}`;

  renderStats(data);

  DOM.overviewText.textContent = data.demand_overview || '';
  renderInsights(data.key_insights);

  renderTags(DOM.industriesTags, data.top_industries, 'industry');
  renderTags(DOM.companiesTags,  data.top_companies,  'company');

  renderRoadmap(data.career_paths);

  if (data.recommended_skills && data.recommended_skills.length) {
    renderTags(DOM.recSkillsTags, data.recommended_skills, 'skill');
    setHidden(DOM.recSkillsSection, false);
  } else {
    setHidden(DOM.recSkillsSection, true);
  }

  renderJobs(data.jobs);

  setHidden(DOM.loadingState, true);
  setHidden(DOM.errorState, true);
  setHidden(DOM.resultsContent, false);
  setHidden(DOM.chatSection, false);

  setTimeout(() => {
    DOM.resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

async function fetchSkillData(skill, location) {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill, location, session_id: sessionId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

async function handleSearch(e) {
  if (e) e.preventDefault();
  closeSuggestions();

  if (!validateForm()) return;

  const skill    = DOM.skillInput.value.trim();
  const location = DOM.locationInput.value.trim() || 'India';

  lastQuery = { skill, location };

  setButtonLoading(true);
  const loadingInterval = showLoading(skill);

  try {
    const result = await fetchSkillData(skill, location);
    clearInterval(loadingInterval);

    if (!result.success) {
      throw new Error(result.error || 'Agent returned an error.');
    }

    renderResults(result.data);
  } catch (err) {
    clearInterval(loadingInterval);
    console.error('[HireSight]', err);
    showError(err.message || 'Failed to connect to the HireSight API. Is the Flask server running?');
  } finally {
    setButtonLoading(false);
  }
}

DOM.form.addEventListener('submit', handleSearch);
DOM.retryBtn.addEventListener('click', () => handleSearch(null));
DOM.newSearchBtn.addEventListener('click', () => {
  setHidden(DOM.resultsContent, true);
  setHidden(DOM.errorState, true);
  setHidden(DOM.chatSection, true);
  
  sessionId = crypto.randomUUID();
  DOM.chatMessages.innerHTML = '';

  DOM.skillInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `chat-msg msg-${role}`;
  
  if (role === 'ai') {
    div.innerHTML = `
      <div class="msg-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>
      </div>
      <div class="msg-bubble">${escapeHtml(content)}</div>
    `;
  } else {
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(content)}</div>`;
  }
  
  DOM.chatMessages.appendChild(div);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function setChatLoading(isLoading) {
  DOM.chatInput.disabled = isLoading;
  DOM.chatSendBtn.disabled = isLoading;
  DOM.chatSendBtn.classList.toggle('loading', isLoading);
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  
  const text = DOM.chatInput.value.trim();
  if (!text) return;
  
  if (DOM.chatExamples) {
    DOM.chatExamples.style.display = 'none';
  }

  appendMessage('user', text);
  DOM.chatInput.value = '';
  setChatLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Chat failed');
    }

    appendMessage('ai', result.reply);
  } catch (err) {
    console.error('[Chat Error]', err);
    appendMessage('ai', 'Sorry, I ran into an error processing that request.');
  } finally {
    setChatLoading(false);
    DOM.chatInput.focus();
  }
}

DOM.chatForm.addEventListener('submit', handleChatSubmit);

document.querySelectorAll('.chat-example-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.chatInput.value = btn.dataset.msg;
    handleChatSubmit();
  });
});

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.step-card').forEach(card => {
    card.style.animationPlayState = 'paused';
    observer.observe(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initTypingAnimation();
  initNavbar();
  initScrollAnimations();
  DOM.skillInput.focus();
});
