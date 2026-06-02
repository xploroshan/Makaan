-- ============================================================================
-- Dwello seed data — launch geography + category-specific form templates.
-- Safe to run repeatedly (idempotent upserts).
-- ============================================================================

-- ---------- Launch cities / localities / pincodes ---------------------------
insert into geo (country, city, locality, pincode, centroid, enabled) values
  ('IN', 'Bengaluru', 'Koramangala',   '560034', st_point(77.6309, 12.9352)::geography, true),
  ('IN', 'Bengaluru', 'Indiranagar',   '560038', st_point(77.6408, 12.9719)::geography, true),
  ('IN', 'Bengaluru', 'Whitefield',    '560066', st_point(77.7499, 12.9698)::geography, true),
  ('IN', 'Pune',      'Koregaon Park', '411001', st_point(73.8989, 18.5362)::geography, true),
  ('IN', 'Pune',      'Hinjewadi',     '411057', st_point(73.7389, 18.5912)::geography, true),
  ('IN', 'Mumbai',    'Andheri West',  '400058', st_point(72.8296, 19.1364)::geography, true),
  ('IN', 'Mumbai',    'Powai',         '400076', st_point(72.9050, 19.1176)::geography, true)
on conflict do nothing;

-- ---------- Category-specific listing form templates (PRD §5.2.1) -----------
-- `fields` drives the dynamic listing wizard; `validations` feed server checks.

-- Rent — flat/house
insert into form_templates (transaction_type, property_type, version, fields, validations)
values ('rent', 'flat', 1,
  '[
    {"key":"price","label":"Monthly rent","type":"currency","required":true},
    {"key":"deposit","label":"Security deposit","type":"currency","required":true},
    {"key":"maintenance","label":"Maintenance / month","type":"currency"},
    {"key":"furnishing","label":"Furnishing","type":"enum","options":["unfurnished","semi","full"],"required":true},
    {"key":"bhk","label":"BHK","type":"number","required":true},
    {"key":"area_sqft","label":"Built-up area (sq ft)","type":"number","required":true},
    {"key":"floor","label":"Floor","type":"number"},
    {"key":"available_from","label":"Available from","type":"date","required":true},
    {"key":"preferred_tenant","label":"Preferred tenant","type":"enum","options":["family","bachelors","company","any"]},
    {"key":"amenities","label":"Amenities","type":"multiselect"},
    {"key":"lock_in","label":"Lock-in (months)","type":"number"},
    {"key":"notice_period","label":"Notice period (months)","type":"number"}
  ]'::jsonb,
  '{"required":["price","deposit","furnishing","bhk","area_sqft","available_from"]}'::jsonb)
on conflict (transaction_type, property_type, version) do update
  set fields = excluded.fields, validations = excluded.validations;

-- Lease — flat/house
insert into form_templates (transaction_type, property_type, version, fields, validations)
values ('lease', 'flat', 1,
  '[
    {"key":"price","label":"Lease amount","type":"currency","required":true},
    {"key":"lease_duration","label":"Lease duration (months)","type":"number","required":true},
    {"key":"refundable","label":"Refundable amount","type":"currency"},
    {"key":"furnishing","label":"Furnishing","type":"enum","options":["unfurnished","semi","full"]},
    {"key":"bhk","label":"BHK","type":"number","required":true},
    {"key":"area_sqft","label":"Built-up area (sq ft)","type":"number","required":true},
    {"key":"conditions","label":"Conditions","type":"text"}
  ]'::jsonb,
  '{"required":["price","lease_duration","bhk","area_sqft"]}'::jsonb)
on conflict (transaction_type, property_type, version) do update
  set fields = excluded.fields, validations = excluded.validations;

-- Co-living / PG
insert into form_templates (transaction_type, property_type, version, fields, validations)
values ('coliving', 'flat', 1,
  '[
    {"key":"price","label":"Price per bed / room","type":"currency","required":true},
    {"key":"sharing","label":"Sharing type","type":"enum","options":["private","double","triple","dorm"],"required":true},
    {"key":"gender_pref","label":"Gender preference","type":"enum","options":["any","male","female"]},
    {"key":"food_included","label":"Food included","type":"boolean"},
    {"key":"deposit","label":"Deposit","type":"currency"},
    {"key":"house_rules","label":"House rules","type":"text"},
    {"key":"amenities","label":"Amenities","type":"multiselect"}
  ]'::jsonb,
  '{"required":["price","sharing"]}'::jsonb)
on conflict (transaction_type, property_type, version) do update
  set fields = excluded.fields, validations = excluded.validations;

-- Sell — flat/house
insert into form_templates (transaction_type, property_type, version, fields, validations)
values ('sale', 'flat', 1,
  '[
    {"key":"price","label":"Expected price","type":"currency","required":true},
    {"key":"negotiable","label":"Negotiable","type":"boolean"},
    {"key":"ownership","label":"Ownership","type":"enum","options":["freehold","leasehold"],"required":true},
    {"key":"age","label":"Property age (years)","type":"number"},
    {"key":"area_sqft","label":"Built-up area (sq ft)","type":"number","required":true},
    {"key":"floor","label":"Floor","type":"number"},
    {"key":"facing","label":"Facing","type":"enum","options":["N","S","E","W","NE","NW","SE","SW"]},
    {"key":"parking","label":"Parking","type":"number"},
    {"key":"approvals","label":"Approvals (RERA etc.)","type":"text"},
    {"key":"loan_available","label":"Loan available","type":"boolean"},
    {"key":"possession","label":"Possession status","type":"enum","options":["ready","under_construction"]}
  ]'::jsonb,
  '{"required":["price","ownership","area_sqft"]}'::jsonb)
on conflict (transaction_type, property_type, version) do update
  set fields = excluded.fields, validations = excluded.validations;

-- Sell / lease — land / plot (incl. registration details)
insert into form_templates (transaction_type, property_type, version, fields, validations)
values ('sale', 'land', 1,
  '[
    {"key":"price","label":"Price (total)","type":"currency","required":true},
    {"key":"price_per_unit","label":"Price per sq ft / unit","type":"currency"},
    {"key":"area_sqft","label":"Plot area (sq ft)","type":"number","required":true},
    {"key":"dimensions","label":"Plot dimensions","type":"text"},
    {"key":"land_type","label":"Land type","type":"enum","options":["residential","agricultural","commercial","industrial"],"required":true},
    {"key":"road_width","label":"Road width (ft)","type":"number"},
    {"key":"corner_plot","label":"Corner plot","type":"boolean"},
    {"key":"boundary","label":"Boundary / fencing","type":"enum","options":["none","partial","full"]},
    {"key":"approvals","label":"Approvals (RERA / khata)","type":"text"},
    {"key":"survey_no","label":"Survey / khata number","type":"text","required":true},
    {"key":"registration_office","label":"Registration sub-office","type":"text"},
    {"key":"guideline_value","label":"Guideline / circle value","type":"currency"},
    {"key":"encumbrance","label":"Encumbrance status","type":"enum","options":["clear","encumbered"]}
  ]'::jsonb,
  '{"required":["price","area_sqft","land_type","survey_no"]}'::jsonb)
on conflict (transaction_type, property_type, version) do update
  set fields = excluded.fields, validations = excluded.validations;

-- ---------- Default feature flags / config ----------------------------------
insert into app_config (key, value, scope, enabled) values
  ('search.default_radius_m', '5000', 'global', true),
  ('listing.max_media',       '20',   'global', true),
  ('feature.nl_search',       'false','global', false),
  ('feature.ai_listing_assist','false','global', false),
  ('feature.masked_calling',  'false','global', false)
on conflict (key) do nothing;
