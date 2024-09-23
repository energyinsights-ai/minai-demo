from flask import Flask, jsonify
import json
import os
from dotenv import load_dotenv
from flask_cors import CORS
import pandas as pd
from data import Data

load_dotenv()
app = Flask(__name__,static_folder='static')
app.config.from_object(__name__)
app.config.update(SECRET_KEY=os.getenv("SECRET_KEY"))

# enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})

@app.route('/api/geojson', methods=['GET'])
def get_geojson():
    # Load the GeoJSON file

    data_instance = Data()
    geojson_data = data_instance.get_map_layer('tr')
    print(geojson_data)
    return jsonify(geojson_data)

@app.route('/api/get_rigs', methods=['GET'])
def get_rigs():
    rig_df = pd.read_csv('rigs.csv')
    rig_df = rig_df[rig_df.first_date.astype(str)>'2022-01-01']
    return jsonify(rig_df.to_dict(orient='records'))

@app.route('/api/get_wells', methods=['GET'])
def get_wells():
    data_instance = Data()
    well_json = data_instance.get_wells()
    return well_json

if __name__ == '__main__':
    app.run(debug=True)
    
    