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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Stanford University School of Medicine", year: 2005 },
      { degree: "B.S. Biology", institution: "UCLA", year: 2001 },
    ]),
    certifications: JSON.stringify(["Board Certified in Family Medicine", "ACLS Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Johns Hopkins School of Medicine", year: 2000 },
      { degree: "Fellowship, Interventional Cardiology", institution: "Mayo Clinic", year: 2006 },
    ]),
    certifications: JSON.stringify(["Board Certified in Cardiology", "Board Certified in Interventional Cardiology"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "UCSF School of Medicine", year: 2008 },
      { degree: "Fellowship, Pulmonary Medicine", institution: "Duke University", year: 2012 },
    ]),
    certifications: JSON.stringify(["Board Certified in Pulmonology", "Sleep Medicine Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Harvard Medical School", year: 2002 },
      { degree: "Fellowship, Gastroenterology", institution: "Cleveland Clinic", year: 2007 },
    ]),
    certifications: JSON.stringify(["Board Certified in Gastroenterology", "Advanced Endoscopy Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Yale School of Medicine", year: 2006 },
      { degree: "Fellowship, Endocrinology", institution: "Stanford Health Care", year: 2010 },
    ]),
    certifications: JSON.stringify(["Board Certified in Endocrinology", "Certified Diabetes Educator"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Columbia University", year: 2004 },
      { degree: "Residency, Neurology", institution: "UCLA Medical Center", year: 2008 },
    ]),
    certifications: JSON.stringify(["Board Certified in Neurology", "Headache Medicine Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D., Ph.D.", institution: "University of Pennsylvania", year: 1998 },
      { degree: "Fellowship, Infectious Disease", institution: "NIH Clinical Center", year: 2003 },
    ]),
    certifications: JSON.stringify(["Board Certified in Infectious Disease", "Fellow, IDSA"]),
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
    ]),
    rating: 4.8,
    yearsExperience: 19,
    bio: "Orthopedic surgeon specializing in sports injuries, joint replacement, and minimally invasive procedures. Team physician for local professional sports teams.",
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
    education: JSON.stringify([
      { degree: "M.D.", institution: "Duke University School of Medicine", year: 2001 },
      { degree: "Fellowship, Sports Medicine", institution: "Hospital for Special Surgery", year: 2007 },
    ]),
    certifications: JSON.stringify(["Board Certified in Orthopedic Surgery", "Sports Medicine Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "UCSF School of Medicine", year: 2009 },
      { degree: "Residency, Dermatology", institution: "NYU Langone", year: 2013 },
    ]),
    certifications: JSON.stringify(["Board Certified in Dermatology", "Mohs Surgery Certified"]),
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
    education: JSON.stringify([
      { degree: "M.D.", institution: "Cornell University", year: 2007 },
      { degree: "Residency, Psychiatry", institution: "Massachusetts General Hospital", year: 2011 },
    ]),
    certifications: JSON.stringify(["Board Certified in Psychiatry", "Certified in TMS Therapy"]),
    available: true,
  },
];

// ===========================================
// SAMPLE REVIEWS
// ===========================================

const sampleReviews = [
  { rating: 5, comment: "Excellent doctor! Very thorough and takes time to explain everything.", author: "John D." },
  { rating: 5, comment: "Dr. Mitchell is amazing. She really listens and cares about her patients.", author: "Maria S." },
  { rating: 4, comment: "Great experience overall. Short wait times and friendly staff.", author: "Robert K." },
  { rating: 5, comment: "Highly recommend! Very professional and knowledgeable.", author: "Sarah T." },
  { rating: 4, comment: "Good doctor, helped me understand my condition better.", author: "Michael L." },
  { rating: 5, comment: "Best doctor I've ever had. Took time to answer all my questions.", author: "Emily R." },
  { rating: 4, comment: "Very helpful and explained treatment options clearly.", author: "David W." },
  { rating: 5, comment: "Exceptional care. Made me feel comfortable and heard.", author: "Jennifer M." },
  { rating: 5, comment: "Outstanding physician. Would recommend to anyone.", author: "Christopher P." },
  { rating: 4, comment: "Professional and efficient. Got great care.", author: "Amanda J." },
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
// TIME SLOT GENERATION (Next 14 Days)
// ===========================================

interface TimeSlotData {
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  isBooked: boolean;
  isBlocked: boolean;
}

function generateTimeSlots(doctorId: string, daysAhead: number = 14): TimeSlotData[] {
  const slots: TimeSlotData[] = [];

  // Slot times (30-minute appointments)
  const slotTimes = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:00", end: "10:30" },
    { start: "10:30", end: "11:00" },
    { start: "11:00", end: "11:30" },
    { start: "11:30", end: "12:00" },
    { start: "13:00", end: "13:30" },
    { start: "13:30", end: "14:00" },
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
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const slot of slotTimes) {
      // Randomly mark ~15% of slots as booked for realism
      const isBooked = Math.random() < 0.15;
      // Randomly block ~5% of slots
      const isBlocked = !isBooked && Math.random() < 0.05;

      slots.push({
        doctorId,
        date: new Date(date),
        startTime: slot.start,
        endTime: slot.end,
        duration: 30,
        isBooked,
        isBlocked,
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
  await prisma.doctorReview.deleteMany();
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
  console.log("👨‍⚕️ Creating doctors, time slots, and reviews...\n");
  let totalSlots = 0;
  let bookedSlots = 0;
  let totalReviews = 0;

  for (const doctorData of doctors) {
    const doctor = await prisma.doctor.create({
      data: doctorData,
    });

    // Generate time slots for this doctor
    const slots = generateTimeSlots(doctor.id, 14);
    await prisma.timeSlot.createMany({
      data: slots,
    });

    // Add random reviews (3-6 per doctor)
    const numReviews = Math.floor(Math.random() * 4) + 3;
    const shuffledReviews = [...sampleReviews].sort(() => Math.random() - 0.5).slice(0, numReviews);

    for (const review of shuffledReviews) {
      await prisma.doctorReview.create({
        data: {
          doctorId: doctor.id,
          rating: review.rating,
          comment: review.comment,
          author: review.author,
        },
      });
    }

    const doctorBookedSlots = slots.filter((s) => s.isBooked).length;
    totalSlots += slots.length;
    bookedSlots += doctorBookedSlots;
    totalReviews += numReviews;

    console.log(
      `   ✓ ${doctor.name.padEnd(22)} | ${doctor.specialty.padEnd(18)} | ${slots.length} slots (${doctorBookedSlots} booked) | ${numReviews} reviews`
    );
  }

  // Print summary
  console.log("\n" + "═".repeat(70));
  console.log("✅ DATABASE SEEDED SUCCESSFULLY");
  console.log("═".repeat(70));

  console.log("\n📊 Summary:");
  console.log(`   • Patients:      1`);
  console.log(`   • Doctors:       ${doctors.length}`);
  console.log(`   • Time Slots:    ${totalSlots} (${bookedSlots} pre-booked, ${totalSlots - bookedSlots} available)`);
  console.log(`   • Reviews:       ${totalReviews}`);

  console.log("\n👨‍⚕️ Specialties Available:");
  const specialties = [...new Set(doctors.map((d) => d.specialty))].sort();
  specialties.forEach((s) => {
    const count = doctors.filter((d) => d.specialty === s).length;
    console.log(`   • ${s.padEnd(20)} (${count} doctor${count > 1 ? "s" : ""})`);
  });

  console.log("\n🔑 Demo Login:");
  console.log("   Email: demo@healthsnap.test");
  console.log("   Name:  Alex Johnson");

  console.log("\n" + "═".repeat(70) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
