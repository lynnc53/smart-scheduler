from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://scheduler_user:Delasalle33!@localhost/smart_scheduler'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    from .routes.api import api_blueprint
    app.register_blueprint(api_blueprint)

    with app.app_context():
        from .models.assignment import Assignment
        db.create_all()

    return app
