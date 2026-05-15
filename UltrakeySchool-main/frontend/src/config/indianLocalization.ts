/**
 * Indian Localization Configuration
 * Contains Indian states, capitals, currency formatting, and other India-specific data
 */

export const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands', capital: 'Port Blair' },
  { code: 'AP', name: 'Andhra Pradesh', capital: 'Amaravati' },
  { code: 'AR', name: 'Arunachal Pradesh', capital: 'Itanagar' },
  { code: 'AS', name: 'Assam', capital: 'Dispur' },
  { code: 'BR', name: 'Bihar', capital: 'Patna' },
  { code: 'CG', name: 'Chhattisgarh', capital: 'Raipur' },
  { code: 'CH', name: 'Chandigarh', capital: 'Chandigarh' },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman' },
  { code: 'DL', name: 'Delhi', capital: 'New Delhi' },
  { code: 'GA', name: 'Goa', capital: 'Panaji' },
  { code: 'GJ', name: 'Gujarat', capital: 'Gandhinagar' },
  { code: 'HR', name: 'Haryana', capital: 'Chandigarh' },
  { code: 'HP', name: 'Himachal Pradesh', capital: 'Shimla' },
  { code: 'JK', name: 'Jammu and Kashmir', capital: 'Srinagar (Summer) / Jammu (Winter)' },
  { code: 'JH', name: 'Jharkhand', capital: 'Ranchi' },
  { code: 'KA', name: 'Karnataka', capital: 'Bengaluru' },
  { code: 'KL', name: 'Kerala', capital: 'Thiruvananthapuram' },
  { code: 'LA', name: 'Ladakh', capital: 'Leh' },
  { code: 'LD', name: 'Lakshadweep', capital: 'Kavaratti' },
  { code: 'MH', name: 'Maharashtra', capital: 'Mumbai' },
  { code: 'ML', name: 'Meghalaya', capital: 'Shillong' },
  { code: 'MN', name: 'Manipur', capital: 'Imphal' },
  { code: 'MP', name: 'Madhya Pradesh', capital: 'Bhopal' },
  { code: 'MZ', name: 'Mizoram', capital: 'Aizawl' },
  { code: 'NL', name: 'Nagaland', capital: 'Kohima' },
  { code: 'OD', name: 'Odisha', capital: 'Bhubaneswar' },
  { code: 'PY', name: 'Puducherry', capital: 'Puducherry' },
  { code: 'PB', name: 'Punjab', capital: 'Chandigarh' },
  { code: 'RJ', name: 'Rajasthan', capital: 'Jaipur' },
  { code: 'SK', name: 'Sikkim', capital: 'Gangtok' },
  { code: 'TN', name: 'Tamil Nadu', capital: 'Chennai' },
  { code: 'TG', name: 'Telangana', capital: 'Hyderabad' },
  { code: 'TR', name: 'Tripura', capital: 'Agartala' },
  { code: 'UP', name: 'Uttar Pradesh', capital: 'Lucknow' },
  { code: 'UT', name: 'Uttarakhand', capital: 'Dehradun' },
  { code: 'WB', name: 'West Bengal', capital: 'Kolkata' }
];

export const INDIAN_CITIES = [
  // Major metropolitan cities
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Coimbatore', 'Amritsar', 'Navi Mumbai',
  'Allahabad', 'Ranchi', 'Hubli-Dharwad', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur',
  'Tiruchirappalli', 'Madurai', 'Bangalore Rural', 'Gurgaon', 'Vijayawada', 'Jabalpur',
  'Guwahati', 'Chandigarh', 'Solapur', 'Tiruppur', 'Bhiwandi', 'Saharanpur', 'Guntur',
  'Amravati', 'Bhubaneswar', 'Bhiwani', 'Nellore', 'Jalandhar', 'Tirupati', 'Erode',
  'Thoothukudi', 'Haridwar', 'Bareilly', 'Roorkee', 'Aligarh', 'Moradabad', 'Sikar',
  'Gulbarga', 'Jammu', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Uttarpara', 'Noida',
  'Kalyani', 'Ajmer', 'Karnal', 'Shivaji Nagar', 'Warangal', 'Mangalore', 'Erode',
  'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gwalior', 'Bhilai', 'Korba',
  'Bhilwara', 'Brahmapur', 'Mysore', 'Rangpur', 'Nizamabad', 'Parbhani', 'Tumkur',
  'Kolar', 'Panihati', 'Bally', 'South Dumdum', 'Berhampur', 'Rajahmundry', 'Baranagar',
  'Baharampur', 'Akola', 'Ichalkaranji', 'Tiruvottiyur', 'Kumbakonam', 'Tirupathur',
  'Udagamandalam', 'Anantapur', 'Karimnagar', 'Adoni', 'Proddatur', 'Nandyal',
  'Mahbubnagar', 'Nellore', 'Ongole', 'Tenali', 'Guntakal', 'Bhimavaram', 'Tanuku',
  'Dharmavaram', 'Eluru', 'Amalapuram', 'Narsapur', 'Palakkad', 'Pondicherry',
  'Shimoga', 'Bellary', 'Raichur', 'Mandya', 'Hassan', 'Mangalore', 'Chikmagalur',
  'Udupi', 'Davanagere', 'Gulbarga', 'Bidar', 'Yadgir', 'Koppal', 'Bagalkot',
  'Vijayapura', 'Haveri', 'Uttara Kannada', 'Uttara Kannada', 'Dharwad', 'Gadag',
  'Belagavi', 'Bagalkot', 'Vijayapura', 'Bagalkot', 'Koppal', 'Gadag', 'Haveri',
  'Uttara Kannada', 'Uttara Kannada', 'Dharwad', 'Belagavi', 'Bagalkot', 'Vijayapura',
  'Bagalkot', 'Koppal', 'Gadag', 'Haveri', 'Uttara Kannada', 'Uttara Kannada'
];

export const INDIAN_CURRENCY = {
  symbol: '₹',
  code: 'INR',
  name: 'Indian Rupee',
  decimalDigits: 2,
  format: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  formatWithoutSymbol: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
};

export const INDIAN_PHONE_PATTERN = {
  regex: /^[6-9]\d{9}$/,
  format: (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as +91 XXXXX XXXXX
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  },
  validate: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return INDIAN_PHONE_PATTERN.regex.test(cleaned);
  }
};

export const INDIAN_PINCODE_PATTERN = {
  regex: /^\d{6}$/,
  validate: (pincode: string): boolean => {
    return INDIAN_PINCODE_PATTERN.regex.test(pincode);
  }
};

export const INDIAN_EDUCATION_BOARDS = [
  'CBSE - Central Board of Secondary Education',
  'CISCE - Council for the Indian School Certificate Examinations',
  'IB - International Baccalaureate',
  'Cambridge International',
  'State Board - Andhra Pradesh',
  'State Board - Arunachal Pradesh',
  'State Board - Assam',
  'State Board - Bihar',
  'State Board - Chhattisgarh',
  'State Board - Goa',
  'State Board - Gujarat',
  'State Board - Haryana',
  'State Board - Himachal Pradesh',
  'State Board - Jammu and Kashmir',
  'State Board - Jharkhand',
  'State Board - Karnataka',
  'State Board - Kerala',
  'State Board - Madhya Pradesh',
  'State Board - Maharashtra',
  'State Board - Manipur',
  'State Board - Meghalaya',
  'State Board - Mizoram',
  'State Board - Nagaland',
  'State Board - Odisha',
  'State Board - Punjab',
  'State Board - Rajasthan',
  'State Board - Sikkim',
  'State Board - Tamil Nadu',
  'State Board - Telangana',
  'State Board - Tripura',
  'State Board - Uttar Pradesh',
  'State Board - Uttarakhand',
  'State Board - West Bengal',
  'NIOS - National Institute of Open Schooling'
];

export const INDIAN_INSTITUTION_TYPES = [
  { value: 'school', label: 'School', subtypes: ['Primary School', 'Upper Primary School', 'High School', 'Higher Secondary School'] },
  { value: 'college', label: 'College', subtypes: ['Arts College', 'Science College', 'Commerce College', 'Professional College'] },
  { value: 'university', label: 'University', subtypes: ['Central University', 'State University', 'Private University', 'Deemed University'] },
  { value: 'degree', label: 'Degree College', subtypes: ['BA College', 'BSc College', 'BCom College', 'Professional Degree College'] },
  { value: 'btech', label: 'B.Tech/Engineering College', subtypes: ['Engineering College', 'Polytechnic', 'Technical Institute'] },
  { value: 'medical', label: 'Medical College', subtypes: ['Medical College', 'Dental College', 'Nursing College', 'Pharmacy College'] },
  { value: 'management', label: 'Management College', subtypes: ['MBA College', 'BBA College', 'Management Institute'] },
  { value: 'vocational', label: 'Vocational Institute', subtypes: ['ITI', 'Vocational Training Center', 'Skill Development Center'] }
];

export const INDIAN_ACADEMIC_YEARS = [
  { value: '2023-24', label: '2023-24' },
  { value: '2024-25', label: '2024-25' },
  { value: '2025-26', label: '2025-26' },
  { value: '2026-27', label: '2026-27' }
];

export const INDIAN_GRADES = [
  { grade: 'A+', percentage: '90-100', points: 10 },
  { grade: 'A', percentage: '80-89', points: 9 },
  { grade: 'B+', percentage: '70-79', points: 8 },
  { grade: 'B', percentage: '60-69', points: 7 },
  { grade: 'C+', percentage: '50-59', points: 6 },
  { grade: 'C', percentage: '40-49', points: 5 },
  { grade: 'D', percentage: '33-39', points: 4 },
  { grade: 'F', percentage: '0-32', points: 0 }
];

export const INDIAN_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)', offset: '+05:30' }
];

export default {
  states: INDIAN_STATES,
  cities: INDIAN_CITIES,
  currency: INDIAN_CURRENCY,
  phone: INDIAN_PHONE_PATTERN,
  pincode: INDIAN_PINCODE_PATTERN,
  educationBoards: INDIAN_EDUCATION_BOARDS,
  institutionTypes: INDIAN_INSTITUTION_TYPES,
  academicYears: INDIAN_ACADEMIC_YEARS,
  grades: INDIAN_GRADES,
  timezones: INDIAN_TIMEZONES
};
