from backend import db

class Assignment(db.Model):
    __tablename__ = 'assignments'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    estimated_hours = db.Column(db.Float)
    weight = db.Column(db.Float)

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'due_date': self.due_date.isoformat(),
            'estimated_hours': self.estimated_hours,
            'weight': self.weight
        }
