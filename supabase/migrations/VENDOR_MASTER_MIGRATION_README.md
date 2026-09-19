# Vendor Master Module - Database Migration Guide

## 📋 Overview
This guide covers the database setup for the Vendor Master module using Supabase PostgreSQL with RPC functions for transactional business logic, as well as the administrator login setup.

## 📁 Migration Files
Four migrations are provided:
1. `068_vendor_master_enhanced_schema.sql` - `item_categories`, enhanced `vendors`, `vendor_item_categories`, constraints, code generator `generate_vendor_code()`, triggers, and RLS policies.
2. `069_vendor_master_rpc_functions.sql` - Transactional RPC functions (`rpc_create_vendor`, `rpc_update_vendor`, `rpc_list_vendors`, `rpc_get_vendor_details`, `rpc_update_vendor_status`, `rpc_check_vendor_gstin_duplicate`, `rpc_check_vendor_name_duplicate`, `rpc_get_vendor_history`, `rpc_list_item_categories`).
3. `070_vendor_master_permissions.sql` - RBAC permissions (`VENDOR_VIEW`, `VENDOR_CREATE`, `VENDOR_UPDATE`, `VENDOR_STATUS_UPDATE`, `VENDOR_HISTORY_VIEW`) and role assignments.
4. `071_seed_admin_login_user.sql` - Seeds Organization Administrator accounts with full permissions across all modules and creates auth credentials.

## 🔐 Administrator Login Credentials

| User Email | Password | Role | Permissions |
|---|---|---|---|
| **admin@calibration.demo** | `Password@123` | Organization Administrator (`ADMIN`) | **ALL permissions** (Vendor Master, Clients, Items, Lab, Commercial, Dispatch) |
| **apex@gmail.com** | `Password@123` | Organization Administrator (`ADMIN`) | **ALL permissions** |

## 🚀 How to Run Migrations

### Option 1: Supabase CLI
```bash
cd a:\cloudflareccm
supabase migration up
```

### Option 2: Supabase Dashboard (SQL Editor)
Execute in order:
1. `068_vendor_master_enhanced_schema.sql`
2. `069_vendor_master_rpc_functions.sql`
3. `070_vendor_master_permissions.sql`
4. `071_seed_admin_login_user.sql`

### Option 3: Automatic Migration Script
If `DATABASE_URL` or `SUPABASE_DB_PASSWORD` is configured:
```bash
node apply-schema.mjs
```
