import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY: str                 = os.getenv("SECRET_KEY", "dev-key")
    DEBUG: bool                     = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    SQLALCHEMY_DATABASE_URI: str    = os.getenv(
        "DATABASE_URL",
        "postgresql://fluwatch_user:password@localhost:5432/fluwatch_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS  = False
    SQLALCHEMY_ENGINE_OPTIONS       = {"pool_pre_ping": True, "pool_recycle": 300}

    OPENROUTER_API_KEY: str         = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_API_URL: str         = "https://openrouter.ai/api/v1/chat/completions"
    AI_MODEL: str                   = os.getenv("AI_MODEL", "upstage/solar-pro-3:free")

    APP_URL: str                    = os.getenv("APP_URL", "http://localhost:5000")
    FRONTEND_URL: str               = os.getenv("FRONTEND_URL", "http://localhost:5173")

    RADIUS_KM_DEFAULT: float        = float(os.getenv("RADIUS_KM_DEFAULT", "10"))
    JAM_DEFAULT: int                = int(os.getenv("JAM_DEFAULT", "48"))

    JWT_SECRET_KEY: str             = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))


config = Config()
