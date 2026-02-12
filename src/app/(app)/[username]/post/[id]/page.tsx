import { redirect } from 'next/navigation';

export default async function UsernamePostRedirect(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    redirect(`/post/${params.id}`);
}
