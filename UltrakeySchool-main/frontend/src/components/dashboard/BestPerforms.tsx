import { useState, useEffect } from 'react';
import OwlCarousel from 'react-owl-carousel';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import apiClient from '../../api/client';

interface Performer {
  _id: string;
  userId: string;
  name: string;
  type: 'teacher' | 'student';
  role?: string;
  class?: string;
  section?: string;
  performanceScore: number;
  achievements: string[];
  photo?: string;
  isFeatured: boolean;
}

const BestPerforms = () => {
  const [teachers, setTeachers] = useState<Performer[]>([]);
  const [students, setStudents] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const options = {
    loop: true,
    margin: 10,
    items: 1,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    dots: true,
    nav: false,
  };

  useEffect(() => {
    fetchBestPerformers();
  }, []);

  const fetchBestPerformers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/performers/best', {
        params: { featured: true }
      });

      if (response.data.success && response.data.data) {
        const performers = response.data.data;
        
        // Separate teachers and students
        const teacherPerformers = performers.filter((p: Performer) => p.type === 'teacher');
        const studentPerformers = performers.filter((p: Performer) => p.type === 'student');
        
        setTeachers(teacherPerformers);
        setStudents(studentPerformers);
      }
    } catch (err: any) {
      console.error('Error fetching best performers:', err);
      setError(err.response?.data?.message || 'Failed to fetch best performers');
      
      // Fallback to hardcoded data if API fails
      const fallbackTeachers: Performer[] = [
        {
          _id: '1',
          userId: 'teacher1',
          name: 'Rubell',
          type: 'teacher',
          role: 'Physics Teacher',
          performanceScore: 95.5,
          achievements: ['Best Teacher Award', 'Innovation in Teaching'],
          photo: '/assets/img/performer/performer-01.webp',
          isFeatured: true
        },
        {
          _id: '2',
          userId: 'teacher2',
          name: 'George Odell',
          type: 'teacher',
          role: 'English Teacher',
          performanceScore: 92.3,
          achievements: ['Excellence in Literature', 'Student Mentorship'],
          photo: '/assets/img/performer/performer-02.webp',
          isFeatured: true
        }
      ];

      const fallbackStudents: Performer[] = [
        {
          _id: '3',
          userId: 'student1',
          name: 'Tenesa',
          type: 'student',
          class: 'XII',
          section: 'A',
          performanceScore: 98.7,
          achievements: ['Top Scorer', 'Science Olympiad Winner'],
          photo: '/assets/img/performer/student-performer-01.webp',
          isFeatured: true
        },
        {
          _id: '4',
          userId: 'student2',
          name: 'Michael',
          type: 'student',
          class: 'XII',
          section: 'B',
          performanceScore: 96.2,
          achievements: ['Mathematics Champion', 'Debate Competition Winner'],
          photo: '/assets/img/performer/student-performer-02.webp',
          isFeatured: true
        }
      ];

      setTeachers(fallbackTeachers);
      setStudents(fallbackStudents);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="row flex-fill">
        <div className="col-12 text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="row flex-fill">
        <div className="col-12">
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row flex-fill">
      {/* Best Performer - Teachers */}
      <div className="col-sm-6 d-flex flex-column">
        <div className="bg-success-800 p-3 br-5 text-center flex-fill mb-4 pb-0 owl-height bg-01">
          {teachers.length > 0 ? (
            <OwlCarousel {...options} className="student-slider h-100">
              {teachers.map((teacher) => (
                <div key={teacher._id} className="item h-100">
                  <div className="d-flex justify-content-between flex-column h-100">
                    <div>
                      <h5 className="mb-3 text-white">Best Performer</h5>
                      <h4 className="mb-1 text-white">{teacher.name}</h4>
                      <p className="text-light">{teacher.role || 'Teacher'}</p>
                      {teacher.performanceScore && (
                        <p className="text-light small">Score: {teacher.performanceScore.toFixed(1)}</p>
                      )}
                    </div>
                    <img 
                      src={teacher.photo || '/assets/img/performer/performer-01.webp'} 
                      alt={teacher.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/img/performer/performer-01.webp';
                      }}
                    />
                  </div>
                </div>
              ))}
            </OwlCarousel>
          ) : (
            <div className="h-100 d-flex flex-column justify-content-center">
              <div>
                <h5 className="mb-3 text-white">Best Performer</h5>
                <p className="text-light">No featured teachers yet</p>
              </div>
              <img src="/assets/img/performer/performer-01.webp" alt="placeholder" />
            </div>
          )}
        </div>
      </div>

      {/* Star Students */}
      <div className="col-sm-6 d-flex flex-column">
        <div className="bg-info p-3 br-5 text-center flex-fill mb-4 pb-0 owl-height bg-02">
          {students.length > 0 ? (
            <OwlCarousel {...options} className="teacher-slider h-100">
              {students.map((student) => (
                <div key={student._id} className="item h-100">
                  <div className="d-flex justify-content-between flex-column h-100">
                    <div>
                      <h5 className="mb-3 text-white">Star Students</h5>
                      <h4 className="mb-1 text-white">{student.name}</h4>
                      <p className="text-light">
                        {student.class && student.section 
                          ? `${student.class}, ${student.section}` 
                          : 'Student'}
                      </p>
                      {student.performanceScore && (
                        <p className="text-light small">Score: {student.performanceScore.toFixed(1)}</p>
                      )}
                    </div>
                    <img 
                      src={student.photo || '/assets/img/performer/student-performer-01.webp'} 
                      alt={student.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/img/performer/student-performer-01.webp';
                      }}
                    />
                  </div>
                </div>
              ))}
            </OwlCarousel>
          ) : (
            <div className="h-100 d-flex flex-column justify-content-center">
              <div>
                <h5 className="mb-3 text-white">Star Students</h5>
                <p className="text-light">No featured students yet</p>
              </div>
              <img src="/assets/img/performer/student-performer-01.webp" alt="placeholder" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestPerforms;
