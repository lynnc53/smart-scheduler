import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState({ course_id: '', title: '', due_date: '', estimated_hours: '', weight: '' });
  const [quiz, setQuiz] = useState({ course_id: '', title: '', date: '', duration: '', weight: '' });
  const [exam, setExam] = useState({ course_id: '', title: '', date: '', duration: '', weight: '' });
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
        const availability = Array(7).fill().map(() => Array(15).fill(true));

        (qData.quizzes || []).forEach(q => {
          const date = new Date(q.date);
          if (isNaN(date.getTime())) return;
        
          const d = getDayIndex(q.date);
          const startHour = date.getHours();
          const duration = parseInt(q.duration || 1);  // fallback to 1 hour if undefined
        
          for (let i = 0; i < duration; i++) {
            const hour = startHour + i;
            const hourIndex = hour - 9;
            if (hourIndex < 0 || hourIndex >= 15) continue; // outside calendar range
        
            if (availability[d] && availability[d][hourIndex] !== undefined) {
              availability[d][hourIndex] = false;
            }
        
            allBlocks.push({
              day: d,
              hour,
              title: `${q.course_id}: ${q.title}`,
              type: 'quiz'
            });
          }
          const studyTask = {
            title: `${q.course_id}: Study for ${q.title}`,
            due_date: q.date,
            estimated_hours: Math.max(1, Math.ceil((parseInt(q.weight || 5) / 10))), // estimate
          };
        
          allBlocks.push(...allocateStudyTime(studyTask, availability));
        });
        
        (eData.exams || []).forEach(ex => {
          const date = new Date(ex.date);
          if (isNaN(date.getTime())) return;
        
          const d = getDayIndex(ex.date);
          const startHour = date.getHours();
          const duration = parseInt(ex.duration || 1);
        
          for (let i = 0; i < duration; i++) {
            const hour = startHour + i;
            const hourIndex = hour - 9;
            if (hourIndex < 0 || hourIndex >= 15) continue;
        
            if (availability[d] && availability[d][hourIndex] !== undefined) {
              availability[d][hourIndex] = false;
            }
        
            allBlocks.push({
              day: d,
              hour,
              title: `${ex.course_id}: ${ex.title}`,
              type: 'exam'
            });
          }
          const studyTask = {
            title: `${ex.course_id}: Study for ${ex.title}`,
            due_date: ex.date,
            estimated_hours: Math.max(2, Math.ceil((parseInt(ex.weight || 20) / 10))), // exams = more prep
          };
        
          allBlocks.push(...allocateStudyTime(studyTask, availability));
        
        });
        
        (vData.events || []).forEach(ev => {
          const date = new Date(ev.date);
          if (isNaN(date.getTime())) return;
        
          const d = getDayIndex(ev.date);
          const startHour = date.getHours();
          const duration = parseInt(ev.duration || 1);
        
          for (let i = 0; i < duration; i++) {
            const hour = startHour + i;
            const hourIndex = hour - 9;
            if (hourIndex < 0 || hourIndex >= 15) continue;
        
            if (availability[d] && availability[d][hourIndex] !== undefined) {
              availability[d][hourIndex] = false;
            }
        
            allBlocks.push({
              day: d,
              hour,
              title: ev.title,
              type: 'event'
            });
          }
        });        
        
        (aData.assignments || []).forEach(a => {
          const assignmentTitle = `${a.course_id}: ${a.title}`;
          const due = new Date(a.due_date);
          if (isNaN(due.getTime())) return;
        
          const day = (due.getDay() + 6) % 7;
          const rawHour = due.getHours();
          const hour = Math.max(9, Math.min(23, rawHour)); // clamp to calendar range
          const hourIndex = hour - 9;
        
          // Mark the assignment due time as unavailable
          if (availability[day] && availability[day][hourIndex] !== undefined) {
            availability[day][hourIndex] = false;
          }
        
          // Add the assignment block (e.g., due at 4pm on Friday)
          allBlocks.push({
            day,
            hour,
            title: assignmentTitle,
            type: 'assignment'
          });
        
          // Add study blocks labeled "Study for ..."
          const studyTitle = `${a.course_id}: Study for ${a.title}`;
          allBlocks.push(...allocateStudyTime({ ...a, title: studyTitle }, availability));
        });                 

        setStudyBlocks(allBlocks);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);
  const handleResetAll = async () => {
    const confirmed = window.confirm("Are you sure you want to delete ALL data?");
    if (!confirmed) return;
  
    const endpoints = [
      'delete-all-assignments',
      'delete-all-quizzes',
      'delete-all-exams',
      'delete-all-events'
    ];
  
    for (const endpoint of endpoints) {
      await fetch(`http://127.0.0.1:5000/api/${endpoint}`, { method: 'POST' });
    }
  
    window.location.reload();
  };
  
  const allocateStudyTime = (task, availability) => {
    const blocks = [];
    const now = new Date();
    const due = new Date(task.due_date);
    const totalHours = parseInt(task.estimated_hours || 1);
    const daysLeft = Math.max(Math.ceil((due - now) / (1000 * 60 * 60 * 24)), 1);
    let remaining = totalHours;
  
    for (let d = 0; d < daysLeft && remaining > 0; d++) {
      const day = new Date();
      day.setDate(now.getDate() + d);
      const dayIndex = (day.getDay() + 6) % 7;
  
      // Prefer midday hours (e.g., 10am to 8pm)
      const preferredHours = [...Array(15).keys()].map(i => i + 9).filter(h => h >= 10 && h <= 20);
  
      for (const hour of preferredHours) {
        const hourIndex = hour - 9;
        if (availability[dayIndex] && availability[dayIndex][hourIndex]) {
          availability[dayIndex][hourIndex] = false;
          blocks.push({
            day: dayIndex,
            hour,
            title: task.title,
            type: 'study'
          });
          remaining--;
          if (remaining === 0) break;
        }
      }
    }
  
    return blocks;
  };
  

  const handleAssignmentChange = (e) => setAssignment({ ...assignment, [e.target.name]: e.target.value });
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
      body: JSON.stringify(assignment)
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

  const getDayIndex = (dateStr) => (new Date(dateStr).getDay() + 6) % 7;
  const getHourIndex = (dateStr) => new Date(dateStr).getHours();
  
  return (
    <div className="container">
      <h1>Smart Scheduler</h1>
      <button onClick={handleResetAll} style={{ marginBottom: '10px' }}>🗑️ Reset All Data</button>

      <form onSubmit={handleIcsSubmit}>
        <h3>📅 Import ACORN Timetable (.ics)</h3>
        <input type="file" accept=".ics" onChange={e => setIcsFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>

      <form onSubmit={handleSubmit}>
        <h3>Add Assignment</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={assignment.course_id} onChange={handleAssignmentChange} required />
        <input type="text" name="title" placeholder="Title" value={assignment.title} onChange={handleAssignmentChange} required />
        <input type="datetime-local" name="due_date" value={assignment.due_date} onChange={handleAssignmentChange} required />
        <input type="number" name="estimated_hours" placeholder="Hours" value={assignment.estimated_hours} onChange={handleAssignmentChange} required />
        <input type="number" name="weight" placeholder="Weight" value={assignment.weight} onChange={handleAssignmentChange} required />
        <button type="submit">Add Assignment</button>
      </form>

      <form onSubmit={handleQuizSubmit}>
        <h3>Add Quiz</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={quiz.course_id} onChange={handleQuizChange} required />
        <input type="text" name="title" placeholder="Quiz Title" value={quiz.title} onChange={handleQuizChange} required />
        <input type="datetime-local" name="date" value={quiz.date} onChange={handleQuizChange} required />
        <input type="number" name="duration" placeholder="Duration" value={quiz.duration} onChange={handleQuizChange} />
        <input type="number" name="weight" placeholder="Weight" value={quiz.weight} onChange={handleQuizChange} />
        <button type="submit">Add Quiz</button>
      </form>

      <form onSubmit={handleExamSubmit}>
        <h3>Add Exam</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={exam.course_id} onChange={handleExamChange} required />
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
      
      <div className="legend">
        <span className="legend-item"><span className="legend-color assignment"></span> Assignment</span>
        <span className="legend-item"><span className="legend-color quiz"></span> Quiz</span>
        <span className="legend-item"><span className="legend-color exam"></span> Exam</span>
        <span className="legend-item"><span className="legend-color event"></span> Event</span>
        <span className="legend-item"><span className="legend-color study"></span> Study</span>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-label"></div>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
            const today = new Date();
            const monday = new Date(today);
            const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)

            // Calculate how many days to subtract to get to Monday
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek); // if Sunday, go back 6 days
            monday.setDate(today.getDate() + diffToMonday); // get this week's Monday

            const d = new Date(monday);
            d.setDate(monday.getDate() + i); // add i days to get each day of the week

            const label = `${day} ${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return (
              <div className="calendar-day-header" key={day}>{label}</div>
            );
          })}
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
