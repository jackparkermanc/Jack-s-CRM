# Add-Ons Feature Setup Guide

## Overview
The add-ons feature allows you to create optional extras/add-ons for each service that can be offered to clients (e.g., express booking, extra hours, premium support, etc.).

## Setup Steps

### 1. Create the Addons Table in Supabase

Go to your Supabase dashboard and open the **SQL Editor**. Run this SQL command:

```sql
CREATE TABLE addons (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX addons_service_id_idx ON addons(service_id);
```

This creates:
- `addons` table with fields for service reference, name, and cost
- Automatic cascade delete when a service is deleted
- Index on service_id for fast queries

### 2. Deploy the New Files

The following files have been created/updated:

**New Files:**
- `/api/addons.js` - Backend API endpoint for managing add-ons
- `/src/components/dialogs/AddOnDialog.jsx` - Modal for adding/editing add-ons

**Updated Files:**
- `/src/components/Services.jsx` - Added add-ons section to the Services screen
- `/src/lib/api.js` - Added addonsAPI client methods

### 3. Commit and Deploy

```bash
git add .
git commit -m "Add add-ons feature to Services"
git push origin main
```

Vercel will automatically redeploy your application.

## How to Use

### Adding Add-Ons to Services

1. Navigate to the **Services** tab
2. Select a service by clicking on it - it will expand showing an "Add-Ons" section
3. Click the **"Add-On"** button in the Add-Ons section
4. Enter:
   - **Add-On Name** (e.g., "Express Booking", "Extra Hours")
   - **Cost (£)** (the additional cost for this add-on)
5. Click **Save**

### Editing Add-Ons

1. Click the **✏️ Edit** button next to the add-on you want to modify
2. Update the details and click **Save**

### Deleting Add-Ons

1. Click the **🗑️ Delete** button next to the add-on
2. Confirm the deletion

## Database Structure

The `addons` table has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | BIGSERIAL | Unique identifier (auto-generated) |
| `service_id` | BIGINT | Foreign key referencing the service |
| `name` | TEXT | Name of the add-on (e.g., "Express Booking") |
| `cost` | NUMERIC | Additional cost in pounds (£) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## API Endpoints

### Get Add-Ons for a Service
```
GET /api/addons?service_id=123
```

### Create Add-On
```
POST /api/addons
Body: {
  "service_id": 123,
  "name": "Express Booking",
  "cost": 25
}
```

### Update Add-On
```
PUT /api/addons
Body: {
  "id": 456,
  "name": "Express Booking",
  "cost": 30
}
```

### Delete Add-On
```
DELETE /api/addons?id=456
```

## Features

- ✅ Full CRUD operations for add-ons
- ✅ Add-ons are tied to specific services
- ✅ Automatic deletion of add-ons when a service is deleted
- ✅ Clean, intuitive UI integrated into the Services screen
- ✅ Real-time updates without page refresh
- ✅ Logging of all add-on operations

## Notes

- Add-ons are optional - services don't require any add-ons
- Multiple add-ons can be created for a single service
- Costs are numeric and support decimal values (e.g., 25.50)
- All changes are automatically logged in the app_logs table
