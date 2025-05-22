import hashlib
import hmac
from urllib.parse import parse_qsl

# ⚠️ Вставь сюда свой bot_token
BOT_TOKEN = "7344287619:AAEsXe-k6Mpsa9dqWLbzbRf6WRKvFSTeGiM"
SECRET_KEY = hashlib.sha256(BOT_TOKEN.encode()).digest()

def verify_telegram_auth(init_data: str) -> dict | None:
    try:
        data_dict = dict(parse_qsl(init_data, keep_blank_values=True))
        hash_from_telegram = data_dict.pop("hash")

        sorted_data = sorted([f"{k}={v}" for k, v in data_dict.items()])
        data_check_string = "\n".join(sorted_data)

        hmac_hash = hmac.new(SECRET_KEY, data_check_string.encode(), hashlib.sha256).hexdigest()
        if hmac_hash == hash_from_telegram:
            return data_dict
        return None
    except Exception:
        return None
