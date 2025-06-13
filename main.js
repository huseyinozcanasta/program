const SETTINGS_KEY = 'studyPlanSettingsV2';
const MONTHLY_KEY = 'studyPlanMonthly';
const TUTORIAL_KEY = 'studyPlanTutorialV2';
const dayNames = [
    "Pazartesi", "Salı", "Çarşamba", "Perşembe",
    "Cuma", "Cumartesi", "Pazar"
];
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const weeksContainer = document.getElementById('weeks-container');
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
function loadSettings() {
    let settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
        settings = JSON.parse(settings);
    } else {
        settings = { days: [0,1,2,3,4,5,6], slideTargets: 0 };
    }
    if (settings.defaultSlides !== undefined && settings.slideTargets === undefined) {
        settings.slideTargets = settings.defaultSlides;
        delete settings.defaultSlides;
    }
    return settings;
}
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
    const sameRadio = document.getElementById('same-target-radio');
    const diffRadio = document.getElementById('different-target-radio');
    const targetsDiv = document.getElementById('default-slide-targets');
    let slideTargets = settings.slideTargets || 0;
    let isSame = !Array.isArray(slideTargets);
    sameRadio.checked = isSame;
    diffRadio.checked = !isSame;
    function renderTargetInputs() {
        targetsDiv.innerHTML = '';
        if (isSame) {
            targetsDiv.innerHTML = `<input type="number" id="default-slides" min="0" value="${slideTargets}" style="width:110px;padding:5px 7px; border-radius:6px; border:1px solid #bfd1d9;">`;
        } else {
            settings.days.forEach((dayIdx) => {
                let val = (Array.isArray(slideTargets) && slideTargets[dayIdx]) || 0;
                const label = document.createElement('label');
                label.style = "display:flex;align-items:center;gap:7px;margin-bottom:6px;";
                label.innerHTML = `${dayNames[dayIdx]}:`;
                const input = document.createElement('input');
                input.type = "number";
                input.min = 0;
                input.value = val;
                input.style = "width:70px;padding:4px 7px;border-radius:6px;border:1px solid #bfd1d9;";
                input.oninput = e => {
                    if (!Array.isArray(slideTargets)) slideTargets = [];
                    slideTargets[dayIdx] = parseInt(e.target.value, 10) || 0;
                };
                label.appendChild(input);
                targetsDiv.appendChild(label);
            });
        }
    }
    renderTargetInputs();
    sameRadio.onchange = () => {
        isSame = true;
        slideTargets = parseInt(document.getElementById('default-slides').value, 10) || 0;
        renderTargetInputs();
    };
    diffRadio.onchange = () => {
        isSame = false;
        if (!Array.isArray(slideTargets)) {
            slideTargets = [];
        }
        renderTargetInputs();
    };

    // 👀 Öğreticiyi Göster butonu
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
        if (sameRadio.checked) {
            let val = parseInt(document.getElementById('default-slides').value, 10) || 0;
            settings.slideTargets = val;
        } else {
            let arr = [];
            targetsDiv.querySelectorAll('input[type="number"]').forEach((el, i) => {
                arr[settings.days[i]] = parseInt(el.value, 10) || 0;
            });
            settings.slideTargets = arr;
        }
        saveSettings(settings);
        closeSettingsModal();
        initializeWeeks();
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
function initializeWeeks() {
    weeksContainer.innerHTML = '';
    const settings = loadSettings();
    for(let week=0; week<4; week++) {
        const weekAccordion = document.createElement('div');
        weekAccordion.className = 'week-accordion';
        weekAccordion.id = `week-accordion-${week}`;
        weekAccordion.innerHTML = `
            <div class="week-accordion-header">
                <span>Hafta ${week+1}</span>
                <span class="arrow">&#9654;</span>
            </div>
            <div class="week-accordion-content">
                <div class="week-title" style="display:none;">Hafta ${week+1}</div>
                <div id="summary-section-${week}" class="summary-section" style="display:none;">
                    <div class="summary-title">Haftalık Genel Durum</div>
                    <div id="weekly-progress-bar-${week}" class="progress-bar" style="margin-bottom: 12px;">
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
                        <tbody id="summary-table-body-${week}"></tbody>
                    </table>
                </div>
                <div id="days-container-${week}"></div>
            </div>
        `;
        weeksContainer.appendChild(weekAccordion);
        // Accordion logic for week
        const accHeader = weekAccordion.querySelector('.week-accordion-header');
        accHeader.addEventListener('click', () => {
            weekAccordion.classList.toggle('open');
        });
        initializeDays(week, settings);
    }
}
function initializeDays(weekIdx, settings) {
    const daysContainer = document.getElementById(`days-container-${weekIdx}`);
    daysContainer.innerHTML = "";
    let targets = settings.slideTargets;
    settings.days.forEach((i) => {
        let defaultSlides = Array.isArray(targets) ? (targets[i] || 0) : (targets || 0);
        createDayCard(dayNames[i], i, defaultSlides, weekIdx, daysContainer);
    });
}
function createDayCard(dayName, index, defaultSlides, weekIdx, parent) {
    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<span>${dayName}</span><span class="arrow">&#9654;</span>`;
    card.appendChild(header);
    const content = document.createElement('div');
    content.className = 'card-content';
    content.innerHTML = `
        <div>
            <label for="slide-target-${weekIdx}-${index}">Hedef Slayt Sayısı:</label>
            <input type="number" id="slide-target-${weekIdx}-${index}" class="slide-target" value="${defaultSlides || 0}" min="0" step="1">
        </div>
        <div>
            <label for="slide-completed-${weekIdx}-${index}">Tamamlanan Slayt Sayısı:</label>
            <input type="number" id="slide-completed-${weekIdx}-${index}" class="slide-completed" value="0" min="0" step="1">
            <div class="error-message" style="display:none;"></div>
        </div>
        <div>
            <label for="questions-solved-${weekIdx}-${index}">Çözülen Soru Sayısı:</label>
            <input type="number" id="questions-solved-${weekIdx}-${index}" class="questions-solved" value="0" min="0" step="1">
        </div>
        <div>
            <label for="notes-${weekIdx}-${index}">Notlar:</label>
            <textarea id="notes-${weekIdx}-${index}" class="notes" rows="3"></textarea>
        </div>
    `;
    card.appendChild(content);
    header.addEventListener('click', () => {
        card.classList.toggle('open');
    });
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
function saveData() {
    const data = [];
    let isValid = true;
    for (let week = 0; week < 4; week++) {
        const weekCards = document.querySelectorAll(`#days-container-${week} .card`);
        const weekData = [];
        weekCards.forEach(card => {
            if (typeof card.validate === "function" && !card.validate()) isValid = false;
        });
        weekCards.forEach(card => {
            const slideTarget = card.querySelector('.slide-target').value;
            const slideCompleted = card.querySelector('.slide-completed').value;
            const questionsSolved = card.querySelector('.questions-solved').value;
            const notes = card.querySelector('.notes').value;
            weekData.push({ slideTarget, slideCompleted, questionsSolved, notes });
        });
        data.push(weekData);
    }
    if (!isValid) {
        showToast('Lütfen tüm alanlardaki hataları giderin.', 'error');
        return;
    }
    localStorage.setItem(MONTHLY_KEY, JSON.stringify(data));
    showToast('Veriler başarıyla kaydedildi!');
    updateAllSummaries();
}
function loadData() {
    const data = JSON.parse(localStorage.getItem(MONTHLY_KEY));
    if (data) {
        for (let week = 0; week < 4; week++) {
            const weekCards = document.querySelectorAll(`#days-container-${week} .card`);
            if (data[week]) {
                weekCards.forEach((card, idx) => {
                    if (data[week][idx]) {
                        card.querySelector('.slide-target').value = data[week][idx].slideTarget;
                        card.querySelector('.slide-completed').value = data[week][idx].slideCompleted;
                        card.querySelector('.questions-solved').value = data[week][idx].questionsSolved;
                        card.querySelector('.notes').value = data[week][idx].notes;
                        card.querySelector('.slide-target').classList.remove('input-error');
                        card.querySelector('.slide-completed').classList.remove('input-error');
                        const errorMessage = card.querySelector('.error-message');
                        errorMessage.style.display = 'none';
                        errorMessage.textContent = '';
                    }
                });
            }
        }
        showToast('Veriler başarıyla yüklendi!');
        updateAllSummaries();
    } else {
        showToast('Kayıtlı veri bulunamadı.', 'error');
        updateAllSummaries();
    }
}
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
            if (!Array.isArray(data)) {
                throw new Error("Dosya formatı hatalı!");
            }
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
function updateAllSummaries() {
    let monthlyTarget = 0, monthlyCompleted = 0, hasAnyData = false, monthlyQuestions = 0;
    for (let week = 0; week < 4; week++) {
        let totalTarget = 0, totalCompleted = 0, totalQuestions = 0;
        const summaryTableBody = document.getElementById(`summary-table-body-${week}`);
        const weeklyProgressFill = document.querySelector(`#weekly-progress-bar-${week} .progress-bar-fill`);
        const weeklyProgressPercent = document.querySelector(`#weekly-progress-bar-${week} .progress-percent`);
        const weeklyQuestionsTotal = document.querySelector(`#weekly-progress-bar-${week} .questions-total`);
        const summarySection = document.getElementById(`summary-section-${week}`);
        summaryTableBody.innerHTML = "";
        const weekCards = document.querySelectorAll(`#days-container-${week} .card`);
        weekCards.forEach(card => {
            const slideTarget = parseInt(card.querySelector('.slide-target').value, 10) || 0;
            const slideCompleted = parseInt(card.querySelector('.slide-completed').value, 10) || 0;
            const questionsSolved = parseInt(card.querySelector('.questions-solved').value, 10) || 0;
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
                <td>${card.querySelector('.card-header span').textContent}</td>
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
        weeklyProgressFill.style.width = weekPercent + "%";
        weeklyProgressPercent.textContent = weekPercent + "%";
        if (weeklyQuestionsTotal) weeklyQuestionsTotal.textContent = `Çözülen Soru: ${totalQuestions}`;
        summarySection.style.display = weekCards.length && hasAnyData ? "" : "none";
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
saveButton.addEventListener('click', saveData);
loadButton.addEventListener('click', loadData);
document.getElementById('clear-all-btn').addEventListener('click', function() {
    if(confirm("Tüm verileri ve ayarları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
        localStorage.removeItem(MONTHLY_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem('darkModeEnabled');
        initializeWeeks();
        for (let week = 0; week < 4; week++) {
            const weekCards = document.querySelectorAll(`#days-container-${week} .card`);
            weekCards.forEach(card => {
                card.querySelector('.slide-target').value = 0;
                card.querySelector('.slide-completed').value = 0;
                card.querySelector('.questions-solved').value = 0;
                card.querySelector('.notes').value = '';
                card.querySelector('.slide-target').classList.remove('input-error');
                card.querySelector('.slide-completed').classList.remove('input-error');
                const errorMessage = card.querySelector('.error-message');
                errorMessage.style.display = 'none';
                errorMessage.textContent = '';
            });
        }
        updateAllSummaries();
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
        showToast("Tüm veriler ve ayarlar silindi!");
    }
});
document.addEventListener('DOMContentLoaded', () => {
    initializeWeeks();
    checkDarkModePreference();
    loadData();
    updateAllSummaries();
    showTutorialModal();
});
window.showTutorialAgain = function() { showTutorialModal(true); };