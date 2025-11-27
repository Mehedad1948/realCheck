

import { Suspense } from 'react';
import ClientTaskPage from './ClientTaskPage';

export default function page() {
    return <Suspense fallback={<div></div>}>
        <ClientTaskPage />

    </Suspense>
}