import os
from sqlalchemy import create_engine,text,Table,select
import pandas as pd
from flask import current_app as app
from dateutil.relativedelta import relativedelta
import numpy as np
from sqlalchemy import MetaData
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

class Data:
    def __init__(self):
        pass

    
    def get_wells(self):
        import json
        with open('wells.geojson', 'r') as file:
            wells_geojson = json.load(file)
        return wells_geojson
    def get_tr(self):
        with open('tr_json.json', 'r') as file:
            tr_json = json.load(file)
        return tr_json

    def get_all_data(self):
        df = pd.read_csv('all_data.csv')
        
        return df
