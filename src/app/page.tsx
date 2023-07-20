import React from 'react'
import { prisma } from '@/lib/db'
import { ServerControlledTable } from "@/components/server-controlled-table"

interface IndexPageProps {
    searchParams: {
        page?: string
        items?: string
        sort?: string
        order?: "asc" | "desc"
        email?: string
        stance?: string
    }
}
export default async function IndexPage({ searchParams }: IndexPageProps) {
    const { page, items, sort, order, email, stance } = searchParams

    const limit = items ? parseInt(items) : 10
    const offset = page ? (parseInt(page) - 1) * limit : 0
    const needFiltering = email || stance
    const [skaters, totalSkaters] = await prisma.$transaction([
        prisma.skater.findMany({
            // For server-side pagination
            take: limit,
            skip: offset,
            // For server-side filtering
            where: needFiltering
                ? {
                    AND: {
                        email: email ? { contains: email } : undefined,
                        stance: stance ? { equals: stance } : undefined,
                    },
                }
                : undefined,
            // For server-side sorting
            orderBy: { [sort ?? "email"]: order ?? "asc" },
        }),
        prisma.skater.count(),
    ])

    const pageCount = Math.ceil(totalSkaters / limit)
    return (
        <main className='container grid items-center py-5'>
            <ServerControlledTable
                data={skaters}
                pageCount={pageCount}
            />
        </main>
    )
}
