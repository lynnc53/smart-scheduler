from __init__ import db  # now imports from __init__.py, not app.py

class Event(db.Model):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False)  
    duration = db.Column(db.Float)


    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date.isoformat(),
            'duration': self.duration,
        }
