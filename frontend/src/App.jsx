import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    course_id: '', title: '', due_date: '', estimated_hours: '', weight: ''
  });
  const [quiz, setQuiz] = useState({ title: '', date: '', duration: '', weight: '' });
  const [exam, setExam] = useState({ title: '', date: '', duration: '', weight: '' });
  const [event, setEvent] = useState({ title: '', date: '', duration: '' });
  const [icsFile, setIcsFile] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [aRes, qRes, eRes, vRes] = await Promise.all([
          fetch('http://127.0.0.1:5000/api/get-assignments'),
          fetch('http://127.0.0.1:5000/api/get-quizzes'),
          fetch('http://127.0.0.1:5000/api/get-exams'),
          fetch('http://127.0.0.1:5000/api/get-events')
        ]);

        const [aData, qData, eData, vData] = await Promise.all([
          aRes.json(), qRes.json(), eRes.json(), vRes.json()
        ]);

        setAssignments(aData.assignments || []);

        const allBlocks = [];
        (aData.assignments || []).forEach(a => allBlocks.push(...distributeStudyBlocks(a, 'assignment')));
        (qData.quizzes || []).forEach(q => allBlocks.push({ day: getDayIndex(q.date), hour: getHourIndex(q.date), title: q.title, type: 'quiz' }));
        (eData.exams || []).forEach(ex => allBlocks.push({ day: getDayIndex(ex.date), hour: getHourIndex(ex.date), title: ex.title, type: 'exam' }));
        (vData.events || []).forEach(ev => allBlocks.push({ day: getDayIndex(ev.date), hour: getHourIndex(ev.date), title: ev.title, type: 'event' }));

        setStudyBlocks(allBlocks);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleQuizChange = (e) => setQuiz({ ...quiz, [e.target.name]: e.target.value });
  const handleExamChange = (e) => setExam({ ...exam, [e.target.name]: e.target.value });
  const handleEventChange = (e) => setEvent({ ...event, [e.target.name]: e.target.value });
  const handleIcsSubmit = async (e) => {
    e.preventDefault();
    if (!icsFile) return;
    const formData = new FormData();
    formData.append('file', icsFile);
    await fetch('http://127.0.0.1:5000/api/upload-acorn-ics', { method: 'POST', body: formData });
    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-assignment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => window.location.reload());
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-quiz', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    }).then(() => window.location.reload());
  };

  const handleExamSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-exam', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    }).then(() => window.location.reload());
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).then(() => window.location.reload());
  };

  const distributeStudyBlocks = (task, type = 'assignment') => {
    const blocks = [];
    const now = new Date();
    const due = new Date(task.due_date || task.date);
    const totalHours = parseInt(task.estimated_hours || 1);
    const daysLeft = Math.max(Math.ceil((due - now) / (1000 * 60 * 60 * 24)), 1);

    for (let i = 0; i < daysLeft; i++) {
      const studyDate = new Date();
      studyDate.setDate(now.getDate() + i);
      const day = (studyDate.getDay() + 6) % 7;
      const hour = 9 + (i % 10);
      blocks.push({ day, hour, title: task.title, type });
    }

    return blocks;
  };

  const getDayIndex = (dateStr) => (new Date(dateStr).getDay() + 6) % 7;
  const getHourIndex = (dateStr) => new Date(dateStr).getHours();

  return (
    <div className="container">
      <h1>Smart Scheduler</h1>

      <form onSubmit={handleIcsSubmit}>
        <h3>📥 Import ACORN Timetable (.ics)</h3>
        <input type="file" accept=".ics" onChange={e => setIcsFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>

      <form onSubmit={handleSubmit}>
        <h3>Add Assignment</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={form.course_id} onChange={handleInputChange} required />
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleInputChange} required />
        <input type="datetime-local" name="due_date" value={form.due_date} onChange={handleInputChange} required />
        <input type="number" name="estimated_hours" placeholder="Hours" value={form.estimated_hours} onChange={handleInputChange} required />
        <input type="number" name="weight" placeholder="Weight" value={form.weight} onChange={handleInputChange} required />
        <button type="submit">Add Assignment</button>
      </form>

      <form onSubmit={handleQuizSubmit}>
        <h3>Add Quiz</h3>
        <input type="text" name="title" placeholder="Quiz Title" value={quiz.title} onChange={handleQuizChange} required />
        <input type="datetime-local" name="date" value={quiz.date} onChange={handleQuizChange} required />
        <input type="number" name="duration" placeholder="Duration" value={quiz.duration} onChange={handleQuizChange} />
        <input type="number" name="weight" placeholder="Weight" value={quiz.weight} onChange={handleQuizChange} />
        <button type="submit">Add Quiz</button>
      </form>

      <form onSubmit={handleExamSubmit}>
        <h3>Add Exam</h3>
        <input type="text" name="title" placeholder="Exam Title" value={exam.title} onChange={handleExamChange} required />
        <input type="datetime-local" name="date" value={exam.date} onChange={handleExamChange} required />
        <input type="number" name="duration" placeholder="Duration" value={exam.duration} onChange={handleExamChange} />
        <input type="number" name="weight" placeholder="Weight" value={exam.weight} onChange={handleExamChange} />
        <button type="submit">Add Exam</button>
      </form>

      <form onSubmit={handleEventSubmit}>
        <h3>Add Event</h3>
        <input type="text" name="title" placeholder="Event Title" value={event.title} onChange={handleEventChange} required />
        <input type="datetime-local" name="date" value={event.date} onChange={handleEventChange} required />
        <input type="number" name="duration" placeholder="Duration" value={event.duration} onChange={handleEventChange} />
        <button type="submit">Add Event</button>
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
                  const cellBlocks = studyBlocks.filter(b => b.day === j && b.hour === hour);
                  return (
                    <div className="calendar-cell" key={j}>
                      {cellBlocks.map((b, idx) => (
                        <div className={`study-block ${b.type}`} key={idx}>{b.title}</div>
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
