# models/task.py 

class Task:
    def __init__(self, name, due_date, priority):
        self.name = name 
        self.due_date = due_date
        self.priority = priority 
    def to_dict(self):
        return {
            "name": self.name,
            "due_date": self.due_date,
            "priority": self.priority
        }