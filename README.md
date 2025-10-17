# Qurtubah School - Covenant & Disclaimer Management System

A comprehensive web application for managing employee disclaimers, asset tracking, and departmental operations at Qurtubah School.

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3.10 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+ and npm** - [Download Node.js](https://nodejs.org/)
- **PostgreSQL 12+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **uv** (Python package manager) - [Install uv](https://github.com/astral-sh/uv)
- **Git** - [Download Git](https://git-scm.com/)

### Installing uv (Python Package Manager)

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
```

### Installing PostgreSQL

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify installation
psql --version
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### Windows
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. PostgreSQL will start automatically as a Windows service

#### Create Database and User
After installing PostgreSQL, create a database and user for the application:

```bash
# Connect to PostgreSQL (use 'sudo -u postgres psql' on Linux)
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE qurtubah_db;
CREATE USER qurtubah_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qurtubah_db TO qurtubah_user;

# Exit PostgreSQL prompt
\q
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Convenant-Disclaimer
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Python Dependencies
```bash
# uv will automatically create a virtual environment and install dependencies
uv sync
```

#### Configure Environment Variables

Create a `.env` file in the `backend/config/` directory:

```bash
# Copy the example file
cp config/env.example config/.env

# Edit .env and update the PostgreSQL credentials you created earlier:
# - DB_NAME=qurtubah_db
# - DB_USER=qurtubah_user
# - DB_PASSWORD=your_secure_password (use the password you set)
```

#### Run Database Migrations
```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

#### Create Superuser (Admin Account)
```bash
uv run python manage.py createsuperuser
```

Follow the prompts to enter:
- Email address (used as username)
- First name
- Last name
- Password (minimum 8 characters)


### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Node Dependencies
```bash
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# Copy the example file
cp env.example .env

# Then edit .env and set your values
# Or manually copy the content of env.example to .env
```

## 🏃 Running the Application

### Start Backend Server

Open a terminal and run:

```bash
cd backend
uv run python manage.py runserver
```

The backend will be available at: **http://localhost:8000**

- API endpoints: `http://localhost:8000/api/`
- Admin panel: `http://localhost:8000/admin/`

### Start Frontend Development Server

Open a **new terminal** and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### Access the Application

1. Open your browser and navigate to **http://localhost:5173**
2. You can:
   - **Sign in** with your superuser credentials
   - Access the **admin panel** at http://localhost:8000/admin/

## 📁 Project Structure

```
Convenant-Disclaimer/
├── backend/                    # Django backend
│   ├── apps/                   # Django apps
│   │   ├── assets/            # Asset management
│   │   ├── disclaimer/        # Disclaimer system
│   │   ├── reports/           # Reporting functionality
│   │   └── users/             # User authentication
│   ├── config/                # Django settings
│   ├── media/                 # Uploaded files
│   ├── locale/                # Translation files
│   ├── manage.py              # Django management script
│   └── pyproject.toml         # Python dependencies
│
├── frontend/                   # React frontend
│   ├── public/                # Static assets
│   ├── src/                   # Source code
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React context providers
│   │   ├── layouts/           # Page layouts
│   │   ├── lib/               # Utility libraries
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Helper functions
│   │   └── widgets/           # UI widgets
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
│
└── README.md                   # This file
```


This project is proprietary software for Qurtubah School.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Last Updated:** October 2025

