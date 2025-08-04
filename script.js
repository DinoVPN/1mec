// Упрощенный список серверов (оставляем только 5)
const servers = [
    { name: "Автоматически", code: "AUTO" },
    { name: "США", code: "US" },
    { name: "Германия", code: "DE" },
    { name: "Япония", code: "JP" },
    { name: "Россия", code: "RU" }
];

// URL для перенаправления при окончании подписки
const SUBSCRIPTION_END_URL = "https://telegra.ph/Uvazhaemyj-polzovatel-08-04";

// Основные переменные
const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
const connectionButton = document.getElementById('connectionButton');
const mainStatusText = document.getElementById('mainStatusText');
const currentLocationText = document.getElementById('currentLocationText');
const serverList = document.getElementById('serverList');
const searchBar = document.getElementById('searchBar');
const receivedDataEl = document.getElementById('receivedData');
const sentDataEl = document.getElementById('sentData');
const subscriptionDaysEl = document.getElementById('subscriptionDays');
const subscriptionEndedText = document.getElementById('subscriptionEndedText');

let isConnected = false;
let selectedLocation = servers[0]; // Автоматически по умолчанию
let trafficInterval;
let receivedBytes = 0;
let sentBytes = 0;

// Логика переключения экранов
function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.screen === screenId);
    });
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen(e.currentTarget.dataset.screen);
    });
});

// Логика главной кнопки и трафика
connectionButton.addEventListener('click', () => {
    const daysLeft = calculateDaysLeft();
    
    // Проверяем, закончилась ли подписка
    if (daysLeft <= 0) {
        window.open(SUBSCRIPTION_END_URL, '_blank');
        return; // Прекращаем выполнение функции
    }
    
    isConnected = !isConnected;
    connectionButton.classList.toggle('connected', isConnected);
    connectionButton.classList.toggle('disconnected', !isConnected);
    updateMainScreen();

    if (isConnected) {
        // Начинаем симуляцию трафика
        trafficInterval = setInterval(updateTraffic, 1000);
    } else {
        // Останавливаем симуляцию и сбрасываем данные
        clearInterval(trafficInterval);
        receivedBytes = 0;
        sentBytes = 0;
        receivedDataEl.textContent = '0 B';
        sentDataEl.textContent = '0 B';
    }
});

function updateMainScreen() {
    const daysLeft = calculateDaysLeft();
    
    if (daysLeft <= 0) {
        mainStatusText.textContent = 'Подписка закончилась';
        subscriptionDaysEl.textContent = '0';
        connectionButton.classList.add('disabled');
        subscriptionEndedText.style.display = 'block';
    } else {
        mainStatusText.textContent = isConnected ? 'Подключено' : 'Не подключено';
        subscriptionDaysEl.textContent = daysLeft;
        connectionButton.classList.remove('disabled');
        subscriptionEndedText.style.display = 'none';
    }
    
    const status = isConnected ? 'Подключено к' : 'Выбрано';
    currentLocationText.innerHTML = `${status}: <strong>${selectedLocation.name}</strong>`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateTraffic() {
    // Симуляция: добавляем случайное количество байт
    receivedBytes += Math.random() * 1024 * 500; // до 500 КБ/с
    sentBytes += Math.random() * 1024 * 50;   // до 50 КБ/с
    receivedDataEl.textContent = formatBytes(receivedBytes);
    sentDataEl.textContent = formatBytes(sentBytes);
}

// Функция для расчета оставшихся дней подписки
function calculateDaysLeft() {
    const firstLoginDate = localStorage.getItem('firstLoginDate');
    if (!firstLoginDate) {
        // Если это первый вход, сохраняем текущую дату
        const now = new Date();
        localStorage.setItem('firstLoginDate', now.toISOString());
        return 7;
    }
    
    const firstDate = new Date(firstLoginDate);
    const now = new Date();
    const diffTime = now - firstDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - diffDays;
    
    return daysLeft > 0 ? daysLeft : 0;
}

// Логика генерации списка серверов и поиска
function getFlagEmoji(countryCode) {
    if (countryCode === "AUTO") return '✨';
    if (countryCode === "XK") return '🇽🇰'; // Косово
    
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function renderServerList(filter = '') {
    serverList.innerHTML = ''; // Очищаем список
    const filteredServers = servers.filter(server => 
        server.name.toLowerCase().includes(filter.toLowerCase())
    );

    filteredServers.forEach(server => {
        const item = document.createElement('li');
        item.className = 'server-item';
        item.dataset.locationCode = server.code;
        
        if (server.code === selectedLocation.code) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <div class="server-item-left">
                <span class="flag">${getFlagEmoji(server.code)}</span>
                <span class="location-name">${server.name}</span>
            </div>
            <div class="server-item-right">
                <i class="fas fa-check-circle check-icon"></i>
            </div>
        `;

        item.addEventListener('click', () => {
            selectedLocation = server;
            // Перерисовываем список, чтобы отметить новый выбор
            renderServerList(searchBar.value);
            updateMainScreen();
            // Возвращаемся на главный экран после выбора
            setTimeout(() => showScreen('mainScreen'), 200);
        });

        serverList.appendChild(item);
    });
}

searchBar.addEventListener('input', (e) => {
    renderServerList(e.target.value);
});

// Логика переключателей в настройках
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация переключателей
    const darkThemeToggle = document.getElementById('darkThemeToggle');
    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
    const helpSupportBtn = document.getElementById('helpSupportBtn');
    
    // Проверяем сохраненную тему
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        darkThemeToggle.checked = true;
    }
    
    // Обработчик переключения темы
    darkThemeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // Обработчик политики конфиденциальности
    privacyPolicyBtn.addEventListener('click', function() {
        window.open('https://telegra.ph/POLZOVATELSKOE-SOGLASHENIE-DinoVPN-08-04', '_blank');
    });
    
    // Обработчик помощи и поддержки
    helpSupportBtn.addEventListener('click', function() {
        window.open('https://t.me/dinovpnhelp', '_blank');
    });
    
    // Логика других переключателей
    const switches = document.querySelectorAll('.switch input:not(#darkThemeToggle)');
    switches.forEach(sw => {
        sw.addEventListener('change', function() {
            const settingName = this.parentElement.previousElementSibling.textContent;
            console.log(`Настройка "${settingName}" изменена: ${this.checked}`);
            // Здесь можно добавить сохранение в localStorage
        });
    });
    
    // Инициализация приложения
    renderServerList();
    updateMainScreen();
});