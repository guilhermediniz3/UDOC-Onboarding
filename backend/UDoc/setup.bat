@echo off
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────────────────────────────────────
:: UDoc — Script de setup inicial (Windows)
::
:: Uso:
::   setup.bat              → sobe postgres + backend apenas
::   setup.bat --ollama     → sobe postgres + backend + Ollama e baixa modelos
:: ─────────────────────────────────────────────────────────────────────────────

set WITH_OLLAMA=false

:: ── Parâmetros ────────────────────────────────────────────────────────────────
for %%A in (%*) do (
    if "%%A"=="--ollama" set WITH_OLLAMA=true
)

echo.
echo ╔══════════════════════════════════════╗
echo ║        UDoc — Setup Inicial          ║
echo ╚══════════════════════════════════════╝
echo.

:: ── Verificar Docker ──────────────────────────────────────────────────────────
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Docker nao esta rodando. Inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo [OK] Docker esta rodando.

:: ── Verificar .env ────────────────────────────────────────────────────────────
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado. Criando a partir de .env.example...
    if exist .env.example (
        copy .env.example .env > nul
        echo [INFO] Arquivo .env criado.
        echo [INFO] Edite o arquivo .env com suas configuracoes antes de continuar.
        echo        Pressione qualquer tecla para continuar ou feche a janela para cancelar.
        pause > nul
    ) else (
        echo [ERRO] .env.example nao encontrado. Crie o arquivo .env manualmente.
        pause
        exit /b 1
    )
)

:: ── Subir serviços ────────────────────────────────────────────────────────────
if "%WITH_OLLAMA%"=="true" (
    echo [INFO] Subindo servicos com IA local (postgres + backend + Ollama^)...
    docker compose --profile ollama up -d
) else (
    echo [INFO] Subindo servicos (postgres + backend^)...
    docker compose up -d
)

if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao subir os servicos Docker.
    pause
    exit /b 1
)

:: ── Aguardar backend ──────────────────────────────────────────────────────────
echo.
echo [INFO] Aguardando o backend iniciar...
set /a TRIES=0
:WAIT_BACKEND
set /a TRIES+=1
if %TRIES% gtr 30 (
    echo [AVISO] Backend demorou mais que o esperado. Verifique: docker compose logs backend
    goto AFTER_BACKEND
)
curl -sf http://localhost:8081/actuator/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend pronto!
    goto AFTER_BACKEND
)
curl -sf http://localhost:8081/api/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend pronto!
    goto AFTER_BACKEND
)
<nul set /p "=."
timeout /t 3 /nobreak > nul
goto WAIT_BACKEND
:AFTER_BACKEND
echo.

:: ── Baixar modelos Ollama ─────────────────────────────────────────────────────
if "%WITH_OLLAMA%"=="true" (
    echo [INFO] Aguardando Ollama ficar pronto...
    set /a TRIES=0
    :WAIT_OLLAMA
    set /a TRIES+=1
    if !TRIES! gtr 20 (
        echo [AVISO] Ollama demorou para iniciar. Verifique: docker compose logs ollama
        goto AFTER_OLLAMA_WAIT
    )
    docker exec udoc-ollama curl -sf http://localhost:11434/api/tags > nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [OK] Ollama pronto!
        goto AFTER_OLLAMA_WAIT
    )
    <nul set /p "=."
    timeout /t 3 /nobreak > nul
    goto WAIT_OLLAMA
    :AFTER_OLLAMA_WAIT
    echo.

    echo [INFO] Baixando modelo: llama3.1:8b (pode demorar na primeira vez^)...
    docker exec udoc-ollama ollama pull llama3.1:8b
    echo [OK] llama3.1:8b disponivel!

    echo [INFO] Baixando modelo: qwen2.5:7b (pode demorar na primeira vez^)...
    docker exec udoc-ollama ollama pull qwen2.5:7b
    echo [OK] qwen2.5:7b disponivel!

    echo.
    echo [INFO] Modelos disponíveis:
    docker exec udoc-ollama ollama list
)

:: ── Resumo ────────────────────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  OK  UDoc esta rodando!                                  ║
echo ║                                                          ║
echo ║  Backend:  http://localhost:8081                         ║
if "%WITH_OLLAMA%"=="true" (
echo ║  Ollama:   http://localhost:11434                        ║
)
echo ║                                                          ║
echo ║  Para usar IA local:                                     ║
echo ║  Configuracoes -^> Integracoes -^> selecione              ║
echo ║  'Ollama / Llama' ou 'Ollama / Qwen' e insira            ║
echo ║  o nome do modelo (ex: llama3.1:8b^)                     ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

pause
