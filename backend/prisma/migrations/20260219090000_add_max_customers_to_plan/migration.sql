-- Migration: add_max_customers_to_plan
-- Description: Adds maxCustomers as a typed Int column to plans table.
-- This replaces the previous (JSON) representation of maxCustomers in plan.features.
-- SAFE: Additive only. No drops, no type conversions, no data loss.
ALTER TABLE "plans"
ADD COLUMN "maxCustomers" INTEGER NOT NULL DEFAULT 200;