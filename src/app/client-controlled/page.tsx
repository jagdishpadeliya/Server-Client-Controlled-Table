import ClientControlledTable from "@/components/client-controlled-table"
import { columns } from "@/components/columns"
import { prisma } from "@/lib/db"
export default async function ClientControlledPage() {
    const skaters = await prisma.skater.findMany()
    // console.log(skaters);

    return (
        <main className="container grid items-center py-5">
            <ClientControlledTable data={skaters} columns={columns} />
        </main>
    )
}
