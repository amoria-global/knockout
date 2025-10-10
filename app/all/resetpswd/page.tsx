import React, { Suspense } from "react";
import Resetpassword from '../../pages/auth/resetpswd';

const ResetpswdPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Resetpassword />
        </Suspense>
    );
}
export default ResetpswdPage;