import os
from flask import Flask, render_template, request, redirect, url_for

# Importando o banco de dados e as rotas da sua arquitetura original (src)
# Certifique-se que o __init__.py dentro de src/routes exporta esses blueprints
# Caso dê erro de importação, verifique os nomes dentro de src/routes/
from src.models.database import db
try:
    from src.routes.reservation_routes import reservation_bp
    from src.routes.user_routes import user_bp
except ImportError:
    print("Aviso: Blueprints não encontrados ou nomes diferentes. Rodando sem API completa.")
    reservation_bp = None
    user_bp = None

def create_app():
    # --- 1. CONFIGURAÇÃO DE PASTAS ---
    # Define onde está a pasta raiz do projeto
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Aponta para a sua pasta de frontend atual
    pasta_front = os.path.join(base_dir, 'frontEnd/01-prototipo-interface')

    app = Flask(__name__, 
                template_folder=pasta_front,   # Onde estão os HTMLs
                static_folder=pasta_front,     # Onde estão CSS/JS/Imagens
                static_url_path='/static')     # Prefixo para acessar via URL

    # --- 2. CONFIGURAÇÃO DO BANCO DE DADOS ---
    # Cria o arquivo do banco dentro da pasta 'instance'
    db_path = os.path.join(base_dir, 'instance', 'reservas.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'chave_secreta_desenvolvimento' # Necessário para sessões

    # Inicializa o banco com o app
    db.init_app(app)

    # --- 3. REGISTRO DE BLUEPRINTS (SUA API) ---
    if reservation_bp:
        app.register_blueprint(reservation_bp, url_prefix='/api/reservas')
    if user_bp:
        app.register_blueprint(user_bp, url_prefix='/api/users')

    # =========================================================================
    # --- 4. ROTAS DO FRONTEND (As "Pontes" para seus HTMLs) ---
    # =========================================================================

    # --- LOGIN E AUTENTICAÇÃO ---
    @app.route('/')
    def index():
        # Tela inicial (Login)
        return render_template('login/11_login.html')

    @app.route('/login', methods=['POST'])
    def login_submit():
        # AQUI entraria a lógica de verificar senha no banco
        print("Login recebido:", request.form)
        return redirect(url_for('diaria')) # Redireciona para o dashboard se der certo

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
        # Lógica de salvar novo usuário
        return redirect(url_for('index'))

    # --- DASHBOARD E TABELAS ---
    @app.route('/diaria')
    def diaria():
        return render_template('tabelas/01_index.html')

    @app.route('/semanal')
    def semanal():
        return render_template('tabelas/02_visao_semanal.html')

    # --- RESERVAS ---
    @app.route('/listagem')
    def listagem():
        # Aqui você futuramente buscará as reservas do banco:
        # reservas = ReservaService.listar_todas()
        return render_template('reserva/10_listagem_reservas.html', dados_banco=[])

    @app.route('/reservar')
    def reservar():
        return render_template('reserva/03_04_reservar.html')

    @app.route('/reservas/salvar', methods=['POST'])
    def salvar_reserva():
        # Captura os dados do formulário corrigido
        dados = request.form
        print("Nova Reserva:", dados)
        # ReservaService.criar(dados...)
        return redirect(url_for('listagem'))

    @app.route('/reservas/excluir', methods=['POST'])
    def excluir_reserva():
        print("Reserva Excluída")
        return redirect(url_for('diaria'))

    # --- ADMINISTRAÇÃO E USUÁRIOS ---
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

# --- 5. INICIALIZAÇÃO DO SERVIDOR ---
if __name__ == '__main__':
    app = create_app()
    
    # Garante que a pasta do banco existe
    if not os.path.exists('instance'):
        os.makedirs('instance')
    
    # Cria as tabelas no banco (se não existirem)
    with app.app_context():
        db.create_all()
        print("Banco de dados verificado/criado com sucesso!")

    # Roda o servidor
    app.run(debug=True)