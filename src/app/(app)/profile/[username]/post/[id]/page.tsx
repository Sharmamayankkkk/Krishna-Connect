import { redirect } from 'next/navigation';

export default async function ProfilePostRedirect(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/post/${params.id}`);
}
