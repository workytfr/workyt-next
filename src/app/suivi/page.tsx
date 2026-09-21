import { Suspense } from "react";
import SuiviHome from "./_components/SuiviHome";

export default function SuiviPage() {
    return (
        <Suspense>
            <SuiviHome />
        </Suspense>
    );
}
