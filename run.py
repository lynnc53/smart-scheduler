from backend import create_app  # imports your app factory

app = create_app()  # initializes your app with config, db, CORS, blueprints, etc.

if __name__ == "__main__":
    app.run(debug=True)  # only runs if you run this file directly
