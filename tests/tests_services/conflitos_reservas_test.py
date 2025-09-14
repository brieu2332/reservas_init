# tests/tests_services/conflitos_reservas_test.py
import pytest
from datetime import date, time
from typing import List

# Importações dos Modelos e Tipos
from src.models.user_models import User, Admin, TipoUsuario
from src.models.room_models import Room
from src.utils.exceptions import BookingConflictError

# Importações dos Repositórios e Serviços
from src.repositories.user_repository import UserRepository
from src.repositories.room_repositories import RoomRepository
from src.services.reserva_service import ReservaService

# Mock para hashing de senha para manter os testes rápidos e previsíveis
@pytest.fixture(autouse=True)
def patch_hashing(monkeypatch):
    """Padroniza o hashing para evitar lentidão e dependências externas."""
    monkeypatch.setattr(
        'src.utils.hashing_senha.hash_and_validate',
        lambda pw: ("salt123", "hash123")
    )

# --- Fixtures de Dados com Escopo de Sessão ---

@pytest.fixture(scope="session")
def setup_users(user_repo: UserRepository) -> dict:
    """Cria 2 admins e 2 usuários comuns UMA VEZ POR SESSÃO de teste."""
    print("\n--- [Fixture Session] Criando usuários de teste (executado uma vez) ---")
    users = {
        "admin1": user_repo.create_user(name="Admin Alice", email="alice@admin.com", password="Password@123", user_type=TipoUsuario.ADMIN),
        "admin2": user_repo.create_user(name="Admin Bob", email="bob@admin.com", password="Password@123", user_type=TipoUsuario.ADMIN),
        "user1": user_repo.create_user(name="User Carol", email="carol@user.com", password="Password@123"),
        "user2": user_repo.create_user(name="User David", email="david@user.com", password="Password@123"),
    }
    print("✔ [Fixture Session] Usuários criados.")
    return users

@pytest.fixture(scope="session")
def setup_rooms(room_repo: RoomRepository, setup_users: dict) -> List[Room]:
    """Cria 2 salas de teste UMA VEZ POR SESSÃO, usando um dos admins."""
    print("\n--- [Fixture Session] Criando salas de teste (executado uma vez) ---")
    admin_creator = setup_users["admin1"]
    rooms = [
        room_repo.create(admin_creator, {"name": "Sala de Foco", "capacity": 4}),
        room_repo.create(admin_creator, {"name": "Sala de Colaboração", "capacity": 10}),
    ]
    print("✔ [Fixture Session] Salas criadas.")
    return rooms

# --- Suíte de Testes para Conflitos de Reserva ---

class TestReservaConflictScenarios:
    """
    Documentação Viva: Valida a lógica de negócio na camada de serviço para
    prevenir a criação de reservas com horários conflitantes, servindo como
    documentação clara dos casos de uso de agendamento.
    """

    def test_reserva_criada_com_sucesso_em_horario_livre(self, session, setup_users, setup_rooms):
        """
        Cenário: Um usuário comum tenta criar uma reserva em um horário completamente livre.
        Resultado Esperado: A reserva deve ser criada com sucesso.
        """
        print("\n--- Teste: Reserva em horário livre ---")
        # Arrange
        user_carol = setup_users["user1"]
        sala_foco = setup_rooms[0]
        service = ReservaService(acting_user=user_carol, db_session=session)
        reserva_data = {
            "room_id": sala_foco.id,
            "subject_name": "Planejamento Semanal",
            "reservation_date": date(2025, 9, 15),
            "start_time": time(10, 0),
            "end_time": time(11, 0)
        }
        print(f"Usuário '{user_carol.name}' tentando reservar a sala '{sala_foco.name}' das 10h às 11h.")

        # Act
        reserva = service.create_reserva(reserva_data)

        # Assert
        assert reserva is not None
        assert reserva.subject_name == "Planejamento Semanal"
        print("✔ Sucesso! Reserva criada em horário livre.")

    def test_falha_ao_reservar_com_conflito_de_um_minuto(self, session, setup_users, setup_rooms):
        """
        Cenário: Existe uma reserva das 14h às 15h. Um admin tenta criar outra
        das 13h às 14h01, resultando em 1 minuto de sobreposição.
        Resultado Esperado: O sistema deve levantar BookingConflictError.
        """
        print("\n--- Teste: Falha por conflito de 1 minuto ---")
        # Arrange: Cria a reserva inicial
        user_david = setup_users["user2"]
        admin_alice = setup_users["admin1"]
        sala_foco = setup_rooms[0]
        service_david = ReservaService(acting_user=user_david, db_session=session)
        service_david.create_reserva({
            "room_id": sala_foco.id, "subject_name": "Reunião Inicial",
            "reservation_date": date(2025, 9, 15), "start_time": time(14, 0), "end_time": time(15, 0)
        })
        print("Reserva existente criada das 14:00 às 15:00.")
        print("Admin 'Alice' tentando agendar das 13:00 às 14:01...")

        # Act & Assert: Tenta criar a reserva conflitante
        service_alice = ReservaService(acting_user=admin_alice, db_session=session)
        reserva_conflitante = {
            "room_id": sala_foco.id, "subject_name": "Reunião Conflitante",
            "reservation_date": date(2025, 9, 15), "start_time": time(13, 0), "end_time": time(14, 1)
        }
        with pytest.raises(BookingConflictError, match="A sala já está reservada neste horário"):
            service_alice.create_reserva(reserva_conflitante)
        
        print("✔ Sucesso! Exceção BookingConflictError levantada como esperado.")

    def test_sucesso_em_reservas_consecutivas_sem_sobreposicao(self, session, setup_users, setup_rooms):
        """
        Cenário: Uma reserva termina às 10h. Um usuário diferente cria outra na
        mesma sala, começando exatamente às 10h.
        Resultado Esperado: A segunda reserva deve ser criada com sucesso.
        """
        print("\n--- Teste: Reservas consecutivas (back-to-back) ---")
        # Arrange: Cria a primeira reserva
        admin_bob = setup_users["admin2"]
        user_carol = setup_users["user1"]
        sala_colaboracao = setup_rooms[1]
        service_bob = ReservaService(acting_user=admin_bob, db_session=session)
        service_bob.create_reserva({
            "room_id": sala_colaboracao.id, "subject_name": "Primeira Reunião",
            "reservation_date": date(2025, 9, 16), "start_time": time(9, 0), "end_time": time(10, 0)
        })
        print("Reserva existente criada das 09:00 às 10:00.")
        print("Usuário 'Carol' tentando agendar das 10:00 às 11:00...")

        # Act
        service_carol = ReservaService(acting_user=user_carol, db_session=session)
        segunda_reserva_data = {
            "room_id": sala_colaboracao.id, "subject_name": "Segunda Reunião",
            "reservation_date": date(2025, 9, 16), "start_time": time(10, 0), "end_time": time(11, 0)
        }
        reserva_criada = service_carol.create_reserva(segunda_reserva_data)

        # Assert
        assert reserva_criada is not None
        assert reserva_criada.start_time == time(10, 0)
        print("✔ Sucesso! Reserva consecutiva criada sem conflito.")

    def test_sucesso_em_mesmo_horario_em_dias_diferentes(self, session, setup_users, setup_rooms):
        """
        Cenário: Um admin reserva uma sala para as 11h de um dia. Um usuário comum
        reserva a mesma sala no mesmo horário, mas no dia seguinte.
        Resultado Esperado: Ambas as reservas são bem-sucedidas.
        """
        print("\n--- Teste: Mesmo horário em dias diferentes ---")
        # Arrange: Reserva do Admin no dia 17
        admin_alice = setup_users["admin1"]
        sala_foco = setup_rooms[0]
        service_alice = ReservaService(acting_user=admin_alice, db_session=session)
        service_alice.create_reserva({
            "room_id": sala_foco.id, "subject_name": "Reserva Dia 17",
            "reservation_date": date(2025, 9, 17), "start_time": time(11, 0), "end_time": time(12, 0)
        })
        print("Admin 'Alice' reservou a sala no dia 17/09 das 11h às 12h.")

        # Act: Reserva do Usuário no dia 18
        user_david = setup_users["user2"]
        service_david = ReservaService(acting_user=user_david, db_session=session)
        reserva_outro_dia_data = {
            "room_id": sala_foco.id, "subject_name": "Reserva Dia 18",
            "reservation_date": date(2025, 9, 18), "start_time": time(11, 0), "end_time": time(12, 0)
        }
        reserva_criada = service_david.create_reserva(reserva_outro_dia_data)
        
        # Assert
        assert reserva_criada is not None
        assert reserva_criada.reservation_date == date(2025, 9, 18)
        print("✔ Sucesso! Usuário 'David' conseguiu reservar no dia 18/09 no mesmo horário.")

    def test_sucesso_em_mesmo_horario_em_salas_diferentes(self, session, setup_users, setup_rooms):
        """
        Cenário: Um admin e um usuário comum criam reservas para o mesmo dia e
        mesmo horário, mas em salas diferentes.
        Resultado Esperado: Ambas as reservas são bem-sucedidas.
        """
        print("\n--- Teste: Mesmo horário em salas diferentes ---")
        # Arrange
        admin_bob = setup_users["admin2"]
        user_carol = setup_users["user1"]
        sala_foco = setup_rooms[0]
        sala_colaboracao = setup_rooms[1]
        
        # Act
        service_bob = ReservaService(acting_user=admin_bob, db_session=session)
        reserva_sala1 = service_bob.create_reserva({
            "room_id": sala_foco.id, "subject_name": "Reserva Sala Foco",
            "reservation_date": date(2025, 9, 19), "start_time": time(15, 0), "end_time": time(16, 0)
        })
        print(f"Admin '{admin_bob.name}' reservou a '{sala_foco.name}' para as 15h.")

        service_carol = ReservaService(acting_user=user_carol, db_session=session)
        reserva_sala2 = service_carol.create_reserva({
            "room_id": sala_colaboracao.id, "subject_name": "Reserva Sala Colaboração",
            "reservation_date": date(2025, 9, 19), "start_time": time(15, 0), "end_time": time(16, 0)
        })
        print(f"Usuário '{user_carol.name}' reservou a '{sala_colaboracao.name}' para as 15h.")
        
        # Assert
        assert reserva_sala1 is not None
        assert reserva_sala2 is not None
        assert reserva_sala1.room_id != reserva_sala2.room_id
        print("✔ Sucesso! Ambas as reservas foram criadas em salas diferentes.")