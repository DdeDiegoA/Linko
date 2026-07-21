import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: "/?modal=access", permanent: true } };
};

export default function RegisterRedirectPage() {
  return null;
}