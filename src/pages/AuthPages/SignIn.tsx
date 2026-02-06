import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | ODI XTECH Dashboard"
        description="Login to your ODI XTECH account to manage your workspace."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
