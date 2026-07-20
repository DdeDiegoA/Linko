import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import db from "@/lib/db";
import PublicPage from "@/components/PublicPage";
import type { Page, LinkItem, SocialLink, PublicPageData } from "@/types";

interface Props {
  data: PublicPageData;
}

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const username = String(params?.username ?? "").toLowerCase();

  const page = db
    .prepare(
      `SELECT pages.* FROM pages JOIN users ON users.id = pages.user_id WHERE users.username = ?`
    )
    .get(username) as Page | undefined;

  if (!page) {
    return { notFound: true };
  }

  const links = db
    .prepare("SELECT * FROM links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as LinkItem[];

  const socials = db
    .prepare("SELECT * FROM social_links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as SocialLink[];

  return {
    props: { data: { page, links, socials } },
    revalidate: 60,
  };
};

export default function PublicUserPage({ data }: Props) {
  return (
    <>
      <Head>
        <title>{data.page.title || "Linko"}</title>
      </Head>
      <PublicPage data={data} />
    </>
  );
}
