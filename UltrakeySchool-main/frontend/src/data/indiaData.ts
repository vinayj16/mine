// Indian States and Cities Data for the application

export const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands', capital: 'Port Blair' },
  { code: 'AP', name: 'Andhra Pradesh', capital: 'Amaravati' },
  { code: 'AR', name: 'Arunachal Pradesh', capital: 'Itanagar' },
  { code: 'AS', name: 'Assam', capital: 'Dispur' },
  { code: 'BR', name: 'Bihar', capital: 'Patna' },
  { code: 'CH', name: 'Chandigarh', capital: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh', capital: 'Raipur' },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman' },
  { code: 'DL', name: 'Delhi', capital: 'New Delhi' },
  { code: 'GA', name: 'Goa', capital: 'Panaji' },
  { code: 'GJ', name: 'Gujarat', capital: 'Gandhinagar' },
  { code: 'HP', name: 'Himachal Pradesh', capital: 'Shimla' },
  { code: 'HR', name: 'Haryana', capital: 'Chandigarh' },
  { code: 'JH', name: 'Jharkhand', capital: 'Ranchi' },
  { code: 'JK', name: 'Jammu and Kashmir', capital: 'Srinagar (Summer), Jammu (Winter)' },
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
  { code: 'OR', name: 'Odisha', capital: 'Bhubaneswar' },
  { code: 'PB', name: 'Punjab', capital: 'Chandigarh' },
  { code: 'PY', name: 'Puducherry', capital: 'Puducherry' },
  { code: 'RJ', name: 'Rajasthan', capital: 'Jaipur' },
  { code: 'SK', name: 'Sikkim', capital: 'Gangtok' },
  { code: 'TG', name: 'Telangana', capital: 'Hyderabad' },
  { code: 'TN', name: 'Tamil Nadu', capital: 'Chennai' },
  { code: 'TR', name: 'Tripura', capital: 'Agartala' },
  { code: 'TT', name: 'Uttar Pradesh', capital: 'Lucknow' },
  { code: 'UT', name: 'Uttarakhand', capital: 'Dehradun' },
  { code: 'WB', name: 'West Bengal', capital: 'Kolkata' }
];

export const MAJOR_INDIAN_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Kurnool', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Roing', 'Bomdila', 'Ziro', 'Along', 'Tawang', 'Khonsa'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur', 'Bongaigaon', 'Tinsukia', 'Dibrugarh', 'Nagaon', 'Karbi Anglong'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif', 'Purnia', 'Arrah', 'Begusarai', 'Katihar'],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Raigarh', 'Korba', 'Jagdalpur', 'Ambikapur', 'Dhamtari'],
  'Delhi': ['New Delhi', 'Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', ' Meerut', 'Rajouri Garden', 'Saket', 'Dwarka'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Benaulim', 'Cansaulim', 'Dona Paula', 'Colva', 'Anjuna'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Jamnagar', 'Junagadh', 'Gandhidham', 'Anand', 'Bharuch'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Karnal', 'Rohtak', 'Hisar', 'Sonipat', 'Yamunanagar', 'Bahadurgarh', 'Kurukshetra'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Manali', 'Chamba', 'Kangra', 'Palampur', 'Nahan'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Jhumri Telaiya'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Gulmarg', 'Udhampur', 'Kathua', 'Sopore', 'Punch', 'Kashmir'],
  'Karnataka': ['Bengaluru', 'Mysore', 'Hubli-Dharwad', 'Mangalore', 'Belgaum', 'Dharwad', 'Bellary', 'Tumkur', 'Shimoga', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Malappuram', 'Alappuzha', 'Kannur', 'Kottayam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai', 'Sangli'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Mawkyrwat', 'Mendipathar', 'Resubelpara', 'Khliehriat'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Tamenglong', 'Senapati', 'Chandel', 'Jiribam'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Saitual', 'Khawzawl'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokukchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mongku', 'Phek', 'Kiphire', 'Longleng'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Jeypore', 'Angul'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Firozpur', 'Kapurthala', 'Moga'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Pilani', 'Bhilwara', 'Alwar', 'Sikar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore', 'Erode', 'Tirunelveli', 'Thanjavur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Khammam', 'Ramagundam', 'Secunderabad', 'Nizamabad', 'Suryapet', 'Jagtial', 'Miryalguda'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Aligarh', 'Bareilly', 'Moradabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Kotdwar', 'Mussoorie'],
  'West Bengal': ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Kharagpur', 'Berhampore', 'Baharampur']
};

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small schools starting their digital journey',
    priceINR: 2499,
    priceUSD: 29,
    duration: 'monthly',
    features: {
      maxUsers: 100,
      maxStudents: 500,
      maxTeachers: 50,
      storageGB: 10,
      customDomain: false,
      whiteLabel: false,
      advancedAnalytics: false,
      prioritySupport: false,
      integrations: 0
    },
    allowedFeatures: [
      'Basic Dashboard',
      'Student Management',
      'Teacher Management',
      'Class Management',
      'Attendance Tracking',
      'Basic Reports',
      'Email Support'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Best for growing institutions needing more features',
    priceINR: 4999,
    priceUSD: 59,
    duration: 'monthly',
    features: {
      maxUsers: 250,
      maxStudents: 1500,
      maxTeachers: 150,
      storageGB: 50,
      customDomain: true,
      whiteLabel: false,
      advancedAnalytics: true,
      prioritySupport: true,
      integrations: 5
    },
    allowedFeatures: [
      'Everything in Basic',
      'Fee Management',
      'Library Management',
      'Transport Management',
      'Hostel Management',
      'Advanced Analytics',
      'Custom Domain',
      'SMS Notifications',
      'Priority Support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Complete solution for large institutions',
    priceINR: 9999,
    priceUSD: 119,
    duration: 'monthly',
    features: {
      maxUsers: 1000,
      maxStudents: 5000,
      maxTeachers: 500,
      storageGB: 200,
      customDomain: true,
      whiteLabel: true,
      advancedAnalytics: true,
      prioritySupport: true,
      unlimitedIntegrations: true
    },
    allowedFeatures: [
      'Everything in Standard',
      'White Label Solution',
      'API Access',
      'Mobile App',
      'Dedicated Account Manager',
      'Custom Integrations',
      'Training Sessions',
      '24/7 Premium Support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solution for multi-branch institutions',
    priceINR: 24999,
    priceUSD: 299,
    duration: 'monthly',
    features: {
      maxUsers: -1, // unlimited
      maxStudents: -1,
      maxTeachers: -1,
      storageGB: -1,
      customDomain: true,
      whiteLabel: true,
      advancedAnalytics: true,
      prioritySupport: true,
      unlimitedIntegrations: true,
      multiBranch: true
    },
    allowedFeatures: [
      'Everything in Premium',
      'Multi-Branch Management',
      'Custom Development',
      'SLA Guarantee',
      'Dedicated Server',
      'Custom Contracts',
      'On-Premise Option',
      'White Glove Setup'
    ]
  }
];

export const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Credit Card', icon: 'ti-credit-card' },
  { id: 'debit_card', name: 'Debit Card', icon: 'ti-credit-card' },
  { id: 'upi', name: 'UPI', icon: 'ti-wallet' },
  { id: 'net_banking', name: 'Net Banking', icon: 'ti-building-bank' }
];

export const INDIAN_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'IDBI Bank',
  'Federal Bank',
  'South Indian Bank',
  'Indian Bank'
];

export const CARD_TYPES = ['Visa', 'Mastercard', 'RuPay', 'American Express'];
