/**
 * Adds the 25 real internships/jobs from docs/scraped-internships-engineering.md
 * to the live database so they show up on the public /internships page.
 *
 * Additive only — does NOT touch existing seeded demo data. Safe to re-run:
 * skips any listing whose (role + company name) pair already exists.
 *
 * Usage: node backend/scripts/seed-scraped-internships.js
 */
require("dotenv").config();

const connectDB = require("../src/shared/database/db");
const User = require("../src/models/User");
const CompanyProfile = require("../src/models/CompanyProfile");
const Internship = require("../src/models/Internship");
const { hashPassword } = require("../src/shared/utils/password");
const { USER_ROLES, COMPANY_VERIFICATION_STATUS } = require("../src/constants/enums");

const PLACEHOLDER_PASSWORD = "ScrapedCo@123";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
}

function inferMode(location) {
  const text = location.toLowerCase();
  if (text.includes("hybrid")) return "hybrid";
  if (text.includes("work from home") || text.includes("remote")) return "remote";
  return "on-site";
}

// company: display name used for CompanyProfile.companyName
// role, location, stipend, duration, skills, description, source, url as gathered
const LISTINGS = [
  // -- Internshala --
  {
    company: "Senso Vision System",
    role: "Research and Development",
    location: "Bangalore",
    stipend: "₹5,000 – 10,000 /month",
    duration: "3 Months",
    skillsRequired: ["Raspberry Pi", "Control systems", "Arduino"],
    description:
      "Apply knowledge of motors, sensors, cameras, and related technologies to design and develop innovative solutions for various applications. Collaborate closely with cross-functional teams to understand project requirements and contribute to the development of effective solutions. Work on Arduino-based projects and microcontroller programming for product development and prototyping. Develop and implement control systems for automation and product functionality. Integrate and work with various sensors (proximity, vision, temperature, pressure, etc.) for system applications.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/research-and-development-internship-in-bangalore-at-senso-vision-system1787284962"
  },
  {
    company: "Aawas Yojana",
    role: "Flutter Development",
    location: "Dehradun, Uttarakhand (Hybrid)",
    stipend: "₹5,000 – 8,000 /month",
    duration: "2 Months",
    skillsRequired: ["Flutter", "REST API", "Dart", "iOS", "Android", "Firebase", "Cloud Firestore"],
    description:
      "Develop and maintain mobile applications using Flutter for both iOS and Android platforms. Implement REST API integration to fetch data and communicate with external services. Utilize Dart programming language to write clean and efficient code for app development. Integrate Firebase services such as authentication, cloud messaging, and analytics into the app. Store and retrieve data using Cloud Firestore to ensure seamless data management in the app.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/flutter-development-internship-in-multiple-locations-at-aawas-yojana1787741204"
  },
  {
    company: "Growify Digital",
    role: "Shopify Developer And Maintenance",
    location: "Delhi",
    stipend: "₹15,000 /month",
    duration: "6 Months",
    skillsRequired: ["HTML", "CSS", "JavaScript", "Shopify", "Debugging"],
    description:
      "Monitor live Shopify stores for bugs, broken links, layout issues, and checkout errors; resolve or escalate issues promptly. Perform routine website maintenance, including theme updates, app updates, page edits, and content/product uploads. Customize Shopify and Shopify Plus themes using Liquid, HTML, CSS, and JavaScript. Assist with integrating third-party apps and tools, including payment gateways and marketing platforms.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/shopify-developer-and-maintenance-internship-in-delhi-at-growify-digital1787824784"
  },
  {
    company: "Novum Labs",
    role: "Artificial Intelligence (Teaching & Technical)",
    location: "Kolkata",
    stipend: "₹10,000 – 13,000 /month",
    duration: "3 Months",
    skillsRequired: ["Python", "Data Structures", "Machine Learning", "Data Science", "Neural Networks", "NLP", "Deep Learning"],
    description:
      "Assist in teaching and mentoring students in computer science, artificial intelligence, and data science. Collaborate with senior AI developers to design and implement machine learning algorithms. Assist in the development and deployment of AI models for various applications. Analyze and process large datasets to extract valuable insights for decision-making. Work on NLP projects to enhance language understanding and text processing capabilities.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/artificial-intelligence-teaching-technical-internship-in-kolkata-at-novum-labs1787743962"
  },
  {
    company: "Smollan India",
    role: "Web Scraping",
    location: "Work from home",
    stipend: "₹13,000 – 15,000 /month",
    duration: "3 Months",
    skillsRequired: ["HTML", "Python", "Selenium", "BeautifulSoup", "XPATH"],
    description:
      "Develop automated scrapers: build end-to-end data extraction pipelines using Python and Playwright (Sync & Async). Implement advanced evasion techniques, including proxy management, User-Agent rotation, and stealth browser configurations. Proactively monitor and fix scrapers when target websites change their UI or security protocols. Optimize browser resource usage and execution speed for large-scale crawling.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/work-from-home-web-scraping-internship-at-smollan-india1786527587"
  },
  {
    company: "Finflock Systems Private Limited",
    role: "Database Engineer (WFH)",
    location: "Work from home",
    stipend: "₹14,000 – 18,000 /month (Fixed ₹12,000–14,000 + incentive ₹2,000–4,000)",
    duration: "6 Months",
    skillsRequired: ["Ansible", "Bash", "Docker", "Kubernetes", "Linux", "Networking", "PostgreSQL", "Python", "SQL", "System Design", "Terraform", "Unix"],
    description:
      "Assist in PostgreSQL schema design, normalization/denormalization, and partitioning strategies. Support query optimization using EXPLAIN (ANALYZE, BUFFERS) and indexing techniques. Operate and troubleshoot Linux/Unix servers. Configure networking, including TCP/IP, routing, DNS, and firewalling. Contribute to monitoring stacks using Prometheus, Grafana, and pg_stat views. Join on-call rotations, narrate incidents end-to-end, and support root cause analysis.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/work-from-home-database-engineer-internship-at-finflock-systems-private-limited1787823816"
  },
  {
    company: "Gateway Software Solutions",
    role: "Python Development (Part Time)",
    location: "Chennai, Coimbatore, Erode, Madurai, Sivakasi (Hybrid)",
    stipend: "₹7,500 – 12,500 /month (Fixed ₹5,000–7,500 + incentive ₹2,500–5,000)",
    duration: "6 Months, Part Time",
    skillsRequired: ["CSS", "Django", "HTML", "MySQL", "Python"],
    description:
      "Collaborate with the development team to design and implement new features for our software solutions. Write clean, efficient, and maintainable code using Python and Django frameworks. Assist in troubleshooting and debugging issues to ensure seamless performance of our applications. Utilize MySQL to manage database systems and optimize data retrieval processes.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/python-development-internship-in-multiple-locations-at-gateway-software-solutions1787736259"
  },
  {
    company: "Hubnine India Private Limited",
    role: "AI Robotics/ML Research Engineer (WFH)",
    location: "Work from home",
    stipend: "₹7,000 – 12,000 /month",
    duration: "6 Months",
    skillsRequired: ["Arduino", "Artificial Intelligence", "C++ Programming", "Embedded Systems", "Machine Learning", "MATLAB", "Python", "PyTorch", "Robotics"],
    description:
      "Build and experiment with robotics and embedded systems using Arduino, ESP32, STM32, Raspberry Pi, and NVIDIA Jetson. Develop robotics software using Python, C, and C++. Work with ROS / ROS 2 and robotics simulation environments. Build and test robot control systems, motion control, and real-time control loops. Explore and deploy VLA and robot foundation models such as OpenVLA, SmolVLA, GR00T.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/work-from-home-ai-robotics-ml-research-engineer-internship-at-hubnine-india-private-limited1787737270"
  },
  {
    company: "UNIO Labs",
    role: "IoT Field Application Engineer",
    location: "Delhi, Gurgaon, Greater Noida, Noida (Hybrid)",
    stipend: "₹5,000 – 10,000 /month (Fixed ₹4,000–6,000 + incentive ₹1,000–4,000)",
    duration: "3 Months",
    skillsRequired: ["ARM Microcontroller", "Computer skills", "ESP32", "Internet of Things (IoT)", "Networking", "Soldering", "Troubleshooting"],
    description:
      "Visit deployed IoT systems across Delhi/NCR for inspection and troubleshooting. Diagnose hardware, sensor, power supply, wiring, communication, and connectivity issues. Perform soldering, desoldering, connector replacement, wire termination, and minor PCB-level repairs. Flash, update, and verify firmware on ESP32, Arduino, and similar microcontroller-based devices. Not a software-only or work-from-home internship — involves physical field visits.",
    source: "Internshala",
    hrContact: "https://internshala.com/internship/detail/iot-field-application-engineer-internship-in-multiple-locations-at-unio-labs1787745835"
  },
  // -- Unstop --
  {
    company: "Learntricks Edutech",
    role: "Data Analyst Internship",
    location: "Work from Home",
    stipend: "₹15,000 – 17,000 /month",
    duration: "Part Time",
    skillsRequired: ["Data Analysis", "Reporting and Analysis", "Data Analysis Tools", "Exploratory Data Analysis (EDA)"],
    description:
      "Perform basic exploratory data analysis (EDA) to identify patterns and insights. Create simple visualizations, charts, and dashboards to present findings. Support the team in preparing data-driven reports and presentations. Research industry trends, tools, and best practices in data analysis. Assist in using and improving internal data analysis tools and workflows.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/data-analyst-internship-unstop-tech-fair-20-learntricks-edutech-1743489"
  },
  {
    company: "Kukbit SL",
    role: "VLSI Design Internship",
    location: "Work from Home",
    stipend: "₹20,000 – 25,000 /month",
    duration: "Part Time",
    skillsRequired: ["Electronic Design Automation (EDA)", "SystemVerilog", "Verilog"],
    description:
      "Assist in the design and verification of complex integrated circuits (ICs). Learn and apply industry-standard EDA tools for VLSI design. Participate in the development of RTL (Register Transfer Level) code. Support the creation and execution of test benches for functional verification. Collaborate with senior engineers on layout design and physical verification tasks.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/vlsi-design-internship-kukbit-sl-1737771"
  },
  {
    company: "Kukbit SL",
    role: "AI/ML Internship",
    location: "Work from Home",
    stipend: "₹12,000 – 15,000 /month",
    duration: "Part Time",
    skillsRequired: ["Artificial Intelligence (AI)", "Machine Learning Optimization", "AI Research", "Machine Learning Engineering", "Applied AI"],
    description:
      "Assist in the development and implementation of AI and ML models. Participate in data collection, cleaning, and preprocessing tasks. Conduct research on the latest trends and advancements in AI/ML. Collaborate with the team to analyze data and identify patterns. Contribute to the design and testing of AI-powered solutions.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/aiml-internship-kukbit-sl-1741846"
  },
  {
    company: "Vidbow",
    role: "System Architecture & Technical Engineering Internship",
    location: "Work from Home",
    stipend: "Not disclosed",
    duration: "Part Time",
    skillsRequired: ["Database Design", "SQL", "System Architecture", "Platform Engineering", "Software Development"],
    description:
      "Assist in modular system design and development. Contribute to defining API contracts and REST architecture. Participate in database schema planning for both SQL and NoSQL environments. Engage in GitHub pull request (PR) reviews to ensure code quality. Support code hygiene governance and best practices.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/system-architecture-technical-engineering-intern-vidbow-1745104"
  },
  {
    company: "Kiran Foundation",
    role: "React Native Internship",
    location: "Work from Home",
    stipend: "Not disclosed (listing URL slug includes \"unpaid\")",
    duration: "Part Time",
    skillsRequired: ["React.js", "Communication Skills", "JavaScript"],
    description:
      "Develop and enhance mobile application features using React Native. Build responsive and user-friendly mobile interfaces. Collaborate with designers and developers in an agile environment. Debug, test, and optimize application performance. Requirements: basic knowledge of React.js and React Native, familiarity with JavaScript or TypeScript.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/react-native-internship-remote-unpaid-kiran-foundation-1745285"
  },
  {
    company: "siriyon enterprises",
    role: "Web Development & UI/UX Design Internship",
    location: "Work from Home",
    stipend: "₹3,000 /month",
    duration: "6 months, Full Time",
    skillsRequired: ["Visual Design Principles", "Graphic Design Tools", "UI/UX Design", "Web Development"],
    description:
      "Collaborate with the web development and UI/UX design teams. Contribute to end-to-end product development. Assist in the design and development of web applications. Gain experience in graphic design within the product development lifecycle.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/web-development-uiux-design-intern-siriyon-enterprises-1745336"
  },
  {
    company: "RuruVerse Studio Pvt. Ltd. (Peblo)",
    role: "Full-Stack Platform Engineer Internship (Python + React + DevOps)",
    location: "Work from Home",
    stipend: "₹12,000 – 15,000 /month",
    duration: "Full Time",
    skillsRequired: ["DevOps", "Platform Engineering", "Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker"],
    description:
      "Peblo is an AI-powered learning app for Indian children in Classes 1-5. Build and extend FastAPI services across all five product modes — content catalogues, quiz/question pipelines, publishing jobs, entitlements, webhooks. Own and enhance the internal admin portal. Complete the Azure Container Apps to GCP Cloud Run migration with a staging-to-production pipeline. Must have: 1 year of production software engineering experience, primary depth in Python (FastAPI/Django/Flask), working competence in React/TypeScript, strong PostgreSQL expertise, Docker proficiency. Note: the listing's own eligibility tag says \"Fresher / No prior experience required\", which conflicts with the 1-year-experience requirement stated in the description — flagged as an inconsistency on the source page.",
    source: "Unstop",
    hrContact: "https://unstop.com/internships/full-stack-platform-engineer-internshippython-react-devops-ruruverse-studio-pvt-ltd-peblo-1745118"
  },
  // -- Wellfound --
  {
    company: "Oklo",
    role: "Software Engineer (Applied AI/ML)",
    location: "Remote (United States) • Santa Clara",
    stipend: "$200,000 – $250,000 /year",
    duration: "Full Time",
    skillsRequired: ["Python", "Git", "CI/CD", "Rust", "TypeScript", "Svelte"],
    description:
      "Oklo is pioneering the next generation of nuclear reactors. Invent and implement practical LLM-based workflows to accelerate engineering processes. Design, implement, deploy and maintain production machine learning models for the design and analysis of nuclear systems. Develop surrogate models for use in real-time digital twins. Minimum qualifications: Bachelor's degree in Computer Science, Electrical Engineering, Math, Physics, or equivalent; Python fluency; CI/CD pipelining; Git proficiency; physics-informed machine learning experience.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4617952-software-engineer-applied-ai-ml"
  },
  {
    company: "YipitData",
    role: "Senior Software Engineer (Cloud Infrastructure)",
    location: "Remote (Everywhere, East Coast hours)",
    stipend: "$168,000 – $194,000 /year",
    duration: "Full Time",
    skillsRequired: ["AWS", "Kubernetes", "Terraform", "Databricks", "Cloudflare", "Datadog"],
    description:
      "Help modernize, scale, and operate the shared cloud infrastructure powering YipitData's data-intensive products. Design, build, and operate shared cloud infrastructure using AWS, Kubernetes, Terraform, Databricks, and Cloudflare. Deliver SRE and DevOps initiatives that improve reliability, scalability, observability, and deployment safety. Requirements: 4+ years of relevant software, infrastructure, SRE, platform engineering, or DevOps experience with hands-on production experience on AWS, Kubernetes, Datadog, Databricks, and Terraform.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4627451-senior-software-engineer-cloud-infrastructure"
  },
  {
    company: "StepSecurity",
    role: "Software Engineer",
    location: "Remote (India)",
    stipend: "Not listed (early-stage equity/benefits)",
    duration: "Full Time",
    skillsRequired: ["Go", "Golang", "AWS"],
    description:
      "StepSecurity prevents, detects, and responds to software supply chain attacks by analyzing behavior across the full software development lifecycle for both developers and AI coding agents. Design and build backend services in Golang that power the supply chain security platform. Build scalable, fault-tolerant systems. What we're looking for: 2-5 years of experience with strong engineering fundamentals, Golang backend programming experience, background working with AWS, Azure, or GCP, prior early-stage startup experience.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4566107-software-engineer"
  },
  {
    company: "Venura.ai",
    role: "Software Engineer Intern",
    location: "Remote (Everywhere) • San Francisco Bay Area",
    stipend: "$5,000 – $15,000, No equity",
    duration: "Internship",
    skillsRequired: ["Python", "Flask", "NoSQL", "Node.js", "Flutter"],
    description:
      "Help build and extend an edtech platform. Looking for someone with solid knowledge of infra and agentic engineering, to work on mobile/edge platform engineering or handling growing load. Skills needed: Python Flask, NoSQL databases, caches, Node.js, Flutter, and other cloud technologies.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4609996-software-engineer-clone"
  },
  {
    company: "LeafLink",
    role: "Staff Data Engineer",
    location: "Remote (Everywhere)",
    stipend: "$170,000 – $230,000 /year",
    duration: "Full Time",
    skillsRequired: ["Airflow", "dbt", "Python", "SQL", "Fivetran", "Redshift", "Sigma", "AWS Lambda"],
    description:
      "Lead the evolution of LeafLink's data platform and analytics infrastructure. Design and lead development of scalable data pipelines using Airflow, dbt, and Python. Guide architecture and evolution of the company data platform. Build integrations across modern data stack tools including Fivetran, Redshift, and Sigma. Requirements: 8+ years of experience building production data pipelines and analytics infrastructure, strong SQL and Python experience.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4523685-staff-data-engineer"
  },
  {
    company: "Topsort",
    role: "Software Engineer, Integrations",
    location: "Remote (Bogota, Mexico City, Latin America) • Santiago",
    stipend: "$25,000 – $75,000 /year + 0.01%-0.1% equity",
    duration: "Full Time",
    skillsRequired: ["OAuth", "JSON/XML", "RESTful API"],
    description:
      "Topsort builds privacy-first, cookie-free retail media and ad infrastructure. Hands-on, client-facing role translating real-world business needs into scalable product solutions. Collaborate directly with sales, product, and engineering teams to support pre-sales conversations, understand customer pain points, and lead technical integrations.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/3208453-2-software-engineer-integrations"
  },
  {
    company: "Backpack",
    role: "Founding Backend Engineer",
    location: "Remote (Boston, Philadelphia, Seattle, San Francisco, Salt Lake City) • Austin, NYC",
    stipend: "$170,000 – $220,000 /year + 0.1%-0.5% equity",
    duration: "Full Time",
    skillsRequired: ["Payments", "AWS", "CI/CD"],
    description:
      "Backpack is building the financial infrastructure for the $1.8 Trillion higher education market. Own and evolve the core systems that power Backpack — the payment engine, platform APIs, and underlying infrastructure. Architect a modern financial infrastructure for external payments in higher education. Build and maintain critical infrastructure: payments, storage, networking, security, and observability systems. Own core banking infrastructure including direct integrations with the Federal Reserve and real-time payment networks.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4395939-founding-backend-engineer"
  },
  {
    company: "Finthos",
    role: "Fintech Data Engineer",
    location: "Remote (Boston, San Francisco, Massachusetts, New Hampshire, Rhode Island, SF Bay Area)",
    stipend: "$130,000 – $150,000 /year + 0.5%-1.0% equity",
    duration: "Full Time",
    skillsRequired: ["Data Analysis", "AI", "REST APIs", "CI/CD", "PostgreSQL", "Supabase", "Python", "TypeScript"],
    description:
      "Finthos is an Agentic AI Operating System for family offices managing $100M-$5B+ in assets. Build custodian data pipelines ingesting and normalizing feeds from Plaid, bLink, Tarabut, and other institutional data sources. Multi-format data normalization and entity resolution across custodians into a clean, unified asset model. Requirements: 5+ years building production data pipelines, financial services or fintech experience, strong SQL and PostgreSQL experience. US-based, US citizen or green card holder, no visa sponsorship.",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4574728-fintech-data-engineer-finthos"
  },
  {
    company: "TILT Autonomy",
    role: "Autonomy Software Engineer",
    location: "Remote (Australia, United States) • Annapolis, MD",
    stipend: "$100,000 – $180,000 /year",
    duration: "Full Time",
    skillsRequired: ["C++", "C", "Lua", "ArduPilot"],
    description:
      "TILT Autonomy builds autonomy hardware and software for uncrewed aircraft and surface vessels. Write autonomy software that runs on aircraft and vessels — embedded and real-time code close to the hardware, control and estimation logic. Build and tune control, guidance, and state-estimation logic, validated in sim and on hardware. Integrate sensors, actuators, and comms. Must have: strong C++ and/or C, comfort on embedded/real-time/Linux targets, U.S. citizenship or permanent residency (no visa sponsorship).",
    source: "Wellfound",
    hrContact: "https://wellfound.com/jobs/4572890-autonomy-software-engineer"
  }
];

async function seedScrapedInternships() {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const listing of LISTINGS) {
    const existingCompany = await CompanyProfile.findOne({ companyName: listing.company });
    const existingInternship = existingCompany
      ? await Internship.findOne({ company: existingCompany._id, role: listing.role })
      : null;

    if (existingInternship) {
      skipped += 1;
      continue;
    }

    let company = existingCompany;
    if (!company) {
      const slug = slugify(listing.company);
      const email = `${slug || "company"}.scraped@internai-demo.com`;

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          role: USER_ROLES.COMPANY,
          passwordHash: await hashPassword(PLACEHOLDER_PASSWORD),
          companyAccountType: "owner"
        });
      }

      company = await CompanyProfile.create({
        user: user._id,
        companyName: listing.company,
        companyEmail: email,
        gst: `29SCRPD${String(created + 1).padStart(4, "0")}Z${(created % 9) + 1}`,
        contactName: "Hiring Team",
        phone: "9000000000",
        website: "",
        address: listing.location,
        description: `${listing.company} — listing sourced from ${listing.source} on 2026-08-27/28. See docs/scraped-internships-engineering.md for the full gathering notes.`,
        verificationStatus: COMPANY_VERIFICATION_STATUS.VERIFIED
      });
    }

    await Internship.create({
      company: company._id,
      role: listing.role,
      skillsRequired: listing.skillsRequired,
      prioritySkills: listing.skillsRequired.slice(0, 3),
      stipend: listing.stipend,
      duration: listing.duration,
      location: listing.location,
      mode: inferMode(listing.location),
      description: listing.description,
      hrContact: listing.hrContact,
      additionalInstructions: `Sourced from ${listing.source}. Original posting: ${listing.hrContact}`
    });

    created += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Scraped internships seed complete. Created ${created}, skipped ${skipped} (already present).`);
  process.exit(0);
}

seedScrapedInternships().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Scraped internships seed failed", error);
  process.exit(1);
});
