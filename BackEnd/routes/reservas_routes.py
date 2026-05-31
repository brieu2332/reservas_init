from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session

from src.services.reserva_service import ReservaService
from src.services.user_service import UserService
from src.utils.exceptions import BookingConflictError, PermissionError, NotFoundError
from src.models.database import SessionLocal


from flask_jwt_extended import jwt_required, get_jwt_identity

# 1. Cria um "Blueprint" para agrupar as rotas de reserva
reservation_bp = Blueprint('reservation_routes', __name__)

# 2. Helper para gerenciar a sessão do banco de dados por requisição
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- DEFINIÇÃO DAS ROTAS ---

@reservation_bp.route('/reservations', methods=['POST'])
# @jwt_required() # Descomente quando a autenticação estiver pronta
def create_reservation():
    """
    Endpoint para criar uma nova reserva.
    Valida a entrada, chama o serviço e traduz exceções em respostas HTTP.
    """
    # user_id = get_jwt_identity() # Pega o ID do usuário a partir do token
    
    # Simulação para desenvolvimento sem token:
    acting_user_id = request.json.get("user_id") # Remover dps

    payload = request.get_json()
    if not payload or not all(k in payload for k in ['room_id', 'start_time', 'end_time', 'purpose']):
        return jsonify({"error": "Payload inválido. Campos obrigatórios ausentes."}), 400

    db_session_gen = get_db_session()
    db: Session = next(db_session_gen)

    try:
        user_service = UserService(db_session=db)
        acting_user = user_service.get_user_by_id(acting_user_id)
        
        if not acting_user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        reserva_service = ReservaService(acting_user=acting_user, db_session=db)
        nova_reserva = reserva_service.create_reserva(payload)
        
        return jsonify({"message": "Reserva criada com sucesso!", "id": nova_reserva.id}), 201

    except BookingConflictError as e:
        return jsonify({"error": str(e)}), 409  # 409 Conflict
    
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403  # 403 Forbidden

    except ValueError as e:
        return jsonify({"error": str(e)}), 400 # 400 Bad Request

    except Exception as e:
        # Captura genérica para outros erros inesperados
        return jsonify({"error": "Ocorreu um erro interno no servidor."}), 500
    
    finally:
        # Garante que a sessão do banco seja fechada
        next(db_session_gen, None)
        from flask import Blueprint, request, jsonify


@reservation_bp.route('/reservations/<int:reservation_id>', methods=['GET'])
# @jwt_required()
def get_reservation(reservation_id):
    """ Endpoint para buscar uma única reserva pelo seu ID. """
    # acting_user_id = get_jwt_identity()
    
    db_gen = get_db_session()
    db: Session = next(db_gen)
    try:
        # user_service = UserService(db_session=db)
        # acting_user = user_service.get_user_by_id(acting_user_id)

        reserva_service = ReservaService(db_session=db) 
        reserva = reserva_service.get_reservation_by_id(reservation_id)
        
        return jsonify(reserva.to_dict()), 200

    except NotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor."}), 500
    finally:
        next(db_gen, None)


@reservation_bp.route('/reservations', methods=['GET'])
# @jwt_required()
def list_reservations():
    """ Endpoint para listar todas as reservas, com possíveis filtros. """
    db_gen = get_db_session()
    db: Session = next(db_gen)
    try:
        # Pega os filtros da URL (ex: /reservations?date=2025-09-13)
        filters = request.args.to_dict()

        reserva_service = ReservaService(db_session=db)
        reservas = reserva_service.get_reservations_by_filter(filters)
        
        # Serializa a lista de reservas
        return jsonify([r.to_dict() for r in reservas]), 200
        
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor."}), 500
    finally:
        next(db_gen, None)

@reservation_bp.route('/reservations/<int:reservation_id>', methods=['PUT'])
# @jwt_required()
def update_reservation(reservation_id):
    """ Endpoint para atualizar uma reserva existente. """
    # acting_user_id = get_jwt_identity()
    payload = request.get_json()

    db_gen = get_db_session()
    db: Session = next(db_gen)
    try:
        user_service = UserService(db_session=db)
        # acting_user = user_service.get_user_by_id(acting_user_id)

        reserva_service = ReservaService(acting_user=acting_user, db_session=db)
        reserva_atualizada = reserva_service.update_reservation(reservation_id, payload)
        
        return jsonify(reserva_atualizada.to_dict()), 200

    except (NotFoundError, ValueError) as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor."}), 500
    finally:
        next(db_gen, None)

@reservation_bp.route('/reservations/<int:reservation_id>', methods=['DELETE'])
# @jwt_required()
def delete_reservation(reservation_id):
    """ Endpoint para cancelar (soft delete) uma reserva. """
    # acting_user_id = get_jwt_identity()

    db_gen = get_db_session()
    db: Session = next(db_gen)
    try:
        user_service = UserService(db_session=db)
        # acting_user = user_service.get_user_by_id(acting_user_id)

        reserva_service = ReservaService(acting_user=acting_user, db_session=db)
        reserva_service.cancel_reservation(reservation_id)
        
        return '', 204  

    except NotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor."}), 500
    finally:
        next(db_gen, None)