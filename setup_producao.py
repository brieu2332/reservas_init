import os
from sqlalchemy.orm import Session

# Importe os componentes essenciais da sua arquitetura
from src.models.database import engine, Base
from src.repositories.user_repository import UserRepository
from src.repositories.room_repositories import RoomRepository
from src.models.user_models import TipoUsuario

# --- SOLUÇÃO: IMPORTAR TODOS OS MODELOS AQUI ---
# Isso garante que o SQLAlchemy conheça todas as classes antes de criar as tabelas.
from src.models import user_models, room_models, reserva_models

def criar_banco_inicial():
    """
    Script para apagar o banco de dados de produção existente e criar um novo,
    pré-populado com dados iniciais (2 salas e 2 usuários).
    """
    DB_FILE = "app.db" # Nome do arquivo do banco de dados final

    print("Iniciando a criação do banco de dados de produção...")

    # 1. Apaga o banco de dados antigo, se existir
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"Banco de dados antigo '{DB_FILE}' removido.")

    # 2. Cria todas as tabelas definidas nos seus modelos
    Base.metadata.create_all(bind=engine)
    print("✔ Tabelas criadas com sucesso.")

    # 3. Abre uma sessão com o banco para inserir os dados
    with Session(engine) as session:
        print("\nInserindo dados iniciais...")

        # 3.1. Cria os usuários iniciais
        user_repo = UserRepository(session)
        
        admin_user = user_repo.create_user(
            name="Admin SIRA",
            email="admin@sira.com",
            password="Senha.123", # Use uma senha segura!
            user_type=TipoUsuario.ADMIN
        )
        print(f"✔ Usuário criado: {admin_user.name} (ID: {admin_user.id})")

        common_user = user_repo.create_user(
            name="Usuario Comum",
            email="usuario@ifc.com",
            password="Senha.123"
        )
        print(f"✔ Usuário criado: {common_user.name} (ID: {common_user.id})")

        # 3.2. Cria as salas iniciais
        room_repo = RoomRepository(session)
        print("\nCriando salas iniciais...")

        sala1 = room_repo.create(
            acting_user=admin_user, 
            room_data={"name": "A04", "description": "Laboratório de Informática A", "capacity": 20}
        )
        print(f"✔ Sala criada: {sala1.name} (ID: {sala1.id})")
        
        sala2 = room_repo.create(
            acting_user=admin_user, 
            room_data={"name": "D05", "description": "Laboratório de Informática D", "capacity": 25}
        )
        print(f"✔ Sala criada: {sala2.name} (ID: {sala2.id})")

        # 4. Confirma todas as transações
        session.commit()

        print("\nBanco de dados inicializado e populado com sucesso!")
        print(f"Arquivo do banco de dados '{DB_FILE}' está pronto para uso.")


# Permite que o script seja executado diretamente pelo terminal
if __name__ == '__main__':
    criar_banco_inicial()