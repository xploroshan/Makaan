-- ============================================================================
-- Commercial as a first-class property type (offices, shops, showrooms,
-- warehouses). Enables rent/lease/sale flows for commercial real estate
-- alongside flat, house and land.
-- ============================================================================

alter type property_type add value if not exists 'commercial';
