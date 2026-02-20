import os
from datetime import date, datetime

from flask import Flask, redirect, render_template, request, url_for

from src.models.database import DATABASE_URL, Base, SessionLocal, db, engine
from src.models.reserva_models import Reserva
from src.models.user_models import TipoUsuario
from src.repositories.reserva_repositories import ReservaRepository
from src.repositories.room_repositories import RoomRepository
from src.repositories.user_repository import UserRepository


DEFAULT_ROOMS = ["A04", "A05", "D04", "D05", "D06", "D07"]

try:
    from src.routes.reservation_routes import reservation_bp
    from src.routes.user_routes import user_bp
except ImportError:
    print("Aviso: Blueprints não encontrados ou nomes diferentes. Rodando sem API completa.")
    reservation_bp = None
    user_bp = None


def create_app():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    pasta_front = os.path.join(base_dir, 'frontEnd/01-prototipo-interface')

    app = Flask(
        __name__,
        template_folder=pasta_front,
        static_folder=pasta_front,
        static_url_path='/static',
    )

    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'chave_secreta_desenvolvimento'

    db.init_app(app)
    Base.metadata.create_all(bind=engine)

    if reservation_bp:
        app.register_blueprint(reservation_bp, url_prefix='/api/reservas')
    if user_bp:
        app.register_blueprint(user_bp, url_prefix='/api/users')

    @app.route('/')
    def index():
        return render_template('login/11_login.html')

    @app.route('/login', methods=['POST'])
    def login_submit():
        print("Login recebido:", request.form)
        return redirect(url_for('diaria'))

    @app.route('/esqueci-senha')
    def esqueci_senha():
        return render_template('login/12_esqueci_senha.html')

    @app.route('/enviar-recuperacao', methods=['POST'])
    def enviar_recuperacao():
        email = request.form.get('email')
        return f"Link enviado para {email} (Simulação)"

    @app.route('/primeiro-acesso')
    def primeiro_acesso():
        return render_template('login/06_primeiro_acesso.html')

    @app.route('/cadastro', methods=['POST'])
    def cadastro_submit():
        dados = request.form
        db_session = SessionLocal()
        try:
            user_repo = UserRepository(db_session)
            user_repo.create_user(
                name=dados.get('nome', 'Novo usuário'),
                email=dados.get('email'),
                password=dados.get('senha'),
                user_type=TipoUsuario.COMUM,
            )
            return redirect(url_for('index'))
        finally:
            db_session.close()

    def _get_rooms_for_views(db_session):
        room_repo = RoomRepository(db_session)
        names = [room.name for room in room_repo.list_all(active_only=False)]
        merged = sorted(set(DEFAULT_ROOMS + names))
        return merged

    def _serialize_reservas(db_session):
        reservas = (
            db_session.query(Reserva)
            .order_by(Reserva.reservation_date.desc(), Reserva.start_time.desc())
            .all()
        )

        payload = []
        for reserva in reservas:
            payload.append(
                {
                    "data": reserva.reservation_date.strftime("%Y-%m-%d"),
                    "data_br": reserva.reservation_date.strftime("%d/%m/%Y"),
                    "local": reserva.room.name if reserva.room else "-",
                    "hora_inicio": reserva.start_time.strftime("%H:%M"),
                    "hora_fim": reserva.end_time.strftime("%H:%M"),
                    "usuario": reserva.user.name if reserva.user else "-",
                    "finalidade": reserva.subject_name,
                    "detalhes": reserva.details or "-",
                }
            )
        return payload

    @app.route('/diaria')
    def diaria():
        db_session = SessionLocal()
        try:
            rooms = _get_rooms_for_views(db_session)
            reservas = _serialize_reservas(db_session)
            return render_template('tabelas/01_index.html', rooms=rooms, reservas=reservas)
        finally:
            db_session.close()

    @app.route('/semanal')
    def semanal():
        db_session = SessionLocal()
        try:
            rooms = _get_rooms_for_views(db_session)
            reservas = _serialize_reservas(db_session)
            return render_template('tabelas/02_visao_semanal.html', rooms=rooms, reservas=reservas)
        finally:
            db_session.close()

    @app.route('/listagem')
    def listagem():
        db_session = SessionLocal()
        try:
            dados_banco = _serialize_reservas(db_session)
            for item in dados_banco:
                item["horario"] = f"{item['hora_inicio']} - {item['hora_fim']}"
                item["turma"] = item["detalhes"]
                item["data"] = item["data_br"]

            return render_template('reserva/10_listagem_reservas.html', dados_banco=dados_banco)
        finally:
            db_session.close()

    @app.route('/reservar')
    def reservar():
        db_session = SessionLocal()
        try:
            rooms = _get_rooms_for_views(db_session)
            return render_template('reserva/03_04_reservar.html', rooms=rooms, hoje_iso=date.today().isoformat())
        finally:
            db_session.close()

    @app.route('/reservas/salvar', methods=['POST'])
    def salvar_reserva():
        dados = request.form
        db_session = SessionLocal()

        try:
            user_repo = UserRepository(db_session)
            room_repo = RoomRepository(db_session)
            reserva_repo = ReservaRepository(db_session)

            acting_user = user_repo.get_by_email('admin@local.test')
            if not acting_user:
                acting_user = user_repo.create_user(
                    name='Admin Local',
                    email='admin@local.test',
                    password='SenhaForte!23',
                    user_type=TipoUsuario.ADMIN,
                )

            room_name = dados.get('laboratorio', 'A03')
            room = room_repo.get_by_name(room_name)
            if not room:
                room = room_repo.create(
                    acting_user=acting_user,
                    room_data={
                        'name': room_name,
                        'description': f'Sala {room_name}',
                        'capacity': 30,
                    },
                )

            reservation_date_str = dados.get('reservation_date')
            reservation_date = (
                datetime.strptime(reservation_date_str, '%Y-%m-%d').date()
                if reservation_date_str
                else date.today()
            )

            reserva_repo.create(
                acting_user=acting_user,
                reserva_data={
                    'user_id': acting_user.id,
                    'room_id': room.id,
                    'reservation_date': reservation_date,
                    'start_time': datetime.strptime(dados.get('hora_inicio'), '%H:%M').time(),
                    'end_time': datetime.strptime(dados.get('hora_fim'), '%H:%M').time(),
                    'subject_name': dados.get('materia', 'Sem assunto'),
                    'details': dados.get('detalhes', ''),
                },
            )

            return redirect(url_for('listagem'))
        finally:
            db_session.close()

    @app.route('/reservas/excluir', methods=['POST'])
    def excluir_reserva():
        print("Reserva Excluída")
        return redirect(url_for('diaria'))

    @app.route('/admin')
    def admin():
        return render_template('usuarios/09_admin.html')

    @app.route('/usuarios')
    def usuarios():
        return render_template('usuarios/07_usuarios.html')

    @app.route('/usuario/editar')
    def editar_usuario():
        return render_template('usuarios/08_editar_usuario.html')

    @app.route('/usuario/atualizar', methods=['POST'])
    def atualizar_usuario():
        print("Dados atualizados:", request.form)
        return redirect(url_for('diaria'))

    return app


if __name__ == '__main__':
    app = create_app()

    if not os.path.exists('instance'):
        os.makedirs('instance')

    with app.app_context():
        Base.metadata.create_all(bind=engine)
        print("Banco de dados verificado/criado com sucesso!")

    app.run(debug=True)