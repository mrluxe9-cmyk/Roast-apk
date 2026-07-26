/* ==========================================
   Roastify AI V6
   MR LUXE
========================================== */

// Shortcut
const $ = (id) => document.getElementById(id);

// Elements
const result = $("result");
const username = $("username");
const language = $("language");
const category = $("category");
const level = $("level");
const toast = $("toast");
const generateBtn = $("generate");

// Storage
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let historyList = JSON.parse(localStorage.getItem("history")) || [];

// Toast
function showToast(msg){

    if(!toast) return;

    toast.textContent = msg;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2000);

}

// Typewriter
function typeWriter(text){

    if(!result) return;

    result.innerHTML="";

    let i=0;

    const timer=setInterval(()=>{

        result.innerHTML += text.charAt(i);

        i++;

        if(i>=text.length){

            clearInterval(timer);

        }

    },18);

}

// Random Roast
function getRoast(){

    const lang = language.value;
    let cat = category.value;

    if(cat==="Random"){

        const keys = Object.keys(window.roastData[lang]);

        cat = keys[Math.floor(Math.random()*keys.length)];

    }

    const list = window.roastData[lang][cat];

    return list[
        Math.floor(Math.random()*list.length)
    ];

}

// Copy text helper (used by main copy button + per-card copy)
async function copyText(text){

    if(!text) return;

    try{

        await navigator.clipboard.writeText(text);

        showToast("📋 Copied");

    }catch{

        showToast("Copy failed");

    }

}

// Vibration feedback
function vibrate(pattern){
    if(navigator.vibrate){
        navigator.vibrate(pattern);
    }
}

// Undo Snackbar (for delete actions)
let snackbarTimer = null;

function showUndoSnackbar(message, onUndo){

    let bar = $("undoSnackbar");

    if(!bar){
        bar = document.createElement("div");
        bar.id = "undoSnackbar";
        bar.className = "snackbar";
        document.body.appendChild(bar);
    }

    bar.innerHTML = `
        <span>${message}</span>
        <button class="snackbarUndo">Undo</button>
    `;

    bar.classList.add("show");

    clearTimeout(snackbarTimer);

    const undoBtn = bar.querySelector(".snackbarUndo");

    const cleanup = () => {
        bar.classList.remove("show");
    };

    undoBtn.onclick = () => {
        clearTimeout(snackbarTimer);
        cleanup();
        onUndo();
    };

    snackbarTimer = setTimeout(cleanup, 4000);

}
function askConfirm(message){

    return new Promise((resolve) => {

        const overlay = document.createElement("div");
        overlay.className = "confirmOverlay";

        overlay.innerHTML = `
            <div class="confirmBox">
                <p>${message}</p>
                <div class="confirmActions">
                    <button class="confirmCancel">Cancel</button>
                    <button class="confirmOk">Yes, Clear</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector(".confirmCancel").addEventListener("click", () => {
            overlay.remove();
            resolve(false);
        });

        overlay.querySelector(".confirmOk").addEventListener("click", () => {
            overlay.remove();
            resolve(true);
        });

        overlay.addEventListener("click", (e) => {
            if(e.target === overlay){
                overlay.remove();
                resolve(false);
            }
        });

    });

}
/* ==========================================
   Part 2
   Generate Roast (with loading spinner)
========================================== */

if (generateBtn) {

    generateBtn.addEventListener("click", () => {

        if(generateBtn.disabled) return;

        generateBtn.disabled = true;

        vibrate(20);

        const originalLabel = generateBtn.innerHTML;

        generateBtn.innerHTML = `<span class="spinner"></span> Generating...`;

        result.innerHTML = `<div class="spinnerCenter"><span class="spinner"></span></div>`;

        setTimeout(() => {

            let roast = getRoast();

            const name = username.value.trim();

            if (name !== "") {
                roast = roast.replace(/{name}/g, name);
            }

            switch (level.value) {

                case "Mild":
                    roast = "🙂 " + roast;
                    break;

                case "Savage":
                    roast = "😈 " + roast;
                    break;

                case "Extreme":
                    roast = "☠️ " + roast + " 🔥";
                    break;
            }

            typeWriter(roast);

            historyList.unshift(roast);

            if (historyList.length > 100) {
                historyList.pop();
            }

            localStorage.setItem(
                "history",
                JSON.stringify(historyList)
            );

            if ($("settingLanguage"))
                $("settingLanguage").textContent = language.value;

            if ($("settingCategory"))
                $("settingCategory").textContent = category.value;

            if ($("settingLevel"))
                $("settingLevel").textContent = level.value;

            showToast("🔥 Roast Generated");

            generateBtn.disabled = false;
            generateBtn.innerHTML = originalLabel;

        }, 700);

    });

}
/* ==========================================
   Part 3
   Copy • Share • Favorite
========================================== */

// Copy
const copyBtn = $("copy");

if (copyBtn) {

    copyBtn.addEventListener("click", () => {

        const text = result.innerText.trim();

        if (!text || text.includes("Press Generate")) {
            return showToast("Generate a roast first");
        }

        copyText(text);

    });

}

// Share
const shareBtn = $("share");

if (shareBtn) {

    shareBtn.addEventListener("click", async () => {

        const text = result.innerText.trim();

        if (!text || text.includes("Press Generate")) {
            return showToast("Generate a roast first");
        }

        if (navigator.share) {

            try {

                await navigator.share({
                    title: "Roastify AI",
                    text: text
                });

            } catch {}

        } else {

            copyText(text);

        }

    });

}

// Favorite
const favoriteBtn = $("favorite");

if (favoriteBtn) {

    favoriteBtn.addEventListener("click", () => {

        const text = result.innerText.trim();

        if (!text || text.includes("Press Generate")) {
            return showToast("Generate a roast first");
        }

        if (!favorites.includes(text)) {

            favorites.unshift(text);

            localStorage.setItem(
                "favorites",
                JSON.stringify(favorites)
            );

            vibrate(15);

            showToast("⭐ Added to Favorites");

        } else {

            showToast("Already in Favorites");

        }

    });

}

// Voice (Text-to-Speech)
const speakBtn = $("speak");

const langCodes = {
    "English": "en-US",
    "Bangla": "bn-BD",
    "Hindi": "hi-IN"
};

let ttsSupported = "speechSynthesis" in window;
let cachedVoices = [];

if (ttsSupported) {

    cachedVoices = speechSynthesis.getVoices();

    speechSynthesis.onvoiceschanged = () => {
        cachedVoices = speechSynthesis.getVoices();
    };

}

function speakText(text, langKey){

    if(!ttsSupported){
        return showToast("🚫 Voice not supported here — try Chrome browser");
    }

    if(speechSynthesis.speaking){
        speechSynthesis.cancel();
        if(speakBtn) speakBtn.textContent = "🔊 Voice";
        return;
    }

    const utter = new SpeechSynthesisUtterance(text);

    utter.lang = langCodes[langKey] || "en-US";
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 1;

    const voices = cachedVoices.length ? cachedVoices : speechSynthesis.getVoices();

    const matchedVoice = voices.find(v => v.lang === utter.lang)
        || voices.find(v => v.lang && v.lang.startsWith(utter.lang.split("-")[0]));

    if(matchedVoice){
        utter.voice = matchedVoice;
    } else if (voices.length === 0) {
        showToast("⚠️ No voices found on this device");
    }

    if(speakBtn) speakBtn.textContent = "⏹ Stop";

    utter.onstart = () => {
        showToast("🔊 Playing...");
    };

    utter.onend = () => {
        if(speakBtn) speakBtn.textContent = "🔊 Voice";
    };

    utter.onerror = (e) => {
        if(speakBtn) speakBtn.textContent = "🔊 Voice";
        showToast("Voice error: " + (e.error || "unknown"));
    };

    speechSynthesis.speak(utter);

    // Some browsers need a resume nudge right after speak()
    setTimeout(() => {
        if(speechSynthesis.paused) speechSynthesis.resume();
    }, 150);

}

if (speakBtn) {

    speakBtn.addEventListener("click", () => {

        const text = result.innerText.trim();

        if (!text || text.includes("Press Generate")) {
            return showToast("Generate a roast first");
        }

        speakText(text, language.value);

    });

}
/* ==========================================
   Part 4
   History • Favorites • Remove • Clear
========================================== */

// Render Favorites (with per-card copy + remove)
function renderFavorites() {

    const box = $("favoritesList");

    if (!box) return;

    if (favorites.length === 0) {

        box.innerHTML = `
        <div class="emptyCard">
            No favorite roasts yet.
        </div>`;

        return;
    }

    box.innerHTML = favorites.map((item, idx) => `
        <div class="listCard">
            <div class="listCardText">${item}</div>
            <div class="listCardActions">
                <button class="miniBtn copyMini" data-idx="${idx}">📋</button>
                <button class="miniBtn removeMini" data-idx="${idx}">✕</button>
            </div>
        </div>
    `).join("");

    box.querySelectorAll(".copyMini").forEach(btn => {
        btn.addEventListener("click", () => {
            copyText(favorites[+btn.dataset.idx]);
        });
    });

    box.querySelectorAll(".removeMini").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = +btn.dataset.idx;
            const removedItem = favorites[idx];

            favorites.splice(idx, 1);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites();

            showUndoSnackbar("Removed from Favorites", () => {
                favorites.splice(idx, 0, removedItem);
                localStorage.setItem("favorites", JSON.stringify(favorites));
                renderFavorites();
            });
        });
    });

}

// Render History (with per-card copy)
function renderHistory() {

    const box = $("historyList");

    if (!box) return;

    if (historyList.length === 0) {

        box.innerHTML = `
        <div class="emptyCard">
            No history yet.
        </div>`;

        return;
    }

    box.innerHTML = historyList.map((item, idx) => `
        <div class="listCard">
            <div class="listCardText">${item}</div>
            <div class="listCardActions">
                <button class="miniBtn copyMini" data-idx="${idx}">📋</button>
                <button class="miniBtn removeMini" data-idx="${idx}">✕</button>
            </div>
        </div>
    `).join("");

    box.querySelectorAll(".copyMini").forEach(btn => {
        btn.addEventListener("click", () => {
            copyText(historyList[+btn.dataset.idx]);
        });
    });

    box.querySelectorAll(".removeMini").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = +btn.dataset.idx;
            const removedItem = historyList[idx];

            historyList.splice(idx, 1);
            localStorage.setItem("history", JSON.stringify(historyList));
            renderHistory();

            showUndoSnackbar("Removed from History", () => {
                historyList.splice(idx, 0, removedItem);
                localStorage.setItem("history", JSON.stringify(historyList));
                renderHistory();
            });
        });
    });

}

// Clear History (with confirm)
const clearHistoryBtn = $("clearHistory");

if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener("click", async () => {

        if (historyList.length === 0) {
            return showToast("History already empty");
        }

        const ok = await askConfirm("Clear all history?");

        if (!ok) return;

        const backup = [...historyList];

        historyList = [];

        localStorage.removeItem("history");

        renderHistory();

        showUndoSnackbar("History cleared", () => {
            historyList = backup;
            localStorage.setItem("history", JSON.stringify(historyList));
            renderHistory();
        });

    });

}

// Clear Favorites (with confirm)
const clearFavoriteBtn = $("clearFavorite");

if (clearFavoriteBtn) {

    clearFavoriteBtn.addEventListener("click", async () => {

        if (favorites.length === 0) {
            return showToast("Favorites already empty");
        }

        const ok = await askConfirm("Clear all favorites?");

        if (!ok) return;

        const backup = [...favorites];

        favorites = [];

        localStorage.removeItem("favorites");

        renderFavorites();

        showUndoSnackbar("Favorites cleared", () => {
            favorites = backup;
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites();
        });

    });

}

// Initial Load
renderFavorites();
renderHistory();
/* ==========================================
   Part 5
   Bottom Navigation + Settings
========================================== */

const screens = {
    home: $("homeScreen"),
    favorites: $("favoritesScreen"),
    history: $("historyScreen"),
    settings: $("settingsScreen")
};

const tabs = {
    home: $("homeTab"),
    favorites: $("favoritesTab"),
    history: $("historyTab"),
    settings: $("settingsTab")
};

// Change Screen
function openScreen(name){

    Object.keys(screens).forEach(key => {

        if(screens[key]){
            screens[key].classList.remove("active");
        }

    });

    Object.keys(tabs).forEach(key => {

        if(tabs[key]){
            tabs[key].classList.remove("active");
        }

    });

    if(screens[name]){
        screens[name].classList.add("active");
    }

    if(tabs[name]){
        tabs[name].classList.add("active");
    }

    if(name==="favorites"){
        renderFavorites();
    }

    if(name==="history"){
        renderHistory();
    }

    if(name==="settings"){

        if($("settingLanguage"))
            $("settingLanguage").textContent = language.value;

        if($("settingCategory"))
            $("settingCategory").textContent = category.value;

        if($("settingLevel"))
            $("settingLevel").textContent = level.value;

    }

}

// Navigation
if(tabs.home){
    tabs.home.addEventListener("click",()=>{
        openScreen("home");
    });
}

if(tabs.favorites){
    tabs.favorites.addEventListener("click",()=>{
        openScreen("favorites");
    });
}

if(tabs.history){
    tabs.history.addEventListener("click",()=>{
        openScreen("history");
    });
}

if(tabs.settings){
    tabs.settings.addEventListener("click",()=>{
        openScreen("settings");
    });
}

// Update Settings
if(language){
    language.addEventListener("change",()=>{
        if($("settingLanguage"))
            $("settingLanguage").textContent = language.value;
    });
}

if(category){
    category.addEventListener("change",()=>{
        if($("settingCategory"))
            $("settingCategory").textContent = category.value;
    });
}

if(level){
    level.addEventListener("change",()=>{
        if($("settingLevel"))
            $("settingLevel").textContent = level.value;
    });
}

// Roast of the Day (deterministic per date, same for everyone that day)
function hashCode(str){
    let hash = 0;
    for(let i=0; i<str.length; i++){
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function loadDailyRoast(){

    const box = $("dailyRoastText");

    if(!box || !window.roastData) return;

    const todayKey = new Date().toDateString();
    const seed = hashCode(todayKey);

    const lang = "English";
    const categories = Object.keys(window.roastData[lang]);
    const cat = categories[seed % categories.length];
    const list = window.roastData[lang][cat];
    let roast = list[seed % list.length];

    roast = roast.replace(/{name}/g, "Friend");

    box.textContent = "😏 " + roast;

}

loadDailyRoast();

// Initial Screen
openScreen("home");

console.log("✅ Roastify AI V6 Loaded");
