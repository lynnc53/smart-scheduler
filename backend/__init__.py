from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Config
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://scheduler_user:Delasalle33!@localhost/smart_scheduler'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    from routes.api import api_blueprint
    app.register_blueprint(api_blueprint)

    with app.app_context():
        from models.assignment import Assignment
        db.create_all()

    return app
