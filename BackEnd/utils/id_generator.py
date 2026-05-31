# src/utils/id_generator.py

# A importação correta, conforme a documentação da biblioteca snowflake-id
from snowflake import SnowflakeGenerator

# Para esta biblioteca, precisamos apenas de um ID de instância (worker).
# Ele deve ser um número entre 0 e 4095.
INSTANCE_ID = 1

# Inicializa o gerador com o ID da nossa instância.
generator = SnowflakeGenerator(INSTANCE_ID)

def generate_id() -> int:
    """
    Gera um novo ID único no formato Snowflake (int 64-bit).
    """
    # A forma de obter o próximo ID é usando next().
    return next(generator)