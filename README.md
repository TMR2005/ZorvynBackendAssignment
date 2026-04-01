# Zorvyn - Finance Dashboard Backend

A production-ready Node.js backend for a finance dashboard system with role-based access control, financial record management, and comprehensive analytics APIs.

## Features Implemented

### 1. **Authentication & Authorization**
- JWT-based token authentication with secure password hashing (bcryptjs)
- Role-based access control (RBAC) with three tiers: VIEWER, ANALYST, ADMIN
- User status enforcement (ACTIVE/INACTIVE) to prevent unauthorized access
- Token expiration and refresh mechanisms via `.env` configuration
- Protected routes behind authentication middleware

### 2. **User & Role Management**
- Create, read, update, and deactivate users (Admin only)
- Role assignment: VIEWER (dashboard only), ANALYST (records + dashboard), ADMIN (full access)
- Secure password storage with bcryptjs hashing
- User status tracking (ACTIVE/INACTIVE)
- Email uniqueness validation

### 3. **Financial Records Management**
- Full CRUD operations: Create, Read, Update, Delete (soft delete pattern)
- Record fields: amount, type (INCOME/EXPENSE), category, date, notes
- Paginated record listing with customizable page/limit
- Filtering by type, category, and date range (startDate/endDate)
- Soft delete functionality (isDeleted flag) to preserve audit trails

### 4. **Dashboard Analytics & Aggregations**
- **Summary**: Total income, total expenses, net balance
- **Category Breakdown**: Income/expense totals grouped by category
- **Monthly Trends**: Income/expense trends by month (YYYY-MM)
- **Weekly Trends**: Income/expense trends by week
- **Recent Activity**: Last 5 records ordered by creation time
- Role-scoped aggregations (non-admin users see only their data)

### 5. **Data Validation & Error Handling**
- Strong input validation for amounts (numeric), types (enum), dates (ISO string)
- Comprehensive error responses with appropriate HTTP status codes
- Error handling across all endpoints with structured error messages
- Protection against invalid operations and edge cases

### 6. **Access Control & Data Ownership**
- Admin users: full access to all records and user management
- Analyst/Viewer users: scoped to own records (record:read filters by createdBy)
- Dashboard data is role-aware (users see aggregations of only their records)
- Admin bypass for administrative operations

### 7. **Testing Suite**
- 32 comprehensive tests across 4 test suites
- Authentication tests (login, token validation, inactive users)
- User management tests (RBAC, user CRUD)
- Record management tests (CRUD, filtering, pagination, soft delete)
- Dashboard analytics tests (aggregations, role-based data scoping)
- Jest + Supertest for end-to-end testing

## Architecture & Design

### Project Structure
```
.
├── __tests__/                    # Test suites
│   ├── auth.test.js             # Authentication & authorization tests
│   ├── users.test.js            # User management tests
│   ├── records.test.js          # Record management tests
│   └── dashboard.test.js        # Dashboard analytics tests
├── controllers/                  # Business logic layer
│   ├── user.controller.js       # User CRUD & login
│   ├── record.controller.js     # Record CRUD & filtering
│   └── dashboard.controller.js  # Analytics & aggregations
├── middleware/                   # Express middleware
│   ├── auth.js                  # JWT authentication & password hashing
│   ├── authorize.js             # Role-based authorization
│   └── fakeAuth.js              # Development-only auth (for testing)
├── routes/                       # API route definitions
│   ├── user.routes.js           # /users endpoints
│   ├── record.routes.js         # /records endpoints
│   └── dashboard.routes.js      # /dashboard endpoints
├── lib/                          # Utilities & clients
│   └── prisma.js                # Prisma client initialization
├── prisma/                       # Database
│   ├── schema.prisma            # Data models
│   ├── seed.js                  # Database seeding
│   └── migrations/              # Database migrations
├── index.js                      # Express app setup & entry point
├── package.json                  # Dependencies & scripts
├── docker-compose.yaml           # PostgreSQL container setup
└── .env                          # Environment variables
```

### Tech Stack
- **Runtime**: Node.js v24+ with ES modules
- **Framework**: Express.js v5
- **Database**: PostgreSQL 16 (Docker) with Prisma ORM
- **Authentication**: JWT + bcryptjs
- **Testing**: Jest + Supertest
- **Development**: Nodemon for hot reload

### Design Decisions

#### 1. **Soft Deletes Over Hard Deletes**
- **Decision**: Records and users are marked as deleted (isDeleted flag) rather than removed
- **Rationale**: Preserves audit trails, enables recovery, maintains referential integrity
- **Tradeoff**: Slightly slower queries due to `isDeleted: false` filters, but safety and compliance justify this

#### 2. **Role-Based Data Scoping**
- **Decision**: Dashboard and record endpoints automatically filter data by user role
- **Rationale**: Prevents unauthorized data access at the application layer
- **Tradeoff**: Admin users can see all data, less privacy isolation (but expected for admin role)

#### 3. **JWT Authentication Over Sessions**
- **Decision**: Stateless JWT tokens instead of server-side sessions
- **Rationale**: Scales horizontally, simpler distributed deployment
- **Tradeoff**: Tokens can't be revoked immediately; requires expiration strategy

#### 4. **Prisma ORM Over Raw SQL**
- **Decision**: Type-safe ORM with generated client types
- **Rationale**: Developer experience, safety, auto-generated CRUD operations
- **Tradeoff**: Less control over complex queries, ORM overhead (negligible for this scale)

#### 5. **Aggregation in Application Layer**
- **Decision**: Trends and breakdowns computed in Node.js after fetching records
- **Rationale**: Simpler code, easier to test, works with existing Prisma queries
- **Tradeoff**: Not optimized for very large datasets (>100k records); would need database-level aggregation for scale

#### 6. **No Request Validation Library (Zod/Joi)**
- **Decision**: Manual validation in controllers
- **Rationale**: Minimal dependencies, explicit validation logic
- **Tradeoff**: More verbose, less reusable; consider Zod for production scale

##  Setup & Installation

### Prerequisites
- Node.js v24+
- Docker & Docker Compose
- npm v10+

### Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/TMR2005/ZorvynBackendAssignment.git
   cd ZorvynBackendAssignment
   npm install
   ```

2. **Start PostgreSQL container**
   ```bash
   docker-compose up -d
   ```
   Verify: `docker-compose ps` should show `finance_postgres` running

3. **Configure environment**
   Create/verify `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=1h
   PORT=3000
   NODE_ENV=development
   ```

4. **Setup database**
   ```bash
   npx prisma migrate deploy  # Apply migrations
   npx prisma generate        # Generate Prisma client
   npx prisma db seed         # Optional: seed test data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:3000`

### Health Check
```bash
curl http://localhost:3000
# Response: "API is running 🚀"
```

##  API Documentation

### Authentication Endpoints

#### Login
```
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "User",
    "email": "user@example.com",
    "role": "ANALYST"
  }
}
```

### User Management Endpoints (Admin Only)

#### Create User
```
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securepass123",
  "role": "ANALYST"
}

Response (201 Created)
```

#### Get All Users
```
GET /users
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "id": "uuid",
    "name": "User",
    "email": "user@example.com",
    "role": "ANALYST",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Update User
```
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "ADMIN"
}

Response (200 OK)
```

#### Deactivate User
```
DELETE /users/:id
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "User deactivated successfully"
}
```

### Record Management Endpoints

#### Create Record
```
POST /records
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000.50,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-15",
  "notes": "Monthly salary"
}

Response (201 Created)
```

#### List Records (with Filtering & Pagination)
```
GET /records?type=INCOME&category=Salary&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
Authorization: Bearer <token>

Query Parameters:
- type: INCOME | EXPENSE (optional)
- category: string (optional)
- startDate: ISO date (optional)
- endDate: ISO date (optional)
- page: number (default: 1)
- limit: number (default: 10)

Response (200 OK):
[
  {
    "id": "uuid",
    "amount": 1000.50,
    "type": "INCOME",
    "category": "Salary",
    "date": "2024-01-15",
    "notes": "Monthly salary",
    "createdBy": "user-uuid",
    "isDeleted": false,
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

#### Update Record
```
PATCH /records/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1100.00,
  "notes": "Updated notes"
}

Response (200 OK)
```

#### Delete Record (Soft Delete)
```
DELETE /records/:id
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Record deleted successfully"
}
```

### Dashboard Analytics Endpoints

#### Summary (Income, Expense, Net Balance)
```
GET /dashboard/summary
Authorization: Bearer <token>

Response (200 OK):
{
  "totalIncome": 5000.00,
  "totalExpense": 1200.00,
  "netBalance": 3800.00
}
```

#### Category Breakdown
```
GET /dashboard/categories
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "category": "Salary",
    "type": "INCOME",
    "_sum": { "amount": 5000.00 }
  },
  {
    "category": "Rent",
    "type": "EXPENSE",
    "_sum": { "amount": 800.00 }
  }
]
```

#### Monthly Trends
```
GET /dashboard/trends
Authorization: Bearer <token>

Response (200 OK):
{
  "2024-01": { "income": 5000.00, "expense": 800.00 },
  "2024-02": { "income": 5000.00, "expense": 1000.00 }
}
```

#### Weekly Trends
```
GET /dashboard/weekly
Authorization: Bearer <token>

Response (200 OK):
{
  "2024-01-01": { "income": 1000.00, "expense": 200.00 },
  "2024-01-08": { "income": 1200.00, "expense": 150.00 }
}
```

#### Recent Activity
```
GET /dashboard/recent
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "id": "uuid",
    "amount": 500.00,
    "type": "EXPENSE",
    "category": "Food",
    "date": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

## 🔐 Role-Based Access Control (RBAC)

### Permission Matrix

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Records | ❌ | ✅ (own) | ✅ (all) |
| Create Records | ❌ | ❌ | ✅ |
| Update Records | ❌ | ❌ | ✅ |
| Delete Records | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| View User List | ❌ | ❌ | ✅ |

### Data Scoping Rules
- **VIEWER**: Dashboard aggregations only
- **ANALYST/ADMIN**: Record lists filtered by `createdBy` (unless admin)
- **ADMIN**: Unrestricted access to all records and users

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/auth.test.js

# Watch mode (re-run on file changes)
npm test -- --watch
```

### Test Coverage
- **Auth Tests** (7 tests): Login, token validation, inactive user handling
- **User Tests** (8 tests): CRUD operations, role enforcement, user deactivation
- **Record Tests** (10 tests): CRUD, filtering, pagination, soft delete, ownership
- **Dashboard Tests** (7 tests): Aggregations, role-based scoping

### Test Output
```
Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
Time:        1.645 s
```

## 📊 Database Schema

### User Model
- `id`: UUID primary key
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: Enum (VIEWER, ANALYST, ADMIN)
- `status`: Enum (ACTIVE, INACTIVE)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Record Model
- `id`: UUID primary key
- `amount`: Float
- `type`: Enum (INCOME, EXPENSE)
- `category`: String
- `date`: DateTime
- `notes`: String (optional)
- `createdBy`: UUID (FK to User)
- `isDeleted`: Boolean (default: false)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## 🔄 Workflow Example

1. **Signup/Create User** (Admin only)
   ```bash
   POST /users → Creates new user with hashed password
   ```

2. **Login**
   ```bash
   POST /users/login → Returns JWT token
   ```

3. **Use Token**
   ```bash
   GET /records
   Headers: Authorization: Bearer <token>
   ```

4. **View Analytics**
   ```bash
   GET /dashboard/summary → Role-scoped aggregations
   ```

## 🎯 Design Tradeoffs & Considerations

### Production-Ready Decisions
✅ **JWT Authentication**: Stateless, scalable
✅ **Soft Deletes**: Audit trail preservation
✅ **Input Validation**: Type checking for critical fields
✅ **Error Handling**: Structured HTTP error responses
✅ **Testing**: 32 comprehensive end-to-end tests
✅ **Environment Config**: Secrets in `.env`

### Not Implemented (for Assessment Scope)
⚠️ **Request Validation Library** (Zod/Joi): Manual validation used for simplicity
⚠️ **Rate Limiting**: Can be added via `express-rate-limit`
⚠️ **API Documentation** (Swagger): Would require `swagger-jsdoc`
⚠️ **Caching**: Redis/in-memory caching for aggregations
⚠️ **Search**: Full-text search on records
⚠️ **Logging**: Winston/Pino structured logging
⚠️ **Audit Trail**: Separate audit log table for compliance
⚠️ **Multi-tenancy**: System assumes single organization

## 🚀 Deployment

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://user:password@prod-db:5432/finance_db
JWT_SECRET=long-random-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=production
```

### Docker Build
```bash
docker build -t zorvyn:latest .
docker run -p 3000:3000 --env-file .env zorvyn:latest
```

### Deployment Checklist
- [ ] Change `JWT_SECRET` to a strong random key
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (e.g., AWS RDS, Heroku Postgres)
- [ ] Enable HTTPS
- [ ] Add rate limiting middleware
- [ ] Setup monitoring & logging
- [ ] Configure CORS for frontend domain
- [ ] Use environment-specific `.env` files

## 🔮 Future Enhancements

1. **Input Validation**
   - Integrate Zod for schema validation across all endpoints
   - Standardized error responses for validation failures

2. **API Documentation**
   - Swagger/OpenAPI spec generation
   - Interactive API playground

3. **Performance**
   - Redis caching for dashboard aggregations
   - Database query optimization for large datasets
   - Elasticsearch for record search

4. **Security**
   - Helmet.js for HTTP headers
   - CORS configuration
   - Rate limiting per user/IP
   - API key authentication for services

5. **Observability**
   - Winston structured logging
   - Request/response logging middleware
   - Error tracking (Sentry)
   - Performance monitoring

6. **Features**
   - Export records to CSV/PDF
   - Scheduled alerts (budget warnings)
   - Multi-currency support
   - Recurring transactions
   - Budget planning & forecasting
   - Two-factor authentication

