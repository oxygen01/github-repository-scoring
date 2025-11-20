# GitHub Repository Scoring API

A backend application that scores GitHub repositories based on popularity metrics including stars, forks, and recency of updates.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Option 1: Run with Docker (Recommended)](#option-1-run-with-docker-recommended)
  - [Option 2: Run without Docker](#option-2-run-without-docker)
- [API Endpoints](#api-endpoints)
- [Scoring Algorithm](#scoring-algorithm)
- [Available Scripts](#available-scripts)
- [Architecture](#architecture)

## Features

- 🔍 Search GitHub repositories with configurable filters
- 📊 Intelligent scoring algorithm based on popularity metrics
- ⚡ In-memory caching for improved performance and rate limit protection
- 🔧 Full TypeScript support with strict typing
- 🐳 Docker support for easy deployment
- ✅ Comprehensive test coverage

## Getting Started

You can run this application locally with or without Docker.

### Option 1: Run with Docker (Recommended)

**Prerequisites:**

- Docker and Docker Compose

**Steps:**

1. Clone the repository and navigate to the project directory

2. Copy environment configuration:

   ```bash
   cp .env.example .env
   ```

3. Configure your GitHub token in `.env`

4. Start the application:

   ```bash
   docker-compose up
   ```

The API will be available at `http://localhost:3000`

### Option 2: Run without Docker

**Prerequisites:**

- Node.js 20+
- Yarn package manager

**Steps:**

1. Clone the repository and navigate to the project directory

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Copy environment configuration:

   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`

5. **For Development** (with hot reload):

   ```bash
   yarn dev
   ```

6. **For Production**:

   Build the application:

   ```bash
   yarn build
   ```

   Start the server:

   ```bash
   yarn start
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Base URL

```
http://localhost:3000
```

### Available Endpoints

#### 1. API Documentation

```
GET /
```

Returns API documentation and configuration.

#### 2. Search and Score Repositories

```
GET /api/v1/repositories/score
```

**Query Parameters:**

- `language` (string, **required**): Programming language filter (e.g., 'javascript', 'python')
- `createdAfter` (string, **required**): Filter by creation date (ISO8601 format: YYYY-MM-DD)
- `limit` (number, optional): Number of results (1-100, default 100)

**Example:**

```
GET /api/v1/repositories/score?language=javascript&createdAfter=2023-01-01&limit=10
```

#### 3. Health Checks

```
GET /health
```

## Scoring Algorithm

The popularity score (0-10 scale) is calculated using a simple linear formula with age-based penalties:

**Formula:**

```
popularity_score = (stars + forks × 2) × timeFactor / 7000 × 10
```

### Components

1. **Base Score**: `stars + (forks × 2)`
   - Forks count double because they indicate higher engagement

2. **Age Penalty (timeFactor)**
   - **Popular repos** (score ≥ 1000): 10% per year, max -20%
   - **Medium repos** (score 100-999): 15% per year, max -50%
   - **Small repos** (score < 100): 20% per year, max -70%

3. **Normalization**: Divided by 7000 and scaled to 0-10

### Examples

- **React** (5000 stars, 1000 forks, new): Score = **10.0**
- **React** (5000 stars, 1000 forks, 2 years old): Score = **8.0**
- **Small project** (30 stars, 5 forks, new): Score = **0.06**

## Available Scripts

### Development Commands

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build TypeScript to JavaScript
- `yarn build:watch` - Build TypeScript in watch mode
- `yarn start` - Start production server

### Testing Commands

- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode

### Code Quality Commands

- `yarn lint` - Run ESLint, TypeScript check, and Prettier
- `yarn format` - Format code with ESLint and Prettier

## Architecture

```
docs/
└── adrs             # Architecture Decision Records
src/
├── config/          # Application configuration
├── controllers/     # Request handlers
├── routes/          # API route definitions
├── services/        # Business logic (GitHub API, scoring)
├── types/           # TypeScript type definitions
└── app.ts          # Main application file
```
