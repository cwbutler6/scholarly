import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const sampleOccupations = [
  {
    id: "15-1252.00",
    title: "Software Developers",
    description:
      "Software Engineers apply engineering principles to the design, development, maintenance, testing, and evaluation of computer software. They are the architects behind the digital world, creating everything from mobile apps to enterprise operating systems.",
    category: "Technology",
    education: "Bachelor's in CS or Bootcamp",
    jobZone: 4,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 6,
    riasecArtistic: 4,
    riasecSocial: 2,
    riasecEnterprising: 3,
    riasecConventional: 4,
    medianWage: 85000,
    medianWageHigh: 170000,
    jobGrowth: "22",
    totalEmployment: 1795300,
  },
  {
    id: "29-1141.00",
    title: "Registered Nurses",
    description:
      "Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records.",
    category: "Healthcare",
    education: "Bachelor's in Nursing",
    jobZone: 3,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 3,
    riasecInvestigative: 4,
    riasecArtistic: 1,
    riasecSocial: 6,
    riasecEnterprising: 2,
    riasecConventional: 4,
    medianWage: 65000,
    medianWageHigh: 120000,
    jobGrowth: "12",
    totalEmployment: 3175390,
  },
  {
    id: "27-1024.00",
    title: "Graphic Designers",
    description:
      "Design or create graphics to meet specific commercial or promotional needs, such as packaging, displays, or logos.",
    category: "Design",
    education: "Bachelor's in Design",
    jobZone: 3,
    brightOutlook: false,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 2,
    riasecArtistic: 6,
    riasecSocial: 2,
    riasecEnterprising: 4,
    riasecConventional: 3,
    medianWage: 45000,
    medianWageHigh: 90000,
    jobGrowth: "3",
    totalEmployment: 264800,
  },
  {
    id: "25-2021.00",
    title: "Elementary School Teachers",
    description:
      "Teach academic and social skills to students at the elementary school level, preparing them for future academic success.",
    category: "Education",
    education: "Bachelor's in Education",
    jobZone: 4,
    brightOutlook: false,
    greenOccupation: false,
    riasecRealistic: 1,
    riasecInvestigative: 3,
    riasecArtistic: 4,
    riasecSocial: 6,
    riasecEnterprising: 3,
    riasecConventional: 3,
    medianWage: 50000,
    medianWageHigh: 85000,
    jobGrowth: "4",
    totalEmployment: 1395830,
  },
  {
    id: "11-1021.00",
    title: "General and Operations Managers",
    description:
      "Plan, direct, or coordinate the operations of public or private sector organizations, overseeing multiple departments.",
    category: "Business",
    education: "Bachelor's in Business",
    jobZone: 4,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 3,
    riasecArtistic: 1,
    riasecSocial: 4,
    riasecEnterprising: 6,
    riasecConventional: 4,
    medianWage: 80000,
    medianWageHigh: 150000,
    jobGrowth: "8",
    totalEmployment: 3011570,
  },
  {
    id: "47-2111.00",
    title: "Electricians",
    description:
      "Install, maintain, and repair electrical wiring, equipment, and fixtures in residential, commercial, and industrial settings.",
    category: "Trades",
    education: "Apprenticeship",
    jobZone: 3,
    brightOutlook: true,
    greenOccupation: true,
    riasecRealistic: 6,
    riasecInvestigative: 3,
    riasecArtistic: 1,
    riasecSocial: 2,
    riasecEnterprising: 3,
    riasecConventional: 3,
    medianWage: 50000,
    medianWageHigh: 100000,
    jobGrowth: "11",
    totalEmployment: 726200,
  },
];

const occupationSkills: Record<string, { technical: string[]; soft: string[] }> = {
  "15-1252.00": {
    technical: ["JavaScript", "Python", "Java", "C++", "React", "Node.js", "SQL", "Git", "Docker", "AWS", "TypeScript", "REST APIs", "GraphQL", "MongoDB", "PostgreSQL", "Redis", "Kubernetes", "CI/CD", "Testing", "Agile"],
    soft: ["Problem Solving", "Communication", "Teamwork", "Critical Thinking", "Time Management", "Adaptability", "Attention to Detail", "Creativity", "Leadership", "Continuous Learning"],
  },
  "29-1141.00": {
    technical: ["Patient Assessment", "Medication Administration", "IV Therapy", "Wound Care", "Electronic Health Records", "Vital Signs Monitoring", "CPR/BLS", "Patient Education", "Care Planning", "Medical Equipment"],
    soft: ["Empathy", "Communication", "Attention to Detail", "Critical Thinking", "Stress Management", "Teamwork", "Patience", "Compassion", "Decision Making", "Adaptability"],
  },
  "27-1024.00": {
    technical: ["Adobe Photoshop", "Adobe Illustrator", "Figma", "Sketch", "InDesign", "Typography", "Color Theory", "Layout Design", "Branding", "UI/UX Design", "Motion Graphics", "Print Design", "Web Design"],
    soft: ["Creativity", "Communication", "Attention to Detail", "Time Management", "Collaboration", "Adaptability", "Problem Solving", "Client Management", "Presentation Skills"],
  },
  "25-2021.00": {
    technical: ["Curriculum Development", "Lesson Planning", "Classroom Management", "Assessment Design", "Educational Technology", "Differentiated Instruction", "Special Education", "Parent Communication", "Student Progress Tracking"],
    soft: ["Patience", "Communication", "Creativity", "Organization", "Empathy", "Leadership", "Adaptability", "Conflict Resolution", "Cultural Sensitivity", "Enthusiasm"],
  },
  "11-1021.00": {
    technical: ["Strategic Planning", "Budget Management", "Project Management", "Data Analysis", "Performance Metrics", "Process Improvement", "Risk Management", "Vendor Relations", "Compliance", "ERP Systems"],
    soft: ["Leadership", "Communication", "Decision Making", "Problem Solving", "Negotiation", "Team Building", "Strategic Thinking", "Time Management", "Delegation", "Conflict Resolution"],
  },
  "47-2111.00": {
    technical: ["Electrical Wiring", "Circuit Installation", "Code Compliance", "Blueprint Reading", "Troubleshooting", "Safety Protocols", "Power Tools", "PLC Programming", "Testing Equipment", "Conduit Bending"],
    soft: ["Attention to Detail", "Problem Solving", "Physical Stamina", "Communication", "Safety Awareness", "Time Management", "Customer Service", "Reliability", "Teamwork"],
  },
};

const occupationAbilities: Record<string, string[]> = {
  "15-1252.00": ["Debugging", "Code Review", "System Design", "Database Design", "API Design", "Performance Optimization", "Security Best Practices", "Technical Writing", "Troubleshooting", "Architecture Planning", "Refactoring", "Testing & QA"],
  "29-1141.00": ["Clinical Reasoning", "Patient Advocacy", "Emergency Response", "Health Education", "Team Coordination", "Documentation", "Quality Assurance", "Resource Management", "Cultural Competence", "Infection Control"],
  "27-1024.00": ["Visual Storytelling", "Brand Development", "Creative Direction", "Photo Editing", "Concept Development", "Client Presentation", "Design Systems", "Prototyping", "User Research", "Asset Management"],
  "25-2021.00": ["Student Engagement", "Academic Assessment", "Behavior Management", "Learning Environment", "Parent Relations", "Professional Development", "Cross-Curricular Integration", "Student Counseling", "Event Planning"],
  "11-1021.00": ["Organizational Development", "Change Management", "Financial Analysis", "Stakeholder Management", "Policy Development", "Talent Management", "Business Development", "Crisis Management", "Reporting", "Quality Control"],
  "47-2111.00": ["Electrical Inspection", "Load Calculation", "System Upgrade", "Preventive Maintenance", "Equipment Installation", "Wiring Diagnosis", "Energy Efficiency", "Project Estimation", "Permit Acquisition"],
};

const masterSkills: { name: string; category: string }[] = [
  // O*NET Basic Skills
  { name: "Active Learning", category: "onet_skill" },
  { name: "Active Listening", category: "onet_skill" },
  { name: "Critical Thinking", category: "onet_skill" },
  { name: "Learning Strategies", category: "onet_skill" },
  { name: "Mathematics", category: "onet_skill" },
  { name: "Monitoring", category: "onet_skill" },
  { name: "Reading Comprehension", category: "onet_skill" },
  { name: "Science", category: "onet_skill" },
  { name: "Speaking", category: "onet_skill" },
  { name: "Writing", category: "onet_skill" },

  // O*NET Social Skills
  { name: "Coordination", category: "onet_skill" },
  { name: "Instructing", category: "onet_skill" },
  { name: "Negotiation", category: "onet_skill" },
  { name: "Persuasion", category: "onet_skill" },
  { name: "Service Orientation", category: "onet_skill" },
  { name: "Social Perceptiveness", category: "onet_skill" },

  // O*NET Complex Problem Solving Skills
  { name: "Complex Problem Solving", category: "onet_skill" },

  // O*NET Technical Skills
  { name: "Equipment Maintenance", category: "onet_skill" },
  { name: "Equipment Selection", category: "onet_skill" },
  { name: "Installation", category: "onet_skill" },
  { name: "Operation and Control", category: "onet_skill" },
  { name: "Operations Analysis", category: "onet_skill" },
  { name: "Operations Monitoring", category: "onet_skill" },
  { name: "Programming", category: "onet_skill" },
  { name: "Quality Control Analysis", category: "onet_skill" },
  { name: "Repairing", category: "onet_skill" },
  { name: "Technology Design", category: "onet_skill" },
  { name: "Troubleshooting", category: "onet_skill" },

  // O*NET Systems Skills
  { name: "Judgment and Decision Making", category: "onet_skill" },
  { name: "Systems Analysis", category: "onet_skill" },
  { name: "Systems Evaluation", category: "onet_skill" },

  // O*NET Resource Management Skills
  { name: "Management of Financial Resources", category: "onet_skill" },
  { name: "Management of Material Resources", category: "onet_skill" },
  { name: "Management of Personnel Resources", category: "onet_skill" },
  { name: "Time Management", category: "onet_skill" },

  // O*NET Knowledge Areas
  { name: "Administration and Management", category: "onet_knowledge" },
  { name: "Biology", category: "onet_knowledge" },
  { name: "Building and Construction", category: "onet_knowledge" },
  { name: "Chemistry", category: "onet_knowledge" },
  { name: "Clerical", category: "onet_knowledge" },
  { name: "Communications and Media", category: "onet_knowledge" },
  { name: "Computers and Electronics", category: "onet_knowledge" },
  { name: "Customer and Personal Service", category: "onet_knowledge" },
  { name: "Design", category: "onet_knowledge" },
  { name: "Economics and Accounting", category: "onet_knowledge" },
  { name: "Education and Training", category: "onet_knowledge" },
  { name: "Engineering and Technology", category: "onet_knowledge" },
  { name: "English Language", category: "onet_knowledge" },
  { name: "Fine Arts", category: "onet_knowledge" },
  { name: "Food Production", category: "onet_knowledge" },
  { name: "Foreign Language", category: "onet_knowledge" },
  { name: "Geography", category: "onet_knowledge" },
  { name: "History and Archeology", category: "onet_knowledge" },
  { name: "Law and Government", category: "onet_knowledge" },
  { name: "Mathematics Knowledge", category: "onet_knowledge" },
  { name: "Mechanical", category: "onet_knowledge" },
  { name: "Medicine and Dentistry", category: "onet_knowledge" },
  { name: "Personnel and Human Resources", category: "onet_knowledge" },
  { name: "Philosophy and Theology", category: "onet_knowledge" },
  { name: "Physics", category: "onet_knowledge" },
  { name: "Production and Processing", category: "onet_knowledge" },
  { name: "Psychology", category: "onet_knowledge" },
  { name: "Public Safety and Security", category: "onet_knowledge" },
  { name: "Sales and Marketing", category: "onet_knowledge" },
  { name: "Sociology and Anthropology", category: "onet_knowledge" },
  { name: "Telecommunications", category: "onet_knowledge" },
  { name: "Therapy and Counseling", category: "onet_knowledge" },
  { name: "Transportation", category: "onet_knowledge" },

  // Programming Languages (curated)
  { name: "JavaScript", category: "programming" },
  { name: "TypeScript", category: "programming" },
  { name: "Python", category: "programming" },
  { name: "Java", category: "programming" },
  { name: "C++", category: "programming" },
  { name: "C#", category: "programming" },
  { name: "Go", category: "programming" },
  { name: "Rust", category: "programming" },
  { name: "Swift", category: "programming" },
  { name: "Kotlin", category: "programming" },
  { name: "Ruby", category: "programming" },
  { name: "PHP", category: "programming" },
  { name: "R", category: "programming" },
  { name: "SQL", category: "programming" },
  { name: "HTML/CSS", category: "programming" },

  // Tools (curated)
  { name: "Git", category: "tools" },
  { name: "Docker", category: "tools" },
  { name: "Kubernetes", category: "tools" },
  { name: "AWS", category: "tools" },
  { name: "Google Cloud", category: "tools" },
  { name: "Azure", category: "tools" },
  { name: "VS Code", category: "tools" },
  { name: "Figma", category: "tools" },
  { name: "Adobe Creative Suite", category: "tools" },
  { name: "Slack", category: "tools" },
  { name: "Jira", category: "tools" },
  { name: "Notion", category: "tools" },
  { name: "GitHub", category: "tools" },
  { name: "Postman", category: "tools" },
  { name: "Tableau", category: "tools" },
  { name: "Excel", category: "tools" },
  { name: "Power BI", category: "tools" },

  // Frameworks (curated)
  { name: "React", category: "frameworks" },
  { name: "Next.js", category: "frameworks" },
  { name: "Vue.js", category: "frameworks" },
  { name: "Angular", category: "frameworks" },
  { name: "Node.js", category: "frameworks" },
  { name: "Express", category: "frameworks" },
  { name: "Django", category: "frameworks" },
  { name: "Flask", category: "frameworks" },
  { name: "Spring Boot", category: "frameworks" },
  { name: "Ruby on Rails", category: "frameworks" },
  { name: "Laravel", category: "frameworks" },
  { name: "TensorFlow", category: "frameworks" },
  { name: "PyTorch", category: "frameworks" },
  { name: "React Native", category: "frameworks" },
  { name: "Flutter", category: "frameworks" },
  { name: "Tailwind CSS", category: "frameworks" },
];

async function main() {
  console.log("Seeding database...");

  console.log("\nSeeding master skills...");
  for (const skill of masterSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }
  console.log(`  Seeded ${masterSkills.length} master skills`);

  console.log("\nSeeding occupations...");
  for (const occupation of sampleOccupations) {
    await prisma.occupation.upsert({
      where: { id: occupation.id },
      update: occupation,
      create: occupation,
    });
    console.log(`  Upserted: ${occupation.title}`);

    const skills = occupationSkills[occupation.id];
    if (skills) {
      for (const skill of skills.technical) {
        await prisma.occupationSkill.upsert({
          where: { occupationId_name: { occupationId: occupation.id, name: skill } },
          update: { type: "technical", importance: 80 },
          create: { occupationId: occupation.id, name: skill, type: "technical", importance: 80 },
        });
      }
      for (const skill of skills.soft) {
        await prisma.occupationSkill.upsert({
          where: { occupationId_name: { occupationId: occupation.id, name: skill } },
          update: { type: "soft", importance: 70 },
          create: { occupationId: occupation.id, name: skill, type: "soft", importance: 70 },
        });
      }
      console.log(`    Added ${skills.technical.length + skills.soft.length} skills`);
    }

    const abilities = occupationAbilities[occupation.id];
    if (abilities) {
      for (const ability of abilities) {
        await prisma.occupationAbility.upsert({
          where: { occupationId_name: { occupationId: occupation.id, name: ability } },
          update: { importance: 75 },
          create: { occupationId: occupation.id, name: ability, importance: 75 },
        });
      }
      console.log(`    Added ${abilities.length} abilities`);
    }
  }

  console.log(`\nSeeded ${sampleOccupations.length} occupations with skills and abilities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
