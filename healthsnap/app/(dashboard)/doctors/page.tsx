import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import prisma from "@/app/lib/prisma";
import { getSpecialtyLabel } from "@/app/lib/utils";

interface PageProps {
  searchParams: Promise<{ specialty?: string; search?: string }>;
}

export default async function DoctorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find a Doctor</h1>
        <p className="text-muted-foreground mt-2">
          Browse our network of qualified healthcare professionals.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink specialty="all" active={!params.specialty || params.specialty === "all"}>
          All Specialties
        </FilterLink>
        <FilterLink specialty="general" active={params.specialty === "general"}>
          General Medicine
        </FilterLink>
        <FilterLink specialty="cardiology" active={params.specialty === "cardiology"}>
          Cardiology
        </FilterLink>
        <FilterLink specialty="pulmonology" active={params.specialty === "pulmonology"}>
          Pulmonology
        </FilterLink>
        <FilterLink specialty="neurology" active={params.specialty === "neurology"}>
          Neurology
        </FilterLink>
        <FilterLink specialty="gastroenterology" active={params.specialty === "gastroenterology"}>
          Gastroenterology
        </FilterLink>
      </div>

      {/* Doctors Grid */}
      <Suspense fallback={<DoctorsLoading />}>
        <DoctorsList specialty={params.specialty} />
      </Suspense>
    </div>
  );
}

function FilterLink({
  specialty,
  active,
  children,
}: {
  specialty: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={specialty === "all" ? "/doctors" : `/doctors?specialty=${specialty}`}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-white"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {children}
    </Link>
  );
}

async function DoctorsList({ specialty }: { specialty?: string }) {
  const where: Record<string, unknown> = { isAvailable: true };
  if (specialty && specialty !== "all") {
    where.specialty = specialty;
  }

  const doctors = await prisma.doctor.findMany({
    where,
    orderBy: [{ rating: "desc" }, { experience: "desc" }],
  });

  if (doctors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No doctors found for this specialty.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {doctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{doctor.name}</h3>
                  <p className="text-sm text-primary font-medium">
                    {getSpecialtyLabel(doctor.specialty)}
                  </p>
                  <p className="text-xs text-muted-foreground">{doctor.qualifications}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium text-foreground">{doctor.rating}</span>
                  <span>({doctor.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{doctor.experience} years experience</span>
                </div>
                {doctor.hospital && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{doctor.hospital}</span>
                  </div>
                )}
                {doctor.consultationFee && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>${doctor.consultationFee} consultation</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <Link href={`/doctors/${doctor.id}`}>
                <Button className="w-full">Book Appointment</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DoctorsLoading() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
