from flask import Flask, jsonify, make_response
import json
import os
from dotenv import load_dotenv
from flask_cors import CORS
import pandas as pd
from data import Data  # Make sure this import exists
from flask import request

load_dotenv()
app = Flask(__name__,static_folder='static')
app.config.from_object(__name__)
app.config.update(SECRET_KEY=os.getenv("SECRET_KEY"))

# enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

data_instance = Data()

@app.route('/api/trs', methods=['GET'])
def get_sec_json():
    radius = request.args.get('radius', type=int, default=10)
    geojson_data = data_instance.get_map_layer('trs',radius=radius)
    return jsonify(geojson_data)


@app.route('/api/wells', methods=['GET'])
def get_well_json():
    radius = request.args.get('radius', type=int, default=10)
    geojson_data = data_instance.get_map_layer('wells',radius=radius)
    return jsonify(geojson_data)

if __name__ == '__main__':
    app.run(debug=True)
