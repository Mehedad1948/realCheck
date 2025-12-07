import { ReactNode, Suspense } from 'react';

export default function layout({ children }: { children: ReactNode }) {
    return (
        <div>
            <Suspense>
                {children}
            </Suspense>
            <Suspense>
          
            </Suspense>
        </div>
    );
}