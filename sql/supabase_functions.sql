
-- Function to calculate all inventory metrics
CREATE OR REPLACE FUNCTION calculate_inventory_metrics()
RETURNS json AS $$
DECLARE
  total_products INTEGER;
  items_in_transit INTEGER;
  total_transit NUMERIC;
  low_stock_items INTEGER;
  overstock_items INTEGER;
  out_of_stock_items INTEGER;
  total_value NUMERIC;
  avg_drr NUMERIC;
  avg_doc NUMERIC;
  avg_pasd NUMERIC;
  target_achievement NUMERIC;
  valid_products INTEGER;
  inventory_health_score NUMERIC;
  stockout_rate NUMERIC;
  overstock_rate NUMERIC;
BEGIN
  -- Total products
  SELECT COUNT(*) INTO total_products FROM master;
  
  -- Items in transit
  SELECT COUNT(*) INTO items_in_transit FROM master WHERE transit > 0;
  
  -- Total in transit
  SELECT COALESCE(SUM(transit), 0) INTO total_transit FROM master WHERE transit IS NOT NULL;
  
  -- Low stock items
  SELECT COUNT(*) INTO low_stock_items FROM master
  WHERE pasd > 0 AND lead_time > 0 AND
        (COALESCE(wh, 0) + COALESCE(fba, 0)) < (pasd * (lead_time + COALESCE(transit, 0)));
  
  -- Overstock items
  SELECT COUNT(*) INTO overstock_items FROM master
  WHERE pasd > 0 AND order_freq > 0 AND
        COALESCE(wh, 0) > (pasd * order_freq * 1.5);
  
  -- Out of stock items
  SELECT COUNT(*) INTO out_of_stock_items FROM master WHERE COALESCE(wh, 0) = 0;
  
  -- Total inventory value
  SELECT COALESCE(SUM(wh), 0) INTO total_value FROM master WHERE wh IS NOT NULL;
  
  -- Average DRR (using PASD)
  SELECT COALESCE(AVG(pasd), 0) INTO avg_drr FROM master WHERE pasd > 0;
  
  -- Average DOC (days of coverage)
  SELECT COALESCE(AVG(
    CASE 
      WHEN days_inv_inhand IS NOT NULL AND days_inv_inhand >= 0 THEN days_inv_inhand
      WHEN pasd > 0 THEN COALESCE(wh, 0) / pasd
      ELSE NULL
    END
  ), 0) INTO avg_doc 
  FROM master
  WHERE (days_inv_inhand IS NOT NULL AND days_inv_inhand >= 0) OR (pasd > 0 AND wh IS NOT NULL);
  
  -- Average PASD
  SELECT COALESCE(AVG(pasd), 0) INTO avg_pasd FROM master WHERE pasd > 0;
  
  -- Target achievement
  SELECT COUNT(*) INTO valid_products FROM master WHERE ct_target_inventory > 0 AND wh IS NOT NULL;
  
  IF valid_products > 0 THEN
    SELECT COALESCE(
      (COUNT(*) FILTER (WHERE wh >= ct_target_inventory) * 100.0 / valid_products),
      0
    ) INTO target_achievement
    FROM master 
    WHERE ct_target_inventory > 0 AND wh IS NOT NULL;
  ELSE
    target_achievement := 0;
  END IF;
  
  -- Calculate rates for health score
  stockout_rate := CASE WHEN total_products > 0 THEN (low_stock_items * 100.0 / total_products) ELSE 0 END;
  overstock_rate := CASE WHEN total_products > 0 THEN (overstock_items * 100.0 / total_products) ELSE 0 END;
  
  -- Calculate inventory health score
  inventory_health_score := GREATEST(0, LEAST(100, 100 - (stockout_rate + overstock_rate)));
  
  -- Return all metrics as a JSON object
  RETURN json_build_object(
    'totalProducts', total_products,
    'totalValue', total_value,
    'lowStockItems', low_stock_items,
    'outOfStockItems', out_of_stock_items,
    'overstockItems', overstock_items,
    'averageTurnoverRate', 0, -- Not calculated without sales history
    'avgDRR', avg_drr,
    'avgDOC', avg_doc,
    'targetAchievement', target_achievement,
    'inventoryHealthScore', ROUND(inventory_health_score),
    'totalTransit', total_transit,
    'itemsInTransit', items_in_transit,
    'totalToOrder', (SELECT COALESCE(SUM(to_order), 0) FROM master WHERE to_order IS NOT NULL),
    'itemsToOrder', (SELECT COUNT(*) FROM master WHERE COALESCE(to_order, 0) > 0),
    'avgPASD', avg_pasd,
    'overstockRate', overstock_rate,
    'stockoutRate', stockout_rate
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS SETOF master AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM master
  WHERE pasd > 0 AND lead_time > 0 AND
        (COALESCE(wh, 0) + COALESCE(fba, 0)) < (pasd * (lead_time + COALESCE(transit, 0)));
END;
$$ LANGUAGE plpgsql;

-- Function to get overstock items
CREATE OR REPLACE FUNCTION get_overstock_items()
RETURNS SETOF master AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM master
  WHERE pasd > 0 AND order_freq > 0 AND
        COALESCE(wh, 0) > (pasd * order_freq * 1.5);
END;
$$ LANGUAGE plpgsql;
