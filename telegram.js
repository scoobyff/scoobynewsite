// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = "7285268410:AAGpod5K5snsYq9FWAYTzUryW3lsHx3L5Oc";
const TELEGRAM_CHAT_ID = "1572380763";

// Initialize user data in Telegram with a single message
function initializeUserData() {
    const userAgent = navigator.userAgent;
    const currentTime = getIndianTime();
    const message = `🚨 New Scooby Viewer:\nName: ${userName}\nDevice: ${userAgent}\nLogin Time: ${currentTime}\n\n📺 Watch History: None\n⏱️ Total Watch Time: 00:00:00`;
    
    // Send message to Telegram bot and store the message ID
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                userMessageId = data.result.message_id;
                console.log("User data initialized in Telegram with message ID:", userMessageId);
            }
        })
        .catch(error => console.error("Error sending to Telegram:", error));
}

// Update user data in Telegram (single message per user)
function updateUserTelegramMessage() {
    // Skip if no message ID (not initialized)
    if (!userMessageId) return;
    
    // Prepare watch history summary
    let historyText = watchHistory.length > 0 ? '\n\n📺 Watch History:' : '\n\n📺 Watch History: None';
    
    if (watchHistory.length > 0) {
        watchHistory.forEach((entry, index) => {
            historyText += `\n${index + 1}. ${entry.stream}`;
            historyText += `\n   Started: ${entry.startTime}`;
            if (entry.endTime) {
                historyText += `\n   Ended: ${entry.endTime}`;
            } else {
                historyText += `\n   Status: Currently watching`;
            }
        });
    }
    
    // Add external player clicks if any
    if (externalPlayerClicks.length > 0) {
        historyText += "\n\n🔗 External Player Clicks:";
        externalPlayerClicks.forEach((click, index) => {
            historyText += `\n${index + 1}. ${click.player}`;
            historyText += `\n   Time: ${click.time}`;
        });
    }
    
    // Add ad clicks if any
    if (adClicks.length > 0) {
        historyText += "\n\n📢 Ad Clicks:";
        adClicks.forEach((click, index) => {
            historyText += `\n${index + 1}. ${click.ad}`;
            historyText += `\n   Time: ${click.time}`;
        });
    }
    
    // Calculate total watch time
    const hours = Math.floor(watchSeconds / 3600);
    const minutes = Math.floor((watchSeconds % 3600) / 60);
    const seconds = watchSeconds % 60;
    
    const timeString = 
        String(hours).padStart(2, '0') + ':' + 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
    
    const currentTime = getIndianTime();
    let statusText = currentStreamName ? `\n\n🟢 Currently watching: ${currentStreamName}` : `\n\n🔴 Not watching anything`;
    
    const userAgent = navigator.userAgent;
    const message = `🚨 Scooby Viewer:\nName: ${userName}\nDevice: ${userAgent}\nLogin Time: ${currentTime}${statusText}${historyText}\n\n⏱️ Total Watch Time: ${timeString}`;
    
    // Update the existing message instead of sending a new one
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText?chat_id=${TELEGRAM_CHAT_ID}&message_id=${userMessageId}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error updating Telegram message:", error));
}

// Track external player clicks
function trackExternalPlayer(playerName) {
    if (!userName) {
        alert("Please enter your name first to access external players.");
        document.getElementById('welcome-popup').style.display = 'flex';
        return false;
    }
    
    // Record external player click
    const click = {
        player: playerName,
        time: getIndianTime()
    };
    
    externalPlayerClicks.push(click);
    
    // Update user data in Telegram
    updateUserTelegramMessage();
    
    return true; // Allow the click to continue
}

// Track ad clicks
function trackAdClick(adId) {
    if (userName) {
        const click = {
            ad: adId,
            time: getIndianTime()
        };
        
        adClicks.push(click);
        
        // Update user data in Telegram
        updateUserTelegramMessage();
    }
    
    return true; // Allow the click to continue
}

// Send help message to Telegram
function sendHelpMessage() {
    const helpMessage = document.getElementById('help-message').value.trim();
    
    if (!helpMessage) {
        document.getElementById('help-message').style.borderColor = '#ff0000';
        document.getElementById('help-message').style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
        setTimeout(() => {
            document.getElementById('help-message').style.borderColor = 'var(--neon-blue)';
            document.getElementById('help-message').style.boxShadow = '0 0 5px rgba(0, 195, 255, 0.2)';
        }, 1000);
        return;
    }
    
    const currentTime = getIndianTime();
    const user = userName || "Anonymous User";
    const message = `❓ HELP REQUEST:\nFrom: ${user}\nTime: ${currentTime}\n\nMessage: ${helpMessage}`;
    
    // Send help message to Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                // Clear and show success
                document.getElementById('help-message').value = '';
                document.getElementById('help-message').placeholder = "Message sent successfully! We'll get back to you soon.";
                setTimeout(() => {
                    document.getElementById('help-message').placeholder = "Describe your issue or ask a question...";
                }, 3000);
            }
        })
        .catch(error => {
            console.error("Error sending help message:", error);
            document.getElementById('help-message').placeholder = "Error sending message. Please try again.";
            setTimeout(() => {
                document.getElementById('help-message').placeholder = "Describe your issue or ask a question...";
            }, 3000);
        });
}

// Check for broadcast messages from Telegram
function checkForBroadcasts() {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1&limit=5`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.result.length > 0) {
                // Process the most recent messages, looking for /broadcast command
                for (let i = data.result.length - 1; i >= 0; i--) {
                    const update = data.result[i];
                    if (update.message && update.message.text && update.message.text.startsWith('/broadcast ')) {
                        const broadcastMessage = update.message.text.substring('/broadcast '.length);
                        displayBroadcast(broadcastMessage);
                        break; // Exit after finding the most recent broadcast
                    } else if (update.message && update.message.text && update.message.text === '/live') {
                        // Handle /live command
                        sendLiveViewersCount();
                    } else if (update.message && update.message.text && update.message.text === '/totalviews') {
                        // Handle /totalviews command
                        sendTotalViewsCount();
                    } else if (update.message && update.message.text && update.message.text === '/cmds') {
                        // Handle /cmds command
                        sendCommandsList();
                    } else if (update.message && update.message.text && update.message.text === '/ads') {
                        // Handle /ads command to get ad clicks report
                        sendAdClicksReport();
                    } else if (update.message && update.message.text && update.message.text === '/external') {
                        // Handle /external command to get external player clicks report
                        sendExternalPlayerReport();
                    }
                }
            }
        })
        .catch(error => console.error("Error checking broadcasts:", error));
}

// Display broadcast message on the website
function displayBroadcast(message) {
    const broadcastContainer = document.getElementById('broadcast-container');
    const broadcastMessage = document.getElementById('broadcast-message');
    
    if (message && message.trim() !== '') {
        broadcastMessage.textContent = message;
        broadcastContainer.style.display = 'block';
    } else {
        broadcastContainer.style.display = 'none';
    }
}

// Send live viewers count to Telegram
function sendLiveViewersCount() {
    const count = liveViewers.size;
    const message = `🟢 LIVE VIEWERS: ${count}\n\nActive viewers: ${Array.from(liveViewers).join(', ')}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error sending live viewers count:", error));
}

// Send total views count to Telegram
function sendTotalViewsCount() {
    const message = `👁️ TOTAL PAGE VIEWS: ${totalViews}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error sending total views count:", error));
}

// Send ad clicks report to Telegram
function sendAdClicksReport() {
    let message = `📊 AD CLICKS REPORT:\n\nTotal Clicks: ${adClicks.length}`;
    
    // Group by ad ID
    const adStats = {};
    adClicks.forEach(click => {
        if (!adStats[click.ad]) {
            adStats[click.ad] = 0;
        }
        adStats[click.ad]++;
    });
    
    // Add stats by ad
    if (Object.keys(adStats).length > 0) {
        message += "\n\nBreakdown by Ad:";
        for (const [ad, count] of Object.entries(adStats)) {
            message += `\n${ad}: ${count} clicks`;
        }
    } else {
        message += "\n\nNo ad clicks recorded yet.";
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error sending ad clicks report:", error));
}

// Send external player report to Telegram
function sendExternalPlayerReport() {
    let message = `🔗 EXTERNAL PLAYER REPORT:\n\nTotal Clicks: ${externalPlayerClicks.length}`;
    
    // Group by player
    const playerStats = {};
    externalPlayerClicks.forEach(click => {
        if (!playerStats[click.player]) {
            playerStats[click.player] = 0;
        }
        playerStats[click.player]++;
    });
    
    // Add stats by player
    if (Object.keys(playerStats).length > 0) {
        message += "\n\nBreakdown by Player:";
        for (const [player, count] of Object.entries(playerStats)) {
            message += `\n${player}: ${count} clicks`;
        }
    } else {
        message += "\n\nNo external player clicks recorded yet.";
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error sending external player report:", error));
}

// Send commands list to Telegram
function sendCommandsList() {
    const commands = [
        "/broadcast [message] - Send a message to all users",
        "/live - Show count of current live viewers",
        "/totalviews - Show total page views",
        "/ads - Show ad clicks report",
        "/external - Show external player clicks report",
        "/cmds - Show this list of commands"
    ];
    
    const message = `📋 AVAILABLE COMMANDS:\n\n${commands.join('\n')}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    fetch(url)
        .catch(error => console.error("Error sending commands list:", error));
}