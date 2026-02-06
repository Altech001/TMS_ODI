import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
    return (
        <>
            <PageMeta
                title="Sign Up | ODI XTECH Dashboard"
                description="Join ODI XTECH and start your adventure with our premium dashboard."
            />
            <AuthLayout>
                <SignUpForm />
            </AuthLayout>
        </>
    );
}
