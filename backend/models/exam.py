from backend import db

class Exam(db.Model):
    __tablename__ = 'exam'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.String(10), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False)  
    duration = db.Column(db.Float)
    weight = db.Column(db.Float)

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'date': self.date.isoformat(),
            'duration': self.duration,
            'weight': self.weight
        }
