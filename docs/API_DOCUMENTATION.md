# Sesimiz Ol API Documentation

## Overview
REST API for the Sesimiz Ol platform - a safe space for women to share their stories anonymously.

**Base URL:** `https://api.sesimiz-ol.com/api`
**Version:** 1.0
**Authentication:** JWT Bearer Token

## Authentication

### POST /auth/login
Login user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/register
Register new user
```json
{
  "nickname": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/logout
Logout user (requires auth)

## Stories

### GET /stories
Get all stories
- Query params: `page`, `limit`, `sort`, `tag`

### POST /stories
Create story (requires auth)
```json
{
  "title": "Story Title",
  "content": "Story content...",
  "tags": ["tag1", "tag2"]
}
```

### GET /stories/:id
Get single story

### PUT /stories/:id
Update story (requires auth)

### DELETE /stories/:id
Delete story (requires auth)

## Comments

### GET /stories/:id/comments
Get story comments

### POST /stories/:id/comments
Add comment (requires auth)
```json
{
  "content": "Comment content",
  "parentId": null
}
```

## Users

### GET /users/profile
Get user profile (requires auth)

### PUT /users/profile
Update profile (requires auth)

### POST /users/:id/follow
Follow user (requires auth)

## Organizations

### GET /organizations
Get all organizations

### POST /organizations
Create organization (requires auth)

### GET /organizations/:id
Get organization details

## Error Responses

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Rate Limits
- General: 100 requests/15 minutes
- Auth endpoints: 5 requests/15 minutes