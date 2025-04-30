import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    due_date: '',
    estimated_hours: '',
    weight: ''
  });

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/get-assignments') // not localhost:5173
      .then(res => res.json())
      .then(data => {
        setAssignments(data.assignments || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching assignments:", err);
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })    
      .then(res => res.json())
      .then(data => {
        setForm({ course_id: '', title: '', due_date: '', estimated_hours: '', weight: '' });
        return fetch('/api/get-assignments');
      })
      .then(res => res.json())
      .then(data => setAssignments(data.assignments || []));
  };

  const getDayIndex = (dateStr) => {
    const date = new Date(dateStr);
    return (date.getDay() + 6) % 7; // Monday = 0
  };

  const getHourIndex = (dateStr) => {
    const date = new Date(dateStr);
    return date.getHours() - 9; // 9AM base
  };

  return (
    <div className="container">
      <h1>Smart Scheduler</h1>

      <form className="assignment-form" onSubmit={handleSubmit}>
        <input type="text" name="course_id" placeholder="Course ID" value={form.course_id} onChange={handleInputChange} required />
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleInputChange} required />
        <input type="datetime-local" name="due_date" value={form.due_date} onChange={handleInputChange} required />
        <input type="number" name="estimated_hours" placeholder="Hours" value={form.estimated_hours} onChange={handleInputChange} required />
        <input type="number" name="weight" placeholder="Weight" value={form.weight} onChange={handleInputChange} required />
        <button type="submit">Add Assignment</button>
      </form>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-label"></div>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div className="calendar-day-header" key={day}>{day}</div>
          ))}
        </div>
        <div className="calendar-body">
          {[...Array(15)].map((_, i) => {
            const hour = i + 9;
            return (
              <div className="calendar-row" key={hour}>
                <div className="time-label">{hour}:00</div>
                {[...Array(7)].map((_, j) => {
                  const cellAssignments = assignments.filter(a =>
                    getDayIndex(a.due_date) === j && getHourIndex(a.due_date) === i
                  );
                  return (
                    <div className="calendar-cell" key={j}>
                      {cellAssignments.map(a => (
                        <div className="study-block" key={a.id}>{a.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
