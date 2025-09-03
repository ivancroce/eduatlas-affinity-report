# EduAtlas Affinity Report System

## 📋 Project Overview

The **EduAtlas Affinity Report System** is a capstone project developed for **Westcliff University** to facilitate **international academic credential comparison** for Bachelor's degrees.

The system allows students and administrators to compare education systems between countries, analyzing:

- 🎓 Degree durations (BA)
- 📊 Credit systems (ECTS equivalencies)
- 🏷️ Grading scales
- 📚 Academic requirements

---

## 🚀 4-Week Development Roadmap

### 🎯 v1.0 - Core Features (Weeks 1-2) - **Demo Day Ready**

**Priority: HIGH - Must deliver value quickly**

#### Week 1 - Backend Foundation:

- Database setup with Country entity
- Java service to import Excel data
- JWT Authentication system (login/register)
- Basic REST API (GET countries, auth endpoints)
- CORS configuration for frontend

#### Week 2 - Frontend Core:

- React frontend setup with login page
- Admin backoffice interface (country management)
- Student interface (country selection dropdowns)
- Frontend affinity calculation logic
- Display comparison table (Spain vs Italy style)

**Demo Day Deliverable:**

- Admin can login → see backoffice
- Student can login → select 2 countries → see affinity report

---

### 🔧 v2.0 - Enhanced Features (Week 3)

**Priority: MEDIUM - Improve user experience**

- 📱 Responsive design improvements
- 🎨 Better UI/UX with Bootstrap/custom styling
- ✏️ Admin CRUD operations (edit/delete countries)
- 👥 User management for admins

---

### 🏗️ v3.0 - Advanced Features (Week 4)

**Priority: MEDIUM - Polish and extras**

- 📊 Basic analytics/stats for admin
- 🧪 Testing and bug fixes
- ⚡ Performance optimization
- 📚 Documentation completion

---

### 🔮 v4.0 - Future Enhancements (Post-Submission)

**Priority: LOW - Nice to have**

- 📈 Data visualization charts
- 🌍 Interactive country selection map
- 📧 Email notifications

---

### 🎭 **v1.0 Success Criteria (Demo Day):**

1. Admin login → Access backoffice with country list
2. Student login → See country selection interface
3. Select "Spain" and "Italy" from dropdowns
4. Click "Generate Report"
5. See comparison table with all 6 categories
6. Display "MODERATE/EQUIVALENT" final affinity

**Key Rule:** Authentication + Core functionality in 2 weeks - complete user experience!

---

## 🏗️ Tech Stack

**Backend:** Java 21, Spring Boot 3.2, Maven, PostgreSQL  
**Frontend:** React 18, Vite, Bootstrap, SASS
**Authentication:** JWT  
**Data Processing:** Apache POI (Excel import)  
**API Documentation:** Swagger/OpenAPI 3

---

## 🎯 Current Development Phase

**Phase 1: Database Design & Data Import** _(In Progress)_

### Immediate Goals:

1. ✅ Define database schema and relationships
2. 🔄 Import country education data from Excel
3. 🔄 Create basic backend API structure
4. ⏳ Implement affinity calculation logic

### Key Features (MVP):

- **Admin Dashboard:** Import Excel data, manage countries
- **Student Interface:** Compare 2 countries, generate affinity reports
- **Comprehensive Analysis:** 6-category comparison system
  - Duration (BA)
  - Overall Credits
  - Credit Ratio
  - Grading System
  - EQF/OFQUAL/US Equivalent Level
  - Official Degree Denomination
- **Final Affinity Rating:** Weighted summary with indicator breakdown

---

## 🗂️ Data Structure

Based on the provided Excel file, our system handles:

### Country Education Data:

- **Country Name**
- **Years of Compulsory Schooling** (before university)
- **Duration (BA)** (standard bachelor's duration)
- **Credits per Year** (ECTS or equivalent)
- **Grading System** (numerical/letter scales)
- **EQF/OFQUAL Level** (European Qualification Framework)
- **Official Degree Denomination**

### Business Rules:

- Total education years = 16 (schooling + university)
- Asterisk (\*) marks extended programs - use base duration
- Credit calculations based on standard BA duration only

---

## 🎭 User Roles

### 👨‍💼 Administrator

- Import/export country data via Excel
- CRUD operations on country records
- Manage user accounts
- View system analytics

### 👨‍🎓 Student

- Select and compare 2 countries
- Generate affinity reports
- View comparison history

---

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 13+
- Maven 3.8+

### Database Setup

```sql
CREATE DATABASE affinity_report_db;
```

### Backend Configuration

Create `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/your_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT settings
jwt.secret=your_secret_key
jwt.expiration=86400000
```

### Development Commands

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🤝 Project Team

**Developer:** Ivan Croce'
**Institution:** Westcliff University  
**Project Type:** Capstone Bootcamp Project  
**Timeline:** 4 weeks

---

## 📞 Development Status

**Current Status:** 🔄 Starting v1.0 - Database Design & Data Import Phase  
**Next Milestone:** Week 1 - Backend Foundation Complete  
**Demo Day Target:** v1.0 - Full authentication + comparison functionality

---

_This README will be updated as development progresses through each version._
