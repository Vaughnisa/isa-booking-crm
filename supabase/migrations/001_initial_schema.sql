-- ISA Booking CRM - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    coach TEXT,
    capacity INTEGER NOT NULL DEFAULT 8,
    price INTEGER NOT NULL DEFAULT 150000, -- $1,500 in cents
    deposit_amount INTEGER NOT NULL DEFAULT 50000, -- $500 in cents
    location TEXT DEFAULT 'La Cruz, Mexico',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    weight INTEGER,
    height TEXT,
    sail_size_preference TEXT,
    equipment_needs TEXT,
    bring_own_boat BOOLEAN DEFAULT FALSE,
    boat_details TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded', 'cancelled')),
    deposit_amount INTEGER DEFAULT 50000, -- $500 in cents
    total_price INTEGER, -- Full price in cents
    balance_due INTEGER, -- Remaining balance in cents
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    sailing_goals TEXT,
    dietary_restrictions TEXT,
    waiver_signed BOOLEAN DEFAULT FALSE,
    waiver_signed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, client_id)
);

-- Waiting list table
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    notes TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'converted', 'expired')),
    converted_to_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinics_date ON clinics(date);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic_id ON bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_clinic_id ON waiting_list(clinic_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Enable Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for demo - allow all operations)
CREATE POLICY "Allow all operations on clinics" ON clinics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on waiting_list" ON waiting_list FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO clinics (title, date, coach, capacity, price, deposit_amount, status, description) VALUES
    ('Advanced Racing Clinic', '2025-03-15', 'Vaughn Harrison', 8, 150000, 50000, 'open', 'Intensive 3-day racing clinic focused on starts, tactics, and boat speed.'),
    ('Intermediate Fundamentals', '2025-03-22', 'Sarah Chen', 6, 120000, 50000, 'open', 'Build solid fundamentals in boat handling and sail trim.'),
    ('Youth Performance Camp', '2025-04-05', 'Mike Torres', 10, 100000, 50000, 'open', 'Week-long camp for sailors aged 13-18.'),
    ('Light Wind Mastery', '2025-04-12', 'Vaughn Harrison', 8, 150000, 50000, 'closed', 'Master the art of sailing in light wind conditions.'),
    ('Heavy Weather Clinic', '2025-04-19', 'Sarah Chen', 6, 180000, 50000, 'open', 'Learn to handle strong winds with confidence.')
ON CONFLICT DO NOTHING;

-- Insert sample clients
INSERT INTO clients (name, email, phone, experience_level, weight, sail_size_preference, equipment_needs) VALUES
    ('John Smith', 'john.smith@example.com', '+1-555-0101', 'intermediate', 175, 'Standard', 'Charter boat required'),
    ('Emma Wilson', 'emma.w@example.com', '+1-555-0102', 'advanced', 140, 'Radial', 'Bring own boat'),
    ('Carlos Rodriguez', 'carlos.r@example.com', '+1-555-0103', 'beginner', 190, 'Full', 'Charter boat required'),
    ('Lisa Chen', 'lisa.chen@example.com', '+1-555-0104', 'pro', 160, 'Standard', 'Bring own boat')
ON CONFLICT (email) DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (clinic_id, client_id, payment_status, deposit_amount, total_price, balance_due)
SELECT 
    c.id as clinic_id,
    cl.id as client_id,
    'deposit_paid',
    50000,
    c.price,
    c.price - 50000
FROM clinics c, clients cl
WHERE c.title = 'Advanced Racing Clinic' AND cl.name = 'John Smith'
ON CONFLICT DO NOTHING;

INSERT INTO bookings (clinic_id, client_id, payment_status, deposit_amount, total_price, balance_due)
SELECT 
    c.id as clinic_id,
    cl.id as client_id,
    'fully_paid',
    50000,
    c.price,
    0
FROM clinics c, clients cl
WHERE c.title = 'Intermediate Fundamentals' AND cl.name = 'Emma Wilson'
ON CONFLICT DO NOTHING;

-- Insert sample waiting list entries
INSERT INTO waiting_list (clinic_id, name, email, phone, experience_level, notes)
SELECT 
    c.id,
    'David Park',
    'david.park@example.com',
    '+1-555-0105',
    'intermediate',
    'Really wants to join this clinic'
FROM clinics c
WHERE c.title = 'Light Wind Mastery'
ON CONFLICT DO NOTHING;
