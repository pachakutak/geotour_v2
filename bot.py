import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from aiogram.filters import Command

# 🔒 Укажи токен своего бота
BOT_TOKEN = "7344287619:AAEsXe-k6Mpsa9dqWLbzbRf6WRKvFSTeGiM"

# 🌍 Укажи URL Telegram Web App
WEB_APP_URL = "https://pachakutak.github.io/Geotour/"


# 🎮 Хендлер команды /start
async def cmd_start(message: types.Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[
            KeyboardButton(
                text="🌍 Открыть карту",
                web_app=WebAppInfo(url=WEB_APP_URL)
            )
        ]],
        resize_keyboard=True
    )

    await message.answer(
        text="Привет! Нажми на кнопку ниже, чтобы открыть карту приключений:",
        reply_markup=keyboard
    )


async def main():
    # 🔧 Логгирование
    logging.basicConfig(level=logging.INFO)

    # 🧠 Инициализация
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    # 📌 Регистрируем хендлер
    dp.message.register(cmd_start, Command("start"))

    # 🚀 Запуск бота
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
