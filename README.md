# Stock Manager

A full-stack stock-management application with an Angular frontend, a Spring Boot backend, and an Oracle database.

## Features

- Stock and customer CRUD with search and pagination
- Atomic stock purchases and sales with inventory checks
- Customer portfolio tracking and complete transaction history
- Portfolio value, trading-frequency, price, and total-asset reports
- Bean Validation, consistent API errors, CORS, and application logging
- Interactive OpenAPI/Swagger documentation
- Responsive Angular interface with loading, error, validation, and empty states

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
- Node.js 22.22.3+ (or another version accepted by the Angular packages) and npm
- Oracle Database (local service `FREE` is used for this training setup)
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
2. Connect to the `FREE` service as `SYSTEM` in Oracle SQL Developer.
3. Open `sqlscript.sql` using that connection.
4. Run the whole script with **F5** (Run Script).

The script removes and recreates the application tables, then inserts sample data. Running it again resets that data.
Only use this `SYSTEM` configuration for a local training database. The script drops and recreates its application tables.

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
DB_USERNAME=SYSTEM
DB_PASSWORD=your_oracle_password
```

Update `FREE` only if your Oracle installation uses a different service name.

## 4. Start the backend

From the `backend` directory:

```bat
mvnw.cmd spring-boot:run
```

The Spring Boot API starts at `http://localhost:8080`.

Interactive API documentation is available at `http://localhost:8080/swagger-ui/index.html`.

If your terminal uses an older Java version, configure JDK 17 for the current PowerShell session first. Replace this example path with the JDK 17 location on your machine:

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

## Main API endpoints

| Operation | Method and path |
|---|---|
| List/create stocks | `GET/POST /api/stocks` |
| Read/update/delete a stock | `GET/PUT/DELETE /api/stocks/{symbol}` |
| List/create customers | `GET/POST /api/customers` |
| Read/update/delete a customer | `GET/PUT/DELETE /api/customers/{customerId}` |
| Buy or sell stock | `POST /api/transactions/buy`, `POST /api/transactions/sell` |
| List transactions | `GET /api/transactions` |
| View portfolios | `GET /api/portfolios` |
| View one portfolio | `GET /api/portfolios/{customerId}` |
| View reports | `GET /api/reports/*` |

## Run automated checks

Backend tests, from `backend`:

```bat
mvnw.cmd test
```

Frontend tests and production build, from `frontend`:

```bat
npm test -- --watch=false
npm run build
```

## Local development ports

| Service | Address |
|---|---|
| Oracle Database | `localhost:1521` |
| Spring Boot backend | `http://localhost:8080` |
| Angular frontend | `http://localhost:4200` |

## Security

- Never commit `backend/.env` or database passwords.
- The included `SYSTEM` setup is for local training only; use a dedicated application user outside this environment.
- Commit only `backend/.env.example`, which contains placeholders.
- Each developer should create their own `.env` file with their local credentials.
