# src/models/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

class Base(DeclarativeBase):
    pass

# ANTES:
# DATABASE_URL = "sqlite:///./app.db"

# DEPOIS (NOVO NOME PARA O BANCO DE PRODUÇÃO):
DATABASE_URL = "sqlite:///./sira_producao.db" # <-- Novo nome do arquivo

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # só no SQLite
    echo=False # Mantenha como False para produção para não poluir o log
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)