import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Post",
  description: "View post on Krishna Connect.",
};

export default async function ProfilePostRedirect(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/post/${params.id}`);
}
