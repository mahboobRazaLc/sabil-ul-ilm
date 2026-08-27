export function ResourcePage({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <main><div><h1>{title}</h1><p>{description}</p></div>{children ?? <p>No records yet. Create your first record to begin.</p>}</main>;
}
