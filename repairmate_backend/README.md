# RepairMate Backend

## Table of Contents
1. [Introduction](#introduction)
2. [Technologies](#technologies)
3. [Project Structure](#project-structure)
4. [Setup](#setup)
5. [Database Configuration](#database-configuration)
6. [Important Commands](#important-commands)
7. [Troubleshooting](#troubleshooting)
8. [Frontend Integration](#frontend-integration)

## Introduction

This is the backend for the RepairMate project, a web application designed to facilitate troubleshooting and training on machinery. It's built using Django, a high-level Python web framework that encourages rapid development and clean, pragmatic design.

## Technologies

- Python 3.x
- Django 5.1
- Django REST Framework
- PostgreSQL
- Gunicorn (for production deployment)

## Project Structure
```
tree -I '__pycache__|venv|*.pyc|__init__.py|.gitignore' -a

tree -I '__pycache__|venv|*.pyc|__init__.py|.gitignore|initial_data|media|servers_settings|staticfiles|file_manager|*static' -a

```
```
Repairmate_backend/
│
├── .env                           # Environment variables
├── manage.py                      # Django management script
├── requirements.txt               # Project dependencies
├── reset_and_populate.sh          # Script to reset and populate the database
│
├── api/                           # API app
│   ├── management/
│   │   └── commands/
│   │       └── populate_test_data.py  # Command to populate test data
│   ├── migrations/                # Database migrations
│   ├── models.py                  # Database models
│   ├── serializers.py             # API serializers
│   ├── urls.py                    # API URL configurations
│   └── views.py                   # API views
│
├── core/                          # Core app
│   ├── static/
│   │   └── core/
│   │       ├── css/
│   │       ├── images/
│   │       └── js/
│   ├── templates/
│   │   ├── core/
│   │   │   ├── base.html
│   │   │   └── home.html
│   │   └── registration/
│   │       ├── login.html
│   │       └── register.html
│   ├── urls.py                    # Core app URL configurations
│   └── views.py                   # Core app views
│
├── initial_data/                  # Initial data for populating the database
│   └── machine_images/
│
├── media/                         # User-uploaded media files
│   └── machine_images/
│
├── repairmate/                    # Project configuration
│   ├── settings.py                # Django settings
│   ├── urls.py                    # Main URL configuration
│   ├── wsgi.py                    # WSGI configuration
│   └── static/
│       └── react/
│           └── build/             # React frontend build files
│               ├── index.html
│               └── static/
│                   ├── css/
│                   ├── js/
│                   └── media/
│
└── staticfiles/                   # Collected static files for production
```

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd repairmate
   ```

2. Create a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the project root and add the following:
   ```
   DB_NAME=repairmate_local
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DJANGO_SECRET_KEY=your_secret_key
   # Change to false in production
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

   # For production
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://my-frontend-domain.com
   DJANGO_SECURE_SSL_REDIRECT=True
   DJANGO_SESSION_COOKIE_SECURE=True
   DJANGO_CSRF_COOKIE_SECURE=True
   ```

## Database Configuration

1. Install PostgreSQL:
   ```
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. Start PostgreSQL service:
   ```
   sudo service postgresql start
   ```

3. Create database and user:
   ```
   sudo -u postgres psql
   CREATE DATABASE repairmate_local;
   CREATE USER repairmate_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE repairmate_local TO repairmate_user;
   \q
   ```

4. Update your `.env` file with the new database credentials.

## Important Commands

- Start the development server:
  ```
  python3 manage.py runserver
  ```

- Create migrations:
  ```
  python3 manage.py makemigrations
  ```

- Apply migrations:
  ```
  python3 manage.py migrate
  ```

- Create a superuser:
  ```
  python3 manage.py createsuperuser
  ```

- Populate the database with test data:
  ```
  python3 manage.py populate_test_data
  ```

- Clear all data from the database:
  ```
  python3 manage.py flush
  ```
> [!NOTE]  
> Delete the old cookie in the web browser so you don't get errors with the API token. [This need to be a future enhancement]

- Enter Django shell:
  ```
  python3 manage.py shell
  ```

## Troubleshooting

- If you encounter a "ModuleNotFoundError: No module named 'rest_framework'" error:
  ```
  pip3 install djangorestframework
  ```

- If you have issues with pycairo:
  ```
  sudo apt-get update
  sudo apt-get install -y pkg-config libcairo2-dev
  ```

- If you get a lock error when using apt-get:
  ```
  sudo kill <process_id>
  sudo apt clean
  ```

## Frontend Integration

To integrate the React frontend with the Django backend:

1. In your React project, run:
   ```
   npm run build
   ```

2. Copy the contents of the `build` folder to `repairmate/static/react/build/`.

3. In `repairmate/settings.py`, ensure you have the following:
   ```python
   STATICFILES_DIRS = [
       os.path.join(BASE_DIR, 'repairmate', 'static'),
   ]
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

   REACT_APP_DIR = os.path.join(BASE_DIR, 'repairmate', 'static', 'react', 'build')

   STATICFILES_DIRS += [
       os.path.join(REACT_APP_DIR, 'static'),
   ]
   ```

4. In `repairmate/urls.py`, add a catch-all URL pattern to serve the React app:
   ```python
   from django.views.generic import TemplateView

   urlpatterns = [
       # ... other URL patterns ...
       re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
   ]
   ```


This setup allows Django to serve the React frontend while handling API requests through the backend.