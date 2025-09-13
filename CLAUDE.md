# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homi: Share What You Already Have
Homi is an app built to make sharing niche cooking and household items simple. Its primary audience is college students living together in dorms or small apartments with two to three roommates. This environment is ideal because housemates are comfortable sharing with one another, and Homi helps them build a shared inventory that reduces waste. Instead of letting groceries expire or buying duplicates, students can borrow from what others already have, making sharing straightforward, transparent, and fair.
- Core Feature: Item Sharing
- Post Available Items: Users can mark food or household items with multiple labels, either free to borrow or free to take
- Transparency: Each item shows who posted it, when it was added, and whether it’s free to borrow or free to take
- Community Benefit: Promotes shared use of niche or specialty items such as sauces, spices, garnishes (scallions), and condiments that often go to waste or are bought in duplicates. It also provides clear visibility into which items are free to use, removing the need to wait for confirmation from housemates, which is especially useful for late-night cooking.
Shared Shopping List: Users can create personal shopping lists and choose to make them public so housemates can pick up items for each other during their own shopping trips. The app automatically tracks payments and reimbursements, reducing the need for duplicate trips for small purchases or restocks.
Supporting Features
- Stock levels tracked (available/empty), color-coded for quick visibility. 
- When a user labels an items as empty it will remove it from the shared pantry and will prompt the user to add it to their shopping list

Bill Splitting
Simple, flexible splits: even split, percentage, per-item, or custom.
Receipt upload with OCR to quickly extract totals and item details.

This is a full-stack application called "Homi" with:
- **Frontend**: React 19 application bootstrapped with Create React App
- **Backend**: FastAPI application with PostgreSQL database integration
- **Database**: PostgreSQL (designed to run in Docker containers)

## Architecture

### Frontend Structure
- Standard Create React App structure in the root directory
- Main app component displays "Homi" header
- Uses React 19 with modern testing setup (@testing-library)

### Backend Structure
- Located in `backend/` directory
- FastAPI application organized in modular structure:
  - `app/core/` - Configuration and settings
  - `app/db/` - Database connection and session management
  - `app/models/` - SQLAlchemy ORM models
  - `app/api/` - API route handlers
- Uses SQLAlchemy for ORM with PostgreSQL
- Environment configuration via .env files

## Development Commands

### Frontend (React)
```bash
npm start          # Run development server on localhost:3000
npm test           # Run tests in interactive watch mode
npm run build      # Build production bundle
```

### Backend (FastAPI)
```bash
# From backend/ directory
pip install -r requirements.txt    # Install Python dependencies
uvicorn app.main:app --reload      # Run FastAPI development server
```

### Database Setup
The backend is configured to connect to PostgreSQL with these default settings:
- Database: homi_db
- User: postgres
- Password: password
- Host: localhost:5432

## Key Configuration Files

- `package.json` - Frontend dependencies and scripts
- `backend/requirements.txt` - Python dependencies (FastAPI, SQLAlchemy, psycopg2, etc.)
- `backend/.env` - Database connection settings
- `backend/app/core/config.py` - Application configuration management

## Database Models

The application includes a User model with basic fields (id, email, username, hashed_password, is_active, timestamps).

## Notes for Development

- The backend uses SQLAlchemy's declarative base for ORM models
- Database sessions are managed through dependency injection
- The project is set up for PostgreSQL but not yet dockerized
- Frontend and backend are separate applications that will need CORS configuration for local development