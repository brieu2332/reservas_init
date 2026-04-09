# src/routes/reservation_routes.py
from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy.orm import Session

# Importa os serviços e exceções da sua arquitetura
from src.services.reserva_service import ReservaService
from src.utils.exceptions import BookingConflictError, PermissionError, NotFoundError
from src.models.database import SessionLocal
from src.repositories.user_repository import UserRepository
# from flask_jwt_extended import jwt_required, get_jwt_identity

# Cria um "Blueprint" para agrupar as rotas de reserva
reservation_bp = Blueprint('reservation_routes', __name__)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@reservation_bp.route('/reservations', methods=['POST'])
# @jwt_required() # Descomente quando a autenticação estiver pronta
def create_reservation():
    # user_id = get_jwt_identity() # Pega o ID do usuário a partir do token
    
    # Simulação para desenvolvimento sem token:
    acting_user_id = request.json.get("user_id") # Remover em produção!

    payload = request.get_json()
    if not payload or not all(k in payload for k in ['room_id', 'start_time', 'end_time', 'subject_name', 'reservation_date']):
        return jsonify({"error": "Payload inválido. Campos obrigatórios ausentes."}), 400

    db_session_gen = get_db_session()
    db: Session = next(db_session_gen)

    try:
        user_repo = UserRepository(db)
        acting_user = user_repo.get_by_id(acting_user_id)
        
        if not acting_user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        payload_formatado = {
            **payload,
            "reservation_date": datetime.strptime(payload["reservation_date"], "%Y-%m-%d").date(),
            "start_time": datetime.strptime(payload["start_time"], "%H:%M").time(),
            "end_time": datetime.strptime(payload["end_time"], "%H:%M").time(),
        }

        reserva_service = ReservaService(acting_user=acting_user, db_session=db)
        nova_reserva = reserva_service.create_reserva(payload_formatado)
        
        # Você precisará de uma função para serializar o objeto para JSON
        return jsonify({"message": "Reserva criada com sucesso!", "id": nova_reserva.id}), 201

    except BookingConflictError as e:
        return jsonify({"error": str(e)}), 409
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Ocorreu um erro interno no servidor."}), 500
    finally:
        next(db_session_gen, None)
