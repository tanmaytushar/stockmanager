# Stock Manager

A full-stack stock-management application with an Angular frontend, a Spring Boot backend, and an Oracle database.

## Project structure

```text
stockmanager/
|-- backend/       Spring Boot REST API
|-- frontend/      Angular web application
|-- sqlscript.sql  Oracle schema and sample data
`-- README.md
```

## Prerequisites

Install the following before starting the project:

- Git
- Java JDK 17
- Node.js and npm
- Oracle Database (local service `FREE` is used in the example)
- Oracle SQL Developer or another Oracle SQL client

Verify Java is version 17:

```bat
java -version
```

## 1. Clone the repository

```bat
git clone <repository-url>
cd stockmanager
```

## 2. Create the database schema

1. Start your local Oracle Database.
2. Open `sqlscript.sql` in Oracle SQL Developer.
3. Connect using your local Oracle credentials.
4. Run the whole script with **F5** (Run Script).

The script removes and recreates the application tables, then inserts sample data. Running it again resets that data.

## 3. Configure backend environment variables

The database credentials are kept in `backend/.env`, which is ignored by Git and must not be committed.

```bat
cd backend
copy .env.example .env
notepad .env
```

Set the values in `.env` for your own Oracle database:

```properties
DB_URL=jdbc:oracle:thin:@localhost:1521/FREE
DB_USERNAME=your_oracle_username
DB_PASSWORD=your_oracle_password
```

Update `FREE` if your Oracle service uses a different name, such as `XEPDB1`.

## 4. Start the backend

From the `backend` directory:

```bat
mvnw.cmd spring-boot:run
```

The Spring Boot API starts at `http://localhost:8080`.

If your terminal uses an older Java version, configure JDK 17 for the current PowerShell session first:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.19"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

## 5. Start the frontend

Open a second terminal. From the repository root:

```bat
cd frontend
npm install
npm start
```

Open `http://localhost:4200` in a browser.

## Local development ports

| Service | Address |
|---|---|
| Oracle Database | `localhost:1521` |
| Spring Boot backend | `http://localhost:8080` |
| Angular frontend | `http://localhost:4200` |

## Security

- Never commit `backend/.env` or database passwords.
- Commit only `backend/.env.example`, which contains placeholders.
- Each developer should create their own `.env` file with their local credentials.
