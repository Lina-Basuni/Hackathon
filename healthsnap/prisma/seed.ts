import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===========================================
// MOCK DOCTORS DATA (10 Doctors)
// ===========================================

const doctors = [
  {
    name: "Dr. Sarah Mitchell",
    specialty: "primary-care",
    hospital: "Bay Area Medical Center",
    location: "San Francisco, CA",
    languages: JSON.stringify(["English", "Spanish"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Blue Cross Blue Shield",
      "Cigna",
      "United Healthcare",
      "Kaiser Permanente",
    ]),
    rating: 4.9,
    yearsExperience: 15,
    bio: "Board-certified family medicine physician with 15 years of experience. Specializes in preventive care, chronic disease management, and patient education. Known for thorough consultations and compassionate care.",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. James Chen",
    specialty: "cardiology",
    hospital: "Heart & Vascular Institute",
    location: "San Francisco, CA",
    languages: JSON.stringify(["English", "Mandarin", "Cantonese"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Blue Cross Blue Shield",
      "Cigna",
      "Medicare",
    ]),
    rating: 4.8,
    yearsExperience: 20,
    bio: "Fellowship-trained interventional cardiologist specializing in coronary artery disease, heart failure, and preventive cardiology. Pioneer in minimally invasive cardiac procedures.",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Emily Rodriguez",
    specialty: "pulmonology",
    hospital: "Pacific Lung & Sleep Center",
    location: "San Jose, CA",
    languages: JSON.stringify(["English", "Spanish", "Portuguese"]),
    acceptedInsurance: JSON.stringify([
      "Blue Cross Blue Shield",
      "Cigna",
      "United Healthcare",
      "Humana",
    ]),
    rating: 4.7,
    yearsExperience: 12,
    bio: "Pulmonologist specializing in asthma, COPD, sleep apnea, and respiratory infections. Expert in pulmonary function testing and bronchoscopy. Committed to helping patients breathe easier.",
    imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Michael Thompson",
    specialty: "gastroenterology",
    hospital: "Digestive Health Associates",
    location: "Oakland, CA",
    languages: JSON.stringify(["English"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Blue Cross Blue Shield",
      "United Healthcare",
      "Medicare",
      "Medicaid",
    ]),
    rating: 4.6,
    yearsExperience: 18,
    bio: "Gastroenterologist with expertise in inflammatory bowel disease, liver disorders, and advanced endoscopic procedures. Dedicated to comprehensive digestive health management.",
    imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Priya Patel",
    specialty: "endocrinology",
    hospital: "Bay Area Diabetes & Thyroid Center",
    location: "Palo Alto, CA",
    languages: JSON.stringify(["English", "Hindi", "Gujarati"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Cigna",
      "United Healthcare",
      "Kaiser Permanente",
    ]),
    rating: 4.9,
    yearsExperience: 14,
    bio: "Endocrinologist specializing in diabetes management, thyroid disorders, and hormonal imbalances. Passionate about patient education and lifestyle medicine approaches.",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. David Kim",
    specialty: "neurology",
    hospital: "NeuroCare Specialists",
    location: "San Francisco, CA",
    languages: JSON.stringify(["English", "Korean"]),
    acceptedInsurance: JSON.stringify([
      "Blue Cross Blue Shield",
      "Cigna",
      "United Healthcare",
      "Medicare",
    ]),
    rating: 4.8,
    yearsExperience: 16,
    bio: "Neurologist specializing in headache disorders, epilepsy, and neurodegenerative diseases. Uses cutting-edge diagnostic techniques and personalized treatment plans.",
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Rachel Washington",
    specialty: "infectious-disease",
    hospital: "University Medical Center",
    location: "Berkeley, CA",
    languages: JSON.stringify(["English", "French"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Blue Cross Blue Shield",
      "Cigna",
      "Medicare",
      "Medicaid",
    ]),
    rating: 4.7,
    yearsExperience: 22,
    bio: "Infectious disease specialist with expertise in complex infections, travel medicine, and immunocompromised patient care. Active researcher in antimicrobial resistance.",
    imageUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Robert Martinez",
    specialty: "orthopedics",
    hospital: "Sports Medicine & Orthopedic Center",
    location: "San Francisco, CA",
    languages: JSON.stringify(["English", "Spanish"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Blue Cross Blue Shield",
      "United Healthcare",
      "Workers Compensation",
    ]),
    rating: 4.8,
    yearsExperience: 19,
    bio: "Orthopedic surgeon specializing in sports injuries, joint replacement, and minimally invasive procedures. Team physician for local professional sports teams.",
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Lisa Nakamura",
    specialty: "dermatology",
    hospital: "Bay Dermatology & Aesthetics",
    location: "San Mateo, CA",
    languages: JSON.stringify(["English", "Japanese"]),
    acceptedInsurance: JSON.stringify([
      "Aetna",
      "Cigna",
      "United Healthcare",
      "Kaiser Permanente",
    ]),
    rating: 4.9,
    yearsExperience: 11,
    bio: "Board-certified dermatologist specializing in medical and cosmetic dermatology. Expert in skin cancer detection, acne treatment, and anti-aging procedures.",
    imageUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
  {
    name: "Dr. Anthony Brooks",
    specialty: "psychiatry",
    hospital: "Mind Wellness Center",
    location: "San Francisco, CA",
    languages: JSON.stringify(["English"]),
    acceptedInsurance: JSON.stringify([
      "Blue Cross Blue Shield",
      "Cigna",
      "United Healthcare",
      "Medicare",
    ]),
    rating: 4.6,
    yearsExperience: 13,
    bio: "Psychiatrist specializing in anxiety disorders, depression, ADHD, and medication management. Integrates therapy techniques with pharmacological treatments for holistic care.",
    imageUrl: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=400&h=400&fit=crop&crop=face",
    available: true,
  },
];

// ===========================================
// SAMPLE PATIENT DATA
// ===========================================

const samplePatient = {
  name: "Alex Johnson",
  email: "demo@healthsnap.test",
  phone: "+1 (555) 123-4567",
  dateOfBirth: new Date("1985-03-15"),
  sex: "male",
  knownConditions: JSON.stringify([
    "Mild hypertension",
    "Seasonal allergies",
  ]),
  medications: JSON.stringify([
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
    },
    {
      name: "Cetirizine",
      dosage: "10mg",
      frequency: "As needed",
    },
  ]),
};

// ===========================================
// TIME SLOT GENERATION (Next 7 Days)
// ===========================================

function generateTimeSlots(doctorId: string, daysAhead: number = 7) {
  const slots: Array<{
    doctorId: string;
    datetime: Date;
    isBooked: boolean;
  }> = [];

  // Slot times (30-minute appointments)
  const slotHours = [
    9, 9.5, 10, 10.5, 11, 11.5,           // Morning: 9:00 AM - 12:00 PM
    13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, // Afternoon: 1:00 PM - 5:00 PM
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysAhead; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const hour of slotHours) {
      const slotTime = new Date(date);
      const hours = Math.floor(hour);
      const minutes = (hour % 1) * 60;
      slotTime.setHours(hours, minutes, 0, 0);

      // Randomly mark ~20% of slots as booked for realism
      const isBooked = Math.random() < 0.2;

      slots.push({
        doctorId,
        datetime: slotTime,
        isBooked,
      });
    }
  }

  return slots;
}

// ===========================================
// MAIN SEED FUNCTION
// ===========================================

async function main() {
  console.log("🌱 Starting HealthSnap database seed...\n");

  // Clear existing data (in order due to foreign keys)
  console.log("🧹 Clearing existing data...");
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.report.deleteMany();
  await prisma.nextSteps.deleteMany();
  await prisma.clinicalSummary.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.voiceNote.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  console.log("   ✓ Database cleared\n");

  // Create sample patient
  console.log("👤 Creating sample patient...");
  const patient = await prisma.patient.create({
    data: samplePatient,
  });
  console.log(`   ✓ Created: ${patient.name} (${patient.email})`);
  console.log(`   • DOB: ${patient.dateOfBirth?.toLocaleDateString()}`);
  console.log(`   • Sex: ${patient.sex}`);
  console.log(`   • Known Conditions: ${JSON.parse(patient.knownConditions || "[]").join(", ")}\n`);

  // Create doctors and their time slots
  console.log("👨‍⚕️ Creating doctors and time slots...\n");
  let totalSlots = 0;
  let bookedSlots = 0;

  for (const doctorData of doctors) {
    const doctor = await prisma.doctor.create({
      data: doctorData,
    });

    // Generate time slots for this doctor
    const slots = generateTimeSlots(doctor.id, 7);
    await prisma.timeSlot.createMany({
      data: slots,
    });

    const doctorBookedSlots = slots.filter((s) => s.isBooked).length;
    totalSlots += slots.length;
    bookedSlots += doctorBookedSlots;

    console.log(
      `   ✓ ${doctor.name.padEnd(22)} | ${doctor.specialty.padEnd(18)} | ${slots.length} slots (${doctorBookedSlots} booked)`
    );
  }

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("✅ DATABASE SEEDED SUCCESSFULLY");
  console.log("═".repeat(60));

  console.log("\n📊 Summary:");
  console.log(`   • Patients:      1`);
  console.log(`   • Doctors:       ${doctors.length}`);
  console.log(`   • Time Slots:    ${totalSlots} (${bookedSlots} pre-booked)`);
  console.log(`   • Available:     ${totalSlots - bookedSlots} slots`);

  console.log("\n👨‍⚕️ Specialties Available:");
  const specialties = [...new Set(doctors.map((d) => d.specialty))].sort();
  specialties.forEach((s) => {
    const count = doctors.filter((d) => d.specialty === s).length;
    console.log(`   • ${s.padEnd(20)} (${count} doctor${count > 1 ? "s" : ""})`);
  });

  console.log("\n🔑 Demo Login:");
  console.log("   Email: demo@healthsnap.test");
  console.log("   Name:  Alex Johnson");

  console.log("\n" + "═".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
