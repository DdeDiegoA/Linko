import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const username = typeof ctx.query.username === "string" ? `?modal=access&username=${encodeURIComponent(ctx.query.username)}` : "?modal=access";
  return { redirect: { destination: `/${username}`, permanent: true } };
};

export default function RegisterRedirectPage() {
  return null;
}