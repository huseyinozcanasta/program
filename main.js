const SETTINGS_KEY = 'studyPlanSettingsV2';
const MONTHLY_KEY = 'studyPlanMonthly';
const TUTORIAL_KEY = 'studyPlanTutorialV2';
const weeksCount = 4;
const dayNames = [
    "Pazartesi", "Salı", "Çarşamba", "Perşembe",
    "Cuma", "Cumartesi", "Pazar"
];
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const darkModeToggle = document.getElementById('dark-mode');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const exportJsonBtn = document.getElementById('export-json-btn');
const importJsonBtn = document.getElementById('import-json-btn');
const jsonFileInput = document.getElementById('json-file');
const monthlySummarySection = document.getElementById('monthly-summary-section');
const monthlyProgressBar = document.getElementById('monthly-progress-bar');
const monthlyProgressFill = monthlyProgressBar.querySelector('.progress-bar-fill');
const monthlyProgressPercent = monthlyProgressBar.querySelector('.progress-percent');
const monthlyTotalsDiv = document.getElementById('monthly-totals');

// Öğretici içeriği
const tutorialSteps = [
    `<b>Tıp Fakültesi Aylık Çalışma Planı’na Hoş Geldiniz!</b><br><br>
    Bu uygulama ile haftalık ve aylık çalışma hedeflerinizi kolayca planlayabilir, ilerlemenizi anlık takip edebilirsiniz.`,
    `<b>Ayarlar</b> kısmından çalışmak istediğiniz günleri ve günlük slayt hedeflerinizi belirleyebilirsiniz.<br><br>
    <span style="color:#19A7CE;font-weight:600;">⚙️ Ayarlar</span> butonunu kullanarak dilediğiniz zaman gün/hafta hedeflerinizi güncelleyebilirsiniz.`,
    `<b>Haftalar</b> başlığı altında her bir hafta için gün gün hedeflerinizi ve tamamladıklarınızı kaydedebilirsiniz.<br><br>
    Günlere tıklayarak detayları açabilir, not ekleyebilirsiniz.`,
    `<b>Özet</b> bölümlerinde her haftanın ve tüm ayın genel ilerleme yüzdesini ve çözülen toplam soru sayısını görebilirsiniz.`,
    `Verilerinizi <b>kaydedebilir</b>, <b>yükleyebilir</b>, JSON dosyası olarak dışa ve içe aktarabilirsiniz.<br><br>
    <span style="color:#e74c3c;">Tüm Verileri Temizle</span> ile her şeyi sıfırlayabilirsiniz.`,
    `Aydınlık/Karanlık Mod arasında geçiş yapabilirsiniz.<br><br>
    İyi çalışmalar dileriz! 🎯`
];

// Öğretici modal fonksiyonu
function showTutorialModal(force = false) {
    if (!force && localStorage.getItem(TUTORIAL_KEY) === 'hidden') return;
    let step = 0;
    const modal = document.getElementById('tutorial-modal');
    const stepDiv = document.getElementById('tutorial-step');
    const btnPrev = document.getElementById('tutorial-prev');
    const btnNext = document.getElementById('tutorial-next');
    const btnClose = document.getElementById('tutorial-close');
    const dontShow = document.getElementById('tutorial-dontshow');
    function renderStep() {
        stepDiv.innerHTML = tutorialSteps[step];
        btnPrev.disabled = (step === 0);
        btnNext.disabled = (step === tutorialSteps.length - 1);
    }
    btnPrev.onclick = () => { if (step > 0) { step--; renderStep(); }};
    btnNext.onclick = () => { if (step < tutorialSteps.length - 1) { step++; renderStep(); }};
    btnClose.onclick = () => {
        modal.style.display = 'none';
        if (dontShow.checked) {
            localStorage.setItem(TUTORIAL_KEY, 'hidden');
        } else {
            localStorage.removeItem(TUTORIAL_KEY);
        }
    };
    dontShow.checked = localStorage.getItem(TUTORIAL_KEY) === 'hidden';
    modal.style.display = '';
    renderStep();
}
window.showTutorialAgain = function() { showTutorialModal(true); };

// Toast bildirimi fonksiyonu
function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = "toast show";
    if (type === "error") {
        toast.classList.add("toast-error");
    }
    setTimeout(() => {
        toast.className = "toast";
    }, 2500);
}

// Ayarları yükle/kaydet
function loadSettings() {
    let settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
        settings = JSON.parse(settings);
    } else {
        // Yeni sistemde default olarak 4 hafta x 7 gün 0 hedef
        settings = { days: [0,1,2,3,4,5,6], slideTargets: Array(4).fill().map(()=>Array(7).fill(0)) };
    }
    // Eski sistemden dönüşüm (gerekirse)
    if (typeof settings.slideTargets === 'number') {
        settings.slideTargets = Array(4).fill().map(()=>Array(7).fill(settings.slideTargets));
    }
    if (Array.isArray(settings.slideTargets) && !Array.isArray(settings.slideTargets[0])) {
        // Eski: [haftasız gün hedefleri]
        settings.slideTargets = Array(4).fill().map(()=>settings.slideTargets.slice());
    }
    return settings;
}
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Ayarlar modalı
function updateAllCardTargetsFromSettings() {
    const settings = loadSettings();
    let data = loadAllData();
    for (let week = 0; week < 4; week++) {
        if (!data[week]) data[week] = [];
        settings.days.forEach(dayIdx => {
            let found = data[week].find(d => d.dayIndex === dayIdx);
            if (found) {
                found.slideTarget = settings.slideTargets?.[week]?.[dayIdx] || 0;
            }
        });
    }
    localStorage.setItem(MONTHLY_KEY, JSON.stringify(data));
}

function renderSettingsModal() {
    const settings = loadSettings();
    const daysDiv = document.getElementById('settings-days');
    daysDiv.innerHTML = '';
    dayNames.forEach((g, i) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "day-toggle-btn";
        if(settings.days.includes(i)) btn.classList.add("selected");
        btn.textContent = g;
        btn.dataset.dayIndex = i;
        btn.onclick = function() {
            if (settings.days.includes(i)) {
                settings.days = settings.days.filter(x => x !== i);
            } else {
                settings.days.push(i);
                settings.days.sort();
            }
            saveSettings(settings);
            renderSettingsModal();
        };
        daysDiv.appendChild(btn);
    });
    document.getElementById('select-all-days').onclick = () => {
        settings.days = [...Array(7).keys()];
        saveSettings(settings);
        renderSettingsModal();
    };
    document.getElementById('deselect-all-days').onclick = () => {
        settings.days = [];
        saveSettings(settings);
        renderSettingsModal();
    };

    // Haftaya göre hedefler tablosu
    const targetsDiv = document.getElementById('default-slide-targets');
    targetsDiv.innerHTML = '';
    for (let week = 0; week < 4; week++) {
        const weekDiv = document.createElement('div');
        weekDiv.style = "margin-bottom:16px;border:1px solid #eee;padding:8px 10px;border-radius:7px;background:#f8fafd;";
        weekDiv.innerHTML = `<b>${week + 1}. Hafta</b>`;
        settings.days.forEach((dayIdx) => {
            const label = document.createElement('label');
            label.style = "display:flex;align-items:center;gap:7px;margin:7px 0 0 0;";
            label.innerHTML = `${dayNames[dayIdx]}:`;
            const input = document.createElement('input');
            input.type = "number";
            input.min = 0;
            input.value = settings.slideTargets?.[week]?.[dayIdx] || 0;
            input.style = "width:70px;padding:3px 7px;border-radius:6px;border:1px solid #bfd1d9;";
            input.oninput = e => {
                if (!Array.isArray(settings.slideTargets[week])) settings.slideTargets[week] = [];
                settings.slideTargets[week][dayIdx] = parseInt(e.target.value, 10) || 0;
            };
            label.appendChild(input);
            weekDiv.appendChild(label);
        });
        targetsDiv.appendChild(weekDiv);
    }

    setTimeout(() => {
        const showTutBtn = document.getElementById('show-tutorial-from-settings');
        if (showTutBtn) {
            showTutBtn.onclick = function() {
                showTutorialModal(true);
            };
        }
    }, 0);

    document.getElementById('settings-save').onclick = function() {
        if (!settings.days.length) {
            showToast('En az bir gün seçmelisiniz!', 'error');
            return;
        }
        saveSettings(settings);
        updateAllCardTargetsFromSettings();
        closeSettingsModal();
        initializeWeeksTabs();
        loadData();
        updateAllSummaries();
        showToast('Ayarlar kaydedildi!');
    };
}
settingsBtn.onclick = function() {
    renderSettingsModal();
    settingsModal.style.display = '';
};
function closeSettingsModal() {
    settingsModal.style.display = 'none';
}
document.getElementById('settings-close').onclick = closeSettingsModal;
document.getElementById('settings-cancel').onclick = closeSettingsModal;
settingsModal.addEventListener('click', function(e){
    if (e.target === settingsModal) closeSettingsModal();
});

// Haftaya göre gün hedefi çekme
function initializeDays(weekIdx, settings) {
    const daysContainer = document.getElementById(`days-container-${weekIdx}`);
    daysContainer.innerHTML = "";
    settings.days.forEach((i) => {
        let defaultSlides = settings.slideTargets?.[weekIdx]?.[i] || 0;
        createDayCard(dayNames[i], i, defaultSlides, weekIdx, daysContainer);
    });
}

// Sekmeli HAFTA yönetimi
function initializeWeeksTabs() {
    const weeksTabs = document.getElementById('weeks-tabs');
    weeksTabs.innerHTML = '';
    for(let week=0; week<weeksCount; week++) {
        const tab = document.createElement('div');
        tab.className = 'tab' + (week === 0 ? ' active' : '');
        tab.textContent = `Hafta ${week+1}`;
        tab.dataset.week = week;
        tab.onclick = () => setActiveWeek(week);
        weeksTabs.appendChild(tab);
    }
    setActiveWeek(0); // İlk haftayı yükle
}
function setActiveWeek(week) {
    document.querySelectorAll('#weeks-tabs .tab').forEach((el, i) => {
        el.classList.toggle('active', i === week);
    });
    renderDaysTabs(week);
    renderWeekSummary(week);
}

// Sekmeli GÜN yönetimi
function renderDaysTabs(weekIdx) {
    const settings = loadSettings();
    const daysTabs = document.getElementById('days-tabs');
    daysTabs.innerHTML = '';
    settings.days.forEach((i, dIdx) => {
        const tab = document.createElement('div');
        tab.className = 'tab' + (dIdx === 0 ? ' active' : '');
        tab.textContent = dayNames[i];
        tab.dataset.day = dIdx;
        tab.onclick = () => setActiveDay(weekIdx, dIdx);
        daysTabs.appendChild(tab);
    });
    setActiveDay(weekIdx, 0);
}
function setActiveDay(weekIdx, dayIdx) {
    document.querySelectorAll('#days-tabs .tab').forEach((el, i) => {
        el.classList.toggle('active', i === dayIdx);
    });
    renderDayCard(weekIdx, dayIdx);
}
function renderDayCard(weekIdx, dayTabIdx) {
    const settings = loadSettings();
    const dayIndex = settings.days[dayTabIdx];
    const dayName = dayNames[dayIndex];
    const defaultSlides = settings.slideTargets?.[weekIdx]?.[dayIndex] || 0;
    const dayContent = document.getElementById('day-content');
    dayContent.innerHTML = '';
    createDayCard(dayName, dayIndex, defaultSlides, weekIdx, dayContent);
}

// Haftalık özet tablosu göster
function renderWeekSummary(weekIdx) {
    const weekSummaryContent = document.getElementById('week-summary-content');
    weekSummaryContent.innerHTML = '';
    const summarySection = document.createElement('div');
    summarySection.className = "summary-section";
    summarySection.innerHTML = `
        <div class="summary-title">Haftalık Genel Durum</div>
        <div id="weekly-progress-bar-${weekIdx}" class="progress-bar" style="margin-bottom: 12px;">
            <div class="progress-bar-fill"></div>
            <span class="progress-percent"></span>
            <span class="questions-total" style="margin-left:18px;color:#19A7CE;font-weight:600;"></span>
        </div>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Gün</th>
                    <th>Hedef Slayt</th>
                    <th>Tamamlanan</th>
                    <th>Başarı (%)</th>
                    <th>İlerleme</th>
                    <th>Çözülen Soru</th>
                </tr>
            </thead>
            <tbody id="summary-table-body-${weekIdx}"></tbody>
        </table>
    `;
    weekSummaryContent.appendChild(summarySection);
    updateAllSummaries();
}

// Gün kartı oluşturma (tek gün için, parent'a ekler)
function createDayCard(dayName, index, defaultSlides, weekIdx, parent) {
    const data = loadAllData();
    let weekData = data[weekIdx] || [];
    let cardData = weekData.find(d => d.dayIndex === index) || {
        slideTarget: defaultSlides || 0,
        slideCompleted: 0,
        questionsSolved: 0,
        notes: "",
        dayIndex: index
    };

    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<span>${dayName}</span>`;
    card.appendChild(header);
    const content = document.createElement('div');
    content.className = 'card-content open';
    content.innerHTML = `
        <div>
            <label for="slide-target-${weekIdx}-${index}">Hedef Slayt Sayısı:</label>
            <input type="number" id="slide-target-${weekIdx}-${index}" class="slide-target" value="${cardData.slideTarget || 0}" min="0" step="1">
        </div>
        <div>
            <label for="slide-completed-${weekIdx}-${index}">Tamamlanan Slayt Sayısı:</label>
            <input type="number" id="slide-completed-${weekIdx}-${index}" class="slide-completed" value="${cardData.slideCompleted || 0}" min="0" step="1">
            <div class="error-message" style="display:none;"></div>
        </div>
        <div>
            <label for="questions-solved-${weekIdx}-${index}">Çözülen Soru Sayısı:</label>
            <input type="number" id="questions-solved-${weekIdx}-${index}" class="questions-solved" value="${cardData.questionsSolved || 0}" min="0" step="1">
        </div>
        <div>
            <label for="notes-${weekIdx}-${index}">Notlar:</label>
            <textarea id="notes-${weekIdx}-${index}" class="notes" rows="3">${cardData.notes || ""}</textarea>
        </div>
    `;
    card.appendChild(content);

    // Validasyon ve eventler
    const slideTargetInput = content.querySelector('.slide-target');
    const slideCompletedInput = content.querySelector('.slide-completed');
    const errorMessage = content.querySelector('.error-message');
    function validateSlides() {
        const slideTarget = parseInt(slideTargetInput.value, 10);
        const slideCompleted = parseInt(slideCompletedInput.value, 10);
        slideTargetInput.classList.remove('input-error');
        slideCompletedInput.classList.remove('input-error');
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        if (slideTarget < 0 || isNaN(slideTarget)) {
            slideTargetInput.classList.add('input-error');
            errorMessage.textContent = "Hedef slayt sayısı negatif olamaz!";
            errorMessage.style.display = 'block';
            return false;
        }
        if (slideCompleted < 0 || isNaN(slideCompleted)) {
            slideCompletedInput.classList.add('input-error');
            errorMessage.textContent = "Tamamlanan slayt sayısı negatif olamaz!";
            errorMessage.style.display = 'block';
            return false;
        }
        if (slideCompleted > slideTarget) {
            slideCompletedInput.classList.add('input-error');
            errorMessage.textContent = "Tamamlanan slayt sayısı, hedef slayt sayısından fazla olamaz!";
            errorMessage.style.display = 'block';
            return false;
        }
        return true;
    }
    slideTargetInput.addEventListener('input', () => { validateSlides(); updateAllSummaries(); });
    slideCompletedInput.addEventListener('input', () => { validateSlides(); updateAllSummaries(); });
    content.querySelector('.questions-solved').addEventListener('input', updateAllSummaries);
    content.querySelector('.notes').addEventListener('input', updateAllSummaries);
    card.validate = validateSlides;
    parent.appendChild(card);
}

// Tüm haftaların/günlerin datasını yükle
function loadAllData() {
    let data = JSON.parse(localStorage.getItem(MONTHLY_KEY));
    if (!data) data = [];
    return data;
}

// Kayıt işlemi (aktif haftanın tüm günlerini kaydeder)
function saveData() {
    const settings = loadSettings();
    let data = loadAllData();
    const activeWeek = getActiveWeekIndex();
    if (activeWeek === -1) return;
    if (!data[activeWeek]) data[activeWeek] = [];
    let isValid = true;
    // Gün kartı
    const dayCard = document.getElementById('day-content').querySelector('.card');
    if (!dayCard.validate()) isValid = false;
    if (!isValid) {
        showToast('Lütfen tüm alanlardaki hataları giderin.', 'error');
        return;
    }
    // Kaydet
    const slideTarget = dayCard.querySelector('.slide-target').value;
    const slideCompleted = dayCard.querySelector('.slide-completed').value;
    const questionsSolved = dayCard.querySelector('.questions-solved').value;
    const notes = dayCard.querySelector('.notes').value;
    const dayTabIdx = getActiveDayIndex();
    const dayIndex = settings.days[dayTabIdx];
    let weekData = data[activeWeek];
    const existingIdx = weekData.findIndex(d => d.dayIndex === dayIndex);
    const obj = { slideTarget, slideCompleted, questionsSolved, notes, dayIndex };
    if (existingIdx > -1) {
        weekData[existingIdx] = obj;
    } else {
        weekData.push(obj);
    }
    localStorage.setItem(MONTHLY_KEY, JSON.stringify(data));
    showToast('Veriler başarıyla kaydedildi!');
    updateAllSummaries();
}

// Yükleme işlemi (aktif haftadaki aktif gün verisini gösterir)
function loadData() {
    const settings = loadSettings();
    let data = loadAllData();
    const activeWeek = getActiveWeekIndex();
    const dayTabIdx = getActiveDayIndex();
    if (activeWeek === -1 || dayTabIdx === -1) return;
    if (!data[activeWeek]) data[activeWeek] = [];
    const dayIndex = settings.days[dayTabIdx];
    const dayCard = document.getElementById('day-content').querySelector('.card');
    const cardData = data[activeWeek].find(d => d.dayIndex === dayIndex);
    if (cardData && dayCard) {
        dayCard.querySelector('.slide-target').value = cardData.slideTarget;
        dayCard.querySelector('.slide-completed').value = cardData.slideCompleted;
        dayCard.querySelector('.questions-solved').value = cardData.questionsSolved;
        dayCard.querySelector('.notes').value = cardData.notes;
        dayCard.querySelector('.slide-target').classList.remove('input-error');
        dayCard.querySelector('.slide-completed').classList.remove('input-error');
        const errorMessage = dayCard.querySelector('.error-message');
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }
    updateAllSummaries();
}

// JSON dışa/içe aktarma
function exportJson() {
    const data = localStorage.getItem(MONTHLY_KEY);
    if (!data) {
        showToast('Yedeklenecek veri bulunamadı. Lütfen önce verilerinizi kaydedin.', 'error');
        return;
    }
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-plan-monthly-backup.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 150);
    showToast('JSON dosyası başarıyla dışa aktarıldı!');
}
function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error("Dosya formatı hatalı!");
            localStorage.setItem(MONTHLY_KEY, JSON.stringify(data));
            loadData();
            showToast('Veriler başarıyla içe aktarıldı!');
            updateAllSummaries();
        } catch (err) {
            showToast('Dosya okunamadı veya formatı hatalı!', 'error');
        }
    };
    reader.readAsText(file);
}
importJsonBtn.addEventListener('click', () => jsonFileInput.click());
jsonFileInput.addEventListener('change', importJson);
exportJsonBtn.addEventListener('click', exportJson);

// Karanlık mod
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkModeEnabled', darkModeToggle.checked);
});
function checkDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkModeEnabled') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
}

// Özetleri güncelle
function updateAllSummaries() {
    let monthlyTarget = 0, monthlyCompleted = 0, hasAnyData = false, monthlyQuestions = 0;
    const settings = loadSettings();
    let data = loadAllData();
    // Haftalar (tablar)
    for (let week = 0; week < weeksCount; week++) {
        let totalTarget = 0, totalCompleted = 0, totalQuestions = 0;
        const summaryTableBody = document.getElementById(`summary-table-body-${week}`);
        const weeklyProgressFill = document.querySelector(`#weekly-progress-bar-${week} .progress-bar-fill`);
        const weeklyProgressPercent = document.querySelector(`#weekly-progress-bar-${week} .progress-percent`);
        const weeklyQuestionsTotal = document.querySelector(`#weekly-progress-bar-${week} .questions-total`);
        if (!summaryTableBody) continue;

        summaryTableBody.innerHTML = "";
        settings.days.forEach(dayIdx => {
            let d = (data[week] || []).find(x => x.dayIndex === dayIdx) || {};
            const slideTarget = parseInt(d.slideTarget, 10) || 0;
            const slideCompleted = parseInt(d.slideCompleted, 10) || 0;
            const questionsSolved = parseInt(d.questionsSolved, 10) || 0;
            totalTarget += slideTarget;
            totalCompleted += slideCompleted;
            totalQuestions += questionsSolved;
            monthlyTarget += slideTarget;
            monthlyCompleted += slideCompleted;
            monthlyQuestions += questionsSolved;
            if (slideTarget > 0) hasAnyData = true;
            let percent = (slideTarget > 0 ? Math.min((slideCompleted / slideTarget) * 100, 100) : 0);
            percent = Math.round(percent);
            let barHtml = `
              <div class="progress-bar" style="height:13px;">
                <div class="progress-bar-fill" style="width:${percent}%; background: linear-gradient(90deg, var(--progress-fill) 70%, var(--progress-fill-alt) 100%);"></div>
              </div>
            `;
            summaryTableBody.innerHTML += `
              <tr>
                <td>${dayNames[dayIdx]}</td>
                <td>${slideTarget}</td>
                <td>${slideCompleted}</td>
                <td>${slideTarget > 0 ? percent + "%" : "-"}</td>
                <td>${barHtml}</td>
                <td>${questionsSolved}</td>
              </tr>
            `;
        });
        let weekPercent = (totalTarget > 0) ? Math.min((totalCompleted / totalTarget) * 100, 100) : 0;
        weekPercent = Math.round(weekPercent);
        if (weeklyProgressFill) weeklyProgressFill.style.width = weekPercent + "%";
        if (weeklyProgressPercent) weeklyProgressPercent.textContent = weekPercent + "%";
        if (weeklyQuestionsTotal) weeklyQuestionsTotal.textContent = `Çözülen Soru: ${totalQuestions}`;
    }
    // Aylık genel özet
    let monthPercent = (monthlyTarget > 0) ? Math.min((monthlyCompleted / monthlyTarget) * 100, 100) : 0;
    monthPercent = Math.round(monthPercent);
    monthlyProgressFill.style.width = monthPercent + "%";
    monthlyProgressPercent.textContent = monthPercent + "%";
    const monthlyQuestionsTotal = document.querySelector("#monthly-progress-bar .questions-total");
    if (monthlyQuestionsTotal) monthlyQuestionsTotal.textContent = `Çözülen Soru: ${monthlyQuestions}`;
    if (monthlyTotalsDiv) {
        monthlyTotalsDiv.innerHTML = `Toplam Bitirilen Slayt: <span style="color:#19A7CE">${monthlyCompleted}</span> &nbsp; | &nbsp; Toplam Çözülen Soru: <span style="color:#19A7CE">${monthlyQuestions}</span>`;
    }
    monthlySummarySection.style.display = hasAnyData ? "" : "none";
}

// Aktif sekme indexlerini bulmak için yardımcılar
function getActiveWeekIndex() {
    const weekTabs = document.querySelectorAll('#weeks-tabs .tab');
    for(let i=0;i<weekTabs.length;i++) {
        if(weekTabs[i].classList.contains('active')) return i;
    }
    return -1;
}
function getActiveDayIndex() {
    const dayTabs = document.querySelectorAll('#days-tabs .tab');
    for(let i=0;i<dayTabs.length;i++) {
        if(dayTabs[i].classList.contains('active')) return i;
    }
    return -1;
}

// Kayıt/Yükle butonları
saveButton.addEventListener('click', saveData);
loadButton.addEventListener('click', loadData);

// Tüm verileri temizle
document.getElementById('clear-all-btn').addEventListener('click', function() {
    if(confirm("Tüm verileri ve ayarları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
        localStorage.removeItem(MONTHLY_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem('darkModeEnabled');
        initializeWeeksTabs();
        updateAllSummaries();
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
        showToast("Tüm veriler ve ayarlar silindi!");
    }
});

// Başlangıç
document.addEventListener('DOMContentLoaded', () => {
    initializeWeeksTabs();
    checkDarkModePreference();
    loadData();
    updateAllSummaries();
    showTutorialModal();
});
