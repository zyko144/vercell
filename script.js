document.addEventListener('DOMContentLoaded', () => {
    const enterScreen = document.getElementById('enter-screen');
    const mainContent = document.getElementById('main-content');
    const volumeControl = document.getElementById('volume-control');
    const bgVideo = document.getElementById('bg-video');
    const volumeSlider = document.getElementById('volume-slider');
    
    const profileAvatarTop = document.getElementById('profile-avatar-top');
    const profileNameTop = document.getElementById('profile-name-top');
    const enterTitleName = document.getElementById('enter-title-name');
    const cardAvatar = document.getElementById('card-avatar');
    const cardUsername = document.getElementById('card-username');
    const presenceDot = document.getElementById('presence-dot');
    const presenceStatusText = document.getElementById('presence-status-text');
    const ceoProfileCard = document.getElementById('ceo-profile-card');
    const copyToast = document.getElementById('copy-toast');

    const SUPABASE_URL = 'https://luacxhezcohhriqjlcwd.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_pEuA_YbkCxIDB_cCDO6drw_shRLwudH';
    const TARGET_USERNAME = 'vq';

    // Preload video
    try { bgVideo.load(); } catch(e) {}

    // Enter screen click
    enterScreen.addEventListener('click', () => {
        enterScreen.style.opacity = '0';
        enterScreen.style.backdropFilter = 'blur(0px)';
        
        setTimeout(() => {
            enterScreen.style.display = 'none';
        }, 800);

        mainContent.classList.remove('hidden');
        volumeControl.classList.remove('hidden');

        bgVideo.volume = parseFloat(volumeSlider.value);
        const p = bgVideo.play();
        if (p !== undefined) {
            p.catch(error => {
                console.log("Lecture vidéo:", error);
            });
        }
    });

    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
        bgVideo.volume = parseFloat(e.target.value);
    });

    // Compteur de visites animé (base 1 488, +1 par nouvelle visite)
    const VISITS_BASE = 1488;
    const viewsCountText = document.getElementById('views-count-text');

    function initVisitsCounter() {
        let visits = VISITS_BASE;
        try {
            const stored = localStorage.getItem('site_visits_total');
            const sessionKey = sessionStorage.getItem('site_visited_this_session');

            if (!sessionKey) {
                // Nouvelle visite : on incrémente
                const prev = stored ? parseInt(stored, 10) : VISITS_BASE;
                visits = Math.max(VISITS_BASE, prev) + 1;
                localStorage.setItem('site_visits_total', visits.toString());
                sessionStorage.setItem('site_visited_this_session', '1');
            } else {
                // Rechargement dans la même session, on affiche juste le total actuel
                visits = stored ? Math.max(VISITS_BASE, parseInt(stored, 10)) : VISITS_BASE;
            }
        } catch {
            visits = VISITS_BASE;
        }
        animateCounter(viewsCountText, visits, 1600);
    }

    function animateCounter(element, target, duration) {
        if (!element) return;
        const start = Math.max(0, target - 60);
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * ease);
            element.textContent = current.toLocaleString('fr-FR');
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString('fr-FR');
            }
        }
        requestAnimationFrame(update);
    }

    initVisitsCounter();

    // Click to copy @vq
    let toastTimeout = null;
    if (ceoProfileCard) {
        ceoProfileCard.addEventListener('click', () => {
            const handleToCopy = '@' + TARGET_USERNAME;
            navigator.clipboard.writeText(handleToCopy).then(() => {
                showToast('✨ Pseudo ' + handleToCopy + ' copié !');
            }).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = handleToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('✨ Pseudo ' + handleToCopy + ' copié !');
            });
        });
    }

    function showToast(text) {
        if (!copyToast) return;
        copyToast.textContent = text;
        copyToast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            copyToast.classList.remove('show');
        }, 2200);
    }

    function applyProfile(data) {
        if (!data) return;

        if (profileNameTop) profileNameTop.textContent = '𝐞𝐱';
        if (enterTitleName) enterTitleName.textContent = '𝐞𝐱';
        if (cardUsername) cardUsername.textContent = '𝐞𝐱';

        if (data.avatar_url) {
            if (profileAvatarTop) {
                profileAvatarTop.src = data.avatar_url;
                profileAvatarTop.onerror = () => { profileAvatarTop.src = 'profile.jpg?v=2'; };
            }
            if (cardAvatar) {
                cardAvatar.src = data.avatar_url;
                cardAvatar.onerror = () => { cardAvatar.src = 'profile.jpg?v=2'; };
            }
        }

        updatePresence(data.status || 'offline', data.custom_status);

        try {
            localStorage.setItem('quality:saved_profile_vq', JSON.stringify(data));
        } catch {}
    }

    function updatePresence(status, customStatus = null) {
        if (!presenceDot || !presenceStatusText) return;

        presenceDot.className = 'status-indicator ' + (status || 'offline');
        
        if (status === 'online') {
            presenceDot.title = 'En ligne';
            presenceStatusText.textContent = customStatus || 'En ligne sur Quality';
            presenceStatusText.classList.add('is-online');
        } else if (status === 'idle') {
            presenceDot.title = 'Inactif';
            presenceStatusText.textContent = customStatus || 'Inactif sur Quality';
            presenceStatusText.classList.remove('is-online');
        } else if (status === 'dnd') {
            presenceDot.title = 'Ne pas déranger';
            presenceStatusText.textContent = customStatus || 'Ne pas déranger';
            presenceStatusText.classList.remove('is-online');
        } else {
            presenceDot.title = 'Hors ligne';
            presenceStatusText.textContent = 'Hors ligne';
            presenceStatusText.classList.remove('is-online');
        }
    }

    // 1. Initial State: Hors ligne by default until Quality pings
    updatePresence('offline');

    // Restore saved PDP avatar if available
    try {
        localStorage.removeItem('quality:saved_profile');
        const saved = localStorage.getItem('quality:saved_profile_vq');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.avatar_url) {
                if (profileAvatarTop) profileAvatarTop.src = parsed.avatar_url;
                if (cardAvatar) cardAvatar.src = parsed.avatar_url;
            }
        }
    } catch {}

    // 2. Realtime Heartbeat / Presence detection
    let presenceTimeout = null;
    let presenceChannel = null;

    function resetHeartbeat(status = 'online', customStatus = null) {
        updatePresence(status, customStatus);

        // Si l'application Quality ne renvoie aucun battement de coeur pendant 10s -> passer Hors ligne
        clearTimeout(presenceTimeout);
        presenceTimeout = setTimeout(() => {
            updatePresence('offline');
        }, 10000);
    }

    try {
        if (window.supabase && window.supabase.createClient) {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            presenceChannel = client.channel('public:presence');
            
            presenceChannel
                .on('broadcast', { event: 'user_presence' }, (payload) => {
                    const data = payload.payload;
                    if (data) {
                        if (data.status === 'offline') {
                            updatePresence('offline');
                            clearTimeout(presenceTimeout);
                        } else {
                            applyProfile(data);
                            resetHeartbeat(data.status || 'online', data.custom_status);
                        }
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // Ping Quality app
                        presenceChannel.send({
                            type: 'broadcast',
                            event: 'presence_ping',
                            payload: { from: 'portfolio' }
                        });
                    }
                });
            
            // Ping régulier toutes les 5s pour synchroniser instantanément
            setInterval(() => {
                if (presenceChannel) {
                    presenceChannel.send({
                        type: 'broadcast',
                        event: 'presence_ping',
                        payload: { from: 'portfolio' }
                    });
                }
            }, 5000);
        }
    } catch (e) {
        console.warn('Realtime init:', e);
    }
});
