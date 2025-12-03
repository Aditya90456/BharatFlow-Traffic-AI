

export const GRID_SIZE = 3; // Mini grid (3x3)
export const ROAD_WIDTH = 70; // Wider roads for detail
export const BLOCK_SIZE = 240; // Larger blocks to show city details
export const CAR_SIZE = 14;
export const MAX_SPEED = 4;
export const ACCELERATION = 0.15;
export const DECELERATION = 0.25;

export const INITIAL_GREEN_DURATION = 150; // frames
export const YELLOW_DURATION = 60; // frames

// Layout calculation helper
export const getCanvasSize = () => {
  const width = GRID_SIZE * BLOCK_SIZE; // Canvas is exactly grid size
  const height = GRID_SIZE * BLOCK_SIZE;
  return { width, height };
};

export const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Delhi": { lat: 28.6139, lng: 77.2090 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Chandigarh": { lat: 30.7333, lng: 76.7794 },
  "Indore": { lat: 22.7196, lng: 75.8577 },
  "Kochi": { lat: 9.9312, lng: 76.2673 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
  "Visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "Patna": { lat: 25.5941, lng: 85.1376 },
  "Bhopal": { lat: 23.2599, lng: 77.4126 },
  "Ludhiana": { lat: 30.9010, lng: 75.8573 },
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Nashik": { lat: 19.9975, lng: 73.7898 },
  "Coimbatore": { lat: 11.0168, lng: 76.9558 },
  "Kanpur": { lat: 26.4499, lng: 80.3319 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Goa (Panjim)": { lat: 15.4909, lng: 73.8278 },
  "Shimla": { lat: 31.1048, lng: 77.1734 },
  "Manali": { lat: 32.2432, lng: 77.1892 },
  "Ooty": { lat: 11.4100, lng: 76.6950 },
  "Pondicherry": { lat: 11.9416, lng: 79.8083 },
  "Rishikesh": { lat: 30.0869, lng: 78.2676 },
  "Udaipur": { lat: 24.5854, lng: 73.7125 },
  "Srinagar": { lat: 34.0837, lng: 74.7973 }
};

export const CITY_CONFIGS: Record<string, string[]> = {
  // --- Metros ---
  "Bangalore": [
    "Silk Board", "Hebbal Flyover", "KR Puram",
    "Sony Signal", "Dairy Circle", "Tin Factory",
    "Madiwala", "Richmond Circle", "Indiranagar"
  ],
  "Mumbai": [
    "Teen Hath Naka", "Dadar TT", "Sion Circle",
    "JVLR Junction", "Andheri West", "Bandra Node",
    "Worli Naka", "Chembur Naka", "Haji Ali"
  ],
  "Delhi": [
    "ITO Junction", "AIIMS Loop", "Dhaula Kuan",
    "Ashram Chowk", "Peeragarhi", "Kashmere Gate",
    "Lajpat Nagar", "Rajiv Chowk", "Moolchand"
  ],
  "Chennai": [
    "Kathipara", "Teynampet", "Madhya Kailash",
    "Tidel Park", "Anna Nagar", "Koyambedu",
    "Chromepet", "Guindy", "Velachery"
  ],
  "Hyderabad": [
    "Cyber Towers", "Mindspace", "Gachibowli",
    "Panjagutta", "Paradise", "Jubilee Post",
    "Kukatpally", "LB Nagar", "Charminar"
  ],
  "Kolkata": [
    "Park Street", "Esplanade", "Gariahat", 
    "Shyambazar", "Howrah Bridge", "Ultadanga", 
    "Science City", "Jadavpur", "New Town"
  ],

  // --- Tier 2 Cities ---
  "Pune": [
    "Univ. Circle", "Swargate", "Deccan Gym", 
    "Hinjewadi", "Magarpatta", "Yerwada", 
    "Bremen Chowk", "Chandni Chowk", "Koregaon Park"
  ],
  "Ahmedabad": [
    "SG Highway", "Kalupur", "Nehrunagar", 
    "Shivranjani", "IIM Road", "Income Tax", 
    "Paldi", "Gita Mandir", "Thaltej"
  ],
  "Jaipur": [
    "Ajmeri Gate", "MI Road", "Rambagh", 
    "Statue Circle", "Sindhi Camp", "Gopalpura", 
    "Tonk Road", "Raja Park", "Vaishali"
  ],
  "Lucknow": [
    "Hazratganj", "Charbagh", "Gomti Nagar", 
    "Polytechnic", "Munshipulia", "Alambagh", 
    "Aminabad", "Chowk", "Kapoorthala"
  ],
  "Chandigarh": [
    "Sector 17", "Tribune Chowk", "Aroma Light", 
    "Housing Board", "Matka Chowk", "Transport Lt", 
    "Piccadily", "Zirakpur", "Mohali"
  ],
  "Indore": [
    "Rajwada", "Palasia", "Vijay Nagar", 
    "56 Dukan", "Bhanwarkuan", "LIG Square", 
    "Geeta Bhawan", "Mhow Naka", "Regal Square"
  ],
  "Kochi": [
    "Edappally", "Vytilla", "MG Road", 
    "Marine Drive", "Kaloor", "Palarivattom", 
    "Kakkanad", "Fort Kochi", "Thevara"
  ],
  "Surat": [
    "Ring Road", "Athwa Lines", "Majura Gate", 
    "Udhna", "Parle Point", "Adajan", 
    "Varachha", "Dumas Road", "Piplod"
  ],
  "Nagpur": [
    "Sitabuldi", "Zero Mile", "Sadar", 
    "Dharampeth", "Medical Sq", "Variety Sq", 
    "Shankar Nagar", "RBI Square", "Mate Square"
  ],
  "Visakhapatnam": [
    "Jagadamba", "RK Beach", "Siripuram", 
    "Gajuwaka", "NAD Junction", "Maddilapalem", 
    "RTC Complex", "Satyam", "Gurudwara"
  ],
  "Patna": [
    "Dak Bunglow", "Gandhi Maidan", "Boring Road", 
    "Bailey Road", "Frazer Road", "Kankarbagh", 
    "Rajendra Ngr", "Saguna More", "Hartali Mor"
  ],
  "Bhopal": [
    "MP Nagar", "New Market", "Board Office", 
    "Jyoti Talkies", "Lal Ghati", "Habibganj", 
    "Bittan Market", "VIP Road", "10 Number"
  ],
  "Ludhiana": [
    "Clock Tower", "Chaura Bazar", "Ferozepur Rd", 
    "Gill Road", "Model Town", "Aarti Chowk", 
    "Samrala Chowk", "Jagraon Br", "PAU"
  ],
  "Agra": [
    "MG Road", "Sadar Bazar", "Bhagwan Tk", 
    "Sikandra", "Taj Ganj", "Sanjay Place", 
    "Khandari", "Water Works", "Bijli Ghar"
  ],
  "Vadodara": [
    "Alkapuri", "Race Course", "Mandvi", 
    "Genda Circle", "Chakli Circle", "Fatehgunj", 
    "Akota", "Karelibaug", "Old Padra"
  ],
  "Nashik": [
    "Dwarka Circle", "CBS", "College Road", 
    "Gangapur Rd", "Nashik Road", "Satpur", 
    "Indira Nagar", "Panchvati", "Mumbai Naka"
  ],
  "Coimbatore": [
    "Gandhipuram", "Ukkadam", "RS Puram", 
    "Avinashi Rd", "Lakshmi Mills", "Hope College", 
    "Singanallur", "Cross Cut", "Saibaba Col"
  ],
  "Kanpur": [
    "Meston Road", "Naveen Mkt", "Mall Road", 
    "Ghantaghar", "Rawatpur", "Kakadeo", 
    "Govind Nagar", "Parade", "Gwaltoli"
  ],
  "Varanasi": [
    "Godowlia", "Lanka", "Maidagin", 
    "Cantt Stn", "Sigra", "Rath Yatra", 
    "Girjaghar", "Ravindrapuri", "Durgakund"
  ],

  // --- Mini Towns / Tourist Hubs ---
  "Goa (Panjim)": [
    "MG Road", "Miramar", "Patto", 
    "Panjim Church", "Bambolim", "Dona Paula", 
    "Porvorim", "Mapusa", "Calangute"
  ],
  "Shimla": [
    "The Mall", "Victory Tunnel", "Lakkar Bazar", 
    "Sanjauli", "Chotta Shimla", "Lift Road", 
    "Cart Road", "Boileauganj", "Summer Hill"
  ],
  "Manali": [
    "Mall Road", "Aleo", "Old Manali", 
    "Vashisht", "Hadimba Rd", "Circuit House", 
    "Rangri", "Prini", "Jagatsukh"
  ],
  "Ooty": [
    "Charring Cross", "Commercial Rd", "Botanical Gdn", 
    "Rose Garden", "Boat House", "Fingerpost", 
    "Lovedale", "Coonoor Rd", "Dodabetta"
  ],
  "Pondicherry": [
    "White Town", "Promenade", "Mission St", 
    "Auroville Rd", "MG Road", "Bus Stand", 
    "Reddiarpalayam", "Lawspet", "Kalapet"
  ],
  "Rishikesh": [
    "Laxman Jhula", "Ram Jhula", "Tapovan", 
    "Triveni Ghat", "Natraj Chowk", "AIIMS Rd", 
    "Shivpuri", "Muni Ki Reti", "Swarg Ashram"
  ],
  "Udaipur": [
    "Chetak Circle", "Delhi Gate", "Fateh Sagar", 
    "Hiran Magri", "Surajpole", "Udiapole", 
    "Sukhadia", "Saheliyon", "City Palace"
  ],
  "Srinagar": [
    "Lal Chowk", "Dal Gate", "Residency Rd",
    "Boulevard Rd", "Jahangir Chowk", "Rajbagh",
    "Sonwar", "Hyderpora", "Nowhatta"
  ]
};
