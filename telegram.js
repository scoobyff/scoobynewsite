// ===== Telegram Bot Settings =====
const TELEGRAM_BOT_TOKEN = "7285268410:AAGpod5K5snsYq9FWAYTzUryW3lsHx3L5Oc"; // replace
const TELEGRAM_CHAT_ID = "1572380763";     // replace

let userName = "";
let adClicks = [];
let externalPlayerClicks = [];
let messageId = null; // Store Telegram message ID

// ===== Helper: Get current Indian time =====
function getIndianTime() {
    return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// ===== Send new Telegram message =====
function sendToTelegram(message, callback) {
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok && callback) callback(data.result.message_id);
    });
}

// ===== Edit existing Telegram message =====
function editTelegramMessage(message) {
    if (!messageId) return;
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            message_id: messageId,
            text: message,
            parse_mode: "HTML"
        })
    });
}

// ===== Track external player click =====
function trackExternalPlayer(playerName) {
    if (!userName) {
        alert("Please enter your name first.");
        return false;
    }
    externalPlayerClicks.push({ player: playerName, time: getIndianTime() });

    let clickList = externalPlayerClicks
        .map((c, i) => `${i + 1}. ${c.player} — ${c.time}`)
        .join("\n");

    const updatedMessage = `🚨 Scooby Viewer:\n<b>Name:</b> ${userName}\n<b>Device:</b> ${navigator.userAgent}\n<b>Login Time:</b> ${getIndianTime()}\n\n<b>External Player Clicks:</b>\n${clickList}`;

    if (messageId) {
        editTelegramMessage(updatedMessage);
    } else {
        sendToTelegram(updatedMessage, (id) => messageId = id);
    }
    return true;
}

// ===== Track ad click =====
function trackAdClick(adId) {
    if (userName) {
        adClicks.push({ ad: adId, time: getIndianTime() });
        sendToTelegram(`📢 Ad Click:\nUser: ${userName}\nAd: ${adId}\nTime: ${getIndianTime()}`);
    }
    return true;
}

// ===== Handle name submission =====
function submitUserName() {
    const nameInput = document.getElementById('user-name').value.trim();
    if (!nameInput) {
        document.getElementById('user-name').style.borderColor = '#ff0000';
        return;
    }
    userName = nameInput;
    document.getElementById('welcome-message').textContent = "Welcome, " + userName;
    document.getElementById('welcome-popup').style.display = 'none';
    sessionStorage.setItem('scoobyUserName', userName);
    const device = navigator.userAgent;

    const introMessage = `🚨 Scooby Viewer:\n<b>Name:</b> ${userName}\n<b>Device:</b> ${device}\n<b>Login Time:</b> ${getIndianTime()}\n\n<b>External Player Clicks:</b>\nNone yet`;
    sendToTelegram(introMessage, (id) => {
        messageId = id;
    });
}

// ===== Restore name if stored =====
window.addEventListener('DOMContentLoaded', () => {
    const storedName = sessionStorage.getItem('scoobyUserName');
    if (storedName) {
        userName = storedName;
        const welcomeEl = document.getElementById('welcome-message');
        if (welcomeEl) {
            welcomeEl.textContent = "Welcome, " + userName;
        }
        const popupEl = document.getElementById('welcome-popup');
        if (popupEl) {
            popupEl.style.display = 'none';
        }
    }
});