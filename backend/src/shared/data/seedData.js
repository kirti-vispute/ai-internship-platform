const { USER_ROLES, COMPANY_VERIFICATION_STATUS, APPLICATION_STATUS } = require("../constants/enums");

module.exports = {
  users: [
    {
      email: "admin@internai.com",
      role: USER_ROLES.ADMIN,
      password: "Admin@123",
      adminRole: "super_admin"
    },
    { email: "intern1@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern2@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern3@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern4@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern5@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern6@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern7@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern8@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern9@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern10@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern11@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    { email: "intern12@example.com", role: USER_ROLES.INTERN, password: "Intern@123" },
    {
      email: "company1@example.com",
      role: USER_ROLES.COMPANY,
      password: "Company@123",
      companyAccountType: "owner"
    },
    {
      email: "company2@example.com",
      role: USER_ROLES.COMPANY,
      password: "Company@123",
      companyAccountType: "owner"
    },
    {
      email: "hr@novatech.example",
      role: USER_ROLES.COMPANY,
      password: "CompanyHr@123",
      companyAccountType: "hr",
      displayName: "NovaTech HR",
      linkedCompanyEmail: "company1@example.com"
    },
    {
      email: "ceo@novatech.example",
      role: USER_ROLES.COMPANY,
      password: "CompanyCeo@123",
      companyAccountType: "ceo",
      linkedCompanyEmail: "company1@example.com"
    },
    {
      email: "company3@example.com",
      role: USER_ROLES.COMPANY,
      password: "Company@123",
      companyAccountType: "owner"
    },
    {
      email: "company4@example.com",
      role: USER_ROLES.COMPANY,
      password: "Company@123",
      companyAccountType: "owner"
    },
    {
      email: "company5@example.com",
      role: USER_ROLES.COMPANY,
      password: "Company@123",
      companyAccountType: "owner"
    }
  ],
  internProfiles: [
    {
      fullName: "Aarav Sharma",
      email: "intern1@example.com",
      mobile: "9876543210",
      skills: ["javascript", "react", "node", "mongodb"],
      education: ["B.Tech CSE - ABC University"],
      projects: ["Built internship portal", "Created recommendation app"],
      certifications: ["Machine Learning Certification"],
      interests: ["ai", "machine learning"],
      completedCourses: ["Node.js Masterclass", "SQL Bootcamp"]
    },
    {
      fullName: "Isha Mehta",
      email: "intern2@example.com",
      mobile: "9898989898",
      skills: ["python", "sql", "data analysis"],
      education: ["BCA - XYZ College"],
      projects: ["Sales dashboard project"],
      certifications: ["Data Analytics Certification"]
    },
    {
      fullName: "Rohan Gupta",
      email: "intern3@example.com",
      mobile: "9811100001",
      skills: ["javascript", "react", "node"],
      education: ["B.Tech IT - Delhi Technical University"],
      projects: ["E-commerce storefront", "Chat app with sockets"],
      certifications: ["Full Stack Web Development Certification"]
    },
    {
      fullName: "Sneha Kapoor",
      email: "intern4@example.com",
      mobile: "9811100002",
      skills: ["python", "machine learning", "sql"],
      education: ["B.Tech CSE - Pune Institute of Technology"],
      projects: ["Sentiment analysis tool"],
      certifications: ["Applied Machine Learning Certification"]
    },
    {
      fullName: "Vikram Singh",
      email: "intern5@example.com",
      mobile: "9811100003",
      skills: ["selenium", "jest", "javascript"],
      education: ["BCA - Jaipur National University"],
      projects: ["Automated regression test suite"],
      certifications: ["Software Testing Certification"]
    },
    {
      fullName: "Ananya Iyer",
      email: "intern6@example.com",
      mobile: "9811100004",
      skills: ["python", "tensorflow", "deep learning"],
      education: ["M.Tech AI - IIT Madras"],
      projects: ["Image classification with CNNs"],
      certifications: ["Deep Learning Specialization"]
    },
    {
      fullName: "Karthik Reddy",
      email: "intern7@example.com",
      mobile: "9811100005",
      skills: ["javascript", "react", "node", "mongodb"],
      education: ["B.Tech CSE - Osmania University"],
      projects: ["Task management SaaS app"],
      certifications: ["MERN Stack Certification"]
    },
    {
      fullName: "Meera Joshi",
      email: "intern8@example.com",
      mobile: "9811100006",
      skills: ["python", "machine learning", "sql"],
      education: ["B.Sc Statistics - Fergusson College"],
      projects: ["Churn prediction model"],
      certifications: ["Data Science Certification"]
    },
    {
      fullName: "Aditya Kumar",
      email: "intern9@example.com",
      mobile: "9811100007",
      skills: ["selenium", "jest", "javascript"],
      education: ["B.Tech IT - VIT Vellore"],
      projects: ["API testing framework"],
      certifications: ["QA Automation Certification"]
    },
    {
      fullName: "Divya Nair",
      email: "intern10@example.com",
      mobile: "9811100008",
      skills: ["python", "tensorflow", "deep learning"],
      education: ["B.Tech CSE - Amrita University"],
      projects: ["Recommendation engine for e-commerce"],
      certifications: ["TensorFlow Developer Certificate"]
    },
    {
      fullName: "Rahul Verma",
      email: "intern11@example.com",
      mobile: "9811100009",
      skills: ["javascript", "react", "node", "mongodb"],
      education: ["B.Tech CSE - NIT Warangal"],
      projects: ["Internship platform clone", "Realtime chat app"],
      certifications: ["Full Stack Web Development Certification"]
    },
    {
      fullName: "Priya Desai",
      email: "intern12@example.com",
      mobile: "9811100010",
      skills: ["python", "machine learning", "sql"],
      education: ["B.Tech CSE - Gujarat Technological University"],
      projects: ["NLP based chatbot"],
      certifications: ["Machine Learning Certification"]
    }
  ],
  companyProfiles: [
    {
      companyName: "NovaTech",
      companyEmail: "company1@example.com",
      gst: "22AAAAA0000A1Z5",
      contactName: "Rohit Verma",
      phone: "9123456789",
      website: "https://novatech.example",
      address: "Bangalore",
      description: "AI product startup",
      verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
    },
    {
      companyName: "CloudNest",
      companyEmail: "company2@example.com",
      gst: "33BBBBB1111B1Z6",
      contactName: "Nisha Rao",
      phone: "9234567890",
      website: "https://cloudnest.example",
      address: "Hyderabad",
      description: "Cloud analytics company",
      verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
    },
    {
      companyName: "TechWave",
      companyEmail: "company3@example.com",
      gst: "44CCCCC2222C1Z7",
      contactName: "Karan Mehta",
      phone: "9345678901",
      website: "https://techwave.example",
      address: "Pune",
      description: "Web and mobile product studio",
      verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
    },
    {
      companyName: "DataForge",
      companyEmail: "company4@example.com",
      gst: "55DDDDD3333D1Z8",
      contactName: "Priya Nair",
      phone: "9456789012",
      website: "https://dataforge.example",
      address: "Bangalore",
      description: "Data engineering and analytics firm",
      verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
    },
    {
      companyName: "ByteBridge",
      companyEmail: "company5@example.com",
      gst: "66EEEEE4444E1Z9",
      contactName: "Arjun Malhotra",
      phone: "9567890123",
      website: "https://bytebridge.example",
      address: "Mumbai",
      description: "Design-led software consultancy",
      verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
    }
  ],
  internships: [
    {
      companyEmail: "company1@example.com",
      role: "AI Research Intern",
      skillsRequired: ["python", "machine learning", "sql"],
      prioritySkills: ["python", "machine learning"],
      stipend: "25000",
      duration: "6 months",
      location: "Remote",
      description: "Work on NLP and ranking models",
      assignToHrEmail: null
    },
    {
      companyEmail: "company1@example.com",
      role: "Full Stack Intern",
      skillsRequired: ["javascript", "react", "node", "mongodb"],
      prioritySkills: ["react", "node"],
      stipend: "20000",
      duration: "4 months",
      location: "Bangalore",
      description: "Build product features for internship platform",
      assignToHrEmail: "hr@novatech.example"
    },
    {
      companyEmail: "company1@example.com",
      role: "Machine Learning Intern",
      skillsRequired: ["python", "tensorflow", "deep learning"],
      prioritySkills: ["python", "tensorflow"],
      stipend: "27000",
      duration: "6 months",
      location: "Bangalore",
      mode: "on-site",
      internshipType: "Internship",
      description: "Train and evaluate ML models for recommendation systems",
      assignToHrEmail: null
    },
    {
      companyEmail: "company1@example.com",
      role: "QA Automation Intern",
      skillsRequired: ["selenium", "jest", "javascript"],
      prioritySkills: ["selenium"],
      stipend: "18000",
      duration: "3 months",
      location: "Remote",
      mode: "remote",
      internshipType: "Internship",
      description: "Build automated test suites for the platform",
      assignToHrEmail: "hr@novatech.example"
    },
    {
      companyEmail: "company2@example.com",
      role: "Cloud Support Intern",
      skillsRequired: ["aws", "azure", "networking"],
      prioritySkills: ["aws"],
      stipend: "22000",
      duration: "4 months",
      location: "Hyderabad",
      mode: "on-site",
      internshipType: "Internship",
      description: "Assist customers with cloud infrastructure setup and support",
      assignToHrEmail: null
    },
    {
      companyEmail: "company2@example.com",
      role: "Business Analyst Intern",
      skillsRequired: ["excel", "sql", "power bi"],
      prioritySkills: ["sql", "power bi"],
      stipend: "20000",
      duration: "3 months",
      location: "Hyderabad",
      mode: "hybrid",
      internshipType: "Job",
      description: "Analyze product usage data and build stakeholder reports",
      assignToHrEmail: null
    },
    {
      companyEmail: "company3@example.com",
      role: "Frontend Developer Intern",
      skillsRequired: ["react", "typescript", "css"],
      prioritySkills: ["react", "typescript"],
      stipend: "23000",
      duration: "5 months",
      location: "Remote",
      mode: "remote",
      internshipType: "Internship",
      description: "Build responsive UI components for client products",
      assignToHrEmail: null
    },
    {
      companyEmail: "company3@example.com",
      role: "Backend Developer Intern",
      skillsRequired: ["node", "express", "postgresql"],
      prioritySkills: ["node", "express"],
      stipend: "24000",
      duration: "5 months",
      location: "Pune",
      mode: "on-site",
      internshipType: "Job",
      description: "Design and maintain REST APIs for internal platforms",
      assignToHrEmail: null
    },
    {
      companyEmail: "company4@example.com",
      role: "Data Science Intern",
      skillsRequired: ["python", "pandas", "machine learning"],
      prioritySkills: ["python", "pandas"],
      stipend: "26000",
      duration: "6 months",
      location: "Remote",
      mode: "remote",
      internshipType: "Internship",
      description: "Analyze large datasets and build predictive models",
      assignToHrEmail: null
    },
    {
      companyEmail: "company4@example.com",
      role: "DevOps Intern",
      skillsRequired: ["docker", "kubernetes", "aws"],
      prioritySkills: ["docker", "kubernetes"],
      stipend: "25000",
      duration: "4 months",
      location: "Bangalore",
      mode: "on-site",
      internshipType: "Job",
      description: "Manage CI/CD pipelines and container orchestration",
      assignToHrEmail: null
    },
    {
      companyEmail: "company5@example.com",
      role: "Mobile App Intern",
      skillsRequired: ["flutter", "dart", "firebase"],
      prioritySkills: ["flutter", "dart"],
      stipend: "21000",
      duration: "4 months",
      location: "Mumbai",
      mode: "hybrid",
      internshipType: "Internship",
      description: "Develop and ship features for cross-platform mobile apps",
      assignToHrEmail: null
    },
    {
      companyEmail: "company5@example.com",
      role: "UI/UX Design Intern",
      skillsRequired: ["figma", "design systems", "prototyping"],
      prioritySkills: ["figma"],
      stipend: "19000",
      duration: "3 months",
      location: "Remote",
      mode: "remote",
      internshipType: "Internship",
      description: "Design user flows and interactive prototypes for new features",
      assignToHrEmail: null
    }
  ],
  applications: [
    {
      internEmail: "intern1@example.com",
      internshipRole: "Full Stack Intern",
      status: APPLICATION_STATUS.SHORTLISTED,
      matchScore: 92,
      hrFeedback: [{ feedback: "Strong React fundamentals" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern3@example.com",
      internshipRole: "Full Stack Intern",
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 68,
      hrFeedback: [],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern4@example.com",
      internshipRole: "AI Research Intern",
      status: APPLICATION_STATUS.SCREENING,
      matchScore: 74,
      hrFeedback: [{ feedback: "Reviewing ML project portfolio" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern5@example.com",
      internshipRole: "QA Automation Intern",
      status: APPLICATION_STATUS.SHORTLISTED,
      matchScore: 81,
      hrFeedback: [{ feedback: "Good grasp of test automation" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern6@example.com",
      internshipRole: "Machine Learning Intern",
      status: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
      matchScore: 88,
      hrFeedback: [{ feedback: "Shortlisted for first-round interview" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern7@example.com",
      internshipRole: "Full Stack Intern",
      status: APPLICATION_STATUS.TECHNICAL_ROUND,
      matchScore: 85,
      hrFeedback: [{ feedback: "Cleared screening, strong in DSA round" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern8@example.com",
      internshipRole: "AI Research Intern",
      status: APPLICATION_STATUS.HR_ROUND,
      matchScore: 79,
      hrFeedback: [{ feedback: "Cleared technical round, HR discussion pending" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern9@example.com",
      internshipRole: "QA Automation Intern",
      status: APPLICATION_STATUS.ON_HOLD,
      matchScore: 63,
      hrFeedback: [{ feedback: "Position on hold pending headcount approval" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern10@example.com",
      internshipRole: "Machine Learning Intern",
      status: APPLICATION_STATUS.OFFERED,
      matchScore: 94,
      hrFeedback: [{ feedback: "Offer extended, awaiting response" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern11@example.com",
      internshipRole: "Full Stack Intern",
      status: APPLICATION_STATUS.SELECTED,
      matchScore: 96,
      hrFeedback: [{ feedback: "Offer accepted, onboarding in progress" }],
      assignToHrEmail: "hr@novatech.example"
    },
    {
      internEmail: "intern12@example.com",
      internshipRole: "AI Research Intern",
      status: APPLICATION_STATUS.REJECTED,
      matchScore: 52,
      hrFeedback: [{ feedback: "Skill gap in core ML concepts" }],
      assignToHrEmail: "hr@novatech.example"
    }
  ]
};
