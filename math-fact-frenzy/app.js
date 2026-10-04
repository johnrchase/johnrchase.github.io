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
    concepts: { label:'Concepts', symbol:'?', className:'op-concepts', color:'#0f8b8d', operations:['concepts'] },
    addition:       { label:'Addition',              symbol:'+',  className:'op-add',      color:'#25b6e8', operations:['addition'] },
    subtraction:    { label:'Subtraction',           symbol:'−',  className:'op-subtract', color:'#ff5e9c', operations:['subtraction'] },
    multiplication: { label:'Multiplication',        symbol:'×',  className:'op-multiply', color:'#6c63ff', operations:['multiplication'] },
    division:       { label:'Division',              symbol:'÷',  className:'op-divide',   color:'#29c889', operations:['division'] },
    addSub:         { label:'Add & Subtract',        symbol:'±',  className:'op-addsub',   color:'#ff7f66', operations:['addition','subtraction'], mixed:true },
    mulDiv:         { label:'Multiply & Divide',     symbol:'×÷', className:'op-muldiv',   color:'#6d66ed', operations:['multiplication','division'], mixed:true },
    mixedAll:       { label:'All Four Operations',   symbol:'★',  className:'op-mixedall', color:'#c767da', operations:['addition','subtraction','multiplication','division'], mixed:true }
  };

  const BASE_OP_KEYS = ['addition','subtraction','multiplication','division'];
  const ALL_MODE_KEYS = [...Object.keys(OPS).filter(key=>key!=='concepts'),'concepts'];

  const LEVELS = {
    concepts: Array.from({length:8},(_,i)=>['Missing numbers, repeated addition, area and tape models (level '+(i+1)+')']),
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
    data.profiles.forEach(p=>setCookie('mff_background_'+p.id,validBackground(p.settings?.background)||'default',3650));
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
    p.settings ??= {};
    p.settings.background = validBackground(p.settings.background ?? getCookie('mff_background_'+p.id));
    if(!['off','auto','dots','ten','groups','area','tape'].includes(p.settings.visualModel))p.settings.visualModel='off';
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

    p.placementUnlocked = Object.fromEntries(ALL_MODE_KEYS.map(key=>[key,Math.max(1,Math.min(8,Math.floor(Number(p.placementUnlocked?.[key])||1)))]));
    p.unlocked ??= {};
    [...BASE_OP_KEYS,'concepts'].forEach(key => p.unlocked[key] ??= 1);
    p.bestByOperation ??= {};
    ALL_MODE_KEYS.forEach(key => p.bestByOperation[key] ??= 0);
    return p;
  }

  function getProfile(id = activeProfileId) {
    const p = data.profiles.find(x => x.id === id);
    return p ? ensureProfileShape(p) : null;
  }

  function showScreen(id) {
    if(id!=='gameScreen')stopStartCountdown();
    document.body.classList.toggle('in-game',id==='gameScreen');
    applyPlayerBackground(id==='profileScreen'?null:getProfile());
    screens.forEach(s => $(s).classList.toggle('active', s === id));
    $('settingsBtn').classList.toggle('hidden', id === 'profileScreen' || !activeProfileId || id === 'gameScreen');
    $('mainScreenBtn').classList.toggle('hidden', id === 'profileScreen');
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function goToMainScreen() {
    if(game?.starting){stopStartCountdown();game=null;renderProfiles();showScreen('profileScreen');return;}
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
    $('playerBackground').value=profile?.settings.background||'#f5f7ff';
    $('playerBackground').dataset.custom=profile?.settings.background?'1':'';
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

    const savedProfile=getProfile(editingProfileId||activeProfileId);
    if(savedProfile)savedProfile.settings.background=$('playerBackground').dataset.custom?validBackground($('playerBackground').value):'';
    saveData();
    $('profileDialog').close();
    renderProfiles();
    if (activeProfileId) openDashboard(activeProfileId);
  }

  function deleteActiveProfile() {
    if (!editingProfileId) return;
    const p = getProfile(editingProfileId);
    if (!confirm(`Delete ${p.name}'s profile and all saved progress on this device?`)) return;
    deleteCookie('mff_background_'+editingProfileId);
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
    return Math.max(1, Math.min(8,profile.placementUnlocked?.[modeKey]||1), Math.min(...keys.map(key => profile.unlocked[key] || 1)));
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
          ? `Unlock Level ${level} in every included operation, or pass a level assessment`
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
      return `${mode.label}: ${descriptions}. Mixed levels become available through a level assessment or when that level is unlocked in every included operation.${practiceSuffix}`;
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

  function startGame(options={}) {
    const p = getProfile();
    if (!p) return;
    stopStartCountdown();
    if(game?.timer)clearInterval(game.timer);

    game = {
      placement:options.placement===true,
      placementCount:10,
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
    if(game.placement){game.playMode='placement';$('gameModeLabel').textContent=`${OPS[game.operation].label} · Level ${game.level} assessment`;$('timerWrap').classList.remove('hidden');$('practiceNotice').classList.add('hidden');$('quitGameBtn').textContent='Cancel assessment';}
    configureAnswerInput();
    if(game.playMode==='practice'){nextQuestion();sound('start');}else beginStartCountdown();
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
    if (!game || (game.playMode !== 'timed' && !game.placement) || game.finished) return;
    const elapsed = (Date.now() - game.startedAt) / 1000;
    const remaining = Math.max(0, ROUND_SECONDS - elapsed);
    game.remaining = remaining;
    $('timerText').textContent = Math.ceil(remaining);
    $('timerBar').style.width = `${(remaining / ROUND_SECONDS) * 100}%`;
    if (remaining <= 10) $('timerBar').style.background = 'linear-gradient(90deg,#ffbd35,#ff5b65)';
    if (remaining <= 0) { if(game.placement)finishPlacement();else finishGame(); }
  }

  function nextQuestion() {
    if (!game || game.starting || !$('gameScreen').classList.contains('active')) return;

    let question;
    do {
      question = game.placement && OPS[game.operation].mixed ? makeQuestion(OPS[game.operation].operations[game.attempts % OPS[game.operation].operations.length],game.level) : makeQuestionForMode(game.operation, game.level);
    } while (game.previousSignature && questionSignature(question) === game.previousSignature);
    game.question = question;
    game.previousSignature = questionSignature(question);

    $('gameQuestion').classList.toggle('concept-question',question.op==='concepts');
    $('gameQuestion').textContent = question.prompt || `${question.a} ${OPS[question.op].symbol} ${question.b} = ?`;
    $('practiceVisualControls').classList.toggle('hidden',game.playMode!=='practice');
    $('visualModel').value=game.operation==='concepts'?(getProfile().settings.conceptsVisualModel||'auto'):getProfile().settings.visualModel;
    renderProblemVisual();
    $('answerInput').value = '';
    $('answerInput').className = 'answer-input';
    $('feedbackText').textContent = '';
    $('feedbackText').className = 'feedback-text';
    game.inputLocked = false;

    if (game.score > 0 && Math.random() < .16) {
      $('coachBubble').textContent = NEXT_PROMPTS[Math.floor(Math.random() * NEXT_PROMPTS.length)];
      animateAvatar('bounce');
    }
    if(game.placement)$('questionBadge').textContent=`${game.score} of 10 correct · Level ${game.level}`;
    focusAnswer();
  }

  function makeQuestionForMode(modeKey, level) {
    if(modeKey==='concepts')return makeConceptQuestion(level);
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
    return `${q.op}|${q.kind||''}|${q.prompt||''}|${q.a}|${q.b}`;
  }

  function submitAnswer() {
    if (!game || game.inputLocked) return;
    const raw = $('answerInput').value.trim();
    if (!raw || !/^-?\d+$/.test(raw)) return;
    const value = Number(raw);
    if(game.placement){submitPlacement(value);return;}
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
      const answeredRound=game;setTimeout(()=>{if(game===answeredRound)nextQuestion();},360);
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
      if(!$('answerInput').readOnly)$('answerInput').select();
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
    if (!game || game.starting) return;
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
    if(game.starting){stopStartCountdown();game=null;openDashboard(activeProfileId);return;}
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
    selectedPlayMode = game.placement ? 'timed' : game.playMode;
    startGame({placement:game.placement});
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
      const modeLabel = s.playMode === 'placement' ? 'Level assessment' : (s.playMode || 'timed') === 'practice' ? 'Practice' : 'Timed';
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
    bindExtras();
    $('cancelCountdown').addEventListener('click',()=>{stopStartCountdown();game=null;openDashboard(activeProfileId);});
    bindPlacement();
    document.addEventListener('keydown',e=>{if(!game?.starting)return;if(e.key==='Tab'){e.preventDefault();$('cancelCountdown').focus();}if(e.key==='Escape'){e.preventDefault();$('cancelCountdown').click();}});
    $('newProfileBtn').addEventListener('click', () => openProfileDialog());
    $('profileForm').addEventListener('submit', saveProfileFromDialog);
    $('deleteProfileBtn').addEventListener('click', deleteActiveProfile);
    $('settingsBtn').addEventListener('click', () => openProfileDialog(activeProfileId));
    $('homeBtn').addEventListener('click', goToMainScreen);
    $('mainScreenBtn').addEventListener('click', goToMainScreen);
    $('resultMainBtn').addEventListener('click', () => { game = null; goToMainScreen(); });
    $('soundToggle').addEventListener('click', toggleSound);
    $('startGameBtn').addEventListener('click', startGame);
    $('answerInput').addEventListener('keydown', e => {
      if($('answerInput').readOnly)return;
      if(game?.inputLocked){e.preventDefault();return;}
      if(e.key==='Enter'){e.preventDefault();submitAnswer();}
    });
    document.addEventListener('keydown',e=>{
      if(!$('gameScreen').classList.contains('active')||!$('answerInput').readOnly||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.target.closest('select,button,dialog')||e.target.isContentEditable)return;
      if(/^\d$/.test(e.key)||['Backspace','Delete','Enter'].includes(e.key)){e.preventDefault();answerKey(e.key==='Enter'?'enter':e.key==='Backspace'?'backspace':e.key==='Delete'?'clear':e.key);}
    });

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

    document.querySelectorAll('.keypad button').forEach(btn=>btn.addEventListener('click',()=>answerKey(btn.dataset.key)));

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
  function validBackground(value){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:'';}
  function applyPlayerBackground(profile){
    const color=validBackground(profile?.settings.background);
    document.body.style.background=color||'';
    document.body.classList.toggle('custom-background',!!color);
  }
  function makeConceptQuestion(level,kind=rand(0,14)){
    const limit=[5,7,9,10,12,15,20,25][level-1],a=rand(1,limit),b=rand(1,limit),count=rand(2,Math.min(6,level+2)),unit=['cm','in','ft','m'][rand(0,3)];
    const q={op:'concepts',kind,a,b,unit};
    if(kind===0)return {...q,prompt:Array(count).fill(a).join(' + ')+' = ?',answer:a*count,model:{op:'multiplication',a:count,b:a,answer:a*count}};
    if(kind===1)return {...q,prompt:`${a+b} − ? = ${a}`,answer:b};
    if(kind===2)return {...q,prompt:`${a} + ? = ${a+b}`,answer:b};
    if(kind===3)return {...q,prompt:`? × ${b} = ${a*b}`,answer:a};
    if(kind===4)return {...q,prompt:`${a*b} ÷ ? = ${a}`,answer:b};
    if(kind===5)return {...q,prompt:`A rectangle has area ${a*b} ${unit}² and one side ${a} ${unit}. Find the other side in ${unit}.`,answer:b,diagram:'area',total:a*b};
    if(kind===6)return {...q,prompt:`A bar is ${a+b} ${unit} long. One part is ${a} ${unit}. How long is the other part in ${unit}?`,answer:b,diagram:'tape',total:a+b};
    if(kind===7)return {...q,prompt:`? − ${b} = ${a}`,answer:a+b};
    if(kind===8)return {...q,prompt:`? = ${a} + ${b}`,answer:a+b};
    if(kind===9){const c=Math.min(count,a+b-1);return {...q,prompt:`${a} + ? = ${a+b-c} + ${c}`,answer:b};}
    if(kind===10)return {...q,prompt:`${a} × ${count*b} = ${count} × ?`,answer:a*b};
    if(kind===11){const c=rand(1,count*b-1);return {...q,prompt:`${c} + ${count*b-c} = ${count} × ?`,answer:b};}
    const rows=rand(2,Math.min(8,level+3)),cols=rand(2,Math.min(10,level+4));
    if(kind===12)return {...q,a:rows,b:cols,prompt:`${rows} circles each contain ${cols} dots. How many dots altogether?`,answer:rows*cols,diagram:'circles',visualPrompt:'How many dots?'};
    if(kind===13)return {...q,a:rows,b:cols,prompt:`A grid has ${rows} rows of ${cols} unit squares. How many squares altogether?`,answer:rows*cols,diagram:'grid',visualPrompt:'How many squares?'};
    return {...q,a:rows,b:cols,prompt:`${rows} bars are joined end to end, each ${cols} ${unit} long. What is their total length in ${unit}?`,answer:rows*cols,diagram:'bars',visualPrompt:`Total length (${unit})?`};
  }
  function svgModel(body,label){return `<svg viewBox="0 0 400 200" role="img" aria-label="${escapeHtml(label)}" xmlns="http://www.w3.org/2000/svg"><g font-family="system-ui,sans-serif" font-size="16" text-anchor="middle" fill="#20233a">${body}</g></svg>`;}
  function tapeModel(total,part,unknown=true,unit='',hideTotal=false){
    if(total===0)return svgModel(`<text x="200" y="90">Both parts have length 0 ${unit}.</text>`,'Both parts have length zero.');
    const width=total>0?340*part/total:0,left=30+width/2,right=30+width+(340-width)/2;
    return svgModel(`<text x="200" y="24">Whole: ${hideTotal?'?':total} ${unit}</text><rect x="30" y="65" width="${width}" height="62" fill="#c8eefe" stroke="#256782"/><rect x="${30+width}" y="65" width="${340-width}" height="62" fill="#eceaff" stroke="#625ac4"/><text x="${left}" y="53">${part}</text><text x="${right}" y="152">${unknown?'?':total-part}</text>`, `Whole ${hideTotal?'unknown':total} ${unit}; parts ${part} and ${unknown?'unknown':total-part}. Drawn to scale.`);
  }
  function areaModel(side,other,area,missing=false,unit='cm'){
    const length=missing?(side?area/side:0):other,scale=Math.min(270/Math.max(length,1),110/Math.max(side,1)),w=length*scale,h=side*scale,x=200-w/2,y=40+(110-h)/2;
    return svgModel(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dce9ff" stroke="#536ca8" stroke-width="2"/><text x="200" y="25">${missing?'?':length} ${unit}</text><text x="${Math.max(30,x-35)}" y="${y+h/2+5}">${side} ${unit}</text><text x="200" y="185">Area: ${missing?area:'?'} ${unit}²</text>`,missing?`Rectangle: area ${area} square ${unit}, one side ${side} ${unit}, other side unknown. Drawn to scale.`:`Rectangle: sides ${side} and ${length} ${unit}; find the area. Drawn to scale.`);
  }
  function equalTapeModel(groups,each,total){
    let bars='';for(let i=0;i<groups;i++)bars+=`<rect x="${30+340*i/groups}" y="65" width="${340/groups}" height="60" fill="${i%2?'#eceaff':'#c8eefe'}" stroke="#526985"/>`;
    return svgModel(`<text x="200" y="25">Total: ${each===null?total:'?'}</text>${bars}<text x="200" y="165">${groups} equal groups · ${each===null?'?':each} in each</text>`,`${groups} equal groups; ${each===null?'unknown':each} in each; total ${each===null?total:'unknown'}.`);
  }
  function countingModel(q){
    let body='';
    if(q.diagram==='circles'){
      const columns=Math.min(4,q.a),rows=Math.ceil(q.a/columns),r=Math.min(37,72/rows);
      for(let i=0;i<q.a;i++){const x=55+(i%columns)*95,y=45+Math.floor(i/columns)*85;body+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#eceaff" stroke="#625ac4"/>`;for(let j=0;j<q.b;j++){const angle=2*Math.PI*j/q.b;body+=`<circle cx="${x+Math.cos(angle)*r*.6}" cy="${y+Math.sin(angle)*r*.6}" r="5.5" fill="#234e91"/>`;}}
      return svgModel(body,q.prompt);
    }
    if(q.diagram==='grid'){
      const scale=Math.min(250/q.b,170/q.a),w=q.b*scale,h=q.a*scale,x=210-w/2,y=40;
      for(let i=0;i<q.a;i++)for(let j=0;j<q.b;j++)body+=`<rect x="${x+j*scale}" y="${y+i*scale}" width="${scale}" height="${scale}" fill="${i%2?'#eceaff':'#c8eefe'}" stroke="#526985"/>`;
      body+=`<text x="210" y="24">${q.b} columns</text><text x="${x-18}" y="${y+h/2}" transform="rotate(-90 ${x-18} ${y+h/2})">${q.a} rows</text><text x="210" y="240" font-size="14">Each small square = 1</text>`;
    }else{
      const w=340/q.a,x=30,y=80;
      for(let i=0;i<q.a;i++)body+=`<rect x="${x+i*w}" y="${y}" width="${w}" height="38" fill="${i%2?'#eceaff':'#c8eefe'}" stroke="#526985"/><text x="${x+(i+.5)*w}" y="${y+24}" font-size="13">${q.b}</text>`;
      body+=`<text x="200" y="50">Each bar: ${q.b} ${q.unit}</text><path d="M30 130v10h340v-10" fill="none" stroke="#526985"/><text x="200" y="168">Total length = ? ${q.unit}</text>`;
    }
    return svgModel(body,q.prompt).replace('0 0 400 200','0 0 400 260');
  }
  function renderProblemVisual(){
    const box=$('problemVisual');box.innerHTML='';box.hidden=true;if(!game?.question)return;
    const q=game.question;
    if(q.prompt)$('gameQuestion').textContent=q.prompt;
    if(q.diagram){if(game.playMode==='practice'&&(getProfile()?.settings.conceptsVisualModel||'auto')==='off')return;if(q.visualPrompt)$('gameQuestion').textContent=q.visualPrompt;box.innerHTML=q.diagram==='area'?areaModel(q.a,q.b,q.total,true,q.unit):q.diagram==='tape'?tapeModel(q.total,q.a,true,q.unit):countingModel(q);box.hidden=false;return;}
    let style=q.op==='concepts'?(getProfile()?.settings.conceptsVisualModel||'auto'):(getProfile()?.settings.visualModel||'off');
    if(game.playMode!=='practice'||style==='off')return;
    if(q.op==='concepts'&&!q.model){box.innerHTML='<p>Find the missing number. Use the inverse operation to check your thinking.</p>';box.hidden=false;return;}
    const n=q.model||q,mult=n.op==='multiplication'||n.op==='division';
    if(style==='auto')style=mult?'groups':(Math.max(n.a,n.b)<=20?'ten':'tape');
    let caption='',html='';
    if(style==='area'&&mult){html=n.op==='division'?areaModel(n.b,0,n.a,true):areaModel(n.a,n.b,n.answer);}
    else if(style==='tape'||style==='area'){
      if(mult){const groups=n.op==='division'?n.b:n.a,each=n.op==='division'?null:n.b;html=equalTapeModel(groups,each,n.a);}
      else if(n.op==='subtraction')html=tapeModel(n.a,n.b);
      else html=tapeModel(n.a+n.b,n.a,false,'',true);
    }else{
      let counts;
      if(mult){const groups=n.op==='division'?n.answer:n.a,each=n.b;counts=Array.from({length:groups},()=>each);caption=n.op==='division'?`Split ${n.a} into groups of ${n.b}. How many groups?`:`${n.a} groups of ${n.b}. How many altogether?`;}
      else {counts=n.op==='addition'?[n.a,n.b]:[n.a];caption=n.op==='addition'?`Combine ${n.a} and ${n.b}.`:`Start with ${n.a}; cross out ${n.b}.`;}
      const total=counts.reduce((x,y)=>x+y,0);
      if(total>100||counts.length>20){html=svgModel(`<text x="200" y="60">${n.a} ${OPS[n.op].symbol} ${n.b}</text><text x="200" y="100" font-size="14">Try the tape or area model for larger numbers.</text>`,'Numbers are too large for individual dots. Choose tape or area model.');}
      else {
        let index=0;html='<div class="model-groups">'+counts.map((count,g)=>{
          let dots='';const slots=style==='ten'?Math.max(10,Math.ceil(count/10)*10):count;
          for(let i=0;i<slots;i++){if(style==='ten'&&i%10===0)dots+='<span class="ten-frame">';const filled=i<count,cross=filled&&n.op==='subtraction'&&index<n.b;dots+=`<span class="model-cell ${filled?'filled':''} ${cross?'crossed':''} ${g%2?'alternate':''}" aria-hidden="true"></span>`;if(filled)index++;if(style==='ten'&&i%10===9)dots+='</span>';}
          return `<div class="model-set ${style==='ten'?'ten-frames':''}" aria-label="${count} objects">${dots||'<span>0</span>'}</div>`;
        }).join('')+'</div>';
      }
    }
    box.innerHTML=(caption?`<p>${escapeHtml(caption)}</p>`:'')+html;box.hidden=false;
  }
  function bindExtras(){
    $('playerBackground').addEventListener('input',()=>{$('playerBackground').dataset.custom='1';});
    $('resetBackground').addEventListener('click',()=>{$('playerBackground').value='#f5f7ff';$('playerBackground').dataset.custom='';});
    $('visualModel').addEventListener('change',()=>{const p=getProfile();if(p){p.settings[game?.operation==='concepts'?'conceptsVisualModel':'visualModel']=$('visualModel').value;saveData();renderProblemVisual();}});
    $('fullscreenBtn').addEventListener('click',async()=>{try{
      if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error();
      $('fullscreenStatus').textContent='';
    }catch(_){$('fullscreenStatus').textContent='Full screen is unavailable in this browser.';}});
    document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;$('fullscreenBtn').textContent=on?'Exit full screen':'Full screen';$('fullscreenBtn').setAttribute('aria-pressed',String(on));});
  }

  function bindPlacement(){
    $('testLevelBtn').addEventListener('click',()=>{
      const unlocked=getUnlockedLevel(getProfile(),selectedOperation);
      $('assessmentTarget').value=Math.min(8,unlocked+1);
      $('assessmentDescription').textContent=`${OPS[selectedOperation].label}: Get 10 correct answers in 60 seconds to unlock your chosen level. Incorrect answers move to the next question. Existing progress is kept.`;
      $('assessmentDialog').showModal();
    });
    $('cancelAssessment').addEventListener('click',()=>$('assessmentDialog').close());
    $('startAssessment').addEventListener('click',()=>{
      selectedLevel=Math.max(1,Math.min(8,Number($('assessmentTarget').value)||1));
      $('assessmentDialog').close();startGame({placement:true});
    });
  }
  function submitPlacement(value){
    const round=game;if(round.finished)return;if(Date.now()-round.startedAt>=ROUND_SECONDS*1000){finishPlacement();return;}round.attempts++;round.inputLocked=true;
    const correct=value===round.question.answer;
    if(correct){round.score++;round.streak++;round.bestStreak=Math.max(round.bestStreak,round.streak);}else round.streak=0;
    $('scoreDisplay').textContent=round.score;$('streakDisplay').textContent=round.streak;
    $('feedbackText').textContent=correct?'Correct!':`The answer is ${round.question.answer}. On to the next question.`;
    $('feedbackText').className='feedback-text '+(correct?'good':'bad');
    if(round.score>=round.placementCount){finishPlacement();return;}
    setTimeout(()=>{if(game!==round||round.finished||!$('gameScreen').classList.contains('active'))return;nextQuestion();},correct?450:1300);
  }
  function finishPlacement(){
    if(!game||game.finished)return;
    const p=getProfile(),g=game;g.finished=true;g.inputLocked=true;if(g.timer)clearInterval(g.timer);
    const accuracy=g.attempts?Math.round(100*g.score/g.attempts):0,passed=g.score>=10;
    if(passed){if(OPS[g.operation].mixed){p.placementUnlocked??={};p.placementUnlocked[g.operation]=Math.max(p.placementUnlocked[g.operation]||1,g.level);}else p.unlocked[g.operation]=Math.max(p.unlocked[g.operation]||1,g.level);}
    const durationSeconds=Math.max(1,Math.round((Date.now()-g.startedAt)/1000));
    p.sessions.push({id:uid(),date:new Date().toISOString(),operation:g.operation,level:g.level,playMode:'placement',score:g.score,attempts:g.attempts,accuracy,bestStreak:g.bestStreak,durationSeconds});
    if(p.sessions.length>500)p.sessions=p.sessions.slice(-500);
    p.stats.totalCorrectAll+=g.score;p.stats.totalAttemptsAll+=g.attempts;p.stats.totalPlaySeconds+=durationSeconds;saveData();
    $('resultAvatar').textContent=p.avatar;$('resultScore').textContent=g.score;$('resultAccuracy').textContent=accuracy+'%';$('resultStreak').textContent=g.bestStreak;
    $('resultHeading').textContent=passed?'Level unlocked!':'Keep building your skills';
    $('resultSummary').textContent=passed?`Level ${g.level} is available in ${OPS[g.operation].label}. Choose it from the dashboard.`:`You got ${g.score} correct in 60 seconds. Get 10 correct to unlock this level. Your previous progress is unchanged.`;
    $('resultStars').textContent=passed?'★ ★ ★':'★';$('levelUpBanner').classList.add('hidden');$('nextLevelBtn').classList.add('hidden');$('playAgainBtn').textContent='Try assessment again';showScreen('resultScreen');
  }  function configureAnswerInput(){
    const touch=matchMedia('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0;
    $('answerInput').readOnly=touch;
    $('answerInput').inputMode=touch?'none':'numeric';
    document.body.classList.toggle('touch-game',touch);
    if(touch&&document.activeElement instanceof HTMLElement)document.activeElement.blur();
  }
  function focusAnswer(){if(!$('answerInput').readOnly)$('answerInput').focus({preventScroll:true});}
  function answerKey(key){
    if(!game||game.inputLocked||!$('gameScreen').classList.contains('active'))return;
    const input=$('answerInput');
    if(key==='enter')submitAnswer();
    else if(key==='backspace')input.value=input.value.slice(0,-1);
    else if(key==='clear')input.value='';
    else if(/^\d$/.test(key)){if(input.classList.contains('incorrect')){input.value='';input.classList.remove('incorrect');}if(input.value.length<5)input.value+=key;}
    focusAnswer();
  }
  function stopStartCountdown(){
    if(game?.countdownTimer)clearTimeout(game.countdownTimer);
    if(game)game.starting=false;
    $('startCountdown').hidden=true;
  }
  function beginStartCountdown(){
    const round=game;round.starting=true;round.inputLocked=true;round.question=null;
    $('gameQuestion').textContent='';$('problemVisual').hidden=true;$('practiceVisualControls').classList.add('hidden');
    $('startCountdown').hidden=false;
    $('cancelCountdown').focus({preventScroll:true});
    let step=0;const words=['Ready?','Set?','GO!'];
    function advance(){
      if(game!==round||!$('gameScreen').classList.contains('active'))return;
      if(step<words.length){$('countdownWord').textContent=words[step++];round.countdownTimer=setTimeout(advance,800);return;}
      $('cancelCountdown').blur();$('startCountdown').hidden=true;round.countdownTimer=null;round.starting=false;round.startedAt=Date.now();
      nextQuestion();sound('start');
      if(round.placement||round.playMode==='timed')round.timer=setInterval(tickGame,250);
    }
    advance();
  }})();
