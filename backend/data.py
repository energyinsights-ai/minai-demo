import os
from sqlalchemy import create_engine,text,Table,select
from sql_queries import get_map_layer
import pandas as pd
from flask import current_app as app
from dateutil.relativedelta import relativedelta
import numpy as np
from sqlalchemy import MetaData
from sqlalchemy.orm import Session
from sqlalchemy import func
#if current_user is None else cur


class Data:
    def __init__(self):
        pass
    def _get_session(self):
        return app.db.session
    def _get_engine(self):
        return create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    
    def _reflect_table(self,table_name,type=None):
        if type:
            return Table(table_name,MetaData(schema=type),autoload_with=self._get_engine())
        else:
            return Table(table_name,self.md,autoload_with=self._get_engine())
    def _run_query(self,stmt):
        engine = self._get_engine()
        conn = engine.connect()
        with conn:
            results = conn.execute(stmt)
            out= pd.DataFrame(results.fetchall(),columns=results.keys())
            conn.close()
            engine.dispose()
        return out
    def get_map_layer(self,layer_name,**kwargs):
        sql = f'''
        SELECT jsonb_build_object(
            'type',     'FeatureCollection',
            'features', jsonb_agg(features.feature)
        )
        FROM (
        SELECT jsonb_build_object(
            'type',       'Feature',
            'geometry',   ST_AsGeoJSON(geom)::jsonb,
            'properties', to_jsonb(inputs) - 'gid' - 'geom'
        ) AS feature
        FROM ({get_map_layer(layer_name,**kwargs)}) inputs) features;
        ''' 
        engine = self._get_engine()
        conn = engine.connect() 
        myjson=conn.execute(text(sql)).fetchall()[0][0]
        conn.close()
        engine.dispose()
        return myjson
    
    def get_wells(self):
        import json
        with open('wells.geojson', 'r') as file:
            wells_geojson = json.load(file)
        return wells_geojson
