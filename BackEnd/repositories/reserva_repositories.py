# /repositories/reserva_repositories.py

import uuid
from typing import List, Optional, Dict, Any
from datetime import date, time

from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.user_models import User, Admin
from ..models.reserva_models import Reserva, ReservationStatus
# Importe a política de permissões que criamos anteriormente
from ..policies.reserva_policy import ReservaPolicy


class ReservaRepository:
    """
    Camada de acesso a dados para a entidade Reserva.
    """
    def __init__(self, db_session: Session):
        self.db = db_session
        self.policies = ReservaPolicy()

    def get_by_id(self, reserva_id: int) -> Optional[Reserva]:
        """Busca uma reserva pelo seu ID."""
        return self.db.query(Reserva).filter(Reserva.id == reserva_id).first()

    def list_by_user(self, user_id: int, active_only: bool = True) -> List[Reserva]:
        """
        Lista as reservas de um usuário específico.
        - active_only=True: Retorna apenas reservas ativas (para usuários comuns).
        - active_only=False: Retorna todas (para administradores).
        """
        query = self.db.query(Reserva).filter(Reserva.user_id == user_id)
        if active_only:
            query = query.filter(Reserva.status == ReservationStatus.ACTIVE)
        
        return query.order_by(Reserva.created_at.desc()).all()

    def create(self, acting_user: User, reserva_data: Dict[str, Any]) -> Reserva:
        """
        Cria uma nova reserva no banco de dados.
        """
        # 1. VERIFICA A PERMISSÃO ANTES DE TUDO
        self.policies.can_create(acting_user, reserva_data)

        # 2. Se a política passou, cria o objeto
        nova_reserva = Reserva(**reserva_data)

        if reserva_data.get("status") == ReservationStatus.FIXED:
            self.policies.can_create_fixed_reserva(acting_user)

        # 3. Persiste no banco
        self.db.add(nova_reserva)
        self.db.commit()
        self.db.refresh(nova_reserva)
        return nova_reserva

    def update(self, acting_user: User, reserva: Reserva, update_data: Dict[str, Any]) -> Reserva:
        """
        Atualiza uma reserva existente.
        """
        # 1. VERIFICA A PERMISSÃO
        self.policies.can_update(acting_user, reserva)
        
        # 2. Aplica as atualizações
        for key, value in update_data.items():
            # Garante que campos protegidos não sejam alterados
            if hasattr(reserva, key) and key not in ['id', 'user_id', 'created_at']:
                setattr(reserva, key, value)
        
        # 3. Persiste no banco
        self.db.commit()
        self.db.refresh(reserva)
        return reserva

    def find_conflicting_reservations(self, room_id: int, reservation_date: date, start_time: time, end_time: time) -> List[Reserva]:
        """
        Encontra reservas ativas para uma sala e data que conflitam com o novo horário.
        Um conflito ocorre se:
        - O início da nova reserva está durante uma reserva existente.
        - O fim da nova reserva está durante uma reserva existente.
        - A nova reserva "envolve" completamente uma reserva existente.
        """
        return self.db.query(Reserva).filter(
            and_(
                Reserva.room_id == room_id,
                Reserva.reservation_date == reservation_date,
                Reserva.status == ReservationStatus.ACTIVE,
                # Condição de sobreposição de horários
                and_(
                    start_time < Reserva.end_time,
                    end_time > Reserva.start_time
                )
            )
        ).all()