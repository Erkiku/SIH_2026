-- ============================================
-- Farmer Procurement Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. FARMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  state TEXT,
  district TEXT,
  pincode TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  aadhaar_url TEXT,
  bank_proof_url TEXT,
  profile_photo TEXT,
  is_verified BOOLEAN DEFAULT false,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on phone for fast login lookups
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);

-- ============================================
-- 2. CROPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  crop_variety TEXT,
  category TEXT DEFAULT 'cereal',
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  harvest_date DATE,
  storage_location TEXT,
  moisture_content NUMERIC,
  price_per_kg NUMERIC DEFAULT 0,
  quality_grade TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crops_farmer ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);

-- ============================================
-- 3. PROCUREMENT CENTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS procurement_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_name TEXT NOT NULL,
  location TEXT,
  district TEXT,
  address TEXT,
  phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  manager_id UUID,
  total_capacity INTEGER DEFAULT 100,
  current_queue INTEGER DEFAULT 0,
  operating_hours TEXT DEFAULT '9:00 AM - 6:00 PM',
  is_open BOOLEAN DEFAULT true,
  facilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_centers_district ON procurement_centers(district);
CREATE INDEX IF NOT EXISTS idx_centers_location ON procurement_centers(lat, lng);

-- ============================================
-- 4. SLOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  available_spots INTEGER DEFAULT 10,
  booked_spots INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_center ON slots(center_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_slots_center_date ON slots(center_id, date);

-- ============================================
-- 5. BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  center_id UUID NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  token_number TEXT UNIQUE,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  appointment_date DATE,
  appointment_time TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  estimated_wait_time INTEGER DEFAULT 0,
  current_position INTEGER DEFAULT 0,
  payment_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_center ON bookings(center_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(token_number);

-- ============================================
-- 6. QUALITY CHECKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  center_id UUID REFERENCES procurement_centers(id) ON DELETE SET NULL,
  inspector_name TEXT,
  inspection_date TIMESTAMPTZ,
  quality_parameters JSONB DEFAULT '{}',
  overall_grade TEXT,
  comments TEXT,
  recommendations TEXT,
  photos_after_inspection TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_booking ON quality_checks(booking_id);
CREATE INDEX IF NOT EXISTS idx_quality_crop ON quality_checks(crop_id);

-- ============================================
-- 7. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  center_id UUID REFERENCES procurement_centers(id) ON DELETE SET NULL,
  quantity NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  final_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'bank_transfer',
  transaction_ref_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  receipt_url TEXT,
  procurement_officer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_farmer ON transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_farmer ON notifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(farmer_id, is_read);

-- ============================================
-- AUTO UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to farmers
CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to crops
CREATE TRIGGER update_crops_updated_at
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_centers ENABLE ROW LEVEL SECURITY;

-- Permissive policies for service role (backend uses service role key)
CREATE POLICY "Service role full access on farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on crops" ON crops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on quality_checks" ON quality_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on slots" ON slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on procurement_centers" ON procurement_centers FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Sample Procurement Centers
-- ============================================
INSERT INTO procurement_centers (center_name, location, district, address, phone, lat, lng, total_capacity, current_queue, operating_hours, is_open, facilities)
VALUES
  ('Krishi Bhavan Mandi', 'Lucknow', 'Lucknow', 'Near Railway Station, Lucknow, UP', '0522-2201234', 26.8467, 80.9462, 200, 0, '8:00 AM - 5:00 PM', true, ARRAY['weighing', 'storage', 'quality_lab', 'parking']),
  ('Gandhi Nagar FCI Center', 'Kanpur', 'Kanpur', 'Gandhi Nagar, Kanpur, UP', '0512-2301234', 26.4499, 80.3319, 150, 0, '9:00 AM - 6:00 PM', true, ARRAY['weighing', 'storage', 'parking']),
  ('Varanasi Agricultural Market', 'Varanasi', 'Varanasi', 'Sigra Road, Varanasi, UP', '0542-2501234', 25.3176, 82.9739, 180, 0, '7:00 AM - 4:00 PM', true, ARRAY['weighing', 'storage', 'quality_lab', 'canteen']),
  ('Agra Mandi Samiti', 'Agra', 'Agra', 'Belanganj, Agra, UP', '0562-2601234', 27.1767, 78.0081, 120, 0, '8:00 AM - 5:00 PM', true, ARRAY['weighing', 'storage', 'parking']),
  ('Prayagraj Krishi Kendra', 'Prayagraj', 'Prayagraj', 'Civil Lines, Prayagraj, UP', '0532-2401234', 25.4358, 81.8463, 160, 0, '9:00 AM - 5:00 PM', true, ARRAY['weighing', 'quality_lab', 'parking', 'water'])
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample Slots (next 7 days)
-- ============================================
DO $$
DECLARE
  center_rec RECORD;
  day_offset INTEGER;
  slot_time TEXT;
  slot_times TEXT[] := ARRAY['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'];
BEGIN
  FOR center_rec IN SELECT id FROM procurement_centers LOOP
    FOR day_offset IN 0..6 LOOP
      FOREACH slot_time IN ARRAY slot_times LOOP
        INSERT INTO slots (center_id, date, time_slot, available_spots, booked_spots, status)
        VALUES (center_rec.id, CURRENT_DATE + day_offset, slot_time, 10, 0, 'available')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
