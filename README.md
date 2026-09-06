# FileCharter: A robust, easy to use rust file system emulator within the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Filecharter is a file system emulator brought to the web, inspired by FileBrowser. This project is my first project made with rust. It is intended to be used within a self-hosted/homelab system. Please ensure that a vpn is used (such as tailscale) to avoid exposing this service to the entire net.

### Features

- **Performant**. The backend is entirely made in rust. Ensuring that your access to your filesystem is extremely fast.
- **Security Enabled**. The rust APIs are within a protected route. Guarded by a simple user/password authentication method. However, this is not by all means a catch all. Please use a vpn such as tailscale.
- **Lightweight**. This service's sole purpose is to display a filesystem with filesystem like functionality on a pretty UI. No additional features/bloat.
- **Easy to configure/use**. Setup only requires the source code and an env file for configs. Please look at _**Getting Started**_ for more information.

### Getting Started

- Simply clone the file with: `git clone https://github.com/Pyxelate/FileCharter.git`
- Cd into the file directory where FileCharter is cloned to.
- Create a file named .env.
- Add the following or find in the .env.example file:

```env
# Mongo username and password needed for the MongoDB database.
MONGO_USERNAME=changeme
MONGO_PASSWORD=changeme
MONGO_PORT=27017

# Frontend port usually should be 80 or 443
FRONTEND_PORT=changeme

# If unsure, just use 3000 or any free port above 1024
BACKEND_PORT=changeme

# Serves at the initial directory for the app to display

FILECHARTER_ROOT_DIR=/

# This is used for docker-compose for to bind mount the host filesystem.
FILES_DIR=/Users/your-user
```

- Run the command: `docker compose up --build`
- The service should now start.

Note: Please ensure that this service is running behind a reverse proxy with certs to ensure a safe https connection.
