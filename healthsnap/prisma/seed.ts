import { PrismaClient } from "@prisma/client";
import { addDays, format, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

// Mock doctors data
const doctors = [
  {
    name: "Dr. Sarah Chen",
    email: "sarah.chen@healthsnap.demo",
    phone: "+1 (555) 101-0001",
    specialty: "cardiology",
    qualifications: "MD, FACC",
    experience: 15,
    bio: "Board-certified cardiologist specializing in preventive cardiology and heart failure management. Known for patient-centered care.",
    hospital: "Metro Heart Center",
    address: "123 Medical Plaza",
    city: "San Francisco",
    consultationFee: 250,
    rating: 4.9,
    reviewCount: 324,
    imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
  },
  {
    name: "Dr. Michael Roberts",
    email: "michael.roberts@healthsnap.demo",
    phone: "+1 (555) 101-0002",
    specialty: "pulmonology",
    qualifications: "MD, FCCP",
    experience: 12,
    bio: "Pulmonologist with expertise in respiratory infections, COPD, and sleep disorders. Committed to improving breathing health.",
    hospital: "City Lung & Sleep Clinic",
    address: "456 Health Avenue",
    city: "San Francisco",
    consultationFee: 200,
    rating: 4.8,
    reviewCount: 256,
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Dr. Emily Watson",
    email: "emily.watson@healthsnap.demo",
    phone: "+1 (555) 101-0003",
    specialty: "general",
    qualifications: "MD, MPH",
    experience: 8,
    bio: "Family medicine physician focused on holistic health and preventive care. Experienced in managing chronic conditions.",
    hospital: "Community Health Center",
    address: "789 Wellness Blvd",
    city: "San Francisco",
    consultationFee: 150,
    rating: 4.7,
    reviewCount: 412,
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Dr. James Park",
    email: "james.park@healthsnap.demo",
    phone: "+1 (555) 101-0004",
    specialty: "infectious-disease",
    qualifications: "MD, PhD",
    experience: 18,
    bio: "Infectious disease specialist with research background in emerging pathogens. Expert in complex infection management.",
    hospital: "University Medical Center",
    address: "321 Research Drive",
    city: "San Francisco",
    consultationFee: 300,
    rating: 4.9,
    reviewCount: 189,
    imageUrl: "https://randomuser.me/api/portraits/men/56.jpg",
  },
  {
    name: "Dr. Lisa Nguyen",
    email: "lisa.nguyen@healthsnap.demo",
    phone: "+1 (555) 101-0005",
    specialty: "nephrology",
    qualifications: "MD, FASN",
    experience: 14,
    bio: "Nephrologist specializing in kidney disease prevention and dialysis care. Advocates for early detection.",
    hospital: "Kidney Care Institute",
    address: "654 Renal Way",
    city: "San Francisco",
    consultationFee: 275,
    rating: 4.8,
    reviewCount: 203,
    imageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    name: "Dr. David Martinez",
    email: "david.martinez@healthsnap.demo",
    phone: "+1 (555) 101-0006",
    specialty: "gastroenterology",
    qualifications: "MD, FACG",
    experience: 11,
    bio: "Gastroenterologist experienced in digestive disorders, liver disease, and endoscopic procedures.",
    hospital: "Digestive Health Center",
    address: "987 GI Lane",
    city: "San Francisco",
    consultationFee: 225,
    rating: 4.6,
    reviewCount: 178,
    imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    name: "Dr. Amanda Foster",
    email: "amanda.foster@healthsnap.demo",
    phone: "+1 (555) 101-0007",
    specialty: "neurology",
    qualifications: "MD, FAAN",
    experience: 16,
    bio: "Neurologist specializing in headaches, seizures, and neurodegenerative diseases. Patient-focused approach to care.",
    hospital: "Brain & Spine Institute",
    address: "147 Neuro Circle",
    city: "San Francisco",
    consultationFee: 325,
    rating: 4.9,
    reviewCount: 267,
    imageUrl: "https://randomuser.me/api/portraits/women/52.jpg",
  },
  {
    name: "Dr. Robert Kim",
    email: "robert.kim@healthsnap.demo",
    phone: "+1 (555) 101-0008",
    specialty: "endocrinology",
    qualifications: "MD, FACE",
    experience: 13,
    bio: "Endocrinologist focused on diabetes management, thyroid disorders, and metabolic health.",
    hospital: "Metabolic Health Clinic",
    address: "258 Hormone Street",
    city: "San Francisco",
    consultationFee: 240,
    rating: 4.7,
    reviewCount: 195,
    imageUrl: "https://randomuser.me/api/portraits/men/67.jpg",
  },
];

// Generate time slots for a doctor
function generateTimeSlots(doctorId: string, daysAhead: number = 14) {
  const slots: Array<{
    doctorId: string;
    date: Date;
    startTime: string;
    endTime: string;
  }> = [];

  const slotTimes = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:00", end: "10:30" },
    { start: "10:30", end: "11:00" },
    { start: "11:00", end: "11:30" },
    { start: "11:30", end: "12:00" },
    { start: "14:00", end: "14:30" },
    { start: "14:30", end: "15:00" },
    { start: "15:00", end: "15:30" },
    { start: "15:30", end: "16:00" },
    { start: "16:00", end: "16:30" },
    { start: "16:30", end: "17:00" },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysAhead; day++) {
    const date = addDays(today, day);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const slot of slotTimes) {
      slots.push({
        doctorId,
        date,
        startTime: slot.start,
        endTime: slot.end,
      });
    }
  }

  return slots;
}

// Demo patient for testing
const demoPatient = {
  email: "demo@healthsnap.test",
  name: "Demo Patient",
  dateOfBirth: new Date("1985-06-15"),
  phone: "+1 (555) 000-0000",
  address: "123 Demo Street, San Francisco, CA",
  emergencyContact: "Jane Doe - +1 (555) 000-0001",
  medicalHistory: JSON.stringify({
    allergies: ["Penicillin"],
    conditions: ["Mild hypertension"],
    medications: ["Lisinopril 10mg daily"],
  }),
};

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.report.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.voiceNote.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();

  // Create demo patient
  console.log("👤 Creating demo patient...");
  const patient = await prisma.patient.create({
    data: demoPatient,
  });
  console.log(`   Created: ${patient.name} (${patient.email})`);

  // Create doctors
  console.log("\n👨‍⚕️ Creating doctors...");
  for (const doctorData of doctors) {
    const doctor = await prisma.doctor.create({
      data: doctorData,
    });
    console.log(`   Created: ${doctor.name} (${doctor.specialty})`);

    // Generate time slots for each doctor
    const slots = generateTimeSlots(doctor.id);
    await prisma.timeSlot.createMany({
      data: slots,
    });
    console.log(`   Generated ${slots.length} time slots`);
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log(`   - Patients: 1`);
  console.log(`   - Doctors: ${doctors.length}`);

  const totalSlots = await prisma.timeSlot.count();
  console.log(`   - Time Slots: ${totalSlots}`);

  console.log("\n🔑 Demo Login:");
  console.log(`   Email: demo@healthsnap.test`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
