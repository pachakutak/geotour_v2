// Основной скрипт фронтенда для Telegram Web App и карты

// Telegram Web App initialization
const tg = window.Telegram.WebApp || null;

let telegramUser = null;
if (tg) {
  telegramUser = tg.initDataUnsafe?.user || null;
  if (!telegramUser) {
    alert("Ошибка: не удалось получить данные пользователя из Telegram.");
  }
} else {
  alert("Запускать нужно из Telegram Web App.");
}

// Leaflet карта
const map = L.map('map').setView([55.751244, 37.618423], 13); // Москва по умолчанию

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

const hexLayerGroup = L.layerGroup().addTo(map);
const visitedLayerGroup = L.layerGroup().addTo(map);

const H3_RESOLUTION = 9; // ~100м

let visitedHexSet = new Set();
let telegramId = telegramUser?.id?.toString();

// Отправка авторизации пользователя на бэкенд
async function authUser() {
  if (!telegramUser) return;
  const response = await fetch(BACKEND_URL + '/auth', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ user: telegramUser })
  });
  if (!response.ok) {
    console.error('Ошибка авторизации');
  }
}
authUser();

// Функция отрисовки гексагональной сетки по видимой области карты
function drawHexGrid() {
  hexLayerGroup.clearLayers();

  const bounds = map.getBounds();
  const zoom = map.getZoom();

  // Получаем границы карты (latLng)
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  // Чтобы покрыть область, перебираем по сетке с шагом (примерно размер гексагона)
  // Вместо перебора — используем H3 для всех ячеек между двух точек с помощью polyfill

  // Формируем полигон из углов карты
  const polygon = [
    [north, west],
    [north, east],
    [south, east],
    [south, west]
  ];

  // Получаем все h3 индексы в этой области
  const hexes = h3.polyfill(polygon, H3_RESOLUTION);

  // Отрисовываем каждый гексагон
  hexes.forEach(hex => {
    const hexBoundary = h3.h3ToGeoBoundary(hex, true);
    const latlngs = hexBoundary.map(([lat, lng]) => [lat, lng]);

    let fillColor = 'rgba(0, 123, 255, 0.3)'; // синий прозрачный по умолчанию
    if (visitedHexSet.has(hex)) {
      fillColor = 'rgba(0, 123, 255, 0.05)'; // почти прозрачный для посещённых
    }

    const polygon = L.polygon(latlngs, {
      color: 'blue',
      weight: 1,
      fillColor: fillColor,
      fillOpacity: 1,
      interactive: false
    });

    hexLayerGroup.addLayer(polygon);
  });
}

// Получение посещённых гексагонов с сервера
async function loadVisitedHexes() {
  if (!telegramId) return;
  try {
    const response = await fetch(`${BACKEND_URL}/visited/${telegramId}`);
    if (!response.ok) {
      console.error('Ошибка загрузки посещённых гексагонов');
      return;
    }
    const data = await response.json();
    visitedHexSet = new Set(data.visited);
    drawHexGrid();
  } catch (err) {
    console.error(err);
  }
}
loadVisitedHexes();

// Отправка текущей позиции пользователя на сервер и обновление посещённых
async function updatePosition(lat, lng) {
  if (!telegramId) return;
  try {
    const res = await fetch(BACKEND_URL + '/update_position', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        telegram_id: telegramId,
        lat,
        lng
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.visited_hex && !visitedHexSet.has(data.visited_hex)) {
        visitedHexSet.add(data.visited_hex);
        drawHexGrid();
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Запрос геолокации каждые 8 секунд (только если вкладка активна)
let watchId = null;
function startLocationTracking() {
  if (!navigator.geolocation) {
    alert("Геолокация не поддерживается браузером.");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      updatePosition(latitude, longitude);
    },
    (err) => {
      console.error("Ошибка геолокации", err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
}

function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Запускаем трекинг только при активной вкладке карты
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startLocationTracking();
  } else {
    stopLocationTracking();
  }
});

// Запускаем при загрузке
startLocationTracking();

// Обновляем гексагональную сетку при движении карты (с дебаунсом)
let redrawTimeout = null;
map.on('moveend', () => {
  if (redrawTimeout) clearTimeout(redrawTimeout);
  redrawTimeout = setTimeout(() => {
    loadVisitedHexes();
  }, 300);
});
