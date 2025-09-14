from flask import Flask
# Importe o Blueprint que acabamos de criar
from src.routes.reservation_routes import reservation_bp

app = Flask(__name__)

# Registre o Blueprint na sua aplicação
app.register_blueprint(reservation_bp, url_prefix='/api') # Prefixo opcional para todas as rotas

@app.route("/")
def health_check():
    return "API is running!"

if __name__ == "__main__":
    # O ideal é usar um servidor WSGI como Gunicorn em produção
    app.run(debug=True)