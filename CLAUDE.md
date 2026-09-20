# ALS LMS - Architecture Guidelines

## 1. Project Overview

This project is a Learning Management System (LMS) for the
Alternative Learning System (ALS) in Naawan District.

The system has three end-users:

1. Admin / ALS Coordinator
2. Teacher / ALS Implementor
3. Learner

The system is designed to support the existing ALS learning
process and should not replace the face-to-face learning modality.

---

## 2. Technology Stack

### Frontend
- Vue
- Vite

### Backend
- Node.js
- Express

### Database / Backend Services
- Supabase

### Learner Application
- Progressive Web App (PWA)
- Mobile-first design

---

## 3. System Architecture

The system consists of three user portals and one shared backend:

- admin-portal
- teacher-portal
- learner-portal
- backend

Architecture:

Admin Portal ─────┐
Teacher Portal ───┼──> Node.js + Express ──> Supabase
Learner Portal ───┘

The backend is shared by all three portals.

Do not create a separate backend for each portal.

---

## 4. User Roles

### Admin / ALS Coordinator

Responsible for:
- Managing learners
- Managing teachers/implementors
- Managing learning centers
- Managing learning content
- Monitoring the system
- Viewing reports
- Managing announcements

### Teacher / ALS Implementor

Responsible for:
- Managing assigned learners
- Providing learning modules
- Managing assessments
- Monitoring learner progress
- Recording attendance
- Viewing learner performance

### Learner

Responsible for:
- Accessing assigned learning materials
- Studying modules
- Completing activities
- Taking assessments
- Viewing results
- Viewing learning progress

---

## 5. Data Flow

The system must use real data from Supabase.

Example workflow:

Admin
→ Adds Learner
→ Learner is stored in Supabase
→ Learner is assigned to Teacher/Implementor
→ Teacher assigns/provides Module
→ Learner accesses Module
→ Learner completes learning activities
→ System records progress
→ Teacher monitors progress
→ Admin can view consolidated information

---

## 6. Important Data Rule

Do NOT use hardcoded or fake data for:

- Learner counts
- Teacher/Implementor counts
- Learning progress
- Assessment results
- Attendance
- Reports

When there is no data in Supabase, display:

0

or an appropriate empty state.

Example:

Total Learners: 0

"No learner data available yet."

When the Admin adds a learner, the dashboard must automatically
reflect the actual database record.

---

## 7. Development Principle

Build the system feature-by-feature.

Do not build disconnected pages.

Each feature must have:

Frontend
→ Backend/API
→ Database
→ Real data displayed in the interface.

---

## 8. Architecture Rule

Before implementing a new feature:

1. Identify the user role.
2. Identify the required data.
3. Identify the database table/relationship.
4. Define the backend/API requirement.
5. Build the frontend interface.
6. Connect the frontend to the backend.
7. Test the complete data flow.

Do not create UI-only features that are not connected to the
actual system workflow.

---

## 9. Scope Rule

Do not add features simply because they are common in LMS platforms.

Every feature must support the requirements and workflow of
the ALS LMS.

If a feature is not defined in the requirements, ask before
implementing it.

---

## 10. UI/UX Principle

The system should be:

- Simple
- Clear
- Easy to navigate
- Responsive
- Accessible
- Appropriate for ALS users

The Learner Portal should prioritize mobile devices because
it is designed as a PWA.

---

## 11. Development Instruction

Do not make architectural changes without explaining:

- What is being changed
- Why it is needed
- What existing components are affected

Preserve the established architecture and naming conventions
unless there is a clear technical reason to change them.