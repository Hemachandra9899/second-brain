import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _derive_fernet_key() -> bytes:
    raw = settings.jwt_secret.encode("utf-8")
    key = hashlib.sha256(raw).digest()
    return base64.urlsafe_b64encode(key)


_fernet = Fernet(_derive_fernet_key())


def encrypt_token(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_token(ciphertext: str) -> str:
    return _fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
