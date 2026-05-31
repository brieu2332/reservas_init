from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session

from src.repositories.user_repository import UserRepository
from src.utils import hashing_senha
from src.models.database import SessionLocal


# from flask_jwt_extended import create_access_token

user_bp = Blueprint('user_routes', __name__)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@user_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint PÚBLICO para autenticação.
    """
    payload = request.get_json()
    if not payload or not all(k in payload for k in ['email', 'password']):
        return jsonify({"error": "E-mail e senha são obrigatórios."}), 400

    db_gen = get_db_session()
    db: Session = next(db_gen)

    try:
        # 1. Usa o repositório para encontrar o usuário pelo e-mail
        user_repo = UserRepository(db)
        user = user_repo.get_by_email(payload['email'])

        # 2. Se o usuário existe, usa o utilitário de hashing para verificar a senha
        if user and hashing_senha.verify_password(payload['password'], user.salt, user.hashed_password):
            
            # 3. Se a senha está correta, GERA um token de acesso
            # access_token = create_access_token(identity=user.id) 
            # return jsonify(access_token=access_token), 200
            
            # Simulação sem JWT 
            return jsonify({"message": "Login bem-sucedido!", "user_id": user.id}), 200
        else:
            # Se o usuário não existe ou a senha está incorreta
            return jsonify({"error": "Credenciais inválidas."}), 401 # Unauthorized

    finally:
        next(db_gen, None) # Fecha a sessão do banco