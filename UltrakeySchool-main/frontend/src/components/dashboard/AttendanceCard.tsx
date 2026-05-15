import { Link } from 'react-router-dom';
import { useState } from 'react';

interface AttendanceStats {
  students: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  teachers: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  staff: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

const calculatePieChart = (present: number, absent: number, late: number, total: number) => {
  if (total === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';

  const presentDeg = (present / total) * 360;
  const absentDeg = presentDeg + (absent / total) * 360;
  const lateDeg = absentDeg + (late / total) * 360;

  return `conic-gradient(
    #10b981 0deg ${presentDeg}deg,
    #ef4444 ${presentDeg}deg ${absentDeg}deg,
    #f59e0b ${absentDeg}deg ${lateDeg}deg,
    #e5e7eb ${lateDeg}deg 360deg
  )`;
};

const AttendanceCard = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'staff'>('students');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [stats] = useState<AttendanceStats>({
    students: { present: 28, absent: 1, late: 1, total: 30 },
    teachers: { present: 30, absent: 3, late: 0, total: 33 },
    staff: { present: 45, absent: 1, late: 10, total: 56 }
  });

  const renderTabContent = (type: 'students' | 'teachers' | 'staff', link: string) => {
    const data = stats[type];

    return (
      <div className={`tab-pane fade ${activeTab === type ? 'active show' : ''}`} id={type}>
        <div className="row gx-3">
          <div className="col-sm-4">
            <div className="card bg-light-300 shadow-none border-0">
              <div className="card-body p-3 text-center">
                <h5>{data.present}</h5>
                <p className="fs-12">Present</p>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card bg-light-300 shadow-none border-0">
              <div className="card-body p-3 text-center">
                <h5>{data.absent}</h5>
                <p className="fs-12">Absent</p>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card bg-light-300 shadow-none border-0">
              <div className="card-body p-3 text-center">
                <h5>{data.late}</h5>
                <p className="fs-12">Late</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="pie-chart-container mb-4">
            <div className="pie-chart">
              <div
                className="pie-slice present"
                style={{
                  background: calculatePieChart(data.present, data.absent, data.late, data.total)
                }}
              ></div>
              <div className="pie-center">
                <div className="pie-total">{data.total}</div>
                <div className="pie-label">Total</div>
              </div>
            </div>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="legend-color present"></span>
                Present ({data.present})
              </div>
              <div className="legend-item">
                <span className="legend-color absent"></span>
                Absent ({data.absent})
              </div>
              <div className="legend-item">
                <span className="legend-color late"></span>
                Late ({data.late})
              </div>
            </div>
          </div>
          <Link to={link} className="btn btn-light">
            <i className="ti ti-calendar-share me-1" />
            View All
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Attendance</h4>
          <div className="dropdown">
            <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-calendar-due me-1" />
              {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}
            </a>
            <ul className="dropdown-menu mt-2 p-3">
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded-1"
                  onClick={(e) => { e.preventDefault(); setDateRange('today'); }}
                >
                  Today
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded-1"
                  onClick={(e) => { e.preventDefault(); setDateRange('week'); }}
                >
                  This Week
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded-1"
                  onClick={(e) => { e.preventDefault(); setDateRange('month'); }}
                >
                  This Month
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="card-body">
          <div className="list-tab mb-4">
            <ul className="nav">
              <li>
                <a
                  href="#"
                  className={activeTab === 'students' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setActiveTab('students'); }}
                  data-bs-toggle="tab"
                  data-bs-target="#students"
                >
                  Students
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={activeTab === 'teachers' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setActiveTab('teachers'); }}
                  data-bs-toggle="tab"
                  data-bs-target="#teachers"
                >
                  Teachers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={activeTab === 'staff' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setActiveTab('staff'); }}
                  data-bs-toggle="tab"
                  data-bs-target="#staff"
                >
                  Staff
                </a>
              </li>
            </ul>
          </div>
          <div className="tab-content">
            {renderTabContent('students', '/student-attendance')}
            {renderTabContent('teachers', '/teacher-attendance')}
            {renderTabContent('staff', '/staff-attendance')}
          </div>
        </div>
      </div>

      <div className="row flex-fill">
        {/* Best Performer */}
        <div className="col-sm-6 d-flex flex-column">
          <div className="bg-success-800 p-3 br-5 text-center flex-fill mb-4 pb-0 owl-height bg-01">
            <div className="owl-carousel student-slider h-100">
              <div className="item h-100">
                <div className="d-flex justify-content-between flex-column h-100">
                  <div>
                    <h5 className="mb-3 text-white">Best Performer</h5>
                    <h4 className="mb-1 text-white">Rubell</h4>
                    <p className="text-light">Physics Teacher</p>
                  </div>
                  <img src="/assets/img/performer/performer-01.webp" alt="img" />
                </div>
              </div>
              <div className="item h-100">
                <div className="d-flex justify-content-between flex-column h-100">
                  <div>
                    <h5 className="mb-3 text-white">Best Performer</h5>
                    <h4 className="mb-1 text-white">George Odell</h4>
                    <p className="text-light">English Teacher</p>
                  </div>
                  <img src="/assets/img/performer/performer-02.webp" alt="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Best Performer */}

        {/* Star Students */}
        <div className="col-sm-6 d-flex flex-column">
          <div className="bg-info p-3 br-5 text-center flex-fill mb-4 pb-0 owl-height bg-02">
            <div className="owl-carousel teacher-slider h-100">
              <div className="item h-100">
                <div className="d-flex justify-content-between flex-column h-100">
                  <div>
                    <h5 className="mb-3 text-white">Star Students</h5>
                    <h4 className="mb-1 text-white">Tenesa</h4>
                    <p className="text-light">XII, A</p>
                  </div>
                  <img src="/assets/img/performer/student-performer-01.webp" alt="img" />
                </div>
              </div>
              <div className="item h-100">
                <div className="d-flex justify-content-between flex-column h-100">
                  <div>
                    <h5 className="mb-3 text-white">Star Students</h5>
                    <h4 className="mb-1 text-white">Michael</h4>
                    <p className="text-light">XII, B</p>
                  </div>
                  <img src="/assets/img/performer/student-performer-02.webp" alt="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Star Students */}
      </div>

      <style>
        {`
          .pie-chart-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: #f9fafb;
             : 8px;
            border: 1px solid #e5e7eb;
          }

          .pie-chart {
            position: relative;
            width: 120px;
            height: 120px;
             : 50%;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .pie-slice {
            width: 100%;
            height: 100%;
             : 50%;
            position: relative;
          }

          .pie-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70px;
            height: 70px;
            background: white;
             : 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .pie-total {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            line-height: 1;
          }

          .pie-label {
            font-size: 10px;
            color: #6b7280;
            margin-top: 2px;
          }

          .pie-legend {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #374151;
          }

          .legend-color {
            width: 12px;
            height: 12px;
             : 2px;
          }

          .legend-color.present {
            background: #10b981;
          }

          .legend-color.absent {
            background: #ef4444;
          }

          .legend-color.late {
            background: #f59e0b;
          }

          @media (max-width: 768px) {
            .pie-chart {
              width: 100px;
              height: 100px;
            }

            .pie-center {
              width: 60px;
              height: 60px;
            }

            .pie-total {
              font-size: 16px;
            }

            .pie-legend {
              gap: 10px;
            }

            .legend-item {
              font-size: 11px;
            }
          }

          /* Total Attendance Chart Styles */
          .total-attendance-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: #f9fafb;
             : 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }

          .total-attendance-chart .pie-chart {
            position: relative;
            width: 140px;
            height: 140px;
             : 50%;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .total-attendance-chart .pie-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: white;
             : 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }

          .total-attendance-chart .pie-total {
            font-size: 22px;
            font-weight: bold;
            color: #1f2937;
            line-height: 1;
          }

          .total-attendance-chart .pie-label {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
          }
        `}
      </style>
    </>
  );
};

export default AttendanceCard;
