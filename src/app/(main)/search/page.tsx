import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchClient } from "@/components/search/SearchClient";
import { WineType } from "@/generated/prisma";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    country?: string;
    varietal?: string;
    vintage?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = parseInt(params.page ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { mergedIntoId: null };

  if (params.type && params.type in WineType) {
    where.type = params.type as WineType;
  }

  if (params.country) {
    where.country = { is: { value: { contains: params.country, mode: "insensitive" } } };
  }

  if (params.vintage) {
    where.vintage = { is: { value: { contains: params.vintage, mode: "insensitive" } } };
  }

  if (params.varietal) {
    where.varietals = { some: { name: { contains: params.varietal, mode: "insensitive" } } };
  }

  if (query) {
    where.OR = [
      { brand: { is: { value: { contains: query, mode: "insensitive" } } } },
      { name: { is: { value: { contains: query, mode: "insensitive" } } } },
      { vintage: { is: { value: { contains: query, mode: "insensitive" } } } },
      { country: { is: { value: { contains: query, mode: "insensitive" } } } },
      { region: { is: { value: { contains: query, mode: "insensitive" } } } },
      { appellation: { is: { value: { contains: query, mode: "insensitive" } } } },
      { varietals: { some: { name: { contains: query, mode: "insensitive" } } } },
    ];
  }

  const [wines, total] = await Promise.all([
    prisma.wine.findMany({
      where,
      include: {
        brand: true,
        name: true,
        vintage: true,
        country: true,
        region: true,
        appellation: true,
        varietals: true,
        photos: { select: { url: true, isCover: true }, take: 1 },
        tastingEntries: { select: { score: true, dateDrank: true }, take: 1, orderBy: { dateDrank: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.wine.count({ where }),
  ]);

  // Get distinct filter options
  const [countries, types, varietalNames] = await Promise.all([
    prisma.fieldValue.findMany({
      where: { wineByCountry: { isNot: null } },
      select: { value: true },
      distinct: ["value"],
      orderBy: { value: "asc" },
    }),
    prisma.wine.groupBy({ by: ["type"], _count: true }),
    prisma.wineVarietal.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Search Wines" />
      <SearchClient
        initialWines={wines as any}
        total={total}
        page={page}
        filterOptions={{
          countries: countries.map((c) => c.value),
          types: types.map((t) => ({ type: t.type, count: t._count })),
          varietals: varietalNames.map((v) => v.name),
        }}
        initialParams={params}
      />
    </div>
  );
}
