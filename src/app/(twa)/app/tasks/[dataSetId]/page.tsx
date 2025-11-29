

import { Suspense } from 'react';
import ClientTaskPage from './ClientTaskPage';
import { getTasks } from '@/app/actions/tasks';
import { getDataset } from '@/app/actions/tasks/getSingleDatasetData';

export default async function page({ params }: { params: Promise<Record<string, string>> }) {
    const getParams = await params

    const datasetId = getParams.dataSetId;

    const { data } = await getTasks(datasetId);

    const { data: datasetData } = await getDataset(datasetId)

    if (Array.isArray(data) && datasetData) {
        return <Suspense fallback={<div></div>}>
            <ClientTaskPage datasetData={datasetData} tasks={data} />
        </Suspense>
    } else {
        return <div className='flex flex-col gap-4'>
            <p className='text-rose-500 text-sm'>
                Couldn&apos;t fetch the tasks
            </p>
            <p className='px-4 rounded-xl border border-rose-400 bg-rose-50 text-sm'>
                {JSON.stringify(data)}
            </p>
        </div>
    }

}