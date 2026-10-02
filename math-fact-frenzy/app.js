(() => {
  'use strict';

  const APP_KEY = 'mathFactFrenzyDataV1';
  const ACTIVE_COOKIE = 'mff_active_profile';
  const PROFILE_COOKIE = 'mff_profile_index';
  const ROUND_SECONDS = 60;

  const AVATARS = [
    '🦊','🐼','🦄','🤖','🚀','🐙','🐯','🐸','🦁','🐨','🐧','🦋',
    '🐢','🐬','🦖','🐝','🦉','🐲','👾','🧙','🧜‍♀️','🥷','🦸‍♀️','🧑‍🚀'
  ];

  const OPS = {
    addition:       { label:'Addition',              symbol:'+',  className:'op-add',      color:'#25b6e8', operations:['addition'] },
    subtraction:    { label:'Subtraction',           symbol:'−',  className:'op-subtract', color:'#ff5e9c', operations:['subtraction'] },
    multiplication: { label:'Multiplication',        symbol:'×',  className:'op-multiply', color:'#6c63ff', operations:['multiplication'] },
    division:       { label:'Division',              symbol:'÷',  className:'op-divide',   color:'#29c889', operations:['division'] },
    addSub:         { label:'Add & Subtract',        symbol:'±',  className:'op-addsub',   color:'#ff7f66', operations:['addition','subtraction'], mixed:true },
    mulDiv:         { label:'Multiply & Divide',     symbol:'×÷', className:'op-muldiv',   color:'#6d66ed', operations:['multiplication','division'], mixed:true },
    mixedAll:       { label:'All Four Operations',   symbol:'★',  className:'op-mixedall', color:'#c767da', operations:['addition','subtraction','multiplication','division'], mixed:true }
  };

  const BASE_OP_KEYS = ['addition','subtraction','multiplication','division'];
  const ALL_MODE_KEYS = Object.keys(OPS);

  const LEVELS = {
    addition: [
      ['Add within 5', 0, 5], ['Add within 10', 0, 10], ['Add within 20', 0, 20], ['Add within 30', 0, 30],
      ['Add within 50', 0, 50], ['Add within 100', 0, 100], ['Two-digit + one-digit', 10, 99], ['Two-digit + two-digit', 10, 99]
    ],
    subtraction: [
      ['Subtract within 5', 0, 5], ['Subtract within 10', 0, 10], ['Subtract within 20', 0, 20], ['Subtract within 30', 0, 30],
      ['Subtract within 50', 0, 50], ['Subtract within 100', 0, 100], ['Two-digit − one-digit', 10, 99], ['Two-digit − two-digit', 10, 99]
    ],
    multiplication: [
      ['Facts × 0, 1, and 2', 0, 2], ['Facts through × 5', 0, 5], ['Facts through × 7', 0, 7], ['Facts through × 9', 0, 9],
      ['Facts through × 10', 0, 10], ['Facts through × 12', 0, 12], ['Challenge facts through × 15', 0, 15], ['Challenge facts through × 20', 0, 20]
    ],
    division: [
      ['Divide by 1 and 2', 1, 2], ['Divide by numbers through 5', 1, 5], ['Divide by numbers through 7', 1, 7], ['Divide by numbers through 9', 1, 9],
      ['Divide by numbers through 10', 1, 10], ['Divide by numbers through 12', 1, 12], ['Challenge divisors through 15', 1, 15], ['Challenge divisors through 20', 1, 20]
    ]
  };

  const ENCOURAGEMENT = [
    'Nice one!', 'Boom! You got it!', 'Math power!', 'Fantastic!', 'Keep rolling!', 'Yes!',
    'Great thinking!', 'On fire!', 'Super speedy!', 'You’re crushing it!', 'That fact is yours!', 'Way to go!'
  ];
  const WRONG_COACHING = [
    'You can fix it — try again! 💪', 'Almost! Give it another shot.', 'No worries — your brain is learning!',
    'Try that one again. You’ve got this!', 'Think it through — I’m cheering for you!'
  ];
  const NEXT_PROMPTS = [
    'Next one — let’s go! 🚀', 'Ready for another?', 'Keep that math brain moving!', 'Here comes the next one!',
    'You’re doing great — keep going!', 'Fact power activated! ⚡'
  ];
  const STREAK_ENCOURAGEMENT = {
    3: 'Three in a row! 🔥',
    5: 'Five straight! Amazing! 🔥🔥',
    10: 'TEN! You are unstoppable! 🚀'
  };

  let data = loadData();
  let activeProfileId = getCookie(ACTIVE_COOKIE) || null;
  let selectedOperation = 'addition';
  let selectedLevel = 1;
  let selectedPlayMode = 'timed';
  let editingProfileId = null;
  let chosenAvatar = AVATARS[0];
  let game = null;
  let soundOn = data.settings?.soundOn !== false;
  let audioCtx = null;

  const $ = (id) => document.getElementById(id);
  const screens = ['profileScreen','dashboardScreen','gameScreen','resultScreen'];

  init();

  function init() {
    data.settings ??= { soundOn:true };
    data.version = 3;
    data.profiles.forEach(ensureProfileShape);
    soundOn = data.settings.soundOn !== false;
    saveData();
    renderSoundButton();
    renderAvatarPicker();
    renderProfiles();
    renderOperationCards();
    bindEvents();

    if (activeProfileId && getProfile(activeProfileId)) openDashboard(activeProfileId);
    else showScreen('profileScreen');
  }

  function defaultData() {
    return { version:3, profiles:[], settings:{ soundOn:true } };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(APP_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.profiles)) return defaultData();
      return parsed;
    } catch {
      return defaultData();
    }
  }

  function saveData() {
    localStorage.setItem(APP_KEY, JSON.stringify(data));
    setCookie(PROFILE_COOKIE, JSON.stringify(data.profiles.map(p => ({ id:p.id, name:p.name, avatar:p.avatar }))), 3650);
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getCookie(name) {
    const prefix = name + '=';
    const found = document.cookie.split('; ').find(row => row.startsWith(prefix));
    return found ? decodeURIComponent(found.slice(prefix.length)) : null;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  function uid() {
    return crypto.randomUUID?.() || `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function newProfile(name, avatar) {
    return ensureProfileShape({
      id:uid(), name, avatar,
      createdAt:new Date().toISOString(),
      stats:{ totalCorrect:0, totalAttempts:0, totalCorrectAll:0, totalAttemptsAll:0, totalPlaySeconds:0, practiceSessions:0, bestStreak:0, gamesPlayed:0, overallBest:0 },
      unlocked:{ addition:1, subtraction:1, multiplication:1, division:1 },
      bestByOperation:{},
      sessions:[]
    });
  }

  function ensureProfileShape(p) {
    p.stats ??= {};
    p.sessions ??= [];
    p.sessions.forEach(s => {
      s.playMode ??= 'timed';
      s.durationSeconds ??= s.playMode === 'timed' ? ROUND_SECONDS : 0;
    });

    p.stats.totalCorrect ??= 0;
    p.stats.totalAttempts ??= 0;
    p.stats.bestStreak ??= 0;
    p.stats.gamesPlayed ??= 0;
    p.stats.overallBest ??= 0;

    // v3 adds true lifetime activity counters. For older profiles, timed-game
    // totals are the best available historical baseline; untimed practice was
    // intentionally not saved before v3.
    p.stats.totalCorrectAll ??= p.stats.totalCorrect;
    p.stats.totalAttemptsAll ??= p.stats.totalAttempts;
    p.stats.totalPlaySeconds ??= (p.stats.gamesPlayed || 0) * ROUND_SECONDS;
    p.stats.practiceSessions ??= p.sessions.filter(s => s.playMode === 'practice').length;

    p.unlocked ??= {};
    BASE_OP_KEYS.forEach(key => p.unlocked[key] ??= 1);
    p.bestByOperation ??= {};
    ALL_MODE_KEYS.forEach(key => p.bestByOperation[key] ??= 0);
    return p;
  }

  function getProfile(id = activeProfileId) {
    const p = data.profiles.find(x => x.id === id);
    return p ? ensureProfileShape(p) : null;
  }

  function showScreen(id) {
    screens.forEach(s => $(s).classList.toggle('active', s === id));
    $('settingsBtn').classList.toggle('hidden', id === 'profileScreen' || !activeProfileId || id === 'gameScreen');
    $('mainScreenBtn').classList.toggle('hidden', id === 'profileScreen');
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function goToMainScreen() {
    if (game && $('gameScreen').classList.contains('active')) {
      const prompt = game.playMode === 'practice'
        ? 'Leave this practice session and return to the player screen?'
        : 'Quit this game and return to the player screen? This round will not be saved.';
      if (!confirm(prompt)) return;
      if (game.timer) clearInterval(game.timer);
      game = null;
    } else if ($('resultScreen').classList.contains('active')) {
      game = null;
    }
    renderProfiles();
    showScreen('profileScreen');
  }

  function renderProfiles() {
    renderAllPlayersStats();
    const grid = $('profileGrid');
    grid.innerHTML = '';
    if (!data.profiles.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;background:white;border-radius:22px;">No players yet. Create one to start your first math sprint! 🎉</div>';
      return;
    }

    [...data.profiles].sort((a,b) => a.name.localeCompare(b.name)).forEach(profile => {
      ensureProfileShape(profile);
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.innerHTML = `
        <button class="profile-card-main" type="button" aria-label="Open ${escapeHtml(profile.name)}'s profile">
          <div class="avatar avatar-xl idle">${escapeHtml(profile.avatar)}</div>
          <strong>${escapeHtml(profile.name)}</strong>
          <span>${profile.stats.gamesPlayed} timed game${profile.stats.gamesPlayed === 1 ? '' : 's'} • ${profile.stats.practiceSessions} practice session${profile.stats.practiceSessions === 1 ? '' : 's'}</span>
          <div class="mini-badges"><em>⏱️ ${formatDuration(profile.stats.totalPlaySeconds)}</em><em>✏️ ${formatNumber(profile.stats.totalAttemptsAll)} attempts</em></div>
        </button>
        <button class="profile-export-button" type="button">⬇ Export ${escapeHtml(profile.name)}</button>`;
      card.querySelector('.profile-card-main').addEventListener('click', () => openDashboard(profile.id));
      card.querySelector('.profile-export-button').addEventListener('click', () => exportProfile(profile.id));
      grid.appendChild(card);
    });
  }

  function renderAvatarPicker() {
    const picker = $('avatarPicker');
    picker.innerHTML = '';
    AVATARS.forEach(avatar => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'avatar-choice';
      b.dataset.avatar = avatar;
      b.textContent = avatar;
      b.setAttribute('aria-label', `Choose ${avatar} avatar`);
      b.addEventListener('click', () => {
        chosenAvatar = avatar;
        [...picker.children].forEach(x => x.classList.toggle('selected', x.dataset.avatar === avatar));
      });
      picker.appendChild(b);
    });
  }

  function openProfileDialog(profileId = null) {
    editingProfileId = profileId;
    const profile = profileId ? getProfile(profileId) : null;
    $('profileDialogTitle').textContent = profile ? 'Edit player' : 'Create a player';
    $('playerName').value = profile?.name || '';
    chosenAvatar = profile?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
    [...$('avatarPicker').children].forEach(x => x.classList.toggle('selected', x.dataset.avatar === chosenAvatar));
    $('deleteProfileBtn').classList.toggle('hidden', !profile);
    $('profileDialog').showModal();
    setTimeout(() => $('playerName').focus(), 50);
  }

  function saveProfileFromDialog(e) {
    e.preventDefault();
    const name = $('playerName').value.trim();
    if (!name) { $('playerName').focus(); return; }

    if (editingProfileId) {
      const p = getProfile(editingProfileId);
      p.name = name;
      p.avatar = chosenAvatar;
    } else {
      const p = newProfile(name, chosenAvatar);
      data.profiles.push(p);
      activeProfileId = p.id;
      setCookie(ACTIVE_COOKIE, p.id, 3650);
    }

    saveData();
    $('profileDialog').close();
    renderProfiles();
    if (activeProfileId) openDashboard(activeProfileId);
  }

  function deleteActiveProfile() {
    if (!editingProfileId) return;
    const p = getProfile(editingProfileId);
    if (!confirm(`Delete ${p.name}'s profile and all saved progress on this device?`)) return;
    data.profiles = data.profiles.filter(x => x.id !== editingProfileId);
    if (activeProfileId === editingProfileId) {
      activeProfileId = null;
      deleteCookie(ACTIVE_COOKIE);
    }
    saveData();
    $('profileDialog').close();
    renderProfiles();
    showScreen('profileScreen');
  }

  function openDashboard(profileId) {
    const p = getProfile(profileId);
    if (!p) return;
    activeProfileId = profileId;
    setCookie(ACTIVE_COOKIE, profileId, 3650);
    selectedLevel = Math.min(selectedLevel, getUnlockedLevel(p, selectedOperation));
    $('dashboardAvatar').textContent = p.avatar;
    resetAvatarClasses($('dashboardAvatar'), 'idle');
    $('dashboardHeading').textContent = p.name;
    $('dashboardEncouragement').textContent = dashboardMessage(p);
    $('overallBest').textContent = p.stats.overallBest;
    $('bestStreak').textContent = p.stats.bestStreak;
    $('gamesPlayed').textContent = p.stats.gamesPlayed;
    renderOperationCards();
    renderPlayMode();
    renderLevels();
    renderProgress();
    showScreen('dashboardScreen');
  }

  function dashboardMessage(p) {
    if (!p.stats.gamesPlayed) return 'Pick a skill and start your first challenge — or practice with no timer!';
    const choices = [
      'Ready to beat your best score?',
      'Every round makes your math brain stronger.',
      `You’ve answered ${formatNumber(p.stats.totalCorrectAll)} facts correctly so far!`,
      'Fast facts, focused brain, big progress!'
    ];
    return choices[p.stats.gamesPlayed % choices.length];
  }

  function renderOperationCards() {
    const container = $('operationCards');
    if (!container) return;
    container.innerHTML = '';
    ALL_MODE_KEYS.forEach(key => {
      const op = OPS[key];
      const p = getProfile();
      const best = p?.bestByOperation?.[key] || 0;
      const level = getUnlockedLevel(p, key);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `operation-card ${op.className} ${selectedOperation === key ? 'active' : ''}`;
      btn.innerHTML = `<span class="operation-symbol">${op.symbol}</span><strong>${op.label}</strong><span class="operation-level">Level ${level} of 8</span><small>${selectedPlayMode === 'timed' ? `Best: ${best}` : 'Untimed practice'}</small>`;
      btn.addEventListener('click', () => {
        selectedOperation = key;
        const profile = getProfile();
        selectedLevel = Math.min(selectedLevel, getUnlockedLevel(profile, key));
        renderOperationCards();
        renderLevels();
      });
      container.appendChild(btn);
    });
  }

  function renderPlayMode() {
    document.querySelectorAll('[data-play-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.playMode === selectedPlayMode);
    });
    const practice = selectedPlayMode === 'practice';
    $('startGameText').textContent = practice ? 'Start untimed practice' : 'Start 60-second challenge';
    $('startGameSubtext').textContent = practice ? 'No points, no clock — stop whenever you want' : 'Press Enter or click to begin';
    renderOperationCards();
  }

  function getUnlockedLevel(profile, modeKey) {
    if (!profile) return 1;
    const keys = OPS[modeKey]?.operations || [modeKey];
    return Math.max(1, Math.min(...keys.map(key => profile.unlocked[key] || 1)));
  }

  function renderLevels() {
    const p = getProfile();
    if (!p) return;
    const unlocked = getUnlockedLevel(p, selectedOperation);
    selectedLevel = Math.max(1, Math.min(selectedLevel, unlocked));
    $('levelLabel').textContent = `Level ${selectedLevel}`;

    if (OPS[selectedOperation].mixed) {
      $('unlockMessage').textContent = unlocked < 8 ? `Mixed levels available through ${unlocked}` : 'All mixed levels available! 🌟';
    } else {
      $('unlockMessage').textContent = unlocked < 8 ? `Unlocked through level ${unlocked}` : 'All levels unlocked! 🌟';
    }

    $('levelDescription').textContent = levelDescription(selectedOperation, selectedLevel);
    const box = $('levelButtons');
    box.innerHTML = '';
    for (let level = 1; level <= 8; level++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = level;
      b.className = `level-button ${level === selectedLevel ? 'active' : ''} ${level > unlocked ? 'locked' : ''}`;
      b.disabled = level > unlocked;
      if (level > unlocked) {
        b.title = OPS[selectedOperation].mixed
          ? `Unlock Level ${level} in every included operation first`
          : `Score ${unlockTarget(level - 1)} or more on Level ${level - 1} to unlock`;
      } else b.title = `Play Level ${level}`;
      b.addEventListener('click', () => { selectedLevel = level; renderLevels(); });
      box.appendChild(b);
    }
  }

  function levelDescription(modeKey, level) {
    const mode = OPS[modeKey];
    const practiceSuffix = selectedPlayMode === 'practice'
      ? ' Untimed practice does not change points, best scores, or unlocked levels.'
      : '';

    if (mode.mixed) {
      const descriptions = mode.operations.map(key => LEVELS[key][level - 1][0]).join(' • ');
      return `${mode.label}: ${descriptions}. Mixed levels become available when that level is unlocked in every included operation.${practiceSuffix}`;
    }

    const cfg = LEVELS[modeKey][level - 1];
    let suffix = '';
    if (selectedPlayMode === 'timed') {
      suffix = level < 8
        ? ` Score ${unlockTarget(level)}+ correct to unlock Level ${level + 1}.`
        : ' This is the top challenge level!';
    }
    return `${cfg[0]}.${suffix}${practiceSuffix}`;
  }

  function unlockTarget(level) {
    return 18 + level * 2;
  }

  function startGame() {
    const p = getProfile();
    if (!p) return;

    game = {
      operation:selectedOperation,
      level:selectedLevel,
      playMode:selectedPlayMode,
      score:0,
      attempts:0,
      streak:0,
      bestStreak:0,
      startedAt:Date.now(),
      remaining:ROUND_SECONDS,
      question:null,
      previousSignature:null,
      timer:null,
      inputLocked:false
    };

    $('gameAvatar').textContent = p.avatar;
    resetAvatarClasses($('gameAvatar'), 'idle');
    $('gamePlayerName').textContent = p.name;
    $('gameModeLabel').textContent = `${OPS[selectedOperation].label} • Level ${selectedLevel} • ${selectedPlayMode === 'timed' ? '60-second challenge' : 'Untimed practice'}`;
    $('questionBadge').textContent = `${OPS[selectedOperation].label} • Level ${selectedLevel}`;
    $('scoreCounterLabel').textContent = selectedPlayMode === 'timed' ? 'Score' : 'Correct';
    $('scoreDisplay').textContent = '0';
    $('streakDisplay').textContent = '0 🔥';
    $('coachBubble').textContent = personalizedStartMessage(p.name);
    $('feedbackText').textContent = '';
    $('answerInput').value = '';
    $('answerInput').className = 'answer-input';
    $('timerBar').style.background = 'linear-gradient(90deg,var(--green),var(--cyan),var(--primary))';
    $('timerBar').style.width = '100%';
    $('timerText').textContent = ROUND_SECONDS;
    $('timerWrap').classList.toggle('hidden', selectedPlayMode === 'practice');
    $('practiceNotice').classList.toggle('hidden', selectedPlayMode !== 'practice');
    $('quitGameBtn').textContent = selectedPlayMode === 'practice' ? 'Finish practice' : 'Quit game';

    showScreen('gameScreen');
    nextQuestion();
    $('answerInput').focus();
    sound('start');

    if (selectedPlayMode === 'timed') game.timer = setInterval(tickGame, 250);
  }

  function personalizedStartMessage(name) {
    const options = [
      `Let’s go, ${name}! 🚀`,
      `I’m cheering for you, ${name}! ⭐`,
      'One fact at a time — you’ve got this!',
      'Ready... math powers ON! ⚡'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  function tickGame() {
    if (!game || game.playMode !== 'timed') return;
    const elapsed = (Date.now() - game.startedAt) / 1000;
    const remaining = Math.max(0, ROUND_SECONDS - elapsed);
    game.remaining = remaining;
    $('timerText').textContent = Math.ceil(remaining);
    $('timerBar').style.width = `${(remaining / ROUND_SECONDS) * 100}%`;
    if (remaining <= 10) $('timerBar').style.background = 'linear-gradient(90deg,#ffbd35,#ff5b65)';
    if (remaining <= 0) finishGame();
  }

  function nextQuestion() {
    if (!game) return;

    let question;
    do {
      question = makeQuestionForMode(game.operation, game.level);
    } while (game.previousSignature && questionSignature(question) === game.previousSignature);
    game.question = question;
    game.previousSignature = questionSignature(question);

    $('gameQuestion').textContent = `${question.a} ${OPS[question.op].symbol} ${question.b} = ?`;
    $('answerInput').value = '';
    $('answerInput').className = 'answer-input';
    $('feedbackText').textContent = '';
    $('feedbackText').className = 'feedback-text';
    game.inputLocked = false;

    if (game.score > 0 && Math.random() < .16) {
      $('coachBubble').textContent = NEXT_PROMPTS[Math.floor(Math.random() * NEXT_PROMPTS.length)];
      animateAvatar('bounce');
    }
    $('answerInput').focus();
  }

  function makeQuestionForMode(modeKey, level) {
    const baseOps = OPS[modeKey].operations;
    const baseOp = baseOps[rand(0, baseOps.length - 1)];
    return makeQuestion(baseOp, level);
  }

  function makeQuestion(op, level) {
    const cfg = LEVELS[op][level - 1];
    let a, b, answer;

    if (op === 'addition') {
      if (level <= 6) {
        const max = cfg[2];
        a = rand(0, max);
        b = rand(0, max - a);
      } else if (level === 7) {
        a = rand(10, 99);
        b = rand(1, 9);
      } else {
        a = rand(10, 99);
        b = rand(10, 99);
      }
      answer = a + b;
    } else if (op === 'subtraction') {
      if (level <= 6) {
        const max = cfg[2];
        a = rand(0, max);
        b = rand(0, a);
      } else if (level === 7) {
        a = rand(10, 99);
        b = rand(1, Math.min(9, a));
      } else {
        a = rand(10, 99);
        b = rand(10, a);
      }
      answer = a - b;
    } else if (op === 'multiplication') {
      const max = cfg[2];
      a = rand(0, max);
      b = rand(0, level === 1 ? 12 : max);
      if (level <= 6 && Math.random() < .5) b = rand(0, 12);
      answer = a * b;
    } else {
      const max = cfg[2];
      b = rand(1, max);
      const quotientMax = level <= 6 ? 12 : max;
      answer = rand(0, quotientMax);
      a = b * answer;
    }

    return { op, a, b, answer };
  }

  function questionSignature(q) {
    return `${q.op}|${q.a}|${q.b}`;
  }

  function submitAnswer() {
    if (!game || game.inputLocked) return;
    const raw = $('answerInput').value.trim();
    if (!raw || !/^-?\d+$/.test(raw)) return;
    const value = Number(raw);
    game.attempts++;

    if (value === game.question.answer) {
      game.inputLocked = true;
      game.score++;
      game.streak++;
      game.bestStreak = Math.max(game.bestStreak, game.streak);
      $('scoreDisplay').textContent = game.score;
      $('streakDisplay').textContent = `${game.streak} 🔥`;
      $('answerInput').classList.add('correct');

      const message = streakMessage(game.streak) || ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
      $('feedbackText').textContent = `✓ ${message}`;
      $('feedbackText').className = 'feedback-text good';
      $('coachBubble').textContent = message;

      if (game.streak > 0 && game.streak % 10 === 0) {
        animateAvatar('supercheer');
        burstConfetti(38);
      } else if (game.streak > 0 && game.streak % 5 === 0) {
        animateAvatar('dance');
      } else if (game.streak > 0 && game.streak % 3 === 0) {
        animateAvatar('spin');
      } else {
        animateAvatar('cheer');
      }
      sound('correct');
      setTimeout(nextQuestion, 360);
    } else {
      game.streak = 0;
      $('streakDisplay').textContent = '0 🔥';
      $('answerInput').classList.remove('correct');
      $('answerInput').classList.add('incorrect');
      $('feedbackText').textContent = 'Not quite — try it again!';
      $('feedbackText').className = 'feedback-text bad';
      $('coachBubble').textContent = WRONG_COACHING[Math.floor(Math.random() * WRONG_COACHING.length)];
      animateAvatar('wiggle');
      sound('wrong');
      $('answerInput').select();
      setTimeout(() => $('answerInput').classList.remove('incorrect'), 320);
    }
  }

  function streakMessage(streak) {
    if (STREAK_ENCOURAGEMENT[streak]) return STREAK_ENCOURAGEMENT[streak];
    if (streak > 10 && streak % 5 === 0) return `${streak} in a row! Keep dancing! ⭐`;
    return '';
  }

  function resetAvatarClasses(avatar, addClass = '') {
    avatar.classList.remove('cheer','wiggle','dance','bounce','spin','supercheer','idle');
    if (addClass) avatar.classList.add(addClass);
  }

  function animateAvatar(cls) {
    const avatar = $('gameAvatar');
    resetAvatarClasses(avatar);
    void avatar.offsetWidth;
    avatar.classList.add(cls);
    setTimeout(() => {
      if (game && $('gameScreen').classList.contains('active')) resetAvatarClasses(avatar, 'idle');
    }, cls === 'supercheer' ? 920 : 800);
  }

  function finishGame() {
    if (!game) return;
    if (game.timer) clearInterval(game.timer);
    const p = getProfile();
    const accuracy = game.attempts ? Math.round((game.score / game.attempts) * 100) : 0;
    const durationSeconds = game.playMode === 'timed'
      ? ROUND_SECONDS
      : Math.max(1, Math.round((Date.now() - game.startedAt) / 1000));
    let leveledUp = false;

    const session = {
      id:uid(),
      date:new Date().toISOString(),
      operation:game.operation,
      level:game.level,
      playMode:game.playMode,
      score:game.score,
      attempts:game.attempts,
      accuracy,
      bestStreak:game.bestStreak,
      durationSeconds
    };
    p.sessions.push(session);
    if (p.sessions.length > 500) p.sessions = p.sessions.slice(-500);

    // All activity contributes to lifetime practice totals. Untimed practice
    // still never changes points, best scores, or level unlocks.
    p.stats.totalCorrectAll += game.score;
    p.stats.totalAttemptsAll += game.attempts;
    p.stats.totalPlaySeconds += durationSeconds;
    p.stats.bestStreak = Math.max(p.stats.bestStreak, game.bestStreak);

    if (game.playMode === 'timed') {
      p.stats.gamesPlayed++;
      p.stats.totalCorrect += game.score;
      p.stats.totalAttempts += game.attempts;
      p.stats.overallBest = Math.max(p.stats.overallBest, game.score);
      p.bestByOperation[game.operation] = Math.max(p.bestByOperation[game.operation] || 0, game.score);

      if (!OPS[game.operation].mixed) {
        const unlocked = p.unlocked[game.operation] || 1;
        if (game.level === unlocked && game.level < 8 && game.score >= unlockTarget(game.level)) {
          p.unlocked[game.operation] = game.level + 1;
          leveledUp = true;
        }
      }
    } else {
      p.stats.practiceSessions++;
    }
    saveData();

    $('resultAvatar').textContent = p.avatar;
    resetAvatarClasses($('resultAvatar'), 'idle');
    $('resultScore').textContent = game.score;
    $('resultAccuracy').textContent = `${accuracy}%`;
    $('resultStreak').textContent = game.bestStreak;
    $('resultHeading').textContent = game.playMode === 'practice' ? practiceHeading(game.score) : resultHeading(game.score);
    $('resultSummary').textContent = game.playMode === 'practice'
      ? `You practiced ${game.score} fact${game.score === 1 ? '' : 's'} correctly. Practice counts toward your lifetime activity stats, but not points, records, or unlocked levels.`
      : resultSummary(game, accuracy, p);
    $('resultStars').textContent = game.score >= 30 ? '⭐ ⭐ ⭐' : game.score >= 15 ? '⭐ ⭐' : '⭐';

    $('levelUpBanner').classList.toggle('hidden', !leveledUp);
    if (leveledUp) $('levelUpBanner').textContent = `🎉 Level ${game.level + 1} unlocked for ${OPS[game.operation].label}!`;

    const canAdvance = game.level < getUnlockedLevel(p, game.operation);
    $('nextLevelBtn').classList.toggle('hidden', !canAdvance);
    $('nextLevelBtn').textContent = canAdvance ? `Play Level ${game.level + 1} →` : 'Next level →';
    $('playAgainBtn').textContent = game.playMode === 'practice' ? 'Practice again' : 'Play again';

    if (game.score >= 20 || leveledUp || (game.playMode === 'practice' && game.score >= 15)) burstConfetti(90);
    sound(leveledUp ? 'level' : 'finish');
    showScreen('resultScreen');
  }

  function practiceHeading(score) {
    if (score >= 30) return 'Fantastic practice!';
    if (score >= 15) return 'Great practice!';
    return 'Nice work!';
  }

  function resultHeading(score) {
    if (score >= 40) return 'Incredible speed!';
    if (score >= 30) return 'Fantastic round!';
    if (score >= 20) return 'Great work!';
    if (score >= 10) return 'Nice progress!';
    return 'You did it!';
  }

  function resultSummary(g, accuracy, p) {
    const best = p.bestByOperation[g.operation] || 0;
    if (g.score >= best && g.score > 0) return `That’s your best ${OPS[g.operation].label.toLowerCase()} score so far. Keep building that speed!`;
    if (accuracy >= 95) return 'Your accuracy was excellent. Speed will come with practice!';
    if (g.bestStreak >= 10) return `A ${g.bestStreak}-answer streak is something to celebrate!`;
    if (OPS[g.operation].mixed) return 'Mixed practice keeps your brain flexible — nice work switching between operations!';
    return 'Every round strengthens your recall. Want to go again?';
  }

  function quitGame() {
    if (!game) return;
    if (game.playMode === 'practice') {
      finishGame();
      return;
    }
    if (!confirm('Quit this game? This round will not be saved.')) return;
    if (game.timer) clearInterval(game.timer);
    game = null;
    openDashboard(activeProfileId);
  }

  function playAgain() {
    if (!game) return;
    selectedOperation = game.operation;
    selectedLevel = game.level;
    selectedPlayMode = game.playMode;
    startGame();
  }

  function playNextLevel() {
    if (!game) return;
    const p = getProfile();
    const next = game.level + 1;
    if (next > getUnlockedLevel(p, game.operation)) return;
    selectedOperation = game.operation;
    selectedPlayMode = game.playMode;
    selectedLevel = next;
    startGame();
  }

  function renderProgress() {
    const p = getProfile();
    if (!p) return;
    renderMasteryGrid(p);
    renderLifetimeStats(p);

    const list = $('recentSessions');
    list.innerHTML = '';
    if (!p.sessions.length) {
      list.innerHTML = '<div class="empty-state">Play a round or start an untimed practice session and your activity will appear here. 📈</div>';
      return;
    }

    p.sessions.slice(-8).reverse().forEach(s => {
      const op = OPS[s.operation] || OPS.addition;
      const row = document.createElement('div');
      row.className = 'session-row';
      const modeLabel = (s.playMode || 'timed') === 'practice' ? 'Practice' : 'Timed';
      const duration = formatDuration(s.durationSeconds ?? ((s.playMode || 'timed') === 'timed' ? ROUND_SECONDS : 0));
      row.innerHTML = `
        <span class="session-op" style="background:${op.color}">${op.symbol}</span>
        <span class="session-copy"><strong>${op.label} • Level ${s.level}</strong><small>${friendlyDate(s.date)} • ${modeLabel} • ${s.accuracy}% accuracy • ${duration}</small></span>
        <span class="session-score"><small>correct</small>${s.score}</span>`;
      list.appendChild(row);
    });
  }

  function renderMasteryGrid(p) {
    const grid = $('masteryGrid');
    grid.innerHTML = '';
    BASE_OP_KEYS.forEach(key => {
      const op = OPS[key];
      const level = Math.max(1, Math.min(8, p.unlocked[key] || 1));
      const directSessions = p.sessions.filter(s => s.operation === key);
      const attempts = directSessions.reduce((sum,s) => sum + (s.attempts || 0), 0);
      const correct = directSessions.reduce((sum,s) => sum + (s.score || 0), 0);
      const accuracy = attempts ? Math.round(correct / attempts * 100) : null;
      const best = p.bestByOperation[key] || 0;
      const card = document.createElement('div');
      card.className = 'mastery-card';
      card.innerHTML = `
        <div class="mastery-top">
          <span class="mastery-symbol" style="background:${op.color}">${op.symbol}</span>
          <span><strong>${op.label}</strong><small>Level ${level} of 8</small></span>
        </div>
        <div class="mastery-dots" aria-label="${level} of 8 levels unlocked">
          ${Array.from({length:8},(_,i) => `<i class="${i < level ? 'filled' : ''}" style="--skill-color:${op.color}"></i>`).join('')}
        </div>
        <div class="mastery-meta"><span>🏆 Best ${best}</span><span>${accuracy === null ? 'Accuracy —' : `🎯 ${accuracy}% accuracy`}</span></div>`;
      grid.appendChild(card);
    });
  }

  function renderLifetimeStats(p) {
    const stats = lifetimeStats(p);
    const levelTotal = BASE_OP_KEYS.reduce((sum,key) => sum + Math.max(1, Math.min(8, p.unlocked[key] || 1)), 0);
    const activeDays = new Set(p.sessions.map(s => String(s.date || '').slice(0,10)).filter(Boolean)).size;
    const items = [
      ['✏️','Questions attempted',formatNumber(stats.attempts)],
      ['✅','Correct answers',formatNumber(stats.correct)],
      ['🎯','Overall accuracy',stats.attempts ? `${Math.round(stats.correct / stats.attempts * 100)}%` : '—'],
      ['⏱️','Time played',formatDuration(stats.seconds)],
      ['⚡','Timed games',formatNumber(p.stats.gamesPlayed)],
      ['🌈','Practice sessions',formatNumber(p.stats.practiceSessions)],
      ['🔥','Best streak',formatNumber(p.stats.bestStreak)],
      ['🧩','Core levels open',`${levelTotal} / 32`],
      ['📅','Active days logged',formatNumber(activeDays)]
    ];
    $('progressStats').innerHTML = items.map(([icon,label,value]) => `
      <div class="progress-stat"><span>${icon}</span><strong>${value}</strong><small>${label}</small></div>`).join('');
  }

  function lifetimeStats(p) {
    ensureProfileShape(p);
    return {
      correct:p.stats.totalCorrectAll || 0,
      attempts:p.stats.totalAttemptsAll || 0,
      seconds:p.stats.totalPlaySeconds || 0
    };
  }

  function renderAllPlayersStats() {
    const box = $('allPlayersStats');
    if (!box) return;
    const totals = data.profiles.reduce((acc,p) => {
      const s = lifetimeStats(p);
      acc.correct += s.correct;
      acc.attempts += s.attempts;
      acc.seconds += s.seconds;
      acc.timed += p.stats.gamesPlayed || 0;
      acc.practice += p.stats.practiceSessions || 0;
      return acc;
    }, {correct:0,attempts:0,seconds:0,timed:0,practice:0});

    box.innerHTML = `
      <div class="all-players-label"><span>👨‍👩‍👧‍👦</span><div><strong>All players together</strong><small>Combined activity saved on this browser</small></div></div>
      <div class="all-players-stat"><strong>${formatDuration(totals.seconds)}</strong><small>Total time</small></div>
      <div class="all-players-stat"><strong>${formatNumber(totals.attempts)}</strong><small>Attempts</small></div>
      <div class="all-players-stat"><strong>${formatNumber(totals.correct)}</strong><small>Correct</small></div>
      <div class="all-players-stat"><strong>${totals.attempts ? Math.round(totals.correct/totals.attempts*100) + '%' : '—'}</strong><small>Accuracy</small></div>`;
  }

  function exportProfile(profileId = activeProfileId) {
    const p = getProfile(profileId);
    if (!p) return;
    downloadJson(`${slugify(p.name)}-math-fact-frenzy.json`, {
      app:'Math Fact Frenzy',
      version:3,
      exportType:'profile',
      exportedAt:new Date().toISOString(),
      profile:p
    });
  }

  function exportAllData() {
    if (!data.profiles.length) {
      alert('There are no player profiles to export yet.');
      return;
    }
    downloadJson('math-fact-frenzy-all-players.json', {
      app:'Math Fact Frenzy',
      version:3,
      exportType:'all-data',
      exportedAt:new Date().toISOString(),
      data
    });
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        const importedProfiles = extractImportedProfiles(imported);
        if (!importedProfiles.length) throw new Error('No valid player profiles were found.');

        if (importedProfiles.length > 1) {
          const okay = confirm(`This file contains ${importedProfiles.length} players. Import them into this browser? Existing players will be kept.`);
          if (!okay) return;
        }

        let firstImportedId = null;
        importedProfiles.forEach(rawProfile => {
          const copy = ensureProfileShape(deepClone(rawProfile));
          if (!copy.name || !copy.avatar || !Array.isArray(copy.sessions)) throw new Error('A player profile in this file is invalid.');
          copy.id = uid();
          copy.name = uniqueName(copy.name);
          data.profiles.push(copy);
          firstImportedId ??= copy.id;
        });
        saveData();
        renderProfiles();
        burstConfetti(Math.min(100, 35 + importedProfiles.length * 8));
        if (importedProfiles.length === 1 && firstImportedId) openDashboard(firstImportedId);
        else showScreen('profileScreen');
      } catch (err) {
        alert(`Could not import that file. ${err.message}`);
      } finally {
        $('importInput').value = '';
      }
    };
    reader.readAsText(file);
  }

  function extractImportedProfiles(imported) {
    if (imported?.profile) return [imported.profile];
    if (Array.isArray(imported?.data?.profiles)) return imported.data.profiles;
    if (Array.isArray(imported?.profiles)) return imported.profiles;
    if (imported?.name && imported?.avatar && Array.isArray(imported?.sessions)) return [imported];
    return [];
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uniqueName(name) {
    const names = new Set(data.profiles.map(p => p.name.toLowerCase()));
    if (!names.has(name.toLowerCase())) return name;
    let n = 2;
    while (names.has(`${name} ${n}`.toLowerCase())) n++;
    return `${name} ${n}`;
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toggleSound() {
    soundOn = !soundOn;
    data.settings.soundOn = soundOn;
    saveData();
    renderSoundButton();
    if (soundOn) sound('correct');
  }

  function renderSoundButton() {
    $('soundToggle').textContent = soundOn ? '🔊' : '🔇';
    $('soundToggle').setAttribute('aria-pressed', String(soundOn));
    $('soundToggle').title = soundOn ? 'Turn sound effects off' : 'Turn sound effects on';
  }

  function sound(type) {
    if (!soundOn) return;
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const tones = {
        correct:[[660,.055],[880,.07]],
        wrong:[[220,.07],[180,.09]],
        start:[[440,.06],[660,.07],[880,.08]],
        finish:[[523,.07],[659,.07],[784,.12]],
        level:[[523,.07],[659,.07],[784,.07],[1047,.18]]
      }[type] || [[440,.08]];
      let t = audioCtx.currentTime;
      tones.forEach(([freq,dur]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type === 'wrong' ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(.0001,t);
        gain.gain.exponentialRampToValueAtTime(.11,t+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t+dur+.01);
        t += dur * .82;
      });
    } catch {
      // Audio is optional and browser support can vary.
    }
  }

  function burstConfetti(count = 60) {
    const layer = $('confetti-layer');
    const colors = ['#6c63ff','#ff5e9c','#ffbd35','#29c889','#25b6e8','#ff715b'];
    for (let i=0; i<count; i++) {
      const piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random()*100}%`;
      piece.style.top = `${-20-Math.random()*40}px`;
      piece.style.background = colors[i%colors.length];
      piece.style.setProperty('--dur', `${2.1+Math.random()*1.8}s`);
      piece.style.setProperty('--rot', `${Math.random()*360}deg`);
      piece.style.setProperty('--drift', `${-110+Math.random()*220}px`);
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 4300);
    }
  }

  function bindEvents() {
    $('newProfileBtn').addEventListener('click', () => openProfileDialog());
    $('profileForm').addEventListener('submit', saveProfileFromDialog);
    $('deleteProfileBtn').addEventListener('click', deleteActiveProfile);
    $('settingsBtn').addEventListener('click', () => openProfileDialog(activeProfileId));
    $('homeBtn').addEventListener('click', goToMainScreen);
    $('mainScreenBtn').addEventListener('click', goToMainScreen);
    $('resultMainBtn').addEventListener('click', () => { game = null; goToMainScreen(); });
    $('soundToggle').addEventListener('click', toggleSound);
    $('startGameBtn').addEventListener('click', startGame);
    $('answerInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });

    document.querySelectorAll('[data-play-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPlayMode = btn.dataset.playMode;
        renderPlayMode();
        renderLevels();
      });
    });

    document.addEventListener('keydown', e => {
      if ($('dashboardScreen').classList.contains('active') && e.key === 'Enter' && !document.querySelector('dialog[open]')) startGame();
    });

    document.querySelectorAll('.keypad button').forEach(btn => btn.addEventListener('click', () => {
      if (!game || game.inputLocked) return;
      const key = btn.dataset.key;
      const input = $('answerInput');
      if (key === 'enter') submitAnswer();
      else if (key === 'backspace') input.value = input.value.slice(0,-1);
      else if (input.value.length < 5) input.value += key;
      input.focus();
    }));

    $('quitGameBtn').addEventListener('click', quitGame);
    $('playAgainBtn').addEventListener('click', playAgain);
    $('nextLevelBtn').addEventListener('click', playNextLevel);
    $('backDashboardBtn').addEventListener('click', () => { game = null; openDashboard(activeProfileId); });
    $('exportProfileBtn').addEventListener('click', () => exportProfile(activeProfileId));
    $('exportAllBtn').addEventListener('click', exportAllData);
    $('importInput').addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) importJson(f);
    });
  }

  function rand(min,max) {
    return Math.floor(Math.random()*(max-min+1))+min;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (total < 60) return `${total}s`;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (!hours) return `${minutes}m`;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  function friendlyDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
      month:'short',
      day:'numeric',
      year:new Date(iso).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'player';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
    }[c]));
  }
})();
