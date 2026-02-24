# ISA CRM - Supabase Database Migrations

## Setup Instructions

1. Connect to your Supabase project
2. Run these migrations in order in the SQL Editor

## Migration Files

### 001_initial_schema.sql
Creates all tables with relationships and RLS policies.

## Tables

### clinics
Sailing clinics offered by ISA

### bookings
Client bookings for specific clinics

### clients
Client profiles and sailing information

### waiting_list
People waiting for sold-out clinics

## Row Level Security

RLS is enabled on all tables. In production, add proper policies based on authentication.
