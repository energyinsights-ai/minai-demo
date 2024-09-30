from sqlalchemy import text

def get_map_layer(layer_type,**kwargs):
    map_dict = {
        'trs':_get_trs,
        'wells':_get_wells,
    }
    return map_dict[layer_type](**kwargs)

def _get_trs(**kwargs):
    radius = kwargs.get('radius', 10)
    center_trs = kwargs.get('center_trs', '14-04N-65W')
    basin = kwargs.get('basin', 'DJ')
    sql = f'''
    WITH sections AS (
        SELECT *
        FROM shape.section
        WHERE st_dwithin(geom::geography,
            (SELECT geom::geography FROM shape.section WHERE trs='{center_trs}' AND basin = '{basin}'),
            {radius} * 1609.34,  -- Convert miles to meters
            true)  -- Use spheroid for more accurate calculations
        AND basin = '{basin}'
    ),
    well_footages AS (
        SELECT 
            s.trs,
            dw.interval,
            COUNT(DISTINCT sw.well_id) AS well_count,
            SUM(CASE 
                WHEN ST_Within(sw.geom, s.geom) THEN COALESCE(dw.lateral_length, ST_Length(sw.geom::geography))
                ELSE ST_Length(ST_Intersection(sw.geom, s.geom)::geography)
            END) AS total_footage
        FROM sections s
        JOIN shape.wells sw ON ST_Intersects(sw.geom, s.geom)
        JOIN data.wells dw ON sw.well_id = dw.well_id
        WHERE dw.well_status = 'PRODUCING'
        GROUP BY s.trs, dw.interval
    ),
    section_footages AS (
        SELECT 
            s.*,
            jsonb_object_agg(
                wf.interval, 
                jsonb_build_object(
                    'footage', ROUND(wf.total_footage::numeric, 2),
                    'well_count', wf.well_count
                )
            ) FILTER (WHERE wf.interval IS NOT NULL) AS interval_footages,
            SUM(wf.total_footage) AS total_well_footage,
            SUM(wf.well_count) AS total_well_count
        FROM sections s
        LEFT JOIN well_footages wf ON s.trs = wf.trs
        GROUP BY s.basin, s.tr, s.section, s.geom, s.trs, s.lat, s.lon
    ),
    average_footages AS (
        SELECT 
            interval,
            AVG(footage) AS avg_footage,
            AVG(well_count) AS avg_well_count
        FROM (
            SELECT 
                (jsonb_each_text(interval_footages)).key AS interval,
                ((jsonb_each(interval_footages)).value->>'footage')::numeric AS footage,
                ((jsonb_each(interval_footages)).value->>'well_count')::numeric AS well_count
            FROM section_footages
            WHERE interval_footages IS NOT NULL
        ) subquery
        WHERE interval IS NOT NULL AND interval != 'COL'
        GROUP BY interval
    )
    SELECT 
        sf.*,
        jsonb_object_agg(
            af.interval,
            jsonb_build_object(
                'footage', ROUND(af.avg_footage::numeric, 2),
                'well_count', ROUND(af.avg_well_count::numeric, 2)
            )
        ) AS avg_interval_footages
    FROM section_footages sf
    CROSS JOIN average_footages af
    GROUP BY sf.basin, sf.tr, sf.section, sf.geom, sf.trs, sf.lat, sf.lon, sf.interval_footages, sf.total_well_footage, sf.total_well_count
    '''
    return sql

def _get_wells(**kwargs):
    radius = kwargs.get('radius', 10)
    sql = f'''
    WITH center_point AS (
        SELECT ST_SetSRID(ST_MakePoint(lon, lat), 4326) as geom
        FROM shape.section
        WHERE trs = '14-04N-65W' AND basin = 'DJ'
        LIMIT 1
    )
    SELECT 
        sw.*,
        dw.well_name,
        dw.env_operator as operator,
        dw.well_status,
        dw.first_prod_date
    FROM shape.wells sw
    JOIN data.wells dw ON sw.well_id = dw.well_id
    CROSS JOIN center_point
    WHERE ST_DWithin(sw.geom::geography, center_point.geom::geography, {radius}*1.5 * 1609.34, true)
    '''
    print(sql)
    return sql