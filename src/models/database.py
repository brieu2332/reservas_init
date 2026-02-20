"""Configuração central de banco para toda a aplicação.

Este projeto adota SQLite no arquivo `instance/reservas.db` como fonte única
de verdade. Assim, rotas HTML (Flask), API e repositórios acessam o mesmo
banco físico.
"""

from pathlib import Path

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    """Base declarativa utilizada pelos modelos SQLAlchemy 2.0."""


BASE_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BASE_DIR / "instance" / "reservas.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# URL única do projeto (front + API + repositórios)
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Extensão Flask-SQLAlchemy (usada pelo app factory)
db = SQLAlchemy()

# Engine/sessão SQLAlchemy nativo (usado pelos repositórios atuais)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # necessário para SQLite
    echo=False,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
