const tg = window.Telegram.WebApp;
tg.expand(); // Разворачивает WebView на весь экран

const user = tg.initDataUnsafe?.user;

if (user) {
  // Показываем основной контент
  document.getElementById('username').textContent = user.first_name;
  document.getElementById('app').style.display = 'block';
  document.getElementById('error').style.display = 'none';

  // Авторизация
  fetch("https://pachakutak.github.io/Geotour/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData: tg.initData })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Ответ от сервера:", data);
    })
    .catch(err => {
      console.error("Ошибка авторизации:", err);
    });

} else {
  // Показываем заглушку
  document.getElementById('app').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  console.warn("Приложение запущено вне Telegram");
}