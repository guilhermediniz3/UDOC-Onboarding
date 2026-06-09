#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# UDoc — Script de setup inicial (Linux / macOS)
#
# Uso:
#   ./setup.sh              → sobe postgres + backend apenas
#   ./setup.sh --ollama     → sobe postgres + backend + Ollama e baixa modelos
# ─────────────────────────────────────────────────────────────────────────────

set -e

OLLAMA_MODELS=("llama3.1:8b" "qwen2.5:7b")
WITH_OLLAMA=false

# ── Parâmetros ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --ollama) WITH_OLLAMA=true ;;
    *) echo "Parâmetro desconhecido: $arg"; exit 1 ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        UDoc — Setup Inicial          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Verificar Docker ──────────────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "❌  Docker não está rodando. Inicie o Docker e tente novamente."
  exit 1
fi

# ── Verificar .env ────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "⚠️  Arquivo .env não encontrado. Criando a partir de .env.example..."
  cp .env.example .env
  echo "📝  Edite o arquivo .env com suas configurações antes de continuar."
  echo "    Pressione ENTER para continuar ou Ctrl+C para cancelar."
  read -r
fi

# ── Subir serviços ────────────────────────────────────────────────────────────
if [ "$WITH_OLLAMA" = true ]; then
  echo "🚀  Subindo serviços com IA local (postgres + backend + Ollama)..."
  docker compose --profile ollama up -d
else
  echo "🚀  Subindo serviços (postgres + backend)..."
  docker compose up -d
fi

# ── Aguardar backend ──────────────────────────────────────────────────────────
echo ""
echo "⏳  Aguardando o backend iniciar..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8081/actuator/health > /dev/null 2>&1 || \
     curl -sf http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "✅  Backend pronto!"
    break
  fi
  printf "."
  sleep 3
done
echo ""

# ── Baixar modelos Ollama ─────────────────────────────────────────────────────
if [ "$WITH_OLLAMA" = true ]; then
  echo "⏳  Aguardando Ollama ficar pronto..."
  for i in $(seq 1 20); do
    if docker exec udoc-ollama curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
      echo "✅  Ollama pronto!"
      break
    fi
    printf "."
    sleep 3
  done
  echo ""

  for MODEL in "${OLLAMA_MODELS[@]}"; do
    echo "📥  Baixando modelo: $MODEL (pode demorar na primeira vez)..."
    docker exec udoc-ollama ollama pull "$MODEL"
    echo "✅  $MODEL disponível!"
  done

  echo ""
  echo "🤖  Modelos disponíveis:"
  docker exec udoc-ollama ollama list
fi

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  UDoc está rodando!                                  ║"
echo "║                                                          ║"
echo "║  Backend:  http://localhost:8081                         ║"
if [ "$WITH_OLLAMA" = true ]; then
echo "║  Ollama:   http://localhost:11434                        ║"
fi
echo "║                                                          ║"
echo "║  Para usar IA local:                                     ║"
echo "║  Configurações → Integrações → selecione                 ║"
echo "║  'Ollama / Llama' ou 'Ollama / Qwen' e insira            ║"
echo "║  o nome do modelo (ex: llama3.1:8b)                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
