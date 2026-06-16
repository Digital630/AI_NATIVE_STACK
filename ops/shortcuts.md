cd ~/Desktop/LenDigital

ls

pwd

clear

git clone REPOSITORY_URL

nano ~/.claude/settings.json

cat ~/.claude/settings.json

AI-NATIVE STACK — TERMINAL SHORTCUTS & CORE COMMANDS

────────────────────────────
NAVIGATION
────────────────────────────

pwd
→ show current folder path

ls
→ list files

ls -a
→ list ALL files including hidden (.env, .gitignore)

cd folder-name
→ enter folder

cd ..
→ go back one level

cd ~
→ go home directory

clear
→ clean terminal screen

────────────────────────────
FILE CREATION
────────────────────────────

touch .env
→ create hidden environment file

touch .gitignore
→ create git protection file

touch server.js
→ create server file

────────────────────────────
OPEN FILE EDITOR
────────────────────────────

nano .env
→ open env file

nano server.js
→ open server.js

────────────────────────────
NANO SHORTCUTS
────────────────────────────

Control + O
→ SAVE file

Enter
→ confirm save

Control + X
→ EXIT nano

────────────────────────────
GIT SECURITY
────────────────────────────

echo ".env" >> .gitignore
→ protect secrets from GitHub upload

cat .gitignore
→ view gitignore file

────────────────────────────
VERIFY FILES
────────────────────────────

cat server.js
→ show server.js content

find . -name ".env"
→ find all .env files

────────────────────────────
NODE / SERVER
────────────────────────────

node server.js
→ run local server

Control + C
→ stop running server

────────────────────────────
NPM INSTALLS
────────────────────────────

npm install
→ install dependencies

npm install openai
→ OpenAI/OpenRouter SDK

npm install express cors dotenv axios
→ core backend packages

npm install -g langfuse
→ observability/tracing

────────────────────────────
DOCKER
────────────────────────────

docker --version
→ verify docker

docker ps
→ running containers

────────────────────────────
MCP / INFRASTRUCTURE
────────────────────────────

Filesystem MCP
→ secure local file access

OpenRouter
→ multi-model routing layer

Langfuse
→ AI tracing / observability

Sentry
→ error monitoring

dotenv
→ secret environment loader

────────────────────────────
KEY FILES
────────────────────────────

.env
→ secret API keys

.gitignore
→ prevents secret upload to GitHub

server.js
→ backend orchestration server (future SignalOS router repo)

docs/{product}/PRODUCT_MASTER.md
→ master documents in this repo (see README.md)

services/signalos/
→ reserved folder for future modular router