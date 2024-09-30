import os
from sqlalchemy import create_engine, text, Table, select, MetaData, Column
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
from geoalchemy2 import Geometry
from shapely import wkb
from shapely.geometry import Point, mapping
import geopandas as gpd
from sql_queries import get_map_layer
class Data:
    def __init__(self):
        # PostgreSQL connection parameters
        self.db = os.getenv('DB_NAME')
        self.user = os.getenv('DB_USER')
        self.pwd = os.getenv('DB_PWD')
        self.host = os.getenv('DB_HOST')
        self.port = "5432"
        self.engine = self._create_engine()
        self.metadata = MetaData()
        self.section_table = Table('section', self.metadata, schema='shape', autoload_with=self.engine)

    def _create_engine(self):
        return create_engine(f'postgresql://{self.user}:{self.pwd}@{self.host}:{self.port}/{self.db}')

    def get_wells(self):
        with open('wells.geojson', 'r') as file:
            wells_geojson = json.load(file)
        return wells_geojson

    def get_tr(self):
        with open('tr_json.json', 'r') as file:
            tr_json = json.load(file)
        return tr_json


    def get_map_layer(self, layer_name, **kwargs):
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
        FROM ({get_map_layer(layer_name, **kwargs)}) inputs) features;
        ''' 
        engine = self._create_engine()
        with engine.connect() as conn:
            result = conn.execute(text(sql)).fetchone()
            if result:
                myjson = result[0]
            else:
                myjson = {"type": "FeatureCollection", "features": []}
        return myjson
