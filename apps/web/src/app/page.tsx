import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Second Brain</h1>
      <nav>
        <Link href="/tasks">Tasks</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/settings/integrations">Integrations</Link>
      </nav>
    </main>
  );
}
