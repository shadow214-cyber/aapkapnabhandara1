import { AccountAccess } from "@/components/AccountAccess";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  return <AccountAccess mode="sign-in" initialRole={params.role === "admin" ? "admin" : "customer"} />;
}